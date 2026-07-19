'use client';

import { useState, useRef, useEffect } from 'react';
import { getRecommendation, Tool } from '@/lib/api';

interface Message {
  role: 'user' | 'ai';
  content: string;
  tools?: Tool[];
  method?: string;
}

export default function RecommendChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content:
        '👋 Halo! Saya AI assistant untuk Katalog IT Tools. Tanyakan apa saja tentang tools yang Anda butuhkan!\n\nContoh: "Apa tool yang bagus untuk port scanning?" atau "Rekomendasi tool monitoring server"',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);

    try {
      const result = await getRecommendation(question);

      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: result.answer,
          tools: result.tools,
          method: result.method,
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `❌ Maaf, terjadi kesalahan: ${error.message}. Pastikan backend sudah berjalan.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="glass-card overflow-hidden flex flex-col"
      style={{ height: '500px' }}
      id="recommend-chat"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-lg">
          🤖
        </div>
        <div>
          <h3 className="text-base font-bold text-white">AI Recommendation</h3>
          <p className="text-xs text-slate-400">
            Tanyakan tool yang Anda butuhkan
          </p>
        </div>
        <div className="ml-auto">
          <span className="badge-green badge text-xs">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary-600/30 border border-primary-500/30 text-white'
                  : 'bg-slate-800/60 border border-slate-700/30 text-slate-200'
              }`}
            >
              <p className="text-sm whitespace-pre-line leading-relaxed">
                {msg.content}
              </p>

              {/* Mini tool cards from recommendation */}
              {msg.tools && msg.tools.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.tools.map((tool) => (
                    <div
                      key={tool._id}
                      className="p-3 rounded-xl bg-surface-900/50 border border-slate-700/30 hover:border-primary-500/30 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">
                          {tool.title}
                        </span>
                        <span className="badge text-xs">{tool.category}</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {tool.description}
                      </p>
                      {tool.source_url && (
                        <a
                          href={tool.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-400 hover:text-primary-300 mt-1 inline-block"
                        >
                          🔗 {tool.source_url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Method badge */}
              {msg.method && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">
                    Metode: {msg.method === 'vector_search' ? '🧠 Vector Search' : '🔍 Keyword Match'}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/60 border border-slate-700/30 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-slate-400">Mencari rekomendasi...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-700/50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanya tentang tools... (Enter untuk kirim)"
            className="input-field flex-1 !py-3 !rounded-xl text-sm"
            disabled={loading}
            id="recommend-input"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="btn-primary !px-4 !py-3 !rounded-xl disabled:opacity-40"
            id="recommend-send"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
