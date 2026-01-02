'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { getApiUrl } from '@/lib/api';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to login');
      window.location.href = '/login';
      return;
    }

    console.log('Loading leads and pipelines with token:', token?.substring(0, 20) + '...');

    // Load leads and pipeline stages
    Promise.all([
      fetch(getApiUrl('/api/leads'), {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(getApiUrl('/api/pipelines'), {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json())
    ]).then(([leadsData, pipelinesData]) => {
      console.log('Pipelines response:', pipelinesData);
      console.log('Leads response:', leadsData);
      
      if (leadsData.success) setLeads(leadsData.data);
      
      if (pipelinesData.success && pipelinesData.data && pipelinesData.data.length > 0) {
        // Get stages from first pipeline
        const firstPipeline = pipelinesData.data[0];
        console.log('First pipeline:', firstPipeline);
        
        if (firstPipeline.stages && firstPipeline.stages.length > 0) {
          setStages(firstPipeline.stages);
          console.log('Stages set:', firstPipeline.stages);
        } else {
          console.error('Pipeline has no stages:', firstPipeline);
          // Try to load stages directly
          fetch(getApiUrl(`/api/pipelines/${firstPipeline.id}/stages`), {
            headers: { 'Authorization': `Bearer ${token}` }
          })
            .then(r => r.json())
            .then(stagesData => {
              if (stagesData.success && stagesData.data) {
                setStages(stagesData.data);
                console.log('Stages loaded directly:', stagesData.data);
              }
            });
        }
      } else {
        console.error('No pipelines found or error:', pipelinesData);
      }
      setLoading(false);
    }).catch((error) => {
      console.error('Error loading data:', error);
      setLoading(false);
    });
  }, []);

  // Group leads by stage
  const groupedLeads = stages.reduce((acc: any, stage: any) => {
    acc[stage.id] = leads.filter(lead => lead.stage_id === stage.id);
    return acc;
  }, {});

  const styles = {
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px',
    },
    column: {
      background: '#f9fafb',
      borderRadius: '12px',
      padding: '16px',
    },
    columnHeader: {
      fontWeight: 'bold',
      marginBottom: '16px',
      paddingBottom: '12px',
      borderBottom: '2px solid',
    },
    card: {
      background: 'white',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      cursor: 'move',
    },
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{textAlign: 'center', padding: '40px'}}>
          <div style={{fontSize: '48px'}}>⏳</div>
          <div>Loading leads...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
        <h2 style={{fontSize: '24px', fontWeight: 'bold'}}>
          🎯 Leads Pipeline
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
          onClick={() => alert('Add lead functionality coming soon!')}
        >
          + Add Lead
        </button>
      </div>
      
      {/* Debug info */}
      <div style={{background: '#f0f0f0', padding: '12px', marginBottom: '16px', borderRadius: '8px', fontSize: '12px'}}>
        <strong>Debug Info:</strong><br/>
        Stages loaded: {stages.length}<br/>
        Leads loaded: {leads.length}<br/>
        {stages.length > 0 && (
          <>Stages: {stages.map(s => s.name).join(', ')}</>
        )}
      </div>
      
      {stages.length === 0 ? (
        <div style={{textAlign: 'center', padding: '40px', color: '#6b7280'}}>
          No pipeline stages found. Please create a pipeline first.
          <br/><br/>
          <small>Check browser console (F12) for errors</small>
        </div>
      ) : (
        <div style={styles.grid}>
          {stages.map((stage: any) => (
            <div key={stage.id} style={styles.column}>
              <div style={{
                ...styles.columnHeader, 
                borderBottomColor: stage.color || '#3b82f6', 
                color: stage.color || '#3b82f6'
              }}>
                {stage.name} ({groupedLeads[stage.id]?.length || 0})
              </div>
              {(groupedLeads[stage.id] || []).map((lead: any) => (
                <div key={lead.id} style={styles.card}>
                  <div style={{fontWeight: '600', marginBottom: '4px'}}>
                    {lead.title}
                  </div>
                  <div style={{color: '#6b7280', fontSize: '14px', marginBottom: '4px'}}>
                    {lead.company_name || 'No company'}
                  </div>
                  {lead.value && (
                    <div style={{color: '#10b981', fontSize: '14px', fontWeight: '600'}}>
                      {lead.currency} {lead.value.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
