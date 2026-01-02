'use client';
import { getApiUrl } from '@/lib/api';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(getApiUrl('/api/proposals'), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProposals(data.data);
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
    },
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{textAlign: 'center', padding: '40px'}}>
          <div style={{fontSize: '48px'}}>⏳</div>
          <div>Loading proposals...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
        <h2 style={{fontSize: '24px', fontWeight: 'bold'}}>
          📄 Proposals ({proposals.length})
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
          onClick={() => alert('Add proposal functionality coming soon!')}
        >
          + New Proposal
        </button>
      </div>
      
      {proposals.length === 0 ? (
        <div style={{...styles.card, textAlign: 'center', padding: '40px', color: '#6b7280'}}>
          No proposals found. Create your first proposal to get started!
        </div>
      ) : (
        <div style={styles.grid}>
          {proposals.map(proposal => (
            <div key={proposal.id} style={styles.card}>
              <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '8px'}}>
                {proposal.title}
              </h3>
              <p style={{color: '#6b7280', marginBottom: '4px'}}>
                Client: {proposal.client_name || 'No client'}
              </p>
              {proposal.amount && (
                <p style={{color: '#10b981', fontWeight: '600', marginBottom: '4px'}}>
                  Amount: ${proposal.amount.toLocaleString()}
                </p>
              )}
              <p style={{color: '#6b7280'}}>
                Status: <span style={{
                  fontWeight: '500',
                  color: proposal.status === 'accepted' ? '#10b981' : 
                         proposal.status === 'sent' ? '#f59e0b' : '#6b7280'
                }}>{proposal.status}</span>
              </p>
              {proposal.valid_until && (
                <p style={{color: '#6b7280', fontSize: '14px', marginTop: '8px'}}>
                  Valid until: {new Date(proposal.valid_until).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
