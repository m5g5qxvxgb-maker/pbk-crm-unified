'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { leadsAPI } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';

interface LeadCardProps {
  lead: any;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}

export default function LeadCard({ lead, onClose, onEdit, onRefresh }: LeadCardProps) {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await leadsAPI.delete(lead.id);
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Failed to delete lead:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">{lead.title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              ✕
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Pipeline</h4>
              <p className="text-gray-900">{lead.pipeline_name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700">Stage</h4>
              <p className="text-gray-900">{lead.stage_name}</p>
            </div>
            {lead.value && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">Value</h4>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(lead.value)}
                </p>
              </div>
            )}
            {lead.source && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">Source</h4>
                <p className="text-gray-900">{lead.source}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {lead.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
              <p className="text-gray-900 whitespace-pre-wrap">{lead.description}</p>
            </div>
          )}

          {/* Client */}
          {lead.client_company_name && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Client</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900">{lead.client_company_name}</p>
                {lead.client_contact_person && (
                  <p className="text-sm text-gray-600">Contact: {lead.client_contact_person}</p>
                )}
                {lead.client_email && (
                  <p className="text-sm text-gray-600">Email: {lead.client_email}</p>
                )}
                {lead.client_phone && (
                  <p className="text-sm text-gray-600">Phone: {lead.client_phone}</p>
                )}
              </div>
            </div>
          )}

          {/* Assigned To */}
          {lead.assigned_to_name && (
            <div>
              <h4 className="text-sm font-medium text-gray-700">Assigned To</h4>
              <p className="text-gray-900">👤 {lead.assigned_to_name}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Created</h4>
              <p className="text-gray-600">{formatDate(lead.created_at)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700">Updated</h4>
              <p className="text-gray-600">{formatDate(lead.updated_at)}</p>
            </div>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800 mb-3">
                Are you sure you want to delete this lead? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  loading={loading}
                >
                  Confirm Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
          <Button
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={showDeleteConfirm}
          >
            🗑️ Delete
          </Button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" onClick={onEdit}>
              ✏️ Edit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
