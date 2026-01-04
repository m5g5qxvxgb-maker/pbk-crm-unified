'use client';

import { useState } from 'react';
import { getApiUrl } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AICopilot({ onActionComplete }: { onActionComplete?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [interpretation, setInterpretation] = useState<any>(null);

  const executeCommand = async (autoConfirm = false) => {
    if (!command.trim()) {
      toast.error('Введите команду');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/ai/copilot'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          command,
          context: { autoConfirm }
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.needsConfirmation && !autoConfirm) {
          setNeedsConfirmation(true);
          setInterpretation(data.interpretation);
          toast('Подтвердите действие');
        } else {
          setResult(data);
          setNeedsConfirmation(false);
          toast.success('✅ Выполнено!');
          onActionComplete?.();
        }
      } else {
        toast.error(data.error || 'Ошибка выполнения');
      }
    } catch (error) {
      console.error('AI Copilot error:', error);
      toast.error('Ошибка подключения к AI');
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = () => {
    setNeedsConfirmation(false);
    executeCommand(true);
  };

  const examples = [
    'Создай лид "Ремонт квартиры" на 50000 рублей',
    'Создай задачу "Позвонить клиенту" на завтра',
    'Создай клиента "ООО Строй-Сервис" с телефоном +79001234567',
    'Покажи аналитику по моим лидам',
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
          <span className="text-2xl">🤖</span>
        </button>
      )}

      {/* Modal Window */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg p-6 border-b border-blue-100">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl">
                    🤖
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">AI Copilot</h3>
                    <p className="text-sm text-gray-600">Управляйте CRM через команды на русском</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setCommand('');
                    setResult(null);
                    setNeedsConfirmation(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">

      {/* Command Input */}
      <div className="mb-4">
        <textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              executeCommand();
            }
          }}
          placeholder="Например: Создай лид 'Строительство дома' на 500000 рублей с вероятностью 80%"
          className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
          disabled={loading}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => executeCommand()}
          disabled={loading || !command.trim()}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Обработка...
            </span>
          ) : (
            '▶️ Выполнить'
          )}
        </button>
        {command && (
          <button
            onClick={() => {
              setCommand('');
              setResult(null);
              setNeedsConfirmation(false);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Очистить
          </button>
        )}
      </div>

      {/* Confirmation */}
      {needsConfirmation && interpretation && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-900 mb-2">Подтвердите действие</h4>
          <p className="text-sm text-yellow-800 mb-3">
            Я понял: <strong>{interpretation.explanation}</strong>
          </p>
          <p className="text-sm text-gray-700 mb-3">
            Действие: <span className="font-mono bg-yellow-100 px-2 py-1 rounded">{interpretation.action}</span>
          </p>
          <p className="text-sm text-gray-600 mb-3">
            Уверенность: {Math.round((interpretation.confidence || 0) * 100)}%
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmAction}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              ✅ Подтвердить
            </button>
            <button
              onClick={() => setNeedsConfirmation(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && !needsConfirmation && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">✅ Выполнено!</h4>
          <p className="text-sm text-green-800 mb-2">{result.explanation}</p>
          {result.result?.data && (
            <div className="mt-2 p-3 bg-white rounded border border-green-200">
              <pre className="text-xs text-gray-700 overflow-auto max-h-40">
                {JSON.stringify(result.result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Examples */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Примеры команд:</p>
        <div className="grid grid-cols-1 gap-2">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => setCommand(example)}
              className="text-left text-xs px-3 py-2 bg-white border border-gray-200 rounded hover:border-blue-300 hover:bg-blue-50 transition"
            >
              💡 {example}
            </button>
          ))}
        </div>
      </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
