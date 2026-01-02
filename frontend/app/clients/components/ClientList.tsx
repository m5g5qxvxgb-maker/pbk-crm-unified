'use client';

import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

interface ClientListProps {
  clients: any[];
  loading: boolean;
  onClientClick: (client: any) => void;
  onRefresh: () => void;
}

export default function ClientList({ clients, loading, onClientClick, onRefresh }: ClientListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (clients.length === 0) {
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No clients</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new client.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">All Clients</h3>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            🔄 Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <div
              key={client.id}
              onClick={() => onClientClick(client)}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">
                    {client.company_name || 'No company name'}
                  </h4>
                  {client.contact_person && (
                    <p className="text-sm text-gray-600">👤 {client.contact_person}</p>
                  )}
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {client.type || 'client'}
                </span>
              </div>

              <div className="space-y-1 mb-3">
                {client.email && (
                  <p className="text-sm text-gray-600 truncate">✉️ {client.email}</p>
                )}
                {client.phone && (
                  <p className="text-sm text-gray-600">📞 {client.phone}</p>
                )}
                {client.website && (
                  <p className="text-sm text-gray-600 truncate">🌐 {client.website}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                <span>{formatDate(client.created_at)}</span>
                <div className="flex gap-3">
                  {client.active_leads_count > 0 && (
                    <span className="font-medium text-blue-600">
                      {client.active_leads_count} leads
                    </span>
                  )}
                  {client.calls_count > 0 && (
                    <span className="font-medium text-green-600">
                      {client.calls_count} calls
                    </span>
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
