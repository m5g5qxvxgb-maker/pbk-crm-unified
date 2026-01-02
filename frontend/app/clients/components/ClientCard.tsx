'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { clientsAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface ClientCardProps {
  client: any;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}

export default function ClientCard({ client, onClose, onEdit, onRefresh }: ClientCardProps) {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await clientsAPI.delete(client.id);
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Failed to delete client:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{client.company_name}</h3>
              {client.contact_person && (
                <p className="text-sm text-gray-600">Contact: {client.contact_person}</p>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              ✕
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h4>
            <div className="grid grid-cols-2 gap-4">
              {client.email && (
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                    {client.phone}
                  </a>
                </div>
              )}
              {client.website && (
                <div>
                  <p className="text-xs text-gray-500">Website</p>
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {client.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          {(client.address || client.city || client.state) && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Address</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                {client.address && <p className="text-gray-900">{client.address}</p>}
                <p className="text-gray-900">
                  {[client.city, client.state, client.zip].filter(Boolean).join(', ')}
                </p>
                {client.country && <p className="text-gray-900">{client.country}</p>}
              </div>
            </div>
          )}

          {/* Notes */}
          {client.notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
              <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
                {client.notes}
              </p>
            </div>
          )}

          {/* Stats */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Activity</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {client.active_leads_count || 0}
                </p>
                <p className="text-xs text-gray-600">Active Leads</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {client.calls_count || 0}
                </p>
                <p className="text-xs text-gray-600">Total Calls</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {client.emails_count || 0}
                </p>
                <p className="text-xs text-gray-600">Emails</p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Type</h4>
              <p className="text-gray-900 capitalize">{client.type || 'client'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700">Created</h4>
              <p className="text-gray-600">{formatDate(client.created_at)}</p>
            </div>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800 mb-3">
                Are you sure you want to delete this client? This action cannot be undone.
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
