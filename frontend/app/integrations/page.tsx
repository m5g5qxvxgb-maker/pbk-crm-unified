'use client';

import { useState, useEffect } from 'react';

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState('retell');
  const [agents, setAgents] = useState([]);
  const [activeAgent, setActiveAgent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calls, setCalls] = useState([]);

  useEffect(() => {
    if (activeTab === 'agents') {
      fetchAgents();
    } else if (activeTab === 'retell') {
      fetchRetellCalls();
    }
  }, [activeTab]);

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/agents/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAgents(data.data.agents || []);
        setActiveAgent(data.data.active);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const fetchRetellCalls = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/retell/calls', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCalls(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch calls:', error);
    }
  };

  const activateAgent = async (agentId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/agents/activate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ agent_id: agentId })
      });
      const data = await response.json();
      if (data.success) {
        setActiveAgent(agentId);
        alert('Agent activated successfully');
      }
    } catch (error) {
      console.error('Failed to activate agent:', error);
      alert('Failed to activate agent');
    } finally {
      setLoading(false);
    }
  };

  const createRetellCall = async () => {
    const phone = prompt('Enter phone number (with country code, e.g., +48572778993):');
    if (!phone) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/retell/call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone_number: phone,
          ai_instructions: 'Collect project information and schedule a meeting'
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('Call created successfully!');
        fetchRetellCalls();
      } else {
        alert('Failed to create call: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to create call:', error);
      alert('Failed to create call');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Integrations</h1>

      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('retell')}
          className={`px-4 py-2 ${activeTab === 'retell' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
        >
          Retell AI Calls
        </button>
        <button
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-2 ${activeTab === 'agents' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
        >
          TWM Agents
        </button>
        <button
          onClick={() => setActiveTab('offerteo')}
          className={`px-4 py-2 ${activeTab === 'offerteo' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
        >
          Offerteo
        </button>
      </div>

      {activeTab === 'retell' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Retell AI Voice Calls</h2>
            <button
              onClick={createRetellCall}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : '+ Create Call'}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {calls.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No calls yet. Create your first call!
                    </td>
                  </tr>
                ) : (
                  calls.map((call) => (
                    <tr key={call.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{call.phone_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${
                          call.status === 'ended' ? 'bg-green-100 text-green-800' :
                          call.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {call.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {call.duration ? `${Math.round(call.duration / 1000)}s` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(call.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'agents' && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">TWM AI Agents</h2>
          
          {activeAgent && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                <strong>Active Agent:</strong> {activeAgent}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.length === 0 ? (
              <p className="text-gray-500">No agents available.</p>
            ) : (
              agents.map((agent) => (
                <div key={agent.id} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold mb-2">{agent.name}</h3>
                  <p className="text-gray-600 mb-4">{agent.description}</p>
                  
                  <button
                    onClick={() => activateAgent(agent.id)}
                    disabled={loading || activeAgent === agent.id}
                    className={`w-full py-2 rounded ${
                      activeAgent === agent.id
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    } disabled:opacity-50`}
                  >
                    {activeAgent === agent.id ? '✓ Active' : 'Activate'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'offerteo' && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">Offerteo Integration</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 mb-4">
              Offerteo bot automatically monitors new orders and creates leads in CRM.
            </p>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Bot Status:</span>
                <span className="text-green-600">● Active</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Auto-accept:</span>
                <span>Enabled</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
