'use client';

import { useState } from 'react';
import { emailsAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface EmailComposerProps {
  onClose: () => void;
  onSuccess: () => void;
  replyTo?: any;
  clientEmail?: string;
}

export default function EmailComposer({ onClose, onSuccess, replyTo, clientEmail }: EmailComposerProps) {
  const [formData, setFormData] = useState({
    to: clientEmail || replyTo?.from_email || '',
    subject: replyTo ? `Re: ${replyTo.subject}` : '',
    body: '',
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      await emailsAPI.send(formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">✉️ Compose Email</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="To"
            type="email"
            value={formData.to}
            onChange={(e) => setFormData({ ...formData, to: e.target.value })}
            required
            placeholder="client@example.com"
          />

          <Input
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
            placeholder="Email subject"
          />

          <Textarea
            label="Message"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            required
            rows={12}
            placeholder="Write your message..."
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={sending}>
              {sending ? 'Sending...' : '📤 Send Email'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
