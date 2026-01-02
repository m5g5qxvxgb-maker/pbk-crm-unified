'use client';

import { useState } from 'react';
import { proposalsAPI, clientsAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface ProposalGeneratorProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProposalGenerator({ onClose, onSuccess }: ProposalGeneratorProps) {
  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    requirements: '',
  });
  const [generating, setGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      await proposalsAPI.generate({
        client_id: parseInt(formData.client_id),
        title: formData.title,
        requirements: formData.requirements,
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to generate proposal:', error);
      alert('Failed to generate proposal');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">✨ Generate AI Proposal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              💡 Describe your project requirements, and AI will generate a professional commercial proposal in your template.
            </p>
          </div>

          <Input
            label="Client ID (optional)"
            type="number"
            value={formData.client_id}
            onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
            placeholder="123"
          />

          <Input
            label="Proposal Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="Commercial Proposal for Construction Project"
          />

          <Textarea
            label="Project Requirements"
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            required
            rows={10}
            placeholder="Describe the project: scope, materials, timeline, budget, special requirements..."
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={generating}>
              {generating ? '⏳ Generating...' : '✨ Generate Proposal'}
            </Button>
          </div>

          {generating && (
            <div className="text-center text-sm text-gray-600">
              <p>AI is generating your proposal, this may take 30-60 seconds...</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
