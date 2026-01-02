import { test, expect } from '@playwright/test';

test.describe('PBK CRM - Calls Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@pbkconstruction.net');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.click('a:has-text("Calls")');
  });

  test('should display calls page', async ({ page }) => {
    await expect(page.locator('text=Total Calls')).toBeVisible();
    await expect(page.locator('button:has-text("Create Call Request")')).toBeVisible();
  });

  test('should create call request', async ({ page }) => {
    await page.click('button:has-text("Create Call Request")');
    
    await page.fill('input[name="phone_number"]', '+1234567890');
    await page.fill('textarea[name="notes"]', 'Test call request');
    
    await page.click('button:has-text("Create Request")');
    
    await page.waitForTimeout(1000);
    await expect(page.locator('text=+1234567890')).toBeVisible();
  });

  test('should filter calls by status', async ({ page }) => {
    await page.click('button:has-text("Pending")');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Completed")');
    await page.waitForTimeout(500);
  });

  test('should refresh calls list', async ({ page }) => {
    await page.click('button:has-text("Refresh")');
    await page.waitForTimeout(1000);
  });
});
