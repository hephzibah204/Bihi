import React, { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { getSupabaseEnv } from '../utils/env';
import SimulationModal from './SimulationModal';
import SimulationSuggestionCard, { SimulationSuggestion } from './SimulationSuggestionCard';
import ImagePreview from './ImagePreview';
import SparklesIcon from './icons/SparklesIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import ChatHistorySidebar from './ChatHistorySidebar';
import { useAuth } from '../contexts/AuthContext';
import { getConversationService } from '../services/conversationService';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  html?: string;
  source?: 'gemini' | 'huggingface' | 'gemini-image' | 'unknown';
  image_base64?: string;
  simulation?: SimulationSuggestion;
  createdAt?: number;
};

interface ChatProps {
  title?: string;
}

function parseSimulationFromText(text: string): SimulationSuggestion | null {
  if (!text) return null;
  if (!text.includes('🎮 **Simulation:**')) return null;
  // Heuristic parsing: look for URL and title near the marker
  const urlMatch = text.match(/https?:[^\s)]+/); // first URL
  const titleMatch = text.match(/\*\*Simulation:\*\*\s*(.+?)(\n|$)/);
  const title = titleMatch ? titleMatch[1].trim() : 'Interactive Simulation';
  const url = urlMatch ? urlMatch[0] : '';
  if (!url) return null;
  return { title, url };
}

async function fetchNonStream(prompt: string): Promise<any> {
  const { VITE_SUPABASE_URL } = getSupabaseEnv();
  const url = `${VITE_SUPABASE_URL}/functions/v1/ai-chat`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, stream: false })
  });
  if (!res.ok) throw new Error(`ai-chat failed: ${res.status}`);
  return res.json();
}

