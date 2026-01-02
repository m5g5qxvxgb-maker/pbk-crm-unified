'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { callsAPI, clientsAPI, leadsAPI } from '@/lib/api';

interface CallRequestFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CallRequestForm({ onClose, onSuccess }: CallRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    phone_number: '',
    client_id: '',
    lead_id: '',
    notes: '',
    scheduled_for: '',
  });

  useEffect(() => {
    loadClients();
    loadLeads();
  }, []);

  const loadClients = async () => {
    try {
      const response = await clientsAPI.getAll({ limit: 100 });
      setClients(response.data.data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const loadLeads = async () => {
    try {
      const response = await leadsAPI.getAll({ limit: 100 });
      setLeads(response.data.data);
    } catch (error) {
      console.error('Failed to load leads:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data: any = {
        phone_number: formData.phone_number,
        notes: formData.notes,
      };

      if (formData.client_id) data.client_id = formData.client_id;
      if (formData.lead_id) data.lead_id = formData.lead_id;
      if (formData.scheduled_for) data.scheduled_for = formData.scheduled_for;

      await callsAPI.createRequest(data);
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create call request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Create Call Request
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <Input
            label="Phone Number *"
            name="phone_number"
            type="tel"
            placeholder="+1234567890"
            value={formData.phone_number}
            onChange={handleChange}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client (Optional)
              </label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company_name || client.contact_person}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead (Optional)
              </label>
              <select
                name="lead_id"
                value={formData.lead_id}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select lead</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Schedule For (Optional)"
            name="scheduled_for"
            type="datetime-local"
            value={formData.scheduled_for}
            onChange={handleChange}
          />

          <Textarea
            label="Notes"
            name="notes"
            placeholder="Add any additional instructions or context for the call..."
            rows={4}
            value={formData.notes}
            onChange={handleChange}
          />

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              ℹ️ This call request will be sent for approval before being executed by Retell AI.
            </p>
          </div>
        </form>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
          >
            Create Request
          </Button>
        </div>
      </div>
    </div>
  );
}
