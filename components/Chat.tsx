import React, { useEffect, useRef, useState } from 'react';
import { getSupabaseEnv } from '../utils/env';
import SimulationModal from './SimulationModal';
import SimulationSuggestionCard, { SimulationSuggestion } from './SimulationSuggestionCard';
import ImagePreview from './ImagePreview';
import SparklesIcon from './icons/SparklesIcon';
import UserCircleIcon from './icons/UserCircleIcon';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  html?: string;
  source?: 'gemini' | 'huggingface' | 'gemini-image' | 'unknown';
  image_base64?: string;
  simulation?: SimulationSuggestion;
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

const Chat: React.FC<ChatProps> = ({ title = 'AI Chat (Edge)' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSimOpen, setIsSimOpen] = useState(false);
  const [sim, setSim] = useState<SimulationSuggestion | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const assistantTextRef = useRef('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;
    setInput('');
    const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: 'user', text: prompt };
    setMessages(prev => [...prev, userMsg]);

    const assistantId = `a_${Date.now()}`;
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', text: '' }]);

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

  const launchSim = (s: SimulationSuggestion) => {
    setSim(s);
    setIsSimOpen(true);
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-xs text-gray-500">Gemini/HF text, simulation cues, and images.</p>
        </div>
      </div>
      <div className="space-y-3 max-h-[50vh] overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 flex-shrink-0">
                <SparklesIcon className="w-5 h-5" />
              </div>
            )}
            <div className={`max-w-[80%] p-3 rounded-2xl ${m.role === 'assistant' ? 'bg-gray-100 rounded-bl-lg' : 'bg-indigo-500 text-white rounded-br-lg'}`}>
              {m.simulation ? (
                <SimulationSuggestionCard simulation={m.simulation} onLaunch={launchSim} />
              ) : m.source === 'gemini-image' || m.image_base64 || m.html ? (
                <ImagePreview html={m.html} base64={m.image_base64} />
              ) : m.html ? (
                <div className="prose prose-sm max-w-none"><div dangerouslySetInnerHTML={{ __html: m.html }} /></div>
              ) : (
                <div className="text-sm whitespace-pre-wrap break-words">{m.text}</div>
              )}
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                <UserCircleIcon className="w-6 h-6" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="mt-3 flex items-start">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything…"
          className="input-field flex-1 h-24 resize-y"
          rows={4}
        />
        <div className="ml-2 flex flex-col gap-2">
          <button type="submit" className="btn btn-primary" disabled={isStreaming || !input.trim()}>Send</button>
        </div>
      </form>

      {sim && (
        <SimulationModal isOpen={isSimOpen} onClose={() => setIsSimOpen(false)} title={sim.title} url={sim.url} />
      )}
    </div>
  );
};

export default Chat;