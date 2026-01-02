'use client';
import { getApiUrl } from '@/lib/api';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(getApiUrl('/api/clients'), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setClients(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const styles = {
    grid: {
      display: 'grid',
      gap: '16px',
    },
    card: {
      background: 'white',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: '16px',
      alignItems: 'center',
    },
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{textAlign: 'center', padding: '40px'}}>
          <div style={{fontSize: '48px'}}>⏳</div>
          <div>Loading clients...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
        <h2 style={{fontSize: '24px', fontWeight: 'bold'}}>
          👥 Clients ({clients.length})
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
          onClick={() => alert('Add client functionality coming soon!')}
        >
          + Add Client
        </button>
      </div>
      
      {clients.length === 0 ? (
        <div style={{textAlign: 'center', padding: '40px', color: '#6b7280'}}>
          No clients found. Add your first client to get started!
        </div>
      ) : (
        <div style={styles.grid}>
          {clients.map(client => (
            <div key={client.id} style={styles.card}>
              <div>
                <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '8px'}}>
                  {client.company_name || 'Unnamed Company'}
                </h3>
                <p style={{color: '#6b7280', marginBottom: '4px'}}>
                  👤 {client.contact_person || 'No contact'}
                </p>
                {client.email && (
                  <p style={{color: '#6b7280', marginBottom: '4px'}}>📧 {client.email}</p>
                )}
                {client.phone && (
                  <p style={{color: '#6b7280', marginBottom: '4px'}}>📞 {client.phone}</p>
                )}
                {client.city && (
                  <p style={{color: '#6b7280'}}>📍 {client.city}{client.country ? `, ${client.country}` : ''}</p>
                )}
              </div>
              <div>
                <button 
                  style={{
                    padding: '8px 16px', 
                    background: '#6366f1', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer'
                  }}
                  onClick={() => window.location.href = `/clients/${client.id}`}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
