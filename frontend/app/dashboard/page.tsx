'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import AICopilotChat from '@/components/ai/AICopilotChat';
import StatsCard from '../../src/components/dashboard/StatsCard';
import Card from '../../src/components/ui/Card';
import ActivityTimeline from '../../src/components/timeline/ActivityTimeline';
import { Users, Briefcase, FolderOpen, DollarSign, Phone } from 'lucide-react';
import { getApiUrl } from '@/lib/api';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({ 
    leads: 0, 
    clients: 0, 
    calls: 0,
    projects: 0,
    revenue: 0
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Fetch metrics
    fetch(getApiUrl('/api/dashboard/metrics'), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMetrics(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch recent activities
    fetch(getApiUrl('/api/dashboard/activities'), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setActivities(data.data);
        }
      })
      .catch(err => console.error('Failed to fetch activities:', err));
  }, []);

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
        <div>
          <h1 className="text-h1 text-text-primary mb-2">Dashboard</h1>
          <p className="text-text-muted">Welcome back! Here's what's happening with your business today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Leads"
            value={metrics.leads || 0}
            change={12.5}
            icon={Users}
            color="blue"
          />
          <StatsCard
            title="Active Clients"
            value={metrics.clients || 0}
            change={8.2}
            icon={Briefcase}
            color="green"
          />
          <StatsCard
            title="Projects"
            value={metrics.projects || 0}
            change={-3.1}
            icon={FolderOpen}
            color="purple"
          />
          <StatsCard
            title="Total Calls"
            value={metrics.calls || 0}
            change={15.8}
            icon={Phone}
            color="gold"
          />
        </div>

        {/* Recent Activity */}
        <Card>
          <h3 className="text-h3 text-text-primary mb-4">Recent Activity</h3>
          <ActivityTimeline activities={activities} />
        </Card>
      </div>

      {/* AI Copilot Chat - Fixed on right side */}
      <AICopilotChat onActionComplete={() => {
        // Reload metrics and activities instead of full page reload
        fetch(getApiUrl('/api/dashboard/metrics'), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) setMetrics(data.data);
          });
        
        fetch(getApiUrl('/api/dashboard/activities'), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data) setActivities(data.data);
          });
      }} />
    </AppLayout>
  );
}
