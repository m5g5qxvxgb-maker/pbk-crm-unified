'use client';

import { useState, useRef, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import { XMarkIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
}

export default function AICopilotChat({ onActionComplete }: { onActionComplete?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Привет! Я AI Copilot. Могу помочь вам с:\n\n• Созданием лидов и клиентов\n• Созданием задач\n• Анализом данных\n• Генерацией писем\n\nПросто напишите что нужно сделать!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
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
          command: input,
          context: { autoConfirm: false }
        })
      });

      const data = await response.json();

      if (data.success) {
        let assistantContent = '';
        let needsConfirmation = false;

        if (data.needsConfirmation) {
          needsConfirmation = true;
          const interp = data.interpretation;
          assistantContent = `Я понял вашу команду с уверенностью ${(interp.confidence * 100).toFixed(0)}%:\n\n**Действие:** ${interp.action}\n**Параметры:** ${JSON.stringify(interp.params, null, 2)}\n\nПодтвердить выполнение?`;
        } else {
          // Handle different response formats
          const explanation = data.explanation || data.message || '';
          const resultData = data.result?.data || data.data;
          
          if (data.action === 'create_lead' && resultData) {
            assistantContent = `✅ Готово! Лид "${resultData.title}" создан успешно\n\nСтоимость: ${resultData.value} ${resultData.currency}\nВероятность: ${resultData.probability}%`;
          } else if (data.action === 'create_task' && resultData) {
            assistantContent = `✅ Готово! Задача "${resultData.title}" создана`;
          } else if (data.action === 'create_client' && resultData) {
            assistantContent = `✅ Готово! Клиент "${resultData.company_name}" создан`;
          } else {
            assistantContent = `✅ Готово!\n\n${explanation || JSON.stringify(resultData || data, null, 2)}`;
          }
          
          toast.success('Команда выполнена!');
          onActionComplete?.();
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
          data: needsConfirmation ? data.interpretation : data.data
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `❌ Ошибка: ${data.error || 'Не удалось выполнить команду'}`,
          timestamp: new Date()
        }]);
        toast.error(data.error || 'Ошибка выполнения');
      }
    } catch (error) {
      console.error('AI Copilot error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Ошибка подключения к AI',
        timestamp: new Date()
      }]);
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

  const exampleCommands = [
    'Создай лид "Строительство дома" на 500000 рублей',
    'Создай задачу "Позвонить клиенту" на завтра',
    'Создай клиента "ООО Строй-Сервис"',
    'Покажи аналитику по лидам'
  ];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
          aria-label="Open AI Copilot"
          data-testid="ai-copilot-button"
        >
          <ChatBubbleLeftRightIcon className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 w-full md:w-[480px] h-[600px] bg-white shadow-2xl rounded-tl-2xl flex flex-col z-50 border-l border-t border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-tl-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                🤖
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Copilot</h3>
                <p className="text-sm text-white/80">Ваш умный помощник</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
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
            <div className="px-4 py-2 border-t border-gray-200 bg-white">
              <p className="text-xs text-gray-500 mb-2">Примеры команд:</p>
              <div className="flex flex-wrap gap-2">
                {exampleCommands.slice(0, 2).map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(cmd)}
                    className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition"
                  >
                    {cmd.substring(0, 30)}...
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Введите команду или вопрос..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                disabled={loading}
                data-testid="ai-copilot-input"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="ai-copilot-send"
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
