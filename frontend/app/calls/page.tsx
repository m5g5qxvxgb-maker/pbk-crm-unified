'use client';
import { getApiUrl } from '@/lib/api';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';

export default function CallsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    clientName: '',
    phoneNumber: '',
    purpose: '',
    instructions: '',
  });

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(getApiUrl('/api/calls'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCalls(data.data || []);
      }
    } catch (error) {
      console.error('Error loading calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating call:', formData);
    setShowForm(false);
    setFormData({ clientName: '', phoneNumber: '', purpose: '', instructions: '' });
  };

  const styles = {
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
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
    },
    grid: {
      display: 'grid',
      gap: '16px',
    },
    card: {
      background: 'white',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    modal: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      background: 'white',
      padding: '32px',
      borderRadius: '12px',
      maxWidth: '500px',
      width: '100%',
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
    },
    input: {
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
    },
    textarea: {
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      minHeight: '100px',
      resize: 'vertical' as const,
    },
  };

  return (
    <AppLayout>
      <div style={styles.header}>
        <div>
          <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '8px'}}>
            Calls Management
          </h2>
          <p style={{color: '#6b7280'}}>
            Create and manage automated calls
          </p>
        </div>
        <button onClick={() => setShowForm(true)} style={styles.button}>
          ➕ New Call
        </button>
      </div>

      {loading ? (
        <div style={{textAlign: 'center', padding: '40px'}}>
          <div style={{fontSize: '48px'}}>⏳</div>
          <div>Loading calls...</div>
        </div>
      ) : calls.length === 0 ? (
        <div style={styles.card}>
          <div style={{textAlign: 'center', padding: '40px'}}>
            <div style={{fontSize: '64px', marginBottom: '16px'}}>📞</div>
            <h3 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '8px'}}>
              No calls yet
            </h3>
            <p style={{color: '#6b7280', marginBottom: '24px'}}>
              Create your first call to get started
            </p>
            <button onClick={() => setShowForm(true)} style={styles.button}>
              Create First Call
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.grid}>
          {calls.map((call) => (
            <div key={call.id} style={styles.card}>
              <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '8px'}}>
                {call.client_name}
              </h3>
              <p style={{color: '#6b7280', marginBottom: '8px'}}>
                📞 {call.phone_number}
              </p>
              <p style={{color: '#6b7280'}}>
                Status: <span style={{fontWeight: '500'}}>{call.status}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={styles.modal} onClick={() => setShowForm(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '24px'}}>
              Create New Call
            </h3>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                  Client Name
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                  placeholder="John Doe"
                  required
                  style={styles.input}
                />
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  placeholder="+1234567890"
                  required
                  style={styles.input}
                />
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                  Purpose
                </label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  placeholder="Follow-up call"
                  required
                  style={styles.input}
                />
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                  Instructions
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                  placeholder="Discuss project details..."
                  style={styles.textarea}
                />
              </div>

              <div style={{display: 'flex', gap: '12px'}}>
                <button type="submit" style={styles.button}>
                  Create Call
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{...styles.button, background: '#6b7280'}}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
