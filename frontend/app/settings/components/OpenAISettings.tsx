'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { settingsAPI } from '@/lib/api';

export default function OpenAISettings() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    api_key: '',
    organization_id: '',
    model: 'gpt-4-turbo-preview',
    proposal_template: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const response = await settingsAPI.testOpenAI();
      setMessage({ 
        type: 'success', 
        text: `OpenAI connection successful! Test: ${response.data.data.translatedText}` 
      });
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
      await settingsAPI.updateOpenAI(formData);
      setMessage({ type: 'success', text: 'OpenAI settings saved successfully!' });
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
        <h3 className="text-lg font-medium">OpenAI Configuration</h3>
        <p className="text-sm text-gray-500">
          Configure OpenAI for AI-powered features. Get your API key from{' '}
          <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-600 hover:underline">
            OpenAI Platform
          </a>
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="API Key"
          name="api_key"
          type="password"
          placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          value={formData.api_key}
          onChange={handleChange}
        />

        <Input
          label="Organization ID (Optional)"
          name="organization_id"
          placeholder="org-xxxxxxxxxxxxx"
          value={formData.organization_id}
          onChange={handleChange}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <select
            name="model"
            value={formData.model}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          </select>
        </div>

        <Textarea
          label="Proposal Template"
          name="proposal_template"
          placeholder="Template for commercial proposals generation..."
          rows={10}
          value={formData.proposal_template}
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
