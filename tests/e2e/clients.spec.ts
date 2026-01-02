import { test, expect } from '@playwright/test';

test.describe('PBK CRM - Clients Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@pbkconstruction.net');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.click('a:has-text("Clients")');
  });

  test('should display clients list', async ({ page }) => {
    await expect(page.locator('text=Total Clients')).toBeVisible();
    await expect(page.locator('button:has-text("New Client")')).toBeVisible();
  });

  test('should create new client', async ({ page }) => {
    await page.click('button:has-text("New Client")');
    
    await page.fill('input[name="company_name"]', 'Test Company');
    await page.fill('input[name="contact_person"]', 'John Doe');
    await page.fill('input[name="email"]', 'test@company.com');
    await page.fill('input[name="phone"]', '+1234567890');
    
    await page.click('button:has-text("Create")');
    
    await expect(page.locator('text=Test Company')).toBeVisible();
  });

  test('should search clients', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'test');
    await page.waitForTimeout(500);
  });

  test('should view client details', async ({ page }) => {
    const firstClient = page.locator('[class*="cursor-pointer"]').first();
    if (await firstClient.isVisible()) {
      await firstClient.click();
      await expect(page.locator('button:has-text("Edit")')).toBeVisible();
    }
  });
});
