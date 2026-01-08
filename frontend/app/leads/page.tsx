'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import LeadModal from '@/components/modals/LeadModal';
import { getApiUrl } from '@/lib/api';
import { useTranslation } from '@/lib/translations';
import toast from 'react-hot-toast';

export default function LeadsPage() {
  const { t } = useTranslation();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch(getApiUrl('/api/leads'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setLeads(data.data);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error(t('Failed to load data'));
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'open' && !lead.closed_at) ||
      (filterStatus === 'closed' && lead.closed_at);

    return matchesSearch && matchesStatus;
  });

  const handleOpenLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setShowLeadModal(true);
  };

  const handleCreateNew = () => {
    setSelectedLeadId(null);
    setShowLeadModal(true);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="text-5xl mb-4">⏳</div>
            <div className="text-gray-600">{t('Loading...')}</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            🎯 {t('Leads')} ({filteredLeads.length})
          </h2>
          <button 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            onClick={handleCreateNew}
          >
            <span>✨</span>
            New Lead
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <input 
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Leads List */}
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No leads found. Create your first lead!
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLeads.map((lead) => (
              <div 
                key={lead.id}
                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100 flex items-center justify-between"
                onClick={() => handleOpenLead(lead.id)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {lead.title}
                  </h3>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    {lead.client_name && (
                      <div>👤 {lead.client_name}</div>
                    )}
                    {lead.stage_name && (
                      <div>📍 {lead.stage_name}</div>
                    )}
                    {lead.probability && (
                      <div>📊 {lead.probability}%</div>
                    )}
                  </div>
                </div>

                <div className="text-right ml-4">
                  {lead.value && (
                    <div className="font-semibold text-green-600">
                      {parseFloat(lead.value).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} zł
                    </div>
                  )}
                  {lead.closed_at && (
                    <div className="text-xs text-gray-500 mt-1">✓ Closed</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lead Modal */}
      <LeadModal
        leadId={selectedLeadId}
        isOpen={showLeadModal}
        onClose={() => {
          setShowLeadModal(false);
          setSelectedLeadId(null);
        }}
        onUpdate={loadLeads}
      />
    </AppLayout>
  );
}
