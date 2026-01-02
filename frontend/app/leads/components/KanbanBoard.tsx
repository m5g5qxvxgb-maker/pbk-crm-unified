'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface KanbanBoardProps {
  pipeline: any;
  leads: any[];
  onLeadClick: (lead: any) => void;
  onStageMove: (leadId: number, stageId: number) => void;
}

export default function KanbanBoard({ pipeline, leads, onLeadClick, onStageMove }: KanbanBoardProps) {
  const [draggedLead, setDraggedLead] = useState<any>(null);

  if (!pipeline) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No pipeline selected</p>
      </div>
    );
  }

  const stages = pipeline.stages || [];

  const getLeadsByStage = (stageId: number) => {
    return leads.filter((lead) => lead.stage_id === stageId);
  };

  const handleDragStart = (e: React.DragEvent, lead: any) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stageId: number) => {
    e.preventDefault();
    if (draggedLead && draggedLead.stage_id !== stageId) {
      onStageMove(draggedLead.id, stageId);
    }
    setDraggedLead(null);
  };

  const getValueColor = (value: number) => {
    if (value >= 100000) return 'text-green-600';
    if (value >= 50000) return 'text-blue-600';
    if (value >= 10000) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage: any) => {
        const stageLeads = getLeadsByStage(stage.id);
        const totalValue = stageLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);

        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {stageLeads.length}
                </span>
              </div>
              <p className={`text-sm font-medium ${getValueColor(totalValue)}`}>
                ${totalValue.toLocaleString()}
              </p>
            </div>

            <div className="space-y-3 min-h-[200px]">
              {stageLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead)}
                  onClick={() => onLeadClick(lead)}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <h4 className="font-medium text-gray-900 mb-2">{lead.title}</h4>
                  
                  {lead.client_company_name && (
                    <p className="text-sm text-gray-600 mb-2">
                      🏢 {lead.client_company_name}
                    </p>
                  )}

                  {lead.value && (
                    <p className={`text-sm font-medium mb-2 ${getValueColor(lead.value)}`}>
                      💰 ${lead.value.toLocaleString()}
                    </p>
                  )}

                  {lead.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                      {lead.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{lead.source || 'No source'}</span>
                    {lead.assigned_to_name && (
                      <span>👤 {lead.assigned_to_name}</span>
                    )}
                  </div>
                </div>
              ))}

              {stageLeads.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Drag leads here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
