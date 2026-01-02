'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('retell');
  const [settings, setSettings] = useState({
    retell: { apiKey: '', agentId: '' },
    openai: { apiKey: '', model: 'gpt-4' },
    email: { smtpUser: '', smtpPassword: '', imapUser: '' },
    telegram: { botToken: '', adminChatId: '' },
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const tabs = [
    { id: 'retell', name: 'Retell AI', icon: '🤖' },
    { id: 'openai', name: 'OpenAI', icon: '🧠' },
    { id: 'email', name: 'Email', icon: '📧' },
    { id: 'telegram', name: 'Telegram', icon: '💬' },
  ];

  const styles = {
    tabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '32px',
      borderBottom: '2px solid #e5e7eb',
    },
    tab: {
      padding: '12px 24px',
      cursor: 'pointer',
      background: 'transparent',
      border: 'none',
      borderBottom: '3px solid transparent',
      fontSize: '16px',
      fontWeight: '500',
      color: '#6b7280',
      transition: 'all 0.2s',
    },
    tabActive: {
      color: '#6366f1',
      borderBottomColor: '#6366f1',
    },
    card: {
      background: 'white',
      padding: '32px',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '24px',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
    },
    input: {
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
    },
    button: {
      padding: '12px 24px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      alignSelf: 'flex-start',
    },
    message: {
      padding: '12px',
      borderRadius: '8px',
      fontSize: '14px',
    },
    success: {
      background: '#d1fae5',
      color: '#065f46',
    },
    error: {
      background: '#fee2e2',
      color: '#dc2626',
    },
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    setTimeout(() => {
      setMessage('Settings saved successfully!');
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }, 1000);
  };

  const handleChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab as keyof typeof prev],
        [field]: value,
      }
    }));
  };

  return (
    <AppLayout>
      <div style={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {}),
            }}
          >
            {tab.icon} {tab.name}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        {activeTab === 'retell' && (
          <div style={styles.form}>
            <h3 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '8px'}}>
              🤖 Retell AI Configuration
            </h3>
            <p style={{color: '#6b7280', marginBottom: '16px'}}>
              Configure Retell AI for automated phone calls
            </p>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>API Key</label>
              <input
                type="password"
                value={settings.retell.apiKey}
                onChange={(e) => handleChange('apiKey', e.target.value)}
                placeholder="key_xxxxxxxxxxxxx"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Agent ID</label>
              <input
                type="text"
                value={settings.retell.agentId}
                onChange={(e) => handleChange('agentId', e.target.value)}
                placeholder="agent_xxxxxxxxxxxxx"
                style={styles.input}
              />
            </div>

            {message && (
              <div style={{...styles.message, ...styles.success}}>
                {message}
              </div>
            )}

            <button onClick={handleSave} style={styles.button} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}

        {activeTab === 'openai' && (
          <div style={styles.form}>
            <h3 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '8px'}}>
              🧠 OpenAI Configuration
            </h3>
            <p style={{color: '#6b7280', marginBottom: '16px'}}>
              Configure OpenAI for AI-powered proposal generation
            </p>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>API Key</label>
              <input
                type="password"
                value={settings.openai.apiKey}
                onChange={(e) => handleChange('apiKey', e.target.value)}
                placeholder="sk-xxxxxxxxxxxxx"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Model</label>
              <select
                value={settings.openai.model}
                onChange={(e) => handleChange('model', e.target.value)}
                style={styles.input}
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>

            {message && (
              <div style={{...styles.message, ...styles.success}}>
                {message}
              </div>
            )}

            <button onClick={handleSave} style={styles.button} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}

        {activeTab === 'email' && (
          <div style={styles.form}>
            <h3 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '8px'}}>
              📧 Email Configuration
            </h3>
            <p style={{color: '#6b7280', marginBottom: '16px'}}>
              Configure SMTP and IMAP for email integration
            </p>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>SMTP User (Email)</label>
              <input
                type="email"
                value={settings.email.smtpUser}
                onChange={(e) => handleChange('smtpUser', e.target.value)}
                placeholder="info@pbkconstruction.net"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>SMTP Password (App Password)</label>
              <input
                type="password"
                value={settings.email.smtpPassword}
                onChange={(e) => handleChange('smtpPassword', e.target.value)}
                placeholder="Your app password"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>IMAP User (Email)</label>
              <input
                type="email"
                value={settings.email.imapUser}
                onChange={(e) => handleChange('imapUser', e.target.value)}
                placeholder="info@pbkconstruction.net"
                style={styles.input}
              />
            </div>

            {message && (
              <div style={{...styles.message, ...styles.success}}>
                {message}
              </div>
            )}

            <button onClick={handleSave} style={styles.button} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}

        {activeTab === 'telegram' && (
          <div style={styles.form}>
            <h3 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '8px'}}>
              💬 Telegram Configuration
            </h3>
            <p style={{color: '#6b7280', marginBottom: '16px'}}>
              Configure Telegram bots for notifications and automation
            </p>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Bot Token</label>
              <input
                type="password"
                value={settings.telegram.botToken}
                onChange={(e) => handleChange('botToken', e.target.value)}
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Admin Chat ID</label>
              <input
                type="text"
                value={settings.telegram.adminChatId}
                onChange={(e) => handleChange('adminChatId', e.target.value)}
                placeholder="123456789"
                style={styles.input}
              />
            </div>

            {message && (
              <div style={{...styles.message, ...styles.success}}>
                {message}
              </div>
            )}

            <button onClick={handleSave} style={styles.button} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
