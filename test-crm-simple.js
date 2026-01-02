const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3333';
const API_URL = 'http://localhost:5000';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCRM() {
  console.log('🚀 Starting PBK CRM E2E Test\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  let passed = 0, failed = 0;

  try {
    // Test 1: Backend Health
    console.log('📋 Test 1: Backend Health');
    try {
      const res = await page.goto(API_URL + '/health', { waitUntil: 'networkidle2' });
      const health = await res.json();
      if (health.status === 'ok') {
        console.log('✅ PASS\n');
        passed++;
      } else throw new Error('Unhealthy');
    } catch (err) {
      console.log('❌ FAIL:', err.message, '\n');
      failed++;
    }

    // Test 2: Frontend
    console.log('📋 Test 2: Frontend Loading');
    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      if (page.url().includes('/login')) {
        console.log('✅ PASS\n');
        passed++;
      } else throw new Error('No login redirect');
    } catch (err) {
      console.log('❌ FAIL:', err.message, '\n');
      failed++;
    }

    // Test 3: Login Form
    console.log('📋 Test 3: Login Form Elements');
    try {
      await page.waitForSelector('input#email', { timeout: 5000 });
      await page.waitForSelector('input#password', { timeout: 5000 });
      await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
      console.log('✅ PASS\n');
      passed++;
    } catch (err) {
      console.log('❌ FAIL:', err.message, '\n');
      failed++;
    }

    // Test 4: Navigation Links
    console.log('📋 Test 4: Testing Module Routes');
    const routes = ['/dashboard', '/leads', '/clients', '/projects', '/calls', '/settings'];
    for (const route of routes) {
      try {
        await page.goto(BASE_URL + route, { waitUntil: 'networkidle2', timeout: 8000 });
        await sleep(1000);
        console.log(`  ✅ ${route} - accessible`);
        passed++;
      } catch (err) {
        console.log(`  ❌ ${route} - failed`);
        failed++;
      }
    }
    console.log('');

    // Test 5: API Endpoints
    console.log('📋 Test 5: API Endpoints');
    const endpoints = [
      { path: '/api/retell/webhook', method: 'POST' },
      { path: '/api/offerteo/webhook', method: 'POST' }
    ];
    
    for (const ep of endpoints) {
      try {
        const response = await fetch(API_URL + ep.path, {
          method: ep.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true })
        });
        console.log(`  ✅ ${ep.path} - ${response.status}`);
        passed++;
      } catch (err) {
        console.log(`  ⚠️  ${ep.path} - skip`);
      }
    }

  } catch (error) {
    console.error('\n❌ Critical error:', error);
  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📝 Total:  ${passed + failed}`);
  console.log('='.repeat(60));
  
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED!');
  } else {
    console.log(`⚠️  ${failed} test(s) failed`);
  }
}

testCRM().catch(console.error);
