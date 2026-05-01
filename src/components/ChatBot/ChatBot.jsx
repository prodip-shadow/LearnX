'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const normalizeMathDelimiters = (text = '') => {
  return text
    .replace(/\\\[(.*?)\\\]/gs, (_, expr) => `$$${expr.trim()}$$`)
    .replace(/\\\((.*?)\\\)/gs, (_, expr) => `$${expr.trim()}$`);
};

const ChatMessageContent = ({ text }) => {
  const normalizedText = normalizeMathDelimiters(text);

  return (
    <div className="chatbot-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {normalizedText}
      </ReactMarkdown>
    </div>
  );
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const aiMessage = {
        id: Date.now() + 1,
        text: data.message,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, something went wrong. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-9999">
      <button
        className="flex h-16 w-16 items-center justify-center rounded-full border border-green-500/20 bg-primary text-[28px] text-white shadow-[0_16px_40px_rgba(34,197,94,0.28)] transition duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_20px_45px_rgba(34,197,94,0.34)] focus:outline-none focus:ring-4 focus:ring-green-500/20"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open chatbot"
      >
        <span aria-hidden="true">💬</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 flex h-[min(32rem,calc(100vh-8rem))] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white/98 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:w-98">
          <div className="flex shrink-0 items-center justify-between bg-linear-to-r from-slate-950 to-slate-900 px-4 py-4 text-white">
            <div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-white/70">
                LearnX Assistant
              </p>
              <h3 className="text-[17px] font-bold leading-tight">
                Study help and teacher profiles
              </h3>
            </div>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent text-2xl text-white transition hover:opacity-80 focus:outline-none focus:ring-4 focus:ring-white/10"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] px-4 py-4">
            {messages.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-5 text-center text-sm text-slate-500 shadow-sm">
                Ask any study question or request an approved teacher profile.
              </div>
            )}

            <div className="mt-3 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'user' ? (
                    <p className="max-w-[80%] wrap-break-word rounded-2xl rounded-br-md bg-linear-to-br from-[#22c55e] to-[#16a34a] px-4 py-2.5 text-sm leading-6 text-white shadow-[0_10px_20px_rgba(34,197,94,0.16)]">
                      {msg.text}
                    </p>
                  ) : (
                    <div className="max-w-[85%] wrap-break-word rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-2.5 text-sm leading-6 text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                      <ChatMessageContent text={msg.text} />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <p className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-2.5 text-sm italic leading-6 text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                    Thinking...
                  </p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <form
            className="flex shrink-0 gap-2 border-t border-slate-200/70 bg-white/98 p-3"
            onSubmit={handleSendMessage}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your question..."
              disabled={isLoading}
              className="min-w-0 flex-1 rounded-full border border-slate-300/80 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#22c55e] focus:ring-4 focus:ring-green-500/15 disabled:bg-slate-50 disabled:text-slate-400"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="rounded-full bg-linear-to-r from-slate-950 to-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_18px_rgba(15,23,42,0.15)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
