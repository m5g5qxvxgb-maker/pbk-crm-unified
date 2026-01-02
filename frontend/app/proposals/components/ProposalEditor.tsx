'use client';

import { useState } from 'react';
import { proposalsAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

interface ProposalEditorProps {
  proposal: any;
  onClose: () => void;
  onRefresh: () => void;
}

export default function ProposalEditor({ proposal, onClose, onRefresh }: ProposalEditorProps) {
  const [content, setContent] = useState(proposal.content);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await proposalsAPI.update(proposal.id, { content });
      onRefresh();
      alert('Proposal saved!');
    } catch (error) {
      console.error('Failed to save proposal:', error);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!confirm('Send this proposal to the client?')) return;
    
    setSending(true);
    try {
      await proposalsAPI.send(proposal.id);
      onRefresh();
      alert('Proposal sent!');
      onClose();
    } catch (error) {
      console.error('Failed to send proposal:', error);
      alert('Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{proposal.title}</h2>
            <p className="text-sm text-gray-600">
              Status: <span className="font-medium">{proposal.status}</span> | 
              Created: {new Date(proposal.created_at).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <Textarea
            label="Proposal Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="font-mono text-sm"
          />

          {proposal.metadata && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Metadata</h3>
              <pre className="text-xs text-gray-700">
                {JSON.stringify(proposal.metadata, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : '💾 Save'}
            </Button>
            {proposal.status === 'draft' && (
              <Button variant="primary" onClick={handleSend} disabled={sending}>
                {sending ? 'Sending...' : '📤 Send to Client'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
