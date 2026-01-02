'use client';
import { getApiUrl } from '@/lib/api';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';

export default function EmailsPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(getApiUrl('/api/emails'), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEmails(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const styles = {
    grid: {
      display: 'grid',
      gap: '8px',
    },
    email: {
      background: 'white',
      padding: '16px',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    unread: {
      background: '#eff6ff',
      fontWeight: 'bold',
    },
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{textAlign: 'center', padding: '40px'}}>
          <div style={{fontSize: '48px'}}>⏳</div>
          <div>Loading emails...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
        <h2 style={{fontSize: '24px', fontWeight: 'bold'}}>
          📧 Emails ({emails.length})
        </h2>
        <button 
          style={{
            background: '#667eea',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600'
          }}
          onClick={() => alert('Compose email functionality coming soon!')}
        >
          ✏️ Compose
        </button>
      </div>
      
      {emails.length === 0 ? (
        <div style={{background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#6b7280'}}>
          No emails found. Your inbox is empty!
        </div>
      ) : (
        <div style={styles.grid}>
          {emails.map(email => (
            <div 
              key={email.id} 
              style={{
                ...styles.email, 
                ...(email.is_read === false ? styles.unread : {})
              }}
              onClick={() => alert(`Opening email: ${email.subject}`)}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div style={{flex: 1}}>
                  <div style={{marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    {email.is_read === false && (
                      <span style={{
                        width: '8px', 
                        height: '8px', 
                        background: '#3b82f6', 
                        borderRadius: '50%',
                        display: 'inline-block'
                      }} />
                    )}
                    <span>{email.from_email || 'Unknown sender'}</span>
                  </div>
                  <div style={{fontSize: '14px', color: '#6b7280'}}>
                    {email.subject || '(No subject)'}
                  </div>
                </div>
                <div style={{fontSize: '14px', color: '#6b7280'}}>
                  {email.received_at ? new Date(email.received_at).toLocaleDateString() : 
                   email.sent_at ? new Date(email.sent_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
