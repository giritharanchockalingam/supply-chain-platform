/**
 * RAG Knowledge Search API Route
 *
 * Direct search endpoint for the knowledge base.
 * Supports semantic (embedding) and keyword search.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getKnowledgeRagService, formatSectionsForLLM, type DocType } from '@/lib/ai/rag-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, docTypes, limit, threshold } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const ragService = getKnowledgeRagService();
    const result = await ragService.search(query, {
      docTypes: docTypes as DocType[] | undefined,
      limit: limit || 5,
      threshold: threshold || 0.65,
    });

    return NextResponse.json({
      ...result,
      formattedContext: formatSectionsForLLM(result.sections),
    });
  } catch (error) {
    console.error('[RAG] Error:', error);
    return NextResponse.json({ error: 'RAG service error' }, { status: 500 });
  }
}
