'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ClientModal from '@/components/modals/ClientModal';
import { getApiUrl } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  const handleSelectToggle = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    setSelectedClients(filteredClients.map(client => client.id));
  };

  const handleDeselectAll = () => {
    setSelectedClients([]);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Вы уверены, что хотите удалить ${selectedClients.length} клиент(ов)?`)) {
      return;
    }

    const token = localStorage.getItem('token');
    let successCount = 0;
    let errorCount = 0;

    for (const clientId of selectedClients) {
      try {
        const response = await fetch(getApiUrl(`/api/clients/${clientId}`), {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`✅ Удалено: ${successCount} клиент(ов)`);
    }
    if (errorCount > 0) {
      toast.error(`❌ Ошибка при удалении: ${errorCount} клиент(ов)`);
    }

    setSelectedClients([]);
    loadClients();
  };

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

        {selectedClients.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-3 mb-6">
            <div className="flex items-center justify-start gap-6">
              <span className="text-sm font-medium text-blue-900">
                Выбрано: {selectedClients.length}
              </span>
              <button
                onClick={handleDeselectAll}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Снять выделение
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                🗑️ Удалить
              </button>
            </div>
          </div>
        )}

        {filteredClients.length > 0 && selectedClients.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-3 mb-6">
            <button
              onClick={handleSelectAll}
              className="text-sm text-gray-700 hover:text-gray-900 font-medium"
            >
              Выбрать все ({filteredClients.length})
            </button>
          </div>
        )}

        {filteredClients.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'No clients found' : 'No clients yet. Add your first client!'}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredClients.map((client) => (
              <div 
                key={client.id}
                className={`p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border-2 ${
                  selectedClients.includes(client.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(client.id)}
                    onChange={() => handleSelectToggle(client.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
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
