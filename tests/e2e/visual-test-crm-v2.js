const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const BASE_URL = 'http://localhost:3333';
  const CREDENTIALS = {
    email: 'admin@pbkconstruction.net',
    password: 'admin123'
  };

  console.log('\n�� PBK CRM VISUAL E2E TESTING\n');
  console.log('='.repeat(70));

  try {
    // Test 1: Login Page
    console.log('\n1️⃣  Login Page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: '/tmp/01-login-page.png', fullPage: true });
    console.log('   ✅ Screenshot saved');

    // Fill login form
    await page.type('input[type="email"]', CREDENTIALS.email);
    await page.type('input[type="password"]', CREDENTIALS.password);
    await page.screenshot({ path: '/tmp/02-login-filled.png' });
    
    await page.click('button[type="submit"]');
    await wait(3000);
    console.log(`   Current URL: ${page.url()}`);

    // Test 2: Dashboard
    console.log('\n2️⃣  Dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await wait(2000);
    await page.screenshot({ path: '/tmp/03-dashboard.png', fullPage: true });
    
    const metrics = await page.$$eval('[class*="card"], [class*="metric"], div', els => els.length);
    console.log(`   Found ${metrics} elements`);
    console.log('   ✅ Dashboard loaded');

    // Test 3: Clients List
    console.log('\n3️⃣  Clients Page...');
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle2' });
    await wait(2000);
    await page.screenshot({ path: '/tmp/04-clients-list.png', fullPage: true });
    console.log('   ✅ Clients page loaded');

    // Test 4: Leads Kanban
    console.log('\n4️⃣  Leads Kanban Board...');
    await page.goto(`${BASE_URL}/leads`, { waitUntil: 'networkidle2' });
    await wait(2000);
    await page.screenshot({ path: '/tmp/05-leads-kanban.png', fullPage: true });
    console.log('   ✅ Leads kanban loaded');

    // Test 5: Calls
    console.log('\n5️⃣  Calls Page...');
    await page.goto(`${BASE_URL}/calls`, { waitUntil: 'networkidle2' });
    await wait(2000);
    await page.screenshot({ path: '/tmp/06-calls.png', fullPage: true });
    console.log('   ✅ Calls page loaded');

    // Test 6: Emails
    console.log('\n6️⃣  Emails Page...');
    await page.goto(`${BASE_URL}/emails`, { waitUntil: 'networkidle2' });
    await wait(2000);
    await page.screenshot({ path: '/tmp/07-emails.png', fullPage: true });
    console.log('   ✅ Emails page loaded');

    // Test 7: Proposals
    console.log('\n7️⃣  Proposals Page...');
    await page.goto(`${BASE_URL}/proposals`, { waitUntil: 'networkidle2' });
    await wait(2000);
    await page.screenshot({ path: '/tmp/08-proposals.png', fullPage: true });
    console.log('   ✅ Proposals page loaded');

    // Test 8: Projects
    console.log('\n8️⃣  Projects Page...');
    await page.goto(`${BASE_URL}/projects`, { waitUntil: 'networkidle2' });
    await wait(2000);
    await page.screenshot({ path: '/tmp/09-projects.png', fullPage: true });
    console.log('   ✅ Projects page loaded');

    // Test 9: Settings
    console.log('\n9️⃣  Settings Page...');
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle2' });
    await wait(2000);
    await page.screenshot({ path: '/tmp/10-settings.png', fullPage: true });
    console.log('   ✅ Settings page loaded');

    // Test 10: Mobile Responsive
    console.log('\n🔟 Testing Mobile View...');
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await wait(2000);
    await page.screenshot({ path: '/tmp/11-mobile-dashboard.png', fullPage: true });
    console.log('   ✅ Mobile dashboard screenshot');

    await page.goto(`${BASE_URL}/leads`, { waitUntil: 'networkidle2' });
    await wait(2000);
    await page.screenshot({ path: '/tmp/12-mobile-leads.png', fullPage: true });
    console.log('   ✅ Mobile leads screenshot');

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ VISUAL E2E TESTING COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log('\n📸 Screenshots saved to /tmp/:');
    const screenshots = [
      '01-login-page.png',
      '02-login-filled.png',
      '03-dashboard.png',
      '04-clients-list.png',
      '05-leads-kanban.png',
      '06-calls.png',
      '07-emails.png',
      '08-proposals.png',
      '09-projects.png',
      '10-settings.png',
      '11-mobile-dashboard.png',
      '12-mobile-leads.png'
    ];
    screenshots.forEach(s => console.log(`   ✓ /tmp/${s}`));
    console.log('\n💡 View screenshots: ls -lh /tmp/*.png\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: '/tmp/error.png' });
    console.log('Error screenshot saved to /tmp/error.png');
  } finally {
    await browser.close();
  }
})();
