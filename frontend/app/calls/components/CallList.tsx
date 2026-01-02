'use client';

import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface CallListProps {
  calls: any[];
  loading: boolean;
  onViewTranscript: (call: any) => void;
  onApprove: (call: any) => void;
  onRefresh: () => void;
}

export default function CallList({
  calls,
  loading,
  onViewTranscript,
  onApprove,
  onRefresh,
}: CallListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No calls</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new call request.
        </p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'outbound' ? '📤' : '📥';
  };

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Call History</h3>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            🔄 Refresh
          </Button>
        </div>

        <div className="space-y-4">
          {calls.map((call) => (
            <div
              key={call.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getDirectionIcon(call.direction)}</span>
                    <h4 className="text-lg font-medium text-gray-900">
                      {call.phone_number}
                    </h4>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        call.status
                      )}`}
                    >
                      {call.status}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {formatDate(call.created_at)}
                    </div>
                    {call.duration && (
                      <div>
                        <span className="font-medium">Duration:</span>{' '}
                        {Math.floor(call.duration / 60)}m {call.duration % 60}s
                      </div>
                    )}
                    {call.created_by_name && (
                      <div>
                        <span className="font-medium">Requested by:</span>{' '}
                        {call.created_by_name}
                      </div>
                    )}
                    {call.approved_by_name && (
                      <div>
                        <span className="font-medium">Approved by:</span>{' '}
                        {call.approved_by_name}
                      </div>
                    )}
                  </div>

                  {call.notes && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {call.notes}
                      </p>
                    </div>
                  )}

                  {call.summary && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Summary:</span> {call.summary}
                      </p>
                    </div>
                  )}

                  {call.rejection_reason && (
                    <div className="mt-2 p-2 bg-red-50 rounded">
                      <p className="text-sm text-red-800">
                        <span className="font-medium">Rejection reason:</span>{' '}
                        {call.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  {call.status === 'pending' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onApprove(call)}
                    >
                      ✓ Approve
                    </Button>
                  )}

                  {call.transcript && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onViewTranscript(call)}
                    >
                      📝 Transcript
                    </Button>
                  )}

                  {call.recording_url && (
                    <a
                      href={call.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        🎧 Recording
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
