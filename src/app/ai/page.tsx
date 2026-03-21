'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useAIAssistant, getQuickActions, type AIMessage } from '@/hooks/useAIAssistant';
import {
  Brain, Send, Mic, MicOff, Sparkles, Loader2, Bot, User,
  Trash2, Zap, Database, Search, BarChart3, BookOpen,
  Shield, Truck, Package, AlertTriangle, CheckCircle2,
  Clock, Activity, Server,
} from 'lucide-react';

// ============================================
// Lightweight Markdown Renderer for Chat
// ============================================
function renderChatContent(text: string, isUser: boolean): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip markdown table separator rows
    if (/^\s*\|[\s\-|:]+\|?\s*$/.test(line)) continue;
    if (/^\s*\|.*\|.*\|/.test(line) && line.includes('---')) continue;

    // Strip markdown headers → bold text
    const headerMatch = line.match(/^#{1,4}\s+(.*)$/);
    if (headerMatch) {
      if (elements.length > 0) elements.push(<div key={key++} className="h-2" />);
      elements.push(
        <div key={key++} className="font-semibold">{renderBold(headerMatch[1], isUser)}</div>
      );
      continue;
    }

    // Convert markdown table rows to bullet lines
    if (/^\s*\|/.test(line)) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
      if (cells.length > 1) line = '• ' + cells.join(' — ');
    }

    // Bullet points
    const bulletMatch = line.match(/^\s*[-*•]\s+(.*)$/) || line.match(/^\s*\d+\.\s+(.*)$/);
    if (bulletMatch) {
      elements.push(
        <div key={key++} className="flex gap-2 ml-1">
          <span className="text-blue-400 flex-shrink-0">•</span>
          <span>{renderBold(bulletMatch[1], isUser)}</span>
        </div>
      );
      continue;
    }

    if (line.trim() === '') { elements.push(<div key={key++} className="h-1.5" />); continue; }
    elements.push(<div key={key++}>{renderBold(line, isUser)}</div>);
  }
  return <>{elements}</>;
}

function renderBold(text: string, isUser: boolean): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let k = 0;
  while (remaining.length > 0) {
    const m = remaining.match(/^([\s\S]*?)\*\*(.+?)\*\*([\s\S]*)/);
    if (m) {
      if (m[1]) parts.push(<span key={k++}>{m[1]}</span>);
      parts.push(<strong key={k++} className={isUser ? 'font-bold' : 'font-semibold text-gray-900'}>{m[2]}</strong>);
      remaining = m[3];
      continue;
    }
    parts.push(<span key={k++}>{remaining}</span>);
    break;
  }
  return <>{parts}</>;
}

