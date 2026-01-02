'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { settingsAPI } from '@/lib/api';

export default function RetellSettings() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    api_key: '',
    agent_id: '',
    from_number: '',
    system_prompt: '',
    knowledge_base: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const response = await settingsAPI.testRetell();
      setMessage({ type: 'success', text: 'Retell AI connection successful!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Connection failed' 
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await settingsAPI.updateRetell(formData);
      setMessage({ type: 'success', text: 'Retell AI settings saved successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to save settings' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Retell AI Configuration</h3>
        <p className="text-sm text-gray-500">
          Configure Retell AI for automated calls. Get your API key from{' '}
          <a href="https://retellai.com/dashboard" target="_blank" className="text-blue-600 hover:underline">
            Retell AI Dashboard
          </a>
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="API Key"
          name="api_key"
          type="password"
          placeholder="key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          value={formData.api_key}
          onChange={handleChange}
        />

        <Input
          label="Agent ID"
          name="agent_id"
          placeholder="agent_xxxxxxxxxxxxxxxxxxxxx"
          value={formData.agent_id}
          onChange={handleChange}
        />

        <Input
          label="From Number"
          name="from_number"
          placeholder="+1234567890"
          value={formData.from_number}
          onChange={handleChange}
        />

        <Textarea
          label="System Prompt"
          name="system_prompt"
          placeholder="You are a professional sales assistant for PBK Construction..."
          rows={6}
          value={formData.system_prompt}
          onChange={handleChange}
        />

        <Textarea
          label="Knowledge Base"
          name="knowledge_base"
          placeholder="Company information, services, pricing..."
          rows={8}
          value={formData.knowledge_base}
          onChange={handleChange}
        />
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={handleTest} loading={testing}>
          Test Connection
        </Button>
        <Button variant="primary" onClick={handleSave} loading={loading}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
