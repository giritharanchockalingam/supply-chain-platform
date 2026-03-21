/**
 * useAIAssistant - React Hook for the Supply Chain AI Command Center
 *
 * Features:
 * - Message management with conversation history
 * - Streaming-style updates (progressive reveal)
 * - Voice input via Web Speech API
 * - Context-aware (knows which page user is on)
 * - Quick action suggestions
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    toolsUsed?: string[];
    domain?: string;
    provider?: string;
    ragUsed?: boolean;
    ragSources?: string[];
    complexity?: string;
  };
}

interface UseAIAssistantOptions {
  currentPage?: string;
  selectedTruckId?: string;
  selectedDockId?: string;
  selectedProductId?: string;
}

export function useAIAssistant(options: UseAIAssistantOptions = {}) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (SpeechRecognitionCtor) {
        recognitionRef.current = new SpeechRecognitionCtor();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
      }
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Cancel any previous request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          conversationHistory,
          context: {
            currentPage: options.currentPage,
            selectedTruckId: options.selectedTruckId,
            selectedDockId: options.selectedDockId,
            selectedProductId: options.selectedProductId,
          },
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`AI service returned ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: AIMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.message || data.error || 'No response received.',
        timestamp: new Date(),
        metadata: {
          toolsUsed: data.toolsUsed,
          domain: data.domain,
          provider: data.provider,
          ragUsed: data.ragUsed,
          ragSources: data.ragSources,
          complexity: data.complexity,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `I encountered an error: ${errorMsg}. Please try again.`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, options]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setIsListening(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      sendMessage(transcript);
    };
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.start();
  }, [sendMessage]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const cancelRequest = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    error,
    isListening,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hasVoice: typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in (window as any)),
    sendMessage,
    startListening,
    stopListening,
    clearMessages,
    cancelRequest,
  };
}

// Quick action suggestions based on current page
export function getQuickActions(currentPage?: string): Array<{ label: string; query: string }> {
  const common = [
    { label: 'Yard Overview', query: 'Give me a quick summary of the yard right now — trucks, docks, and any critical exceptions' },
    { label: 'Critical Alerts', query: 'Are there any critical exceptions or issues I need to handle immediately?' },
  ];

  switch (currentPage) {
    case 'yard/dashboard':
      return [
        ...common,
        { label: 'High Dwell Trucks', query: 'Which trucks have been in the yard for over 2 hours?' },
        { label: 'Dock Utilization', query: 'Show me dock utilization report — which docks are underperforming?' },
      ];
    case 'yard/map':
      return [
        { label: 'Available Docks', query: 'Which docks are currently available for assignment?' },
        { label: 'Approaching Trucks', query: 'How many trucks are approaching or at the gate right now?' },
        ...common,
      ];
    case 'yard/docks':
      return [
        { label: 'Dock Status', query: 'Give me a full status report on all docks' },
        { label: 'Maintenance Docks', query: 'Which docks are in maintenance and when will they be available?' },
        ...common,
      ];
    case 'planning/dashboard':
      return [
        { label: 'Planning KPIs', query: 'Show me the key demand planning metrics — forecast accuracy, fill rate, inventory health' },
        { label: 'Low Stock Alerts', query: 'Which products are below their reorder point?' },
        { label: 'Pending Orders', query: 'How many replenishment recommendations are waiting for approval?' },
      ];
    case 'planning/forecasts':
      return [
        { label: 'Forecast Accuracy', query: 'What is our overall forecast accuracy (MAPE) for the last 12 periods?' },
        { label: 'Worst Forecasts', query: 'Which SKUs have the worst forecast accuracy?' },
      ];
    case 'planning/replenishment':
      return [
        { label: 'Critical Orders', query: 'Show me all critical urgency replenishment recommendations' },
        { label: 'Pipeline Value', query: 'What is the total value of our replenishment pipeline?' },
      ];
    default:
      return [
        ...common,
        { label: 'Planning Summary', query: 'Give me a demand planning overview — forecasts, inventory health, and pending replenishments' },
        { label: 'Today\'s Throughput', query: 'How many trucks have arrived and departed today?' },
      ];
  }
}
