'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { leadsAPI, clientsAPI, usersAPI, pipelinesAPI } from '@/lib/api';

interface LeadFormProps {
  lead?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LeadForm({ lead, onClose, onSuccess }: LeadFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: lead?.title || '',
    description: lead?.description || '',
    client_id: lead?.client_id || '',
    pipeline_id: lead?.pipeline_id || '',
    stage_id: lead?.stage_id || '',
    value: lead?.value || '',
    source: lead?.source || '',
    assigned_to: lead?.assigned_to || '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.pipeline_id) {
      const pipeline = pipelines.find((p) => p.id === parseInt(formData.pipeline_id));
      setStages(pipeline?.stages || []);
    }
  }, [formData.pipeline_id, pipelines]);

  const loadData = async () => {
    try {
      const [clientsRes, usersRes, pipelinesRes] = await Promise.all([
        clientsAPI.getAll({ limit: 100 }),
        usersAPI.getAll({ limit: 100 }),
        pipelinesAPI.getAll(),
      ]);
      setClients(clientsRes.data.data);
      setUsers(usersRes.data.data);
      setPipelines(pipelinesRes.data.data);
    } catch (error) {
      console.error('Failed to load data:', error);
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
        title: formData.title,
        description: formData.description,
        pipeline_id: formData.pipeline_id,
        stage_id: formData.stage_id,
        source: formData.source,
      };

      if (formData.client_id) data.client_id = formData.client_id;
      if (formData.value) data.value = parseFloat(formData.value);
      if (formData.assigned_to) data.assigned_to = formData.assigned_to;

      if (lead) {
        await leadsAPI.update(lead.id, data);
      } else {
        await leadsAPI.create(data);
      }
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {lead ? 'Edit Lead' : 'New Lead'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <Input
            label="Title *"
            name="title"
            placeholder="Lead title"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <Textarea
            label="Description"
            name="description"
            placeholder="Lead description..."
            rows={3}
            value={formData.description}
            onChange={handleChange}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pipeline *
              </label>
              <select
                name="pipeline_id"
                value={formData.pipeline_id}
                onChange={handleChange}
                required
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select pipeline</option>
                {pipelines.map((pipeline) => (
                  <option key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stage *
              </label>
              <select
                name="stage_id"
                value={formData.stage_id}
                onChange={handleChange}
                required
                disabled={!formData.pipeline_id}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select stage</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client
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

            <Input
              label="Value ($)"
              name="value"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.value}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Source"
              name="source"
              placeholder="e.g. Website, Referral"
              value={formData.source}
              onChange={handleChange}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </form>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {lead ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}
