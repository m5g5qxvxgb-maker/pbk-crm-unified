#!/usr/bin/env node

const http = require('http');

const API_BASE = 'http://localhost:5000/api';

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 PBK CRM Backend API Tests\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Unauthorized access
  console.log('Test 1: Unauthorized access should fail');
  try {
    const res = await makeRequest('GET', '/users');
    if (res.status === 401 && res.data.error) {
      console.log('✅ PASSED - Got 401 with error message\n');
      passed++;
    } else {
      console.log('❌ FAILED - Expected 401\n');
      failed++;
    }
  } catch (e) {
    console.log('❌ FAILED - ' + e.message + '\n');
    failed++;
  }

  // Test 2: Register user
  console.log('Test 2: Register new user');
  const testEmail = `test_${Date.now()}@pbk.com`;
  try {
    const res = await makeRequest('POST', '/auth/register', {
      email: testEmail,
      password: 'Test123!@#',
      name: 'Test User',
      role: 'user'
    });
    
    if (res.status === 201 && res.data.success) {
      console.log('✅ PASSED - User registered successfully\n');
      passed++;
    } else {
      console.log('❌ FAILED - Registration failed:', res.data, '\n');
      failed++;
    }
  } catch (e) {
    console.log('❌ FAILED - ' + e.message + '\n');
    failed++;
  }

  // Test 3: Login
  console.log('Test 3: Login with credentials');
  let authToken = null;
  try {
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: testEmail,
      password: 'Test123!@#'
    });
    
    if (loginRes.status === 200 && loginRes.data.token) {
      authToken = loginRes.data.token;
      console.log('✅ PASSED - Login successful, got token\n');
      passed++;
    } else {
      console.log('❌ FAILED - Login failed:', loginRes.data, '\n');
      failed++;
    }
  } catch (e) {
    console.log('❌ FAILED - ' + e.message + '\n');
    failed++;
  }

  // Test 4: Create client (authenticated)
  if (authToken) {
    console.log('Test 4: Create client with authentication');
    try {
      const clientRes = await makeRequest('POST', '/clients', {
        name: 'Test Client Company',
        email: 'client@test.com',
        phone: '+48123456789',
        source: 'test'
      }, {
        'Authorization': `Bearer ${authToken}`
      });
      
      if (clientRes.status === 201 && clientRes.data.name) {
        console.log('✅ PASSED - Client created successfully\n');
        passed++;
      } else {
        console.log('❌ FAILED - Client creation failed:', clientRes.data, '\n');
        failed++;
      }
    } catch (e) {
      console.log('❌ FAILED - ' + e.message + '\n');
      failed++;
    }
  }

  // Test 5: Get dashboard stats
  if (authToken) {
    console.log('Test 5: Get dashboard stats');
    try {
      const dashRes = await makeRequest('GET', '/dashboard/stats', null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      if (dashRes.status === 200) {
        console.log('✅ PASSED - Dashboard stats retrieved\n');
        passed++;
      } else {
        console.log('❌ FAILED - Dashboard request failed:', dashRes.data, '\n');
        failed++;
      }
    } catch (e) {
      console.log('❌ FAILED - ' + e.message + '\n');
      failed++;
    }
  }

  // Results
  console.log('═'.repeat(50));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log(`Success rate: ${Math.round((passed / (passed + failed)) * 100)}%\n`);
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
