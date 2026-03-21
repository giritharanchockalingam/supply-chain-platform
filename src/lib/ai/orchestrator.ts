/**
 * AI Orchestrator - Supply Chain Command Center
 *
 * Routes queries to the right MCP server, manages tool execution loops,
 * incorporates RAG knowledge grounding, and handles multi-LLM routing.
 *
 * Features:
 * - Domain detection (yard vs planning vs general)
 * - Multi-step tool execution (up to 8 iterations)
 * - RAG knowledge grounding for policy/SOP questions
 * - Complexity-based LLM routing
 * - Response caching (5-min TTL)
 * - Parallel tool execution for independent calls
 */

import { getYardOperationsServer } from '../mcp/yard-operations';
import { getDemandPlanningServer } from '../mcp/demand-planning';
import { callLLM, estimateQueryComplexity, getMaxTokens, selectLLMProvider, type LLMMessage, type LLMResponse } from './llm-providers';
import { getKnowledgeRagService, formatSectionsForLLM, hasConfidentAnswer } from './rag-service';
import type { MCPTool, MCPToolResult } from '../mcp/protocol';

// ============================================
// Types
// ============================================

export interface OrchestratorRequest {
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: {
    currentPage?: string;
    selectedTruckId?: string;
    selectedDockId?: string;
    selectedProductId?: string;
  };
}

export interface OrchestratorResponse {
  message: string;
  toolsUsed: string[];
  domain: string;
  provider: string;
  ragUsed: boolean;
  ragSources?: string[];
  complexity: string;
}

// ============================================
// Domain Detection
// ============================================

const YARD_KEYWORDS = [
  'truck', 'dock', 'gate', 'yard', 'check-in', 'checkin', 'check in',
  'dwell', 'carrier', 'license plate', 'trailer', 'bol', 'bill of lading',
  'unloading', 'loading', 'departed', 'approaching', 'staging',
  'hazmat', 'temperature', 'seal', 'driver',
];

const PLANNING_KEYWORDS = [
  'forecast', 'demand', 'replenishment', 'inventory', 'stock', 'sku',
  'product', 'customer', 'ingestion', 'signal', 'pos', 'supplier',
  'reorder', 'safety stock', 'lead time', 'fill rate', 'mape',
  'accuracy', 'confidence', 'pipeline', 'order',
];

const KNOWLEDGE_KEYWORDS = [
  'policy', 'procedure', 'sop', 'how to', 'what is the process',
  'safety', 'compliance', 'regulation', 'guideline', 'protocol',
  'training', 'best practice', 'standard', 'rule',
];

function detectDomains(message: string): string[] {
  const lower = message.toLowerCase();
  const domains: string[] = [];
  if (YARD_KEYWORDS.some(kw => lower.includes(kw))) domains.push('yard');
  if (PLANNING_KEYWORDS.some(kw => lower.includes(kw))) domains.push('planning');
  if (KNOWLEDGE_KEYWORDS.some(kw => lower.includes(kw))) domains.push('knowledge');
  if (domains.length === 0) domains.push('general');
  return domains;
}

// ============================================
// Response Cache (5-min TTL)
// ============================================

