/**
 * Knowledge RAG Service - Supply Chain Platform
 *
 * Semantic search over supply chain SOPs, dock procedures,
 * carrier policies, safety protocols, and operational knowledge.
 *
 * Architecture:
 * 1. User query → generate embedding via OpenAI text-embedding-3-small
 * 2. pgvector cosine similarity search on document_sections
 * 3. Fallback to keyword search if embeddings unavailable
 * 4. Returns ranked sections for LLM grounding
 */

import { createClient } from '@supabase/supabase-js';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

// ============================================
// Types
// ============================================

export interface DocumentSection {
  section_id: string;
  document_id: string;
  document_title: string;
  document_slug: string;
  doc_type: string;
  section_no: number;
  section_title: string | null;
  content: string;
  similarity: number;
}

export type DocType = 'policy' | 'sop' | 'safety' | 'carrier' | 'dock_procedure' | 'hazmat' | 'compliance' | 'faq' | 'training';

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  docTypes?: DocType[];
  facilityId?: string;
}

export interface SearchResult {
  success: boolean;
  sections: DocumentSection[];
  query: string;
  totalFound: number;
  searchMethod: 'embedding' | 'keyword' | 'fallback';
  error?: string;
}

// ============================================
// Embedding Service
// ============================================

async function generateEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text.trim().substring(0, 8000) }),
    });
    if (!response.ok) { console.error('[RAG] Embedding API error:', await response.text()); return null; }
    const data = await response.json();
    return data.data[0].embedding;
  } catch (err) {
    console.error('[RAG] Embedding generation failed:', err);
    return null;
  }
}

// ============================================
// Knowledge RAG Service
// ============================================

export class KnowledgeRagService {
  private supabase: SupabaseClient;
  private openaiApiKey: string;
  private defaultOptions: SearchOptions = { limit: 5, threshold: 0.7 };

  constructor(supabase: SupabaseClient, openaiApiKey: string) {
    this.supabase = supabase;
    this.openaiApiKey = openaiApiKey;
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const opts = { ...this.defaultOptions, ...options };

    // Step 1: Try semantic search via embeddings
    const embedding = await generateEmbedding(query, this.openaiApiKey);

    if (embedding) {
      const embeddingStr = `[${embedding.join(',')}]`;
      const { data, error } = await this.supabase.rpc('match_sc_document_sections', {
        query_embedding: embeddingStr,
        match_threshold: opts.threshold,
        match_count: opts.limit,
        filter_doc_types: opts.docTypes || null,
        filter_facility_id: opts.facilityId || null,
      });

      if (!error && data?.length > 0) {
        return { success: true, sections: data, query, totalFound: data.length, searchMethod: 'embedding' };
      }
    }

    // Step 2: Fallback to keyword search
    return this.searchByKeywords(query, opts);
  }

  async searchByKeywords(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const opts = { ...this.defaultOptions, ...options };
    const { data, error } = await this.supabase.rpc('search_sc_knowledge_by_keywords', {
      search_query: query,
      filter_doc_types: opts.docTypes || null,
      match_count: opts.limit,
    });

    if (error) {
      return { success: false, sections: [], query, totalFound: 0, searchMethod: 'keyword', error: error.message };
    }

    const sections: DocumentSection[] = (data || []).map((row: DocumentSection & { rank?: number }) => ({ ...row, similarity: row.rank || 0.5 }));
    return { success: true, sections, query, totalFound: sections.length, searchMethod: 'keyword' };
  }

  // Domain-specific search methods
  async searchPolicies(query: string, options?: Omit<SearchOptions, 'docTypes'>) {
    return this.search(query, { ...options, docTypes: ['policy'] });
  }

  async searchSOPs(query: string, options?: Omit<SearchOptions, 'docTypes'>) {
    return this.search(query, { ...options, docTypes: ['sop'] });
  }

  async searchSafety(query: string, options?: Omit<SearchOptions, 'docTypes'>) {
    return this.search(query, { ...options, docTypes: ['safety', 'hazmat'] });
  }

  async searchDockProcedures(query: string, options?: Omit<SearchOptions, 'docTypes'>) {
    return this.search(query, { ...options, docTypes: ['dock_procedure'] });
  }

  async searchCarrierPolicies(query: string, options?: Omit<SearchOptions, 'docTypes'>) {
    return this.search(query, { ...options, docTypes: ['carrier'] });
  }

  async searchAll(query: string, options?: Omit<SearchOptions, 'docTypes'>) {
    return this.search(query, options);
  }
}

// ============================================
// Response Formatting Helpers
// ============================================

export function formatSectionsForLLM(sections: DocumentSection[]): string {
  if (sections.length === 0) return 'No relevant information found in the knowledge base.';

  const byDocument = new Map<string, DocumentSection[]>();
  for (const section of sections) {
    if (!byDocument.has(section.document_id)) byDocument.set(section.document_id, []);
    byDocument.get(section.document_id)!.push(section);
  }

  const formatted: string[] = [];
  for (const [, docSections] of byDocument) {
    const doc = docSections[0];
    const sorted = docSections.sort((a, b) => a.section_no - b.section_no);
    let text = `**${doc.document_title}** (${doc.doc_type})\n`;
    for (const section of sorted) {
      if (section.section_title) text += `\n*${section.section_title}*\n`;
      text += `${section.content}\n`;
    }
    formatted.push(text);
  }

  return formatted.join('\n---\n\n');
}

export function hasConfidentAnswer(sections: DocumentSection[], threshold = 0.8): boolean {
  return sections.some(s => s.similarity >= threshold);
}

export function getBestMatch(sections: DocumentSection[]): DocumentSection | null {
  if (sections.length === 0) return null;
  return sections.reduce((best, current) => current.similarity > best.similarity ? current : best);
}

// ============================================
// Singleton Factory
// ============================================

let _instance: KnowledgeRagService | null = null;

export function getKnowledgeRagService(): KnowledgeRagService {
  if (!_instance) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { db: { schema: 'supply_chain' } }
    );
    _instance = new KnowledgeRagService(supabase, process.env.OPENAI_API_KEY || '');
  }
  return _instance;
}
