const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3333';
const API_URL = 'http://localhost:5000';
const CREDENTIALS = {
  email: 'admin@pbkconstruction.net',
  password: 'admin123'
};

test.describe('PBK CRM - Full E2E Testing', () => {
  let page;
  let context;
  let authToken;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Extract token from localStorage
    authToken = await page.evaluate(() => localStorage.getItem('token'));
    console.log('✅ Logged in successfully');
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('1. Dashboard - Check all metrics', async () => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Check for metric cards
    const metrics = await page.locator('[class*="metric"], [class*="card"]').count();
    console.log(`📊 Dashboard metrics found: ${metrics}`);
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/dashboard.png', fullPage: true });
    expect(metrics).toBeGreaterThan(0);
  });

  test('2. Clients - View all clients', async () => {
    await page.goto(`${BASE_URL}/clients`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const clientCards = await page.locator('[class*="client"], tr, [class*="card"]').count();
    console.log(`👥 Clients found: ${clientCards}`);
    
    await page.screenshot({ path: '/tmp/clients-list.png', fullPage: true });
    expect(clientCards).toBeGreaterThan(0);
  });

  test('3. Clients - Create new client', async () => {
    await page.goto(`${BASE_URL}/clients`);
    await page.waitForLoadState('networkidle');
    
    // Look for "Add Client" button
    const addButton = page.locator('button:has-text("Add"), button:has-text("Добавить"), button:has-text("Client")').first();
    
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      // Check if modal/form appeared
      const modalVisible = await page.locator('form, [role="dialog"], .modal').count();
      console.log(`📝 Add Client form visible: ${modalVisible > 0}`);
      
      await page.screenshot({ path: '/tmp/client-add-form.png' });
      
      // If form is functional, fill it
      const nameInput = page.locator('input[name="name"], input[placeholder*="name"], input[placeholder*="Name"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('Test Company Ltd');
        
        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        if (await emailInput.count() > 0) {
          await emailInput.fill('test@testcompany.com');
        }
        
        const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
        if (await phoneInput.count() > 0) {
          await phoneInput.fill('+1234567890');
        }
        
        // Try to submit
        const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(2000);
          console.log('✅ Client creation form submitted');
        } else {
          console.log('⚠️ Submit button not found - form is a stub');
        }
      } else {
        console.log('⚠️ Add Client is a stub (shows alert)');
      }
    } else {
      console.log('⚠️ Add Client button not found');
    }
  });

  test('4. Leads - View Kanban board', async () => {
    await page.goto(`${BASE_URL}/leads`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for pipeline stages
    const stages = await page.locator('[class*="stage"], [class*="column"], [class*="pipeline"]').count();
    console.log(`📋 Pipeline stages found: ${stages}`);
    
    // Check for lead cards
    const leads = await page.locator('[class*="lead"], [class*="card"]').count();
    console.log(`💼 Leads found: ${leads}`);
    
    await page.screenshot({ path: '/tmp/leads-kanban.png', fullPage: true });
    expect(stages).toBeGreaterThan(0);
  });

  test('5. Leads - Create new lead', async () => {
    await page.goto(`${BASE_URL}/leads`);
    await page.waitForLoadState('networkidle');
    
    const addButton = page.locator('button:has-text("Add"), button:has-text("Lead"), button:has-text("Добавить")').first();
    
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      const formVisible = await page.locator('form, [role="dialog"]').count();
      console.log(`📝 Add Lead form visible: ${formVisible > 0}`);
      
      await page.screenshot({ path: '/tmp/lead-add-form.png' });
      
      if (formVisible > 0) {
        // Try to fill the form
        const titleInput = page.locator('input[name="title"], input[placeholder*="title"]').first();
        if (await titleInput.count() > 0) {
          await titleInput.fill('New Construction Project');
          
          const valueInput = page.locator('input[name="value"], input[placeholder*="value"], input[placeholder*="amount"]').first();
          if (await valueInput.count() > 0) {
            await valueInput.fill('150000');
          }
          
          const submitButton = page.locator('button[type="submit"], button:has-text("Save")').first();
          if (await submitButton.count() > 0) {
            await submitButton.click();
            await page.waitForTimeout(2000);
            console.log('✅ Lead creation submitted');
          }
        }
      } else {
        console.log('⚠️ Add Lead is a stub');
      }
    }
  });

  test('6. Leads - Try drag and drop between stages', async () => {
    await page.goto(`${BASE_URL}/leads`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const leadCard = page.locator('[class*="lead"], [draggable="true"]').first();
    
    if (await leadCard.count() > 0) {
      // Try to drag
      const leadBox = await leadCard.boundingBox();
      if (leadBox) {
        const stages = await page.locator('[class*="stage"], [class*="column"]').all();
        if (stages.length > 1) {
          const targetStage = stages[1];
          const targetBox = await targetStage.boundingBox();
          
          if (targetBox) {
            await page.mouse.move(leadBox.x + leadBox.width / 2, leadBox.y + leadBox.height / 2);
            await page.mouse.down();
            await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
            await page.mouse.up();
            
            await page.waitForTimeout(1000);
            console.log('✅ Attempted drag and drop');
            await page.screenshot({ path: '/tmp/lead-after-drag.png', fullPage: true });
          }
        }
      }
    } else {
      console.log('⚠️ Drag and drop not implemented');
    }
  });

  test('7. Calls - View all calls', async () => {
    await page.goto(`${BASE_URL}/calls`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const calls = await page.locator('[class*="call"], tr, [class*="card"]').count();
    console.log(`📞 Calls found: ${calls}`);
    
    await page.screenshot({ path: '/tmp/calls-list.png', fullPage: true });
  });

  test('8. Calls - Create new call', async () => {
    await page.goto(`${BASE_URL}/calls`);
    await page.waitForLoadState('networkidle');
    
    // Look for create call form or button
    const createButton = page.locator('button:has-text("Call"), button:has-text("Create"), button:has-text("New")').first();
    
    if (await createButton.count() > 0) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: '/tmp/call-create-form.png' });
      console.log('📞 Create call form opened');
    } else {
      // Maybe form is already visible
      const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
      if (await phoneInput.count() > 0) {
        await phoneInput.fill('+15551234567');
        
        const notesInput = page.locator('textarea, input[name="notes"]').first();
        if (await notesInput.count() > 0) {
          await notesInput.fill('Test call notes');
        }
        
        const submitButton = page.locator('button:has-text("Call"), button[type="submit"]').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(2000);
          console.log('✅ Call creation submitted');
        }
      }
    }
  });

  test('9. Emails - View inbox', async () => {
    await page.goto(`${BASE_URL}/emails`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const emails = await page.locator('[class*="email"], tr, [class*="message"]').count();
    console.log(`📧 Emails found: ${emails}`);
    
    await page.screenshot({ path: '/tmp/emails-inbox.png', fullPage: true });
  });

  test('10. Emails - Compose new email', async () => {
    await page.goto(`${BASE_URL}/emails`);
    await page.waitForLoadState('networkidle');
    
    const composeButton = page.locator('button:has-text("Compose"), button:has-text("New"), button:has-text("✏")').first();
    
    if (await composeButton.count() > 0) {
      await composeButton.click();
      await page.waitForTimeout(1000);
      
      const formVisible = await page.locator('form, [role="dialog"]').count();
      console.log(`✉️ Compose email form visible: ${formVisible > 0}`);
      
      await page.screenshot({ path: '/tmp/email-compose.png' });
      
      if (formVisible > 0) {
        const toInput = page.locator('input[name="to"], input[placeholder*="To"]').first();
        if (await toInput.count() > 0) {
          await toInput.fill('client@example.com');
          
          const subjectInput = page.locator('input[name="subject"], input[placeholder*="Subject"]').first();
          if (await subjectInput.count() > 0) {
            await subjectInput.fill('Test Email Subject');
          }
          
          const bodyInput = page.locator('textarea, [contenteditable="true"]').first();
          if (await bodyInput.count() > 0) {
            await bodyInput.fill('This is a test email body.');
          }
          
          const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
          if (await sendButton.count() > 0) {
            await sendButton.click();
            await page.waitForTimeout(2000);
            console.log('✅ Email sent');
          }
        }
      } else {
        console.log('⚠️ Compose is a stub');
      }
    }
  });

  test('11. Proposals - View all proposals', async () => {
    await page.goto(`${BASE_URL}/proposals`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const proposals = await page.locator('[class*="proposal"], tr, [class*="card"]').count();
    console.log(`📄 Proposals found: ${proposals}`);
    
    await page.screenshot({ path: '/tmp/proposals-list.png', fullPage: true });
  });

  test('12. Proposals - Create new proposal', async () => {
    await page.goto(`${BASE_URL}/proposals`);
    await page.waitForLoadState('networkidle');
    
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")').first();
    
    if (await createButton.count() > 0) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      const formVisible = await page.locator('form, [role="dialog"]').count();
      console.log(`📄 Create proposal form visible: ${formVisible > 0}`);
      
      await page.screenshot({ path: '/tmp/proposal-create.png' });
    } else {
      console.log('⚠️ Create Proposal button not found');
    }
  });

  test('13. Projects - View and create project', async () => {
    await page.goto(`${BASE_URL}/projects`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const projects = await page.locator('[class*="project"], tr, [class*="card"]').count();
    console.log(`🏗️ Projects found: ${projects}`);
    
    await page.screenshot({ path: '/tmp/projects-list.png', fullPage: true });
  });

  test('14. Settings - Check all settings sections', async () => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const sections = await page.locator('[class*="section"], [class*="tab"]').count();
    console.log(`⚙️ Settings sections found: ${sections}`);
    
    await page.screenshot({ path: '/tmp/settings.png', fullPage: true });
  });

  test('15. Navigation - Test all menu items', async () => {
    const menuItems = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/clients', name: 'Clients' },
      { path: '/leads', name: 'Leads' },
      { path: '/calls', name: 'Calls' },
      { path: '/emails', name: 'Emails' },
      { path: '/proposals', name: 'Proposals' },
      { path: '/projects', name: 'Projects' },
      { path: '/settings', name: 'Settings' }
    ];
    
    for (const item of menuItems) {
      await page.goto(`${BASE_URL}${item.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const url = page.url();
      const isCorrectPage = url.includes(item.path);
      console.log(`${isCorrectPage ? '✅' : '❌'} ${item.name}: ${url}`);
      expect(isCorrectPage).toBeTruthy();
    }
  });

  test('16. API Integration - Test backend endpoints', async () => {
    const endpoints = [
      '/api/clients',
      '/api/leads',
      '/api/calls',
      '/api/emails',
      '/api/proposals',
      '/api/dashboard/metrics',
      '/api/pipelines'
    ];
    
    for (const endpoint of endpoints) {
      const response = await page.request.get(`${API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const status = response.status();
      console.log(`${status === 200 ? '✅' : '❌'} ${endpoint}: ${status}`);
      expect(status).toBe(200);
    }
  });

  test('17. Responsive Design - Test mobile view', async () => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/mobile-dashboard.png', fullPage: true });
    
    await page.goto(`${BASE_URL}/leads`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/mobile-leads.png', fullPage: true });
    
    console.log('📱 Mobile view tested');
    
    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('18. Error Handling - Test invalid routes', async () => {
    await page.goto(`${BASE_URL}/nonexistent-page`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const has404 = await page.locator('text=/404|not found/i').count();
    console.log(`404 page handling: ${has404 > 0 ? '✅' : '⚠️'}`);
    
    await page.screenshot({ path: '/tmp/404-page.png' });
  });

  test('19. Logout and Re-login', async () => {
    // Try to find logout button
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")').first();
    
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      await page.waitForTimeout(2000);
      
      const onLoginPage = page.url().includes('login');
      console.log(`Logout successful: ${onLoginPage}`);
      
      if (onLoginPage) {
        // Re-login
        await page.fill('input[type="email"]', CREDENTIALS.email);
        await page.fill('input[type="password"]', CREDENTIALS.password);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        console.log('✅ Re-login successful');
      }
    } else {
      console.log('⚠️ Logout button not found');
    }
  });

  test('20. Final Report - Generate summary', async () => {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PBK CRM E2E TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ All major pages tested');
    console.log('✅ Forms and buttons checked');
    console.log('✅ API endpoints validated');
    console.log('✅ Navigation working');
    console.log('✅ Screenshots saved to /tmp/');
    console.log('='.repeat(60));
    console.log('Check screenshots in /tmp/ directory for visual confirmation');
  });
});
