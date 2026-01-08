'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { getApiUrl } from '@/lib/api';
import toast from 'react-hot-toast';

export default function PipelinesPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // Load pipelines, leads
    Promise.all([
      fetch(getApiUrl('/api/pipelines'), {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(getApiUrl('/api/leads'), {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json())
    ]).then(([pipelinesData, leadsData]) => {
      if (pipelinesData.success && pipelinesData.data && pipelinesData.data.length > 0) {
        setPipelines(pipelinesData.data);
        const firstPipeline = pipelinesData.data[0];
        setSelectedPipeline(firstPipeline.id);
        
        if (firstPipeline.stages && firstPipeline.stages.length > 0) {
          setStages(firstPipeline.stages);
        }
      }
      
      if (leadsData.success) {
        setLeads(leadsData.data);
      }
      
      setLoading(false);
    }).catch((error) => {
      console.error('Error loading data:', error);
      setLoading(false);
    });
  }, []);

  // When pipeline changes, update stages
  useEffect(() => {
    if (selectedPipeline && pipelines.length > 0) {
      const pipeline = pipelines.find(p => p.id === selectedPipeline);
      if (pipeline && pipeline.stages) {
        setStages(pipeline.stages);
      }
    }
  }, [selectedPipeline, pipelines]);

  const handleDealMove = async (leadId: string, newStageId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Update locally first
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, stage_id: newStageId } : lead
      ));

      // Update on server
      const response = await fetch(getApiUrl(`/api/leads/${leadId}/stage`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stage_id: newStageId })
      });

      const data = await response.json();
      if (data.success) {
        const stage = stages.find(s => s.id === newStageId);
        toast.success(`Lead moved to ${stage?.name || 'new stage'}`);
      } else {
        // Revert on error
        fetchLeads();
      }
    } catch (error) {
      console.error('Failed to update lead:', error);
      fetchLeads();
    }
  };

  const fetchLeads = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const response = await fetch(getApiUrl('/api/leads'), {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.success) {
      setLeads(data.data);
    }
  };

  const handleCreatePipeline = async () => {
    if (!newPipelineName.trim()) {
      toast.error('Please enter pipeline name');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(getApiUrl('/api/pipelines'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newPipelineName,
          description: `${newPipelineName} pipeline`,
          stages: [
            { name: 'New', color: '#3B82F6', sort_order: 1 },
            { name: 'Contacted', color: '#8B5CF6', sort_order: 2 },
            { name: 'Qualified', color: '#10B981', sort_order: 3 },
            { name: 'Proposal', color: '#F59E0B', sort_order: 4 },
            { name: 'Won', color: '#22C55E', sort_order: 5 }
          ]
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Pipeline created successfully!');
        setShowCreateModal(false);
        setNewPipelineName('');
        
        // Reload pipelines
        const pipelinesResponse = await fetch(getApiUrl('/api/pipelines'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const pipelinesData = await pipelinesResponse.json();
        if (pipelinesData.success) {
          setPipelines(pipelinesData.data);
          if (pipelinesData.data.length > 0) {
            setSelectedPipeline(pipelinesData.data[0].id);
          }
        }
      } else {
        toast.error(data.error || 'Failed to create pipeline');
      }
    } catch (error) {
      console.error('Error creating pipeline:', error);
      toast.error('Failed to create pipeline');
    }
  };

  // Filter leads by selected pipeline
  const filteredLeads = selectedPipeline 
    ? leads.filter(lead => lead.pipeline_id === selectedPipeline)
    : leads;

  // Group leads by stage
  const groupedLeads = stages.reduce((acc: any, stage: any) => {
    acc[stage.id] = filteredLeads.filter(lead => lead.stage_id === stage.id);
    return acc;
  }, {});

  const styles = {
    grid: {
      display: 'grid',
      gridTemplateColumns: `repeat(${stages.length || 1}, minmax(280px, 1fr))`,
      gap: '16px',
      overflowX: 'auto',
      paddingBottom: '16px'
    },
    column: {
      background: '#f9fafb',
      borderRadius: '12px',
      padding: '16px',
      minHeight: '500px'
    },
    columnHeader: {
      fontWeight: 'bold',
      marginBottom: '16px',
      paddingBottom: '12px',
      borderBottom: '2px solid',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    card: {
      background: 'white',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      cursor: 'move',
      border: '1px solid #e5e7eb',
      transition: 'all 0.2s'
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{textAlign: 'center', padding: '40px'}}>
          <div style={{fontSize: '48px'}}>⏳</div>
          <div>Loading pipeline...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{padding: '24px'}}>
        {/* Header */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
          <div>
            <h1 style={{fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#111827'}}>
              🔥 Pipelines
            </h1>
            <p style={{color: '#6b7280'}}>Manage deals through the sales funnel</p>
          </div>
          
          <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
            {/* Pipeline selector */}
            {pipelines.length > 0 && (
              <select
                value={selectedPipeline}
                onChange={(e) => setSelectedPipeline(e.target.value)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minWidth: '200px',
                  color: '#111827'
                }}
              >
                {pipelines.map(pipeline => (
                  <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>
                ))}
              </select>
            )}
            
            {/* Create Pipeline Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '10px 20px',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#4f46e5'}
              onMouseOut={(e) => e.currentTarget.style.background = '#6366f1'}
            >
              <span style={{fontSize: '16px'}}>+</span>
              Create Pipeline
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px'}}>
          <div style={{background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <div style={{fontSize: '14px', color: '#6b7280', marginBottom: '8px'}}>Total Deals</div>
            <div style={{fontSize: '28px', fontWeight: 'bold', color: '#111827'}}>{filteredLeads.length}</div>
          </div>
          <div style={{background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <div style={{fontSize: '14px', color: '#6b7280', marginBottom: '8px'}}>Total Value</div>
            <div style={{fontSize: '28px', fontWeight: 'bold', color: '#10b981'}}>
              {filteredLeads.reduce((sum, lead) => sum + (lead.value || 0), 0).toLocaleString()} zł
            </div>
          </div>
          <div style={{background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <div style={{fontSize: '14px', color: '#6b7280', marginBottom: '8px'}}>Weighted Value</div>
            <div style={{fontSize: '28px', fontWeight: 'bold', color: '#667eea'}}>
              {Math.round(filteredLeads.reduce((sum, lead) => sum + ((lead.value || 0) * (lead.probability || 0) / 100), 0)).toLocaleString()} zł
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        {stages.length === 0 ? (
          <div style={{textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px'}}>
            <div style={{fontSize: '48px', marginBottom: '16px'}}>📋</div>
            <div style={{fontSize: '18px', color: '#111827', marginBottom: '8px'}}>No Pipeline Stages</div>
            <div style={{color: '#6b7280'}}>Create stages to start managing your deals</div>
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
                  <span>{stage.name}</span>
                  <span style={{background: stage.color || '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px'}}>
                    {groupedLeads[stage.id]?.length || 0}
                  </span>
                </div>

                {/* Deals/Leads in this stage */}
                {(groupedLeads[stage.id] || []).map((lead: any) => (
                  <div 
                    key={lead.id} 
                    style={styles.card}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('leadId', lead.id);
                      e.dataTransfer.setData('currentStageId', lead.stage_id);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const leadId = e.dataTransfer.getData('leadId');
                      const currentStageId = e.dataTransfer.getData('currentStageId');
                      if (leadId && currentStageId !== stage.id) {
                        handleDealMove(leadId, stage.id);
                      }
                    }}
                  >
                    <div style={{fontWeight: '600', marginBottom: '8px', color: '#111827', fontSize: '15px'}}>
                      {lead.title}
                    </div>
                    <div style={{color: '#6b7280', fontSize: '13px', marginBottom: '8px'}}>
                      {lead.company_name || 'No company'}
                    </div>
                    {lead.value && (
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div style={{color: '#10b981', fontSize: '15px', fontWeight: '600'}}>
                          {lead.value.toLocaleString()} zł
                        </div>
                        <div style={{color: '#6b7280', fontSize: '12px'}}>
                          {lead.probability}% prob
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Empty state */}
                {(!groupedLeads[stage.id] || groupedLeads[stage.id].length === 0) && (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#9ca3af',
                    fontSize: '14px',
                    border: '2px dashed #e5e7eb',
                    borderRadius: '8px'
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const leadId = e.dataTransfer.getData('leadId');
                    const currentStageId = e.dataTransfer.getData('currentStageId');
                    if (leadId && currentStageId !== stage.id) {
                      handleDealMove(leadId, stage.id);
                    }
                  }}
                  >
                    Drop deals here
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Pipeline Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowCreateModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#111827'}}>
              Create New Pipeline
            </h2>
            
            <div style={{marginBottom: '24px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151'}}>
                Pipeline Name *
              </label>
              <input
                type="text"
                value={newPipelineName}
                onChange={(e) => setNewPipelineName(e.target.value)}
                placeholder="Enter pipeline name"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreatePipeline();
                  }
                }}
              />
              <p style={{fontSize: '12px', color: '#6b7280', marginTop: '8px'}}>
                Default stages will be created: New, Contacted, Qualified, Proposal, Won
              </p>
            </div>

            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPipelineName('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePipeline}
                style={{
                  padding: '10px 20px',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#4f46e5'}
                onMouseOut={(e) => e.currentTarget.style.background = '#6366f1'}
              >
                Create Pipeline
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
