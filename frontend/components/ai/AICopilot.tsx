'use client';

import { useState, useRef, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import { PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  functionCalled?: any;
}

export default function AICopilot({ onActionComplete }: { onActionComplete?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'Привет! Я AI ассистент PBK CRM. Могу помочь с управлением лидами, задачами, клиентами и аналитикой. Просто напишите что нужно сделать!',
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/ai/copilot'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: input,
          context: { autoConfirm: false },
          history: messages
            .filter(m => m.role !== 'system')
            .slice(-10)
            .map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();
      console.log('[AICopilot] Response:', data);

      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message || 'Готово!',
          timestamp: new Date(),
          functionCalled: data.functionCalled
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        if (data.functionCalled?.success) {
          onActionComplete?.();
        }
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: `❌ Ошибка: ${data.error || 'Неизвестная ошибка'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        toast.error(data.error || 'Ошибка выполнения');
      }
    } catch (error) {
      console.error('AI Copilot error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: '❌ Ошибка подключения к AI',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Ошибка подключения к AI');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const examples = [
    'Создай лид "Ремонт квартиры" на 50000 рублей',
    'Добавь телефон +48 123 456 789 к лиду "Ремонт квартиры"',
    'Создай задачу "Позвонить клиенту" на завтра',
    'Покажи все активные лиды',
  ];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-50"
          title="AI Copilot"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                🤖
              </div>
              <div>
                <h3 className="font-semibold">AI Copilot</h3>
                <p className="text-xs text-white/80">Ваш AI ассистент</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-lg p-1 transition"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : message.role === 'system'
                      ? 'bg-gray-100 text-gray-700 border border-gray-200'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {message.functionCalled && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <p className="text-xs opacity-75 mb-1">Выполнено действие:</p>
                      <pre className="text-xs bg-black/10 rounded p-2 overflow-auto max-h-32">
                        {JSON.stringify(message.functionCalled.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  <p className={`text-xs mt-1 opacity-70`}>
                    {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Example Commands */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Примеры команд:</p>
              <div className="flex flex-wrap gap-2">
                {examples.slice(0, 2).map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(cmd)}
                    className="text-xs px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-full text-gray-700 transition"
                  >
                    {cmd.substring(0, 30)}...
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Напишите команду или вопрос..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
