'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useAIAssistant, getQuickActions, type AIMessage } from '@/hooks/useAIAssistant';
import {
  Brain, Send, Mic, MicOff, X, Minimize2, Maximize2,
  Sparkles, Loader2, Bot, User, Trash2, ChevronDown,
  Zap, Database, Search, AlertTriangle, CheckCircle2,
  BarChart3,
} from 'lucide-react';

interface AICommandCenterProps {
  currentPage?: string;
  selectedTruckId?: string;
  selectedDockId?: string;
  selectedProductId?: string;
}

// ============================================
// Lightweight Markdown Renderer for Chat
// ============================================
function renderChatMarkdown(text: string, isUser: boolean): React.ReactNode {
  // Split into lines and process
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip markdown table rows (|---|---| or | header | header |)
    if (/^\s*\|[\s\-|:]+\|?\s*$/.test(line)) continue;
    if (/^\s*\|.*\|.*\|/.test(line) && line.includes('---')) continue;

    // Strip markdown headers (### Header → just the text bold)
    const headerMatch = line.match(/^#{1,4}\s+(.*)$/);
    if (headerMatch) {
      if (elements.length > 0) elements.push(<div key={key++} className="h-2" />);
      elements.push(
        <div key={key++} className="font-semibold text-[13px]">
          {renderInlineMarkdown(headerMatch[1], isUser)}
        </div>
      );
      continue;
    }

    // Convert markdown table rows to simple bullet lines
    if (/^\s*\|/.test(line)) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
      if (cells.length > 1) {
        line = '• ' + cells.join(' — ');
      }
    }

    // Bullet points (-, *, •, or numbered)
    const bulletMatch = line.match(/^\s*[-*•]\s+(.*)$/) || line.match(/^\s*\d+\.\s+(.*)$/);
    if (bulletMatch) {
      elements.push(
        <div key={key++} className="flex gap-1.5 ml-1">
          <span className="text-blue-400 flex-shrink-0">•</span>
          <span>{renderInlineMarkdown(bulletMatch[1], isUser)}</span>
        </div>
      );
      continue;
    }

    // Empty line = paragraph break
    if (line.trim() === '') {
      elements.push(<div key={key++} className="h-1.5" />);
      continue;
    }

    // Regular text line
    elements.push(
      <div key={key++}>{renderInlineMarkdown(line, isUser)}</div>
    );
  }

  return <>{elements}</>;
}

function renderInlineMarkdown(text: string, isUser: boolean): React.ReactNode {
  // Process **bold** and *italic* inline
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let partKey = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/^([\s\S]*?)\*\*(.+?)\*\*([\s\S]*)/);
    if (boldMatch) {
      if (boldMatch[1]) parts.push(<span key={partKey++}>{boldMatch[1]}</span>);
      parts.push(
        <strong key={partKey++} className={isUser ? 'font-bold' : 'font-semibold text-gray-900'}>
          {boldMatch[2]}
        </strong>
      );
      remaining = boldMatch[3];
      continue;
    }
    // No more matches
    parts.push(<span key={partKey++}>{remaining}</span>);
    break;
  }

  return <>{parts}</>;
}

// ============================================
// Message Bubble Component
// ============================================
function MessageBubble({ message }: { message: AIMessage }) {
  const isUser = message.role === 'user';
  const meta = message.metadata;

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Bot size={16} className="text-white" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-800 rounded-bl-md'
          }`}
        >
          <div className="space-y-0.5">
            {isUser ? message.content : renderChatMarkdown(message.content, isUser)}
          </div>
        </div>

        {/* Metadata badges */}
        {meta && !isUser && (
          <div className="flex flex-wrap gap-1.5 mt-1.5 px-1">
            {meta.domain && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                <Database size={10} /> {meta.domain}
              </span>
            )}
            {meta.provider && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
                <Zap size={10} /> {meta.provider}
              </span>
            )}
            {meta.ragUsed && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                <Search size={10} /> RAG
              </span>
            )}
            {meta.toolsUsed && meta.toolsUsed.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                <BarChart3 size={10} /> {meta.toolsUsed.length} tools
              </span>
            )}
            {meta.complexity && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                meta.complexity === 'complex' ? 'text-red-600 bg-red-50' :
                meta.complexity === 'medium' ? 'text-amber-600 bg-amber-50' :
                'text-green-600 bg-green-50'
              }`}>
                {meta.complexity}
              </span>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
          <User size={16} className="text-white" />
        </div>
      )}
    </div>
  );
}

// ============================================
// Main AI Command Center
// ============================================
export default function AICommandCenter({ currentPage, selectedTruckId, selectedDockId, selectedProductId }: AICommandCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    isListening,
    hasVoice,
    sendMessage,
    startListening,
    stopListening,
    clearMessages,
  } = useAIAssistant({ currentPage, selectedTruckId, selectedDockId, selectedProductId });

  const quickActions = getQuickActions(currentPage);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
        title="AI Command Center"
      >
        <Brain size={24} className="text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></span>
        <span className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          AI Command Center
        </span>
      </button>
    );
  }

  return (
    <div className={`fixed z-50 ${isExpanded ? 'inset-4' : 'bottom-6 right-6 w-[440px] h-[640px]'} transition-all duration-300`}>
      <div className="w-full h-full bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Brain size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold">AI Command Center</h3>
              <p className="text-[10px] text-blue-200">MCP + RAG + Multi-LLM</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors" title={isExpanded ? 'Minimize' : 'Maximize'}>
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button onClick={clearMessages} className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors" title="Clear chat">
              <Trash2 size={16} />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors" title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-blue-600" />
              </div>
              <h4 className="text-base font-bold text-gray-800 mb-1">Supply Chain AI Assistant</h4>
              <p className="text-xs text-gray-500 mb-6 max-w-xs">
                Ask about yard operations, demand planning, or search the knowledge base. I use real-time data from your supply chain.
              </p>

              {/* Quick Actions */}
              <div className="w-full space-y-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Quick Actions</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {quickActions.slice(0, 4).map((action, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(action.query)}
                      className="text-left px-3 py-2 bg-gray-50 hover:bg-blue-50 rounded-lg text-xs text-gray-700 hover:text-blue-700 transition-colors border border-transparent hover:border-blue-200"
                    >
                      <span className="font-medium">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Architecture badges */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  <Database size={10} /> 40+ MCP Tools
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <Search size={10} /> RAG Knowledge Base
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                  <Zap size={10} /> Multi-LLM Routing
                </span>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                    <Loader2 size={16} className="text-blue-600 animate-spin" />
                    <span className="text-sm text-gray-500">Querying supply chain data...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-3 flex-shrink-0">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about trucks, forecasts, dock operations..."
                className="w-full resize-none rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-3 py-2.5 text-sm max-h-24 min-h-[40px] outline-none"
                rows={1}
                disabled={isLoading}
              />
            </div>
            {hasVoice && (
              <button
                onClick={isListening ? stopListening : startListening}
                className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${
                  isListening
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                title={isListening ? 'Stop listening' : 'Voice input'}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              title="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
