/**
 * AI Chat API Route
 *
 * Main endpoint for the AI Command Center.
 * Routes queries through the orchestrator with MCP tool execution,
 * RAG knowledge grounding, and multi-LLM routing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { orchestrate, type OrchestratorRequest } from '@/lib/ai/orchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory, context } = body as OrchestratorRequest;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const result = await orchestrate({
      message: message.trim(),
      conversationHistory: conversationHistory || [],
      context: context || {},
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[AI Chat] Error:', error);
    return NextResponse.json(
      { error: 'AI service error', message: 'I encountered an error processing your request. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check / capability discovery
  return NextResponse.json({
    status: 'ok',
    capabilities: {
      domains: ['yard', 'planning', 'knowledge', 'general'],
      llmProviders: ['claude', 'openai', 'groq'],
      features: ['multi-llm-routing', 'rag-knowledge-grounding', 'mcp-tool-execution', 'response-caching'],
      mcpServers: [
        { name: 'mcp-yard-operations', tools: 17, domain: 'Truck, dock, gate, exception management' },
        { name: 'mcp-demand-planning', tools: 14, domain: 'Forecasts, inventory, replenishment, products' },
      ],
    },
  });
}
