/**
 * Multi-LLM Provider Infrastructure
 *
 * Supports: Claude (Anthropic), OpenAI, Groq (Llama)
 * Features: Circuit breaker, complexity-based routing, automatic failover
 *
 * Adapted from HMS Aurora Portal enterprise LLM architecture
 */

// ============================================
// Types
// ============================================
export type LLMProvider = 'claude' | 'openai' | 'groq';
export type ComplexityLevel = 'simple' | 'medium' | 'complex';

export interface ProviderConfig {
  apiKey: string | undefined;
  url: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

interface CircuitState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
  consecutiveSuccesses: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | unknown;
  tool_call_id?: string;
  tool_calls?: unknown[];
}

export interface LLMResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: unknown[];
    };
  }>;
  _provider: LLMProvider;
}

// ============================================
// Configuration
// ============================================
function getLLMProviders(): Record<LLMProvider, ProviderConfig> {
  return {
    groq: {
      apiKey: process.env.GROQ_API_KEY,
      url: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.3-70b-versatile',
      maxTokens: 1024,
      temperature: 0.3,
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      url: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o',
      maxTokens: 1024,
      temperature: 0.3,
    },
    claude: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      url: 'https://api.anthropic.com/v1/messages',
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 2048,
      temperature: 0.3,
    },
  };
}

// Fallback chains by complexity
const FALLBACK_BY_COMPLEXITY: Record<ComplexityLevel, LLMProvider[]> = {
  simple: ['groq', 'openai', 'claude'],
  medium: ['openai', 'groq', 'claude'],
  complex: ['claude', 'openai', 'groq'],
};

const PROVIDER_PRIORITY: LLMProvider[] = ['groq', 'openai', 'claude'];

// ============================================
// Circuit Breaker
// ============================================
const circuitBreakers: Record<LLMProvider, CircuitState> = {
  groq: { failures: 0, lastFailure: 0, state: 'closed', consecutiveSuccesses: 0 },
  openai: { failures: 0, lastFailure: 0, state: 'closed', consecutiveSuccesses: 0 },
  claude: { failures: 0, lastFailure: 0, state: 'closed', consecutiveSuccesses: 0 },
};

const CIRCUIT_CONFIG = {
  failureThreshold: 3,
  resetTimeout: 30000,
  halfOpenSuccesses: 2,
};

function isProviderAvailable(provider: LLMProvider): boolean {
  const config = getLLMProviders()[provider];
  const circuit = circuitBreakers[provider];
  if (!config.apiKey) return false;
  if (circuit.state === 'closed') return true;
  if (circuit.state === 'open') {
    if (Date.now() - circuit.lastFailure > CIRCUIT_CONFIG.resetTimeout) {
      circuit.state = 'half-open';
      return true;
    }
    return false;
  }
  return true;
}

function recordSuccess(provider: LLMProvider): void {
  const circuit = circuitBreakers[provider];
  if (circuit.state === 'half-open') {
    circuit.consecutiveSuccesses++;
    if (circuit.consecutiveSuccesses >= CIRCUIT_CONFIG.halfOpenSuccesses) {
      circuit.state = 'closed';
      circuit.failures = 0;
      circuit.consecutiveSuccesses = 0;
    }
  } else {
    circuit.failures = 0;
  }
}

function recordFailure(provider: LLMProvider, error: string): void {
  const circuit = circuitBreakers[provider];
  circuit.failures++;
  circuit.lastFailure = Date.now();
  circuit.consecutiveSuccesses = 0;
  if (circuit.failures >= CIRCUIT_CONFIG.failureThreshold) {
    circuit.state = 'open';
    console.error(`[LLM] Circuit OPEN for ${provider}: ${error}`);
  }
}

