import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Card from '../ui/Card';

const KanbanBoard = ({ deals = [], onDealMove }) => {
  const stages = [
    { id: 'lead', name: 'New Lead', color: 'blue' },
    { id: 'qualified', name: 'Qualified', color: 'purple' },
    { id: 'proposal', name: 'Proposal', color: 'yellow' },
    { id: 'negotiation', name: 'Negotiation', color: 'orange' },
    { id: 'won', name: 'Won', color: 'green' },
    { id: 'lost', name: 'Lost', color: 'red' }
  ];

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const dealId = draggableId;
    const newStage = destination.droppableId;
    
    if (onDealMove) {
      onDealMove(dealId, newStage);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map(stage => (
          <Droppable key={stage.id} droppableId={stage.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`
                  flex-shrink-0 w-80 bg-bg-secondary rounded-xl p-4
                  ${snapshot.isDraggingOver ? 'ring-2 ring-gold-500' : ''}
                `}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-3 h-3 rounded-full bg-${stage.color}-500`} />
                  <h3 className="font-semibold text-text-primary">{stage.name}</h3>
                  <span className="text-sm text-text-muted ml-auto">
                    {deals.filter(d => d.stage === stage.id).length}
                  </span>
                </div>
                <div className="space-y-3">
                  {deals
                    .filter(d => d.stage === stage.id)
                    .map((deal, index) => (
                      <Draggable key={deal.id} draggableId={String(deal.id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`
                              bg-bg-primary rounded-lg p-4 border border-border-light
                              hover:border-gold-500 transition-all cursor-pointer
                              ${snapshot.isDragging ? 'shadow-2xl rotate-2' : ''}
                            `}
                          >
                            <h4 className="font-medium text-text-primary mb-2">
                              {deal.title}
                            </h4>
                            <p className="text-sm text-text-muted mb-3">
                              {deal.client}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-gold-500">
                                ${deal.value?.toLocaleString() || 0}
                              </span>
                              <span className="text-xs text-text-muted">
                                {deal.probability || 0}% chance
                              </span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
