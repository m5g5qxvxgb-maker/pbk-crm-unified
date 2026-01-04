'use client';

import { useEffect, useState } from 'react';

export default function TestAPIPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const testAPI = async () => {
      const res: any = {
        token_exists: !!token,
        token_preview: token ? token.substring(0, 30) + '...' : 'NO TOKEN'
      };

      if (!token) {
        setResults(res);
        setLoading(false);
        return;
      }

      try {
        const pipelinesResp = await fetch(getApiUrl('/api/pipelines'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const pipelinesData = await pipelinesResp.json();
        res.pipelines = pipelinesData;

        const leadsResp = await fetch(getApiUrl('/api/leads'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const leadsData = await leadsResp.json();
        res.leads = leadsData;

      } catch (error: any) {
        res.error = error.message;
      }

      setResults(res);
      setLoading(false);
    };

    testAPI();
  }, []);

  if (loading) return <div style={{padding: '40px'}}>Testing API...</div>;

  return (
    <div style={{padding: '40px', fontFamily: 'monospace', fontSize: '14px'}}>
      <h1>🔍 API Test Results</h1>
      
      <div style={{background: '#f0f0f0', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
        <h2>Token</h2>
        <p><strong>Exists:</strong> {results.token_exists ? '✅' : '❌'}</p>
        <p><strong>Preview:</strong> {results.token_preview}</p>
      </div>

      {results.pipelines && (
        <div style={{background: '#efe', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
          <h2>Pipelines</h2>
          <p><strong>Success:</strong> {results.pipelines.success ? '✅' : '❌'}</p>
          <p><strong>Count:</strong> {results.pipelines.data?.length || 0}</p>
          {results.pipelines.data?.[0]?.stages && (
            <p><strong>Stages:</strong> {results.pipelines.data[0].stages.length}</p>
          )}
          <pre>{JSON.stringify(results.pipelines, null, 2)}</pre>
        </div>
      )}

      <a href="/leads">← Back to Leads</a>
    </div>
  );
}
