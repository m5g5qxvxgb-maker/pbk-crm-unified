'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { callsAPI } from '@/lib/api';

interface CallApprovalModalProps {
  call: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CallApprovalModal({ call, onClose, onSuccess }: CallApprovalModalProps) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    try {
      await callsAPI.approve(call.id);
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to approve call');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await callsAPI.reject(call.id, rejectionReason);
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to reject call');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {action === 'reject' ? 'Reject Call Request' : 'Review Call Request'}
          </h3>
        </div>

        <div className="px-6 py-4">
          {!action ? (
            <>
              {/* Call Details */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Phone Number</h4>
                  <p className="text-lg text-gray-900">{call.phone_number}</p>
                </div>

                {call.client_company_name && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Client</h4>
                    <p className="text-gray-900">{call.client_company_name}</p>
                  </div>
                )}

                {call.lead_title && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Lead</h4>
                    <p className="text-gray-900">{call.lead_title}</p>
                  </div>
                )}

                {call.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Notes</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{call.notes}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-700">Requested by</h4>
                  <p className="text-gray-900">{call.created_by_name}</p>
                </div>

                {call.scheduled_for && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Scheduled for</h4>
                    <p className="text-gray-900">
                      {new Date(call.scheduled_for).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ℹ️ Once approved, this call will be initiated by Retell AI.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Rejection Form */}
              <Textarea
                label="Rejection Reason *"
                placeholder="Please provide a reason for rejecting this call request..."
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />

              {error && (
                <div className="mt-4 rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          {!action ? (
            <>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => setAction('reject')}
              >
                ✗ Reject
              </Button>
              <Button
                variant="primary"
                onClick={handleApprove}
                loading={loading}
              >
                ✓ Approve
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setAction(null)}>
                Back
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                loading={loading}
              >
                Confirm Rejection
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
