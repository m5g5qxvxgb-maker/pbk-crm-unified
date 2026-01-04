'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ClientModal from '@/components/modals/ClientModal';
import { getApiUrl } from '@/lib/api';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadClients = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(getApiUrl('/api/clients'), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        console.log('Clients data:', data);
        if (data.success && data.data) {
          setClients(data.data);
          setFilteredClients(data.data);
        } else if (Array.isArray(data)) {
          setClients(data);
          setFilteredClients(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading clients:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredClients(clients);
      return;
    }
    const filtered = clients.filter(client => 
      client.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm)
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="text-5xl mb-4">⏳</div>
            <div className="text-gray-600">Loading clients...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            👥 Clients ({filteredClients.length})
          </h2>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => window.location.href = '/clients/new'}
          >
            + Add Client
          </button>
        </div>

        <div className="mb-6">
          <input 
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {filteredClients.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'No clients found' : 'No clients yet. Add your first client!'}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredClients.map((client) => (
              <div 
                key={client.id}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {client.company_name}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      {client.contact_person && (
                        <div>👤 {client.contact_person}</div>
                      )}
                      {client.email && (
                        <div>📧 {client.email}</div>
                      )}
                      {client.phone && (
                        <div>📞 {client.phone}</div>
                      )}
                      {client.city && (
                        <div>📍 {client.city}{client.country ? `, ${client.country}` : ''}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setIsModalOpen(true);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ClientModal
        clientId={selectedClientId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClientId(null);
        }}
        onSave={() => {
          loadClients();
        }}
      />
    </AppLayout>
  );
}
