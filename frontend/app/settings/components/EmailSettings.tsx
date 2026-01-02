'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { settingsAPI } from '@/lib/api';

export default function EmailSettings() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_secure: false,
    smtp_user: '',
    smtp_password: '',
    imap_host: 'imap.gmail.com',
    imap_port: '993',
    imap_user: '',
    imap_password: '',
    email_signature: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleTest = async () => {
    if (!testEmail) {
      setMessage({ type: 'error', text: 'Please enter test email address' });
      return;
    }
    
    setTesting(true);
    setMessage(null);
    try {
      await settingsAPI.testEmail(testEmail);
      setMessage({ type: 'success', text: 'Email test sent successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Test failed' 
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await settingsAPI.updateEmail(formData);
      setMessage({ type: 'success', text: 'Email settings saved successfully!' });
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
        <h3 className="text-lg font-medium">Email Configuration</h3>
        <p className="text-sm text-gray-500">
          Configure corporate email for sending and receiving messages.
        </p>
      </div>

      {/* SMTP Settings */}
      <div className="border-t pt-6">
        <h4 className="text-md font-medium mb-4">SMTP (Outgoing Mail)</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="SMTP Host"
              name="smtp_host"
              placeholder="smtp.gmail.com"
              value={formData.smtp_host}
              onChange={handleChange}
            />
            <Input
              label="SMTP Port"
              name="smtp_port"
              placeholder="587"
              value={formData.smtp_port}
              onChange={handleChange}
            />
          </div>

          <Input
            label="SMTP User (Email)"
            name="smtp_user"
            type="email"
            placeholder="info@pbkconstruction.net"
            value={formData.smtp_user}
            onChange={handleChange}
          />

          <Input
            label="SMTP Password"
            name="smtp_password"
            type="password"
            placeholder="App Password"
            value={formData.smtp_password}
            onChange={handleChange}
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              name="smtp_secure"
              checked={formData.smtp_secure}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">
              Use SSL/TLS
            </label>
          </div>
        </div>
      </div>

      {/* IMAP Settings */}
      <div className="border-t pt-6">
        <h4 className="text-md font-medium mb-4">IMAP (Incoming Mail)</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="IMAP Host"
              name="imap_host"
              placeholder="imap.gmail.com"
              value={formData.imap_host}
              onChange={handleChange}
            />
            <Input
              label="IMAP Port"
              name="imap_port"
              placeholder="993"
              value={formData.imap_port}
              onChange={handleChange}
            />
          </div>

          <Input
            label="IMAP User (Email)"
            name="imap_user"
            type="email"
            placeholder="info@pbkconstruction.net"
            value={formData.imap_user}
            onChange={handleChange}
          />

          <Input
            label="IMAP Password"
            name="imap_password"
            type="password"
            placeholder="App Password"
            value={formData.imap_password}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Email Signature */}
      <div className="border-t pt-6">
        <Textarea
          label="Email Signature"
          name="email_signature"
          placeholder="Best regards,&#10;PBK Construction Team"
          rows={4}
          value={formData.email_signature}
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

      {/* Test Email */}
      <div className="border-t pt-6">
        <h4 className="text-md font-medium mb-4">Test Email</h4>
        <div className="flex gap-3">
          <Input
            placeholder="test@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1"
          />
          <Button variant="secondary" onClick={handleTest} loading={testing}>
            Send Test
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="primary" onClick={handleSave} loading={loading}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
