'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { callsAPI } from '@/lib/api';

interface TranscriptViewerProps {
  call: any;
  onClose: () => void;
}

export default function TranscriptViewer({ call, onClose }: TranscriptViewerProps) {
  const [transcript, setTranscript] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('ru');
  const [translatedText, setTranslatedText] = useState('');

  useEffect(() => {
    loadTranscript();
  }, []);

  const loadTranscript = async () => {
    setLoading(true);
    try {
      const response = await callsAPI.getTranscript(call.id);
      setTranscript(response.data.data);
    } catch (error) {
      console.error('Failed to load transcript:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    setTranslating(true);
    try {
      const response = await callsAPI.translate(call.id, targetLanguage);
      setTranslatedText(response.data.data.translatedText);
    } catch (error) {
      console.error('Failed to translate:', error);
    } finally {
      setTranslating(false);
    }
  };

  const downloadTranscript = () => {
    const text = transcript?.messages?.map((m: any) => 
      `[${m.role}]: ${m.content}`
    ).join('\n\n') || transcript?.text || '';

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-transcript-${call.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Call Transcript
            </h3>
            <Button variant="ghost" size="sm" onClick={downloadTranscript}>
              💾 Download
            </Button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {call.phone_number} • {new Date(call.created_at).toLocaleString()}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Original Transcript */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Original</h4>
                
                {transcript?.messages ? (
                  <div className="space-y-3">
                    {transcript.messages.map((message: any, index: number) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          message.role === 'agent'
                            ? 'bg-blue-50 border-l-4 border-blue-500'
                            : 'bg-gray-50 border-l-4 border-gray-500'
                        }`}
                      >
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          {message.role === 'agent' ? '🤖 Agent' : '👤 User'}
                        </div>
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {transcript?.text || 'No transcript available'}
                    </p>
                  </div>
                )}
              </div>

              {/* Translation Section */}
              {transcript && (
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <h4 className="font-medium text-gray-900">Translation</h4>
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="h-9 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ru">Russian</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="zh">Chinese</option>
                      <option value="ja">Japanese</option>
                    </select>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleTranslate}
                      loading={translating}
                    >
                      🌐 Translate
                    </Button>
                  </div>

                  {translatedText && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {translatedText}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Call Summary */}
              {call.summary && (
                <div className="mt-8">
                  <h4 className="font-medium text-gray-900 mb-2">AI Summary</h4>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-gray-900">{call.summary}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
