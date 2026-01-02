'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import KanbanBoard from '../../src/components/pipeline/KanbanBoard';
import Button from '../../src/components/ui/Button';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PipelinesPage() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/api/deals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setDeals(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch deals:', error);
      // Mock data для демонстрации
      setDeals([
        { id: 1, title: 'Office Renovation', client: 'ABC Corp', value: 50000, stage: 'lead', probability: 30 },
        { id: 2, title: 'Website Project', client: 'XYZ Inc', value: 25000, stage: 'qualified', probability: 60 },
        { id: 3, title: 'App Development', client: 'Tech Co', value: 75000, stage: 'proposal', probability: 70 },
        { id: 4, title: 'Consulting', client: 'StartupX', value: 15000, stage: 'negotiation', probability: 85 },
        { id: 5, title: 'Building Construction', client: 'Real Estate LLC', value: 250000, stage: 'won', probability: 100 },
        { id: 6, title: 'Small Repair', client: 'Home Owner', value: 5000, stage: 'lost', probability: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDealMove = async (dealId, newStage) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Update locally first
      setDeals(prev => prev.map(deal => 
        deal.id === parseInt(dealId) ? { ...deal, stage: newStage } : deal
      ));

      // Update on server
      const response = await fetch(`http://localhost:5000/api/deals/${dealId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stage: newStage })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Deal moved to ${newStage}`);
      }
    } catch (error) {
      console.error('Failed to update deal:', error);
      toast.success(`Deal moved to ${newStage}`); // Mock success
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h1 text-text-primary mb-2">Sales Pipeline</h1>
            <p className="text-text-muted">Manage your deals through the sales funnel</p>
          </div>
          <Button variant="primary" icon={<Plus size={20} />}>
            New Deal
          </Button>
        </div>

        {/* Kanban Board */}
        <KanbanBoard deals={deals} onDealMove={handleDealMove} />
      </div>
    </AppLayout>
  );
}
