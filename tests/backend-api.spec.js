const { test, expect } = require('@playwright/test');

const API_BASE = 'http://localhost:5000/api';

test.describe('PBK CRM Backend API Tests', () => {
  
  let authToken;
  let testUserId;

  test('Health check - API should be accessible', async ({ request }) => {
    const response = await request.get(`${API_BASE}/users`);
    expect(response.status()).toBe(401); // Should require auth
    const body = await response.json();
    expect(body.error).toContain('token');
  });

  test('Register new user', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/register`, {
      data: {
        email: `test_${Date.now()}@pbk.com`,
        password: 'Test123!@#',
        name: 'Test User',
        role: 'user'
      }
    });
    
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBeTruthy();
    expect(body.user).toBeDefined();
    expect(body.user.email).toContain('@pbk.com');
    testUserId = body.user.id;
  });

  test('Login with credentials', async ({ request }) => {
    // First register
    const email = `test_login_${Date.now()}@pbk.com`;
    const password = 'Test123!@#';
    
    await request.post(`${API_BASE}/auth/register`, {
      data: {
        email,
        password,
        name: 'Login Test User',
        role: 'user'
      }
    });

    // Then login
    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password }
    });

    expect(loginResponse.status()).toBe(200);
    const body = await loginResponse.json();
    expect(body.success).toBeTruthy();
    expect(body.token).toBeDefined();
    authToken = body.token;
  });

  test('Create a client (authenticated)', async ({ request }) => {
    // First login
    const email = `test_client_${Date.now()}@pbk.com`;
    const password = 'Test123!@#';
    
    await request.post(`${API_BASE}/auth/register`, {
      data: { email, password, name: 'Client Test User', role: 'manager' }
    });

    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password }
    });
    const { token } = await loginResponse.json();

    // Create client
    const clientResponse = await request.post(`${API_BASE}/clients`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        name: 'Test Client Company',
        email: 'client@test.com',
        phone: '+48123456789',
        source: 'test'
      }
    });

    expect(clientResponse.status()).toBe(201);
    const client = await clientResponse.json();
    expect(client.name).toBe('Test Client Company');
  });

  test('Get dashboard stats (authenticated)', async ({ request }) => {
    const email = `test_dashboard_${Date.now()}@pbk.com`;
    const password = 'Test123!@#';
    
    await request.post(`${API_BASE}/auth/register`, {
      data: { email, password, name: 'Dashboard User', role: 'admin' }
    });

    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password }
    });
    const { token } = await loginResponse.json();

    const dashboardResponse = await request.get(`${API_BASE}/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    expect(dashboardResponse.status()).toBe(200);
    const stats = await dashboardResponse.json();
    expect(stats).toBeDefined();
  });

  test('Unauthorized access should fail', async ({ request }) => {
    const response = await request.get(`${API_BASE}/clients`);
    expect(response.status()).toBe(401);
  });

  test('Invalid token should fail', async ({ request }) => {
    const response = await request.get(`${API_BASE}/clients`, {
      headers: {
        'Authorization': 'Bearer invalid_token_12345'
      }
    });
    expect(response.status()).toBe(401);
  });

  test('Create lead via API', async ({ request }) => {
    const email = `test_lead_${Date.now()}@pbk.com`;
    const password = 'Test123!@#';
    
    await request.post(`${API_BASE}/auth/register`, {
      data: { email, password, name: 'Lead Test User', role: 'manager' }
    });

    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password }
    });
    const { token } = await loginResponse.json();

    const leadResponse = await request.post(`${API_BASE}/leads`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        name: 'Test Lead',
        email: 'lead@test.com',
        phone: '+48987654321',
        source: 'website',
        status: 'new'
      }
    });

    expect(leadResponse.status()).toBe(201);
    const lead = await leadResponse.json();
    expect(lead.name).toBe('Test Lead');
    expect(lead.status).toBe('new');
  });

  test('Get pipelines (authenticated)', async ({ request }) => {
    const email = `test_pipeline_${Date.now()}@pbk.com`;
    const password = 'Test123!@#';
    
    await request.post(`${API_BASE}/auth/register`, {
      data: { email, password, name: 'Pipeline User', role: 'manager' }
    });

    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password }
    });
    const { token } = await loginResponse.json();

    const pipelineResponse = await request.get(`${API_BASE}/pipelines`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    expect(pipelineResponse.status()).toBe(200);
  });
});
