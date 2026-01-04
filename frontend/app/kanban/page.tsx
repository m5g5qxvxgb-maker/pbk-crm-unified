'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import LeadModal from '@/components/modals/LeadModal';
import { getApiUrl } from '@/lib/api';
import { useTranslation } from '@/lib/translations';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// Sortable Card Component
function SortableCard({ lead, onClick }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 cursor-move hover:shadow-md transition"
    >
      <h3 
        className="font-medium text-gray-900 mb-2 cursor-pointer hover:text-blue-600"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {lead.title}
      </h3>
      <div className="flex items-center justify-between text-sm">
        <span className="text-green-600 font-semibold">
          ${(parseFloat(lead.value) || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        </span>
        <span className="text-gray-500">{lead.probability || 50}%</span>
      </div>
      {lead.client_name && (
        <p className="text-xs text-gray-500 mt-2">👤 {lead.client_name}</p>
      )}
    </div>
  );
}

// Droppable Stage Column
function DroppableStage({ stage, leads, onLeadClick, t }: any) {
  const { setNodeRef } = useDroppable({
    id: stage.id,
  });

  const stageValue = leads.reduce((sum: number, lead: any) => sum + (parseFloat(lead.value) || 0), 0);

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{stage.name}</h3>
          <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">
            {leads.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stage.color || '#6366f1' }}
          />
          <span className="text-sm text-gray-600 font-medium truncate">
            ${stageValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          </span>
        </div>
      </div>

      <SortableContext
        items={leads.map((l: any) => l.id)}
        strategy={verticalListSortingStrategy}
        id={stage.id}
      >
        <div className="min-h-[400px] space-y-2">
          {leads.map((lead: any) => (
            <SortableCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick(lead.id)}
            />
          ))}
          {leads.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              {t('Drop leads here')}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [leads, setLeads] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  
  // Lead Modal
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedPipeline && pipelines.length > 0) {
      const pipeline = pipelines.find(p => p.id === selectedPipeline);
      if (pipeline && pipeline.stages) {
        setStages(pipeline.stages);
      }
    }
  }, [selectedPipeline, pipelines]);

  const loadData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const [pipelinesRes, leadsRes] = await Promise.all([
        fetch(getApiUrl('/api/pipelines'), {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(getApiUrl('/api/leads'), {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json())
      ]);

      if (pipelinesRes.success && pipelinesRes.data?.length > 0) {
        setPipelines(pipelinesRes.data);
        const firstPipeline = pipelinesRes.data[0];
        setSelectedPipeline(firstPipeline.id);
        if (firstPipeline.stages) {
          setStages(firstPipeline.stages);
        }
      }

      if (leadsRes.success) {
        setLeads(leadsRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? over.id as string : null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setOverId(null);
      return;
    }

    const leadId = active.id as string;
    const currentLead = leads.find(l => l.id === leadId);
    
    if (!currentLead) {
      setActiveId(null);
      setOverId(null);
      return;
    }

    let newStageId = over.id as string;
    
    // Debug logging
    console.log('🔍 Drag End Debug:');
    console.log('  - Lead ID:', leadId);
    console.log('  - Over ID:', over.id);
    console.log('  - Over data:', over.data);
    console.log('  - All stages:', stages.map(s => ({ id: s.id, name: s.name })));
    
    // Check if dropped on another lead (not a stage)
    const droppedOnLead = leads.find(l => l.id === newStageId);
    if (droppedOnLead) {
      newStageId = droppedOnLead.stage_id;
      console.log('  - Dropped on lead, using stage:', newStageId);
    } else {
      // Check if the over.id is a valid stage
      const isValidStage = stages.some(s => s.id === newStageId);
      console.log('  - Is valid stage:', isValidStage);
    }

    console.log('  - Target stage ID:', newStageId);

    // Only update if stage actually changed
    if (currentLead.stage_id !== newStageId) {
      // Update UI immediately
      setLeads(prev => prev.map(lead =>
        lead.id === leadId ? { ...lead, stage_id: newStageId } : lead
      ));

      // Update backend
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(getApiUrl(`/api/leads/${leadId}/stage`), {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ stage_id: newStageId })
        });

        const data = await response.json();
        console.log('  - API Response:', data);
        
        if (data.success) {
          const stage = stages.find(s => s.id === newStageId);
          toast.success(`✅ ${t('Moved to')} ${stage?.name || 'stage'}`);
          
          // Trigger automation
          triggerStageAutomation(leadId, newStageId, stage?.name);
        } else {
          console.error('  - API Error:', data.error);
          toast.error(`${t('Failed to save')}: ${data.error || 'Unknown error'}`);
          // Revert UI change
          loadData();
        }
      } catch (error) {
        console.error('  - Network Error:', error);
        toast.error(`${t('Failed to save')}: ${(error as any).message}`);
        loadData();
      }
    } else {
      console.log('  - No stage change needed');
    }

    setActiveId(null);
    setOverId(null);
  };

  const triggerStageAutomation = async (leadId: string, stageId: string, stageName?: string) => {
    console.log(`🤖 Automation trigger: Lead ${leadId} moved to stage "${stageName}" (${stageId})`);
    
    // This is the foundation for automation system
    // Future implementation:
    // 
    // 1. Check if stage has automation rules configured
    // 2. Execute configured actions:
    //    - Create tasks (e.g., "Schedule meeting")
    //    - Send notifications (Telegram, Email)
    //    - Update lead fields
    //    - Assign to team members
    //    - Create reminders
    //    - Trigger webhooks
    //
    // Example for "Meeting" stage:
    // if (stageName?.toLowerCase().includes('meeting')) {
    //   await createTask({
    //     title: 'Meeting with ${lead.client_name}',
    //     lead_id: leadId,
    //     type: 'meeting',
    //     requires: ['date', 'location', 'attendees']
    //   });
    //   
    //   await sendTelegramNotification({
    //     assignee_id: lead.assigned_to,
    //     message: 'New meeting scheduled - confirm or reassign',
    //     actions: ['confirm', 'reassign', 'decline']
    //   });
    // }
  };

  const handleCreatePipeline = async () => {
    if (!newPipelineName.trim()) {
      toast.error('Please enter pipeline name');
      return;
    }

    const token = localStorage.getItem('token');
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
        toast.success('Pipeline created!');
        setShowCreateModal(false);
        setNewPipelineName('');
        loadData();
      } else {
        toast.error(data.error || 'Failed to create pipeline');
      }
    } catch (error) {
      console.error('Error creating pipeline:', error);
      toast.error('Failed to create pipeline');
    }
  };

  const filteredLeads = selectedPipeline
    ? leads.filter(lead => lead.pipeline_id === selectedPipeline)
    : leads;

  const groupedLeads = stages.reduce((acc: any, stage: any) => {
    acc[stage.id] = filteredLeads.filter(lead => lead.stage_id === stage.id);
    return acc;
  }, {});

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🔥 {t('Kanban Board')}
            </h1>
            <p className="text-gray-600">{t('Drag & drop deals through sales pipeline')}</p>
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            {pipelines.length > 0 && (
              <select
                value={selectedPipeline}
                onChange={(e) => setSelectedPipeline(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {pipelines.map(pipeline => (
                  <option key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => {
                // Create new lead modal logic will be added
                setSelectedLeadId(null);
                setShowLeadModal(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <span>✨</span>
              {t('New Lead')}
            </button>

            <button
              onClick={() => router.push('/settings/pipelines')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <span>⚙️</span>
              {t('Edit')}
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <span>+</span>
              {t('Create Pipeline')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-500">{t('Total Deals')}</p>
            <p className="text-2xl font-bold text-gray-900">{filteredLeads.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-500">{t('Total Value')}</p>
            <p className="text-2xl font-bold text-green-600 truncate">
              ${filteredLeads.reduce((sum, lead) => sum + (parseFloat(lead.value) || 0), 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-500">{t('Weighted Value')}</p>
            <p className="text-2xl font-bold text-purple-600 truncate">
              ${Math.round(filteredLeads.reduce((sum, lead) =>
                sum + ((parseFloat(lead.value) || 0) * (lead.probability || 0) / 100), 0
              )).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-500">{t('Avg Deal Size')}</p>
            <p className="text-2xl font-bold text-blue-600 truncate">
              ${filteredLeads.length > 0
                ? Math.round(filteredLeads.reduce((sum, lead) => sum + (parseFloat(lead.value) || 0), 0) / filteredLeads.length).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                : '0'}
            </p>
          </div>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <DroppableStage
                key={stage.id}
                stage={stage}
                leads={groupedLeads[stage.id] || []}
                onLeadClick={(leadId: string) => {
                  setSelectedLeadId(leadId);
                  setShowLeadModal(true);
                }}
                t={t}
              />
            ))}
          </div>

          <DragOverlay>
            {activeId ? (
              <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-blue-500 w-80">
                <p className="font-medium text-gray-900">
                  {leads.find(l => l.id === activeId)?.title || 'Dragging...'}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Create Pipeline Modal */}
        {showCreateModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <div
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4">Create New Pipeline</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pipeline Name *
                </label>
                <input
                  type="text"
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.target.value)}
                  placeholder="Enter pipeline name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreatePipeline()}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Default stages: New → Contacted → Qualified → Proposal → Won
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewPipelineName('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePipeline}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Pipeline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lead Modal */}
        {selectedLeadId && (
          <LeadModal
            leadId={selectedLeadId}
            isOpen={showLeadModal}
            onClose={() => {
              setShowLeadModal(false);
              setSelectedLeadId(null);
            }}
            onUpdate={loadData}
          />
        )}
      </div>
    </AppLayout>
  );
}
