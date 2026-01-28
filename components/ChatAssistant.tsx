
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { getTrafficAssistantResponse } from '../services/geminiService';

const ChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your AI Traffic Assistant. How can I help you optimize the city traffic today?',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getTrafficAssistantResponse(input, messages.map(m => ({ role: m.role, content: m.content })));
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || 'I apologize, but I am unable to process that request right now.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'There was an error communicating with the traffic optimization engine.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-800/50 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
      <div className="p-4 border-b border-slate-700 bg-slate-800 flex items-center gap-2">
        <Bot className="text-blue-400" />
        <h2 className="font-semibold">AI Traffic Assistant</h2>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 flex gap-3 ${
              m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-700 text-slate-100 rounded-tl-none'
            }`}>
              <div className="shrink-0 pt-1">
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} className="text-blue-300" />}
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-100 rounded-2xl rounded-tl-none p-3 flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-xs font-medium">Processing optimization patterns...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-900/50 border-t border-slate-700">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about traffic patterns, route suggestions..."
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100 placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-2 rounded-lg transition-colors shadow-lg shadow-blue-900/20"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatAssistant;