// ============================================
// Message Component
// ============================================
function Message({ message }: { message: AIMessage }) {
  const isUser = message.role === 'user';
  const meta = message.metadata;

  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <Bot size={20} className="text-white" />
        </div>
      )}
      <div className={`max-w-[75%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
          }`}
        >
          <div className="space-y-0.5">
            {isUser ? message.content : renderChatContent(message.content, isUser)}
          </div>
        </div>
        {meta && !isUser && (
          <div className="flex flex-wrap gap-2 mt-2 px-1">
            {meta.domain && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                <Database size={11} /> {meta.domain}
              </span>
            )}
            {meta.provider && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                <Zap size={11} /> {meta.provider}
              </span>
            )}
            {meta.ragUsed && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <BookOpen size={11} /> RAG grounded
              </span>
            )}
            {meta.toolsUsed && meta.toolsUsed.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                <BarChart3 size={11} /> {meta.toolsUsed.length} MCP tools
              </span>
            )}
            {meta.complexity && (
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                meta.complexity === 'complex' ? 'text-red-600 bg-red-50' :
                meta.complexity === 'medium' ? 'text-amber-600 bg-amber-50' :
                'text-green-600 bg-green-50'
              }`}>
                <Activity size={11} /> {meta.complexity}
              </span>
            )}
          </div>
        )}
        {meta?.ragSources && meta.ragSources.length > 0 && (
          <div className="mt-1.5 px-1">
            <span className="text-[10px] text-gray-400">Sources: {meta.ragSources.join(', ')}</span>
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center flex-shrink-0">
          <User size={20} className="text-white" />
        </div>
      )}
    </div>
  );
}

// ============================================
// Full Page AI Command Center
// ============================================
export default function AIPage() {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages, isLoading, isListening, hasVoice,
    sendMessage, startListening, stopListening, clearMessages,
  } = useAIAssistant({ currentPage: 'ai' });

  const quickActions = getQuickActions();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (inputValue.trim()) { sendMessage(inputValue); setInputValue(''); }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <Brain size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Command Center</h1>
                <p className="text-blue-200 text-sm">MCP Tool Orchestration + RAG Knowledge + Multi-LLM Routing</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white bg-opacity-10 px-3 py-1.5 rounded-lg">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">System Online</span>
              </div>
              <button onClick={clearMessages} className="px-3 py-1.5 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg text-sm transition-colors flex items-center gap-2">
                <Trash2 size={14} /> Clear
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-gradient-to-b from-slate-50 to-white">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles size={36} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Supply Chain AI Assistant</h2>
              <p className="text-gray-500 mb-8 max-w-lg">
                Ask me anything about your supply chain. I query real-time data through 40+ MCP tools across yard operations and demand planning, grounded by RAG knowledge search.
              </p>

              {/* Architecture Cards */}
              <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-xl">
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-left shadow-sm">
                  <Server size={20} className="text-blue-600 mb-2" />
                  <h3 className="text-sm font-bold text-gray-800">MCP Servers</h3>
                  <p className="text-xs text-gray-500 mt-1">2 domain servers with 40+ tools for real-time data</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-left shadow-sm">
                  <BookOpen size={20} className="text-emerald-600 mb-2" />
                  <h3 className="text-sm font-bold text-gray-800">RAG Knowledge</h3>
                  <p className="text-xs text-gray-500 mt-1">8 documents, 27 sections with pgvector search</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-left shadow-sm">
                  <Zap size={20} className="text-purple-600 mb-2" />
                  <h3 className="text-sm font-bold text-gray-800">Multi-LLM</h3>
                  <p className="text-xs text-gray-500 mt-1">Claude, OpenAI, Groq with circuit breaker failover</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="w-full max-w-xl">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(action.query)}
                      className="text-left px-4 py-3 bg-white hover:bg-blue-50 rounded-xl text-sm text-gray-700 hover:text-blue-700 transition-colors border border-gray-100 hover:border-blue-200 shadow-sm"
                    >
                      <span className="font-medium">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => <Message key={msg.id} message={msg} />)}
              {isLoading && (
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot size={20} className="text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-md px-5 py-3.5 flex items-center gap-3 shadow-sm border border-gray-100">
                    <Loader2 size={18} className="text-blue-600 animate-spin" />
                    <div>
                      <span className="text-sm text-gray-600">Querying supply chain data...</span>
                      <p className="text-xs text-gray-400 mt-0.5">Running MCP tools and analyzing results</p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 bg-white px-8 py-4">
          <div className="max-w-4xl mx-auto flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about trucks, forecasts, dock procedures, carrier policies..."
                className="w-full resize-none rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-4 py-3 text-sm max-h-32 min-h-[48px] outline-none transition-all"
                rows={1}
                disabled={isLoading}
              />
            </div>
            {hasVoice && (
              <button
                onClick={isListening ? stopListening : startListening}
                className={`p-3 rounded-xl transition-colors flex-shrink-0 ${
                  isListening ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Knowledge Base & Architecture Info */}
      <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto hidden xl:block">
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Server size={16} className="text-blue-600" /> MCP Tool Servers
            </h3>
            <div className="space-y-2">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700">Yard Operations</span>
                  <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">17 tools</span>
                </div>
                <p className="text-[10px] text-blue-600 mt-1">Trucks, docks, gates, exceptions, carriers, metrics</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700">Demand Planning</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">14 tools</span>
                </div>
                <p className="text-[10px] text-emerald-600 mt-1">Forecasts, inventory, replenishment, products, signals</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <BookOpen size={16} className="text-emerald-600" /> Knowledge Base (RAG)
            </h3>
            <div className="space-y-1.5">
              {[
                { icon: Truck, label: 'Dock Operations SOP', type: 'sop' },
                { icon: Shield, label: 'Gate Check-In Procedure', type: 'sop' },
                { icon: Package, label: 'Carrier Management Policy', type: 'carrier' },
                { icon: AlertTriangle, label: 'Hazmat Handling', type: 'hazmat' },
                { icon: BarChart3, label: 'Demand Forecasting', type: 'policy' },
                { icon: CheckCircle2, label: 'Replenishment Policy', type: 'policy' },
                { icon: Clock, label: 'Yard Capacity Guide', type: 'sop' },
                { icon: Search, label: 'Compliance FAQ', type: 'faq' },
              ].map((doc, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-gray-600 hover:bg-gray-50">
                  <doc.icon size={12} className="text-gray-400 flex-shrink-0" />
                  <span className="flex-1 truncate">{doc.label}</span>
                  <span className="text-[9px] text-gray-400 bg-gray-100 px-1 rounded">{doc.type}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Zap size={16} className="text-purple-600" /> LLM Routing
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                <span className="font-medium text-green-700">Simple</span>
                <span className="text-green-600">Groq (Llama 3.3)</span>
              </div>
              <div className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2">
                <span className="font-medium text-amber-700">Medium</span>
                <span className="text-amber-600">OpenAI (GPT-4o)</span>
              </div>
              <div className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2">
                <span className="font-medium text-red-700">Complex</span>
                <span className="text-red-600">Claude (Sonnet)</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Circuit breaker failover with 30s reset timeout</p>
          </div>
        </div>
      </div>
    </div>
  );
}