const responseCache = new Map<string, { response: OrchestratorResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCachedResponse(key: string): OrchestratorResponse | null {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.response;
  responseCache.delete(key);
  return null;
}

function cacheResponse(key: string, response: OrchestratorResponse): void {
  // Limit cache size
  if (responseCache.size > 100) {
    const oldest = responseCache.keys().next().value;
    if (oldest) responseCache.delete(oldest);
  }
  responseCache.set(key, { response, timestamp: Date.now() });
}

// ============================================
// System Prompt
// ============================================

const SYSTEM_PROMPT = `You are the AI Command Center for a supply chain platform. You help operators manage yard operations (trucks, docks, gates) and demand planning (forecasts, inventory, replenishment).

You have access to tools that query real-time data from the supply chain database. Use them to answer questions with actual data — never make up numbers.

When asked about yard operations: use yard tools to check truck statuses, dock availability, exceptions, and metrics.
When asked about demand planning: use planning tools to check forecasts, inventory signals, replenishment recommendations, and products.
When knowledge base context is provided: use it to ground your answers about policies, procedures, and SOPs.

CRITICAL FORMATTING RULES — you are writing for a compact chat widget, NOT a document:
- Write in short, conversational paragraphs. NO markdown tables. NO headers with ### or ##.
- Use **bold** sparingly for key numbers or statuses only.
- For lists of items, use simple bullet points (• ) with one line each, keeping each line short.
- When showing truck/dock data, summarize counts and highlight only the notable items (critical, overdue, unusual).
- Do NOT dump raw data tables. Summarize and highlight what matters.
- Keep responses under 200 words. Be punchy and actionable.
- End with a one-line suggested next action when relevant.
- Use plain language an operator would use, not technical jargon.

Example good response style:
"There are **20 trucks** in the yard right now. **9 of 15 docks** are occupied.
• 2 trucks approaching the gate (1 reefer, 1 dry van)
• 3 checked in and waiting for dock assignment
• 1 critical exception: reefer temp violation on truck GA-2234-UV — needs immediate inspection.
Want me to pull up the exception details or check dock availability?"

Current date/time: ${new Date().toISOString()}`;

// ============================================
// Main Orchestrator
// ============================================

export async function orchestrate(request: OrchestratorRequest): Promise<OrchestratorResponse> {
  const { message, conversationHistory = [], context } = request;
  const startTime = Date.now();

  // Check cache for identical queries
  const cacheKey = `${message}:${context?.currentPage || ''}`;
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    console.log('[Orchestrator] Cache hit');
    return cached;
  }

  // Step 1: Detect domains
  const domains = detectDomains(message);
  const complexity = estimateQueryComplexity(message, domains);
  const maxTokens = getMaxTokens(complexity);
  const provider = selectLLMProvider(message, domains, true);

  console.log(`[Orchestrator] Domains: ${domains.join(',')}, Complexity: ${complexity}, Provider: ${provider}`);

  // Step 2: RAG knowledge grounding (if knowledge-related)
  let ragContext = '';
  let ragUsed = false;
  let ragSources: string[] = [];

  if (domains.includes('knowledge') || KNOWLEDGE_KEYWORDS.some(kw => message.toLowerCase().includes(kw))) {
    try {
      const ragService = getKnowledgeRagService();
      const result = await ragService.searchAll(message, { limit: 3, threshold: 0.65 });
      if (result.success && result.sections.length > 0) {
        ragContext = `\n\nKNOWLEDGE BASE CONTEXT (use this to ground your response):\n${formatSectionsForLLM(result.sections)}`;
        ragUsed = true;
        ragSources = result.sections.map(s => s.document_title);
      }
    } catch (err) {
      console.error('[Orchestrator] RAG search failed:', err);
    }
  }

  // Step 3: Collect available tools from relevant MCP servers
  const availableTools: MCPTool[] = [];
  const toolServerMap: Record<string, 'yard' | 'planning'> = {};

  if (domains.includes('yard') || domains.includes('general')) {
    const yardTools = getYardOperationsServer().listTools();
    availableTools.push(...yardTools);
    yardTools.forEach(t => { toolServerMap[t.name] = 'yard'; });
  }
  if (domains.includes('planning') || domains.includes('general')) {
    const planningTools = getDemandPlanningServer().listTools();
    availableTools.push(...planningTools);
    planningTools.forEach(t => { toolServerMap[t.name] = 'planning'; });
  }

  // Step 4: Build message history
  const messages: LLMMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT + ragContext },
    ...conversationHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message + (context?.currentPage ? `\n(User is currently on: ${context.currentPage})` : '') },
  ];

  // Step 5: Multi-step tool execution loop
  const toolsUsed: string[] = [];
  let iterations = 0;
  const MAX_ITERATIONS = 8;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const llmResponse = await callLLM(messages, availableTools, provider, maxTokens);
    const choice = llmResponse.choices[0]?.message;

    if (!choice) break;

    // Check if LLM wants to call tools
    const toolCalls = choice.tool_calls as Array<{ id: string; function: { name: string; arguments: string } }> | undefined;

    if (!toolCalls || toolCalls.length === 0) {
      // No tool calls - final response
      const elapsed = Date.now() - startTime;
      console.log(`[Orchestrator] Complete in ${elapsed}ms, ${iterations} iterations, ${toolsUsed.length} tools used`);

      const response: OrchestratorResponse = {
        message: choice.content || 'I was unable to generate a response. Please try rephrasing your question.',
        toolsUsed,
        domain: domains.join(', '),
        provider: llmResponse._provider,
        ragUsed,
        ragSources: ragUsed ? ragSources : undefined,
        complexity,
      };

      cacheResponse(cacheKey, response);
      return response;
    }

    // Execute tool calls (in parallel when possible)
    messages.push({ role: 'assistant', content: choice.content, tool_calls: toolCalls });

    const toolResults = await Promise.all(
      toolCalls.map(async (tc) => {
        const toolName = tc.function.name;
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(tc.function.arguments); } catch { args = {}; }

        toolsUsed.push(toolName);
        const server = toolServerMap[toolName];

        let result: MCPToolResult;
        if (server === 'yard') {
          result = await getYardOperationsServer().callTool({ name: toolName, arguments: args });
        } else if (server === 'planning') {
          result = await getDemandPlanningServer().callTool({ name: toolName, arguments: args });
        } else {
          result = { success: false, isError: true, content: [{ type: 'text', text: `Unknown tool: ${toolName}` }] };
        }

        const resultText = result.content.map(c =>
          c.type === 'json' ? JSON.stringify(c.data, null, 2) : (c.text || '')
        ).join('\n');

        return { id: tc.id, content: resultText };
      })
    );

    // Add tool results to message history
    for (const tr of toolResults) {
      messages.push({ role: 'tool', tool_call_id: tr.id, content: tr.content });
    }
  }

  // Max iterations reached
  return {
    message: 'I\'ve gathered extensive data but reached my processing limit. Here\'s what I found so far — you may want to check the dashboards for the full picture.',
    toolsUsed,
    domain: domains.join(', '),
    provider,
    ragUsed,
    ragSources: ragUsed ? ragSources : undefined,
    complexity,
  };
}
