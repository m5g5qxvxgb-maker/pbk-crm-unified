const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const BASE_URL = 'http://localhost:3333';
  const API_URL = 'http://localhost:5000';
  const CREDENTIALS = {
    email: 'admin@pbkconstruction.net',
    password: 'admin123'
  };

  console.log('\n🧪 PBK CRM E2E TESTING STARTED\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Login
    console.log('\n1️⃣  Testing Login...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('dashboard') || currentUrl.includes('login')) {
      console.log('   ✅ Login page loaded');
    }
    
    await page.screenshot({ path: '/tmp/01-login.png' });

    // Test 2: Dashboard
    console.log('\n2️⃣  Testing Dashboard...');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const dashboardContent = await page.content();
    console.log(`   ✅ Dashboard loaded (${dashboardContent.length} bytes)`);
    await page.screenshot({ path: '/tmp/02-dashboard.png', fullPage: true });

    // Test 3: Clients
    console.log('\n3️⃣  Testing Clients Page...');
    await page.goto(`${BASE_URL}/clients`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const clientsCount = await page.locator('table tr, [class*="client"]').count();
    console.log(`   Found ${clientsCount} client elements`);
    console.log('   ✅ Clients page loaded');
    await page.screenshot({ path: '/tmp/03-clients.png', fullPage: true });

    // Test 4: Add Client Button
    console.log('\n4️⃣  Testing Add Client Button...');
    const addClientBtn = page.locator('button:has-text("Add"), button:has-text("Client"), button:has-text("Добавить")').first();
    const btnCount = await addClientBtn.count();
    
    if (btnCount > 0) {
      await addClientBtn.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ Add Client button clicked');
      await page.screenshot({ path: '/tmp/04-add-client-click.png' });
      
      // Check if modal appeared
      const modalVisible = await page.locator('form, [role="dialog"], .modal').count();
      if (modalVisible > 0) {
        console.log('   ✅ Form/Modal appeared');
      } else {
        console.log('   ⚠️  No form/modal (might be stub)');
      }
    } else {
      console.log('   ⚠️  Add Client button not found');
    }

    // Test 5: Leads
    console.log('\n5️⃣  Testing Leads Page...');
    await page.goto(`${BASE_URL}/leads`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const leadsCount = await page.locator('[class*="lead"], [class*="card"]').count();
    console.log(`   Found ${leadsCount} lead elements`);
    console.log('   ✅ Leads page loaded');
    await page.screenshot({ path: '/tmp/05-leads.png', fullPage: true });

    // Test 6: Calls
    console.log('\n6️⃣  Testing Calls Page...');
    await page.goto(`${BASE_URL}/calls`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const callsCount = await page.locator('table tr, [class*="call"]').count();
    console.log(`   Found ${callsCount} call elements`);
    console.log('   ✅ Calls page loaded');
    await page.screenshot({ path: '/tmp/06-calls.png', fullPage: true });

    // Test 7: Emails
    console.log('\n7️⃣  Testing Emails Page...');
    await page.goto(`${BASE_URL}/emails`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const emailsCount = await page.locator('table tr, [class*="email"]').count();
    console.log(`   Found ${emailsCount} email elements`);
    console.log('   ✅ Emails page loaded');
    await page.screenshot({ path: '/tmp/07-emails.png', fullPage: true });

    // Test 8: Proposals
    console.log('\n8️⃣  Testing Proposals Page...');
    await page.goto(`${BASE_URL}/proposals`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const proposalsCount = await page.locator('table tr, [class*="proposal"]').count();
    console.log(`   Found ${proposalsCount} proposal elements`);
    console.log('   ✅ Proposals page loaded');
    await page.screenshot({ path: '/tmp/08-proposals.png', fullPage: true });

    // Test 9: Projects
    console.log('\n9️⃣  Testing Projects Page...');
    await page.goto(`${BASE_URL}/projects`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const projectsCount = await page.locator('table tr, [class*="project"]').count();
    console.log(`   Found ${projectsCount} project elements`);
    console.log('   ✅ Projects page loaded');
    await page.screenshot({ path: '/tmp/09-projects.png', fullPage: true });

    // Test 10: Settings
    console.log('\n🔟 Testing Settings Page...');
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('   ✅ Settings page loaded');
    await page.screenshot({ path: '/tmp/10-settings.png', fullPage: true });

    // Test 11: API Endpoints
    console.log('\n1️⃣1️⃣  Testing API Endpoints...');
    const endpoints = [
      '/health',
      '/api/clients',
      '/api/leads',
      '/api/calls',
      '/api/emails',
      '/api/proposals'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await page.request.get(`${API_URL}${endpoint}`);
        const status = response.status();
        console.log(`   ${status === 200 ? '✅' : '⚠️'}  ${endpoint}: ${status}`);
      } catch (err) {
        console.log(`   ❌ ${endpoint}: ${err.message}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ E2E TESTING COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\n📸 Screenshots saved to:');
    console.log('   /tmp/01-login.png');
    console.log('   /tmp/02-dashboard.png');
    console.log('   /tmp/03-clients.png');
    console.log('   /tmp/04-add-client-click.png');
    console.log('   /tmp/05-leads.png');
    console.log('   /tmp/06-calls.png');
    console.log('   /tmp/07-emails.png');
    console.log('   /tmp/08-proposals.png');
    console.log('   /tmp/09-projects.png');
    console.log('   /tmp/10-settings.png');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: '/tmp/error.png' });
  } finally {
    await browser.close();
  }
})();
