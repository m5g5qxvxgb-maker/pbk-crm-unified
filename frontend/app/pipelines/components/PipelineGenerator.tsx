'use client';

import { useState } from 'react';
import { pipelinesAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

interface PipelineGeneratorProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PipelineGenerator({ onClose, onSuccess }: PipelineGeneratorProps) {
  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      await pipelinesAPI.generate({ description });
      onSuccess();
    } catch (error) {
      console.error('Failed to generate pipeline:', error);
      alert('Failed to generate pipeline');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">✨ Generate Sales Pipeline with AI</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-2">
              💡 <strong>Describe your sales process in natural language</strong>
            </p>
            <p className="text-xs text-blue-700">
              Example: "We have a construction sales pipeline: First contact → Site visit → Quote → Negotiation → Contract signed → Project started"
            </p>
          </div>

          <Textarea
            label="Describe Your Sales Pipeline"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={8}
            placeholder="Describe your sales process, stages, and automation rules in your own words..."
          />

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 mb-2">AI will create:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Pipeline name and description</li>
              <li>✅ All stages with proper ordering</li>
              <li>✅ Automation rules for each stage</li>
              <li>✅ Probability percentages</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={generating}>
              {generating ? '⏳ Generating...' : '✨ Generate Pipeline'}
            </Button>
          </div>

          {generating && (
            <div className="text-center text-sm text-gray-600">
              <p>AI is analyzing your description and creating the pipeline...</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