// ============================================
// Complexity Estimation (Supply Chain Domain)
// ============================================
export function estimateQueryComplexity(message: string, detectedDomains: string[] = []): ComplexityLevel {
  const lower = message.toLowerCase();
  let score = 0;

  // Multi-domain queries
  score += (detectedDomains.length - 1) * 2;

  // Multi-part indicators
  ['and also', 'then', 'additionally', 'as well as', 'plus', 'compare', 'versus'].forEach(ind => {
    if (lower.includes(ind)) score += 2;
  });

  // Analytics / aggregation
  ['total', 'summary', 'report', 'breakdown', 'analysis', 'trend', 'forecast', 'predict', 'optimize'].forEach(w => {
    if (lower.includes(w)) score += 1;
  });

  // Time complexity
  ['this month', 'last week', 'between', 'year to date', 'quarterly', 'weekly trend'].forEach(w => {
    if (lower.includes(w)) score += 1;
  });

  // Supply chain complex operations
  ['replenishment', 'safety stock', 'reorder point', 'lead time', 'bullwhip', 'constraint', 'optimization', 'simulation', 'what-if'].forEach(w => {
    if (lower.includes(w)) score += 3;
  });

  if (message.length > 200) score += 2;
  if (message.split(' ').length > 30) score += 1;
  if (message.length < 30 && detectedDomains.length <= 1) score = Math.max(0, score - 2);

  if (score <= 2) return 'simple';
  if (score <= 5) return 'medium';
  return 'complex';
}

export function getMaxTokens(complexity: ComplexityLevel): number {
  switch (complexity) {
    case 'simple': return 512;
    case 'medium': return 1024;
    case 'complex': return 2048;
  }
}

// ============================================
// Provider Selection
// ============================================
export function selectLLMProvider(message: string, detectedDomains: string[] = [], needsTools = true): LLMProvider {
  const complexity = estimateQueryComplexity(message, detectedDomains);
  const effectiveComplexity: ComplexityLevel = needsTools && complexity === 'simple' ? 'medium' : complexity;

  let preferred: LLMProvider;
  switch (effectiveComplexity) {
    case 'complex': preferred = 'claude'; break;
    case 'medium': preferred = 'openai'; break;
    default: preferred = 'groq'; break;
  }

  if (isProviderAvailable(preferred)) return preferred;

  const fallbackChain = FALLBACK_BY_COMPLEXITY[effectiveComplexity];
  for (const p of fallbackChain) {
    if (isProviderAvailable(p)) return p;
  }
  for (const p of PROVIDER_PRIORITY) {
    if (isProviderAvailable(p)) return p;
  }
  return 'groq';
}

// ============================================
// LLM Call Functions
// ============================================

function buildOpenAIMessages(messages: LLMMessage[]): unknown[] {
  return messages.map(msg => {
    if (msg.role === 'tool') {
      return { role: 'tool', tool_call_id: msg.tool_call_id, content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) };
    }
    if (msg.role === 'assistant' && msg.tool_calls?.length) {
      return {
        role: 'assistant',
        content: typeof msg.content === 'string' ? msg.content : null,
        tool_calls: (msg.tool_calls as Array<{ id: string; function?: { name: string; arguments: string }; name?: string; input?: unknown }>).map(tc => ({
          id: tc.id, type: 'function',
          function: { name: tc.function?.name || tc.name || '', arguments: tc.function?.arguments || JSON.stringify(tc.input || {}) },
        })),
      };
    }
    return { role: msg.role, content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) };
  });
}

function convertToolsToOpenAI(tools: Array<{ name: string; description: string; inputSchema: unknown }>): unknown[] {
  return tools.map(t => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.inputSchema },
  }));
}

function convertToolsToAnthropic(tools: Array<{ name: string; description: string; inputSchema: unknown }>): unknown[] {
  return tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema,
  }));
}