async function fetchStream(prompt: string, onChunk: (chunk: string | Record<string, any>) => void): Promise<void> {
  const { VITE_SUPABASE_URL } = getSupabaseEnv();
  const url = `${VITE_SUPABASE_URL}/functions/v1/ai-chat`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, stream: true })
  });
  if (!res.ok || !res.body) {
    throw new Error(`ai-chat stream failed: ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    // Basic SSE-ish splitting: lines beginning with 'data:'
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('data:')) {
        const payload = trimmed.replace(/^data:\s*/, '');
        try {
          const json = JSON.parse(payload);
          onChunk(json);
        } catch {
          onChunk(payload);
        }
      } else {
        onChunk(trimmed);
      }
    }
  }
}

const Chat: React.FC<ChatProps> = ({ title = 'AI Chat' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSimOpen, setIsSimOpen] = useState(false);
  const [sim, setSim] = useState<SimulationSuggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, session } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const assistantTextRef = useRef('');

  const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '');
  const formatTime = (ts?: number) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const sendPrompt = async (prompt: string) => {
    if (!prompt) return;
    const now = Date.now();
    const userMsg: ChatMessage = { id: `u_${now}`, role: 'user', text: prompt, createdAt: now };
    setMessages(prev => [...prev, userMsg]);

    const assistantId = `a_${Date.now()}`;
    const aiNow = Date.now();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', text: '', createdAt: aiNow }]);

    try {
      // Prefer streaming
      setIsStreaming(true);
      await fetchStream(prompt, (chunk) => {
        if (typeof chunk === 'string') {
          assistantTextRef.current += chunk;
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, text: (m.text || '') + chunk } : m));
          return;
        }
        // JSON chunk
        const { text, html, source, image_base64, simulation } = chunk as any;
        if (text) {
          assistantTextRef.current += text;
        }
        setMessages(prev => prev.map(m => {
          if (m.id !== assistantId) return m;
          return {
            ...m,
            text: text ? ((m.text || '') + text) : m.text,
            html: html ?? m.html,
            source: source ?? m.source,
            image_base64: image_base64 ?? m.image_base64,
            simulation: simulation ?? m.simulation,
          };
        }));
      });
    } catch (err) {
      // Fallback to non-stream
      try {
        const data = await fetchNonStream(prompt);
        const msg: ChatMessage = { id: assistantId, role: 'assistant' } as ChatMessage;
        msg.source = data?.source || 'unknown';
        if (data?.html) msg.html = data.html;
        if (data?.text) msg.text = data.text;
        if (data?.image_base64) msg.image_base64 = data.image_base64;
        if (data?.simulation) msg.simulation = data.simulation as SimulationSuggestion;
        setMessages(prev => prev.map(m => m.id === assistantId ? msg : m));
      } catch (err2) {
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, text: `Error: ${(err2 as any)?.message || 'Unknown error'}` } : m));
      }
    } finally {
      setIsStreaming(false);
      // Detect simulation suggestion in streamed text
      const text = assistantTextRef.current || '';
      const simParsed = parseSimulationFromText(text);
      if (simParsed) {
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, simulation: simParsed } : m));
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;
    setInput('');
    await sendPrompt(prompt);
  };

  const onTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const prompt = input.trim();
      if (prompt && !isStreaming) {
        setInput('');
        void sendPrompt(prompt);
      }
    }
  };

  const launchSim = (s: SimulationSuggestion) => {
    setSim(s);
    setIsSimOpen(true);
  };

  const clearChat = () => setMessages([]);

  const suggestions: string[] = [
    'Summarize the following notes:',
    'Create a study plan for Algebra this week.',
    'Explain photosynthesis simply.',
    'Draft 5 quiz questions on fractions.'
  ];

  const handleLoadConversation = async (conversationId: string) => {
    try {
      const svc = getConversationService();
      const msgs = await svc.getMessages(conversationId);
      const mapped: ChatMessage[] = (msgs || []).map(m => ({
        id: m.id,
        role: m.role === 'assistant' ? 'assistant' : 'user',
        text: m.content,
        createdAt: m.created_at ? new Date(m.created_at).getTime() : undefined
      }));
      setMessages(mapped);
      setIsHistoryOpen(false);
    } catch {
      setIsHistoryOpen(false);
    }
  };

  return (
    <div className={`relative w-full max-w-[95vw] bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden`}>
      {/* Header */}
      <header className="px-4 py-3 border-b flex justify-between items-center flex-shrink-0 bg-gradient-to-r from-indigo-50 to-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            <div className="text-[11px] text-gray-500 truncate">Enter to send • Shift+Enter for newline</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[11px] text-gray-500 flex items-center">
            <span className={`w-2 h-2 rounded-full mr-1.5 ${isStreaming ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
            {isStreaming ? 'Thinking' : 'Ready'}
          </div>
          <button onClick={() => setIsHistoryOpen(true)} title="History" className="p-2 rounded-md hover:bg-gray-100 text-gray-600" disabled={!session?.access_token || !(user as any)?.id}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h16v16H4z M8 8h8v2H8z M8 12h8v2H8z M8 16h5v2H8z"/></svg>
          </button>
          <button onClick={clearChat} title="Clear chat" className="p-2 rounded-md hover:bg-gray-100 text-gray-600">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18M9 6v12m6-12v12M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14"/></svg>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-4 bg-[linear-gradient(to_bottom,rgba(99,102,241,0.04),transparent_120px)]">
        {messages.map((m) => (
          <div key={m.id} className={`group relative flex items-start gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 mt-1 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 flex-shrink-0">
                <SparklesIcon className="w-5 h-5" />
              </div>
            )}
            <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-sm ${m.role === 'assistant' ? 'bg-gray-50 border border-gray-100 rounded-bl-md' : 'bg-indigo-600 text-white rounded-br-md'}`}>
              {m.simulation ? (
                <SimulationSuggestionCard simulation={m.simulation} onLaunch={launchSim} />
              ) : m.source === 'gemini-image' || m.image_base64 || m.html ? (
                <ImagePreview html={m.html} base64={m.image_base64} />
              ) : m.html ? (
                <div className="prose prose-sm max-w-none"><div dangerouslySetInnerHTML={{ __html: m.html }} /></div>
              ) : (
                <div className={`text-[13px] leading-6 whitespace-pre-wrap break-words ${m.role === 'assistant' ? 'text-gray-800' : 'text-white'}`}>{m.text}</div>
              )}
              <div className={`mt-2 flex items-center gap-2 text-[11px] ${m.role === 'assistant' ? 'text-gray-500' : 'text-indigo-200'}`}>
                {m.createdAt && <span>{formatTime(m.createdAt)}</span>}
                {m.role === 'assistant' && (
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded hover:bg-gray-200/70 text-gray-700"
                    onClick={() => navigator.clipboard?.writeText(stripHtml(m.text || ''))}
                    title="Copy"
                  >
                    Copy
                  </button>
                )}
              </div>
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 mt-1 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                <UserCircleIcon className="w-6 h-6" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <footer className="p-3 border-t space-y-3 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">Suggested prompts</div>
          <button className="text-xs text-indigo-600 hover:text-indigo-700" onClick={() => setShowSuggestions(s => !s)}>
            {showSuggestions ? 'Hide' : 'Show'}
          </button>
        </div>
        {showSuggestions && (
          <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto pr-1">
            {suggestions.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className="px-2.5 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 whitespace-nowrap"
                onClick={() => { setInput(prompt); }}
                aria-label={`Use sample prompt: ${prompt}`}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onTextareaKeyDown}
            placeholder="Ask anything… Enter to send • Shift+Enter newline"
            className="input-field flex-1 h-24 resize-y"
            rows={4}
          />
          <div className="flex flex-col gap-2">
            <button type="submit" className="btn btn-primary" disabled={isStreaming || !input.trim()}>
              <span className="inline-flex items-center gap-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"/></svg>
                Send
              </span>
            </button>
          </div>
        </form>
      </footer>

      {/* Modals */}
      {sim && (
        <SimulationModal isOpen={isSimOpen} onClose={() => setIsSimOpen(false)} title={sim.title} url={sim.url} />
      )}

      {isHistoryOpen && session?.access_token && (user as any)?.id && (
        <ChatHistorySidebar
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          userId={(user as any).id}
          authToken={session.access_token}
          filterType="text_chat"
          onLoadConversation={handleLoadConversation}
        />
      )}
    </div>
  );
};

export default Chat;