async function callOpenAICompatible(
  provider: LLMProvider, messages: LLMMessage[], tools: unknown[] | null, maxTokens?: number
): Promise<LLMResponse> {
  const config = getLLMProviders()[provider];
  const payload: Record<string, unknown> = {
    model: config.model,
    messages: buildOpenAIMessages(messages),
    max_tokens: maxTokens || config.maxTokens,
    temperature: config.temperature,
  };
  if (tools && (tools as unknown[]).length > 0) {
    payload.tools = tools;
    payload.tool_choice = 'auto';
  }

  const response = await fetch(config.url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${provider} error ${response.status}: ${errorText.substring(0, 200)}`);
  }

  const result = await response.json();
  result._provider = provider;
  return result;
}

async function callClaude(messages: LLMMessage[], tools: unknown[] | null, maxTokens?: number): Promise<LLMResponse> {
  const config = getLLMProviders().claude;
  const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
  const anthropicMessages: unknown[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') continue;
    if (msg.role === 'tool') {
      anthropicMessages.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: msg.tool_call_id, content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }],
      });
    } else if (msg.role === 'assistant' && msg.tool_calls?.length) {
      const blocks: unknown[] = [];
      if (msg.content && typeof msg.content === 'string') blocks.push({ type: 'text', text: msg.content });
      for (const tc of msg.tool_calls as Array<{ id: string; function?: { name: string; arguments: string }; name?: string; input?: unknown }>) {
        let input = tc.input || {};
        if (tc.function?.arguments) { try { input = JSON.parse(tc.function.arguments); } catch { input = {}; } }
        blocks.push({ type: 'tool_use', id: tc.id, name: tc.function?.name || tc.name || 'unknown', input });
      }
      anthropicMessages.push({ role: 'assistant', content: blocks });
    } else {
      anthropicMessages.push({ role: msg.role, content: msg.content });
    }
  }

  const payload: Record<string, unknown> = {
    model: config.model,
    system: systemPrompt,
    messages: anthropicMessages,
    max_tokens: maxTokens || config.maxTokens,
    temperature: config.temperature,
  };
  if (tools && (tools as unknown[]).length > 0) {
    payload.tools = tools;
    payload.tool_choice = { type: 'auto' };
  }

  const response = await fetch(config.url, {
    method: 'POST',
    headers: { 'x-api-key': config.apiKey!, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude error ${response.status}: ${errorText.substring(0, 200)}`);
  }

  const result = await response.json();
  const content = result.content || [];
  const textContent = content.find((c: { type: string; text?: string }) => c.type === 'text')?.text || null;
  const toolUses = content.filter((c: { type: string }) => c.type === 'tool_use');

  const resp: LLMResponse = { choices: [{ message: { role: 'assistant', content: textContent } }], _provider: 'claude' };
  if (toolUses.length > 0) {
    resp.choices[0].message.tool_calls = toolUses.map((tu: { id: string; name: string; input: unknown }) => ({
      id: tu.id, type: 'function', function: { name: tu.name, arguments: JSON.stringify(tu.input) },
    }));
  }
  return resp;
}

// ============================================
// Unified LLM Caller with Failover
// ============================================
export async function callLLM(
  messages: LLMMessage[],
  tools: Array<{ name: string; description: string; inputSchema: unknown }> | null,
  preferredProvider?: LLMProvider,
  maxTokens?: number
): Promise<LLMResponse> {
  const userMessage = (messages.find(m => m.role === 'user')?.content as string) || '';
  const provider = preferredProvider || selectLLMProvider(userMessage, [], tools !== null && (tools?.length ?? 0) > 0);

  console.log(`[callLLM] Provider: ${provider}, preferred: ${preferredProvider || 'auto'}, tools: ${tools?.length || 0}`);

  const providers: LLMProvider[] = [provider, ...PROVIDER_PRIORITY.filter(p => p !== provider)];
  const errors: string[] = [];

  for (const p of providers) {
    if (!isProviderAvailable(p)) { errors.push(`${p}: unavailable`); continue; }
    try {
      let response: LLMResponse;
      if (p === 'claude') {
        response = await callClaude(messages, tools ? convertToolsToAnthropic(tools) : null, maxTokens);
      } else {
        response = await callOpenAICompatible(p, messages, tools ? convertToolsToOpenAI(tools) : null, maxTokens);
      }
      recordSuccess(p);
      return response;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[LLM] ${p} failed:`, msg.substring(0, 100));
      errors.push(`${p}: ${msg.substring(0, 100)}`);
      recordFailure(p, msg);
    }
  }

  // All providers failed - return fallback
  console.error('[LLM] All providers failed:', errors);
  return {
    choices: [{ message: { role: 'assistant', content: 'I apologize, but I\'m having trouble connecting to my AI services right now. The supply chain data is still available in the dashboards. Please try again in a moment, or check the relevant dashboard for real-time information.' } }],
    _provider: 'groq',
  };
}

// ============================================
// Diagnostics
// ============================================
export function getProviderDiagnostics(): Record<string, unknown> {
  const providers = getLLMProviders();
  const diag: Record<string, unknown> = {};
  for (const [name, config] of Object.entries(providers)) {
    const circuit = circuitBreakers[name as LLMProvider];
    diag[name] = { available: !!config.apiKey, model: config.model, circuitState: circuit.state, failures: circuit.failures };
  }
  return diag;
}
