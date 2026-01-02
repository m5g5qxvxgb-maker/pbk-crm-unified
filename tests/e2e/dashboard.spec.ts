import { test, expect } from '@playwright/test';

test.describe('PBK CRM - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@pbkconstruction.net');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display dashboard metrics', async ({ page }) => {
    await expect(page.locator('text=Total Leads')).toBeVisible();
    await expect(page.locator('text=Active Calls')).toBeVisible();
    await expect(page.locator('text=Total Clients')).toBeVisible();
  });

  test('should navigate to other pages', async ({ page }) => {
    await page.click('a:has-text("Leads")');
    await expect(page).toHaveURL('/leads');
    
    await page.click('a:has-text("Clients")');
    await expect(page).toHaveURL('/clients');
    
    await page.click('a:has-text("Calls")');
    await expect(page).toHaveURL('/calls');
    
    await page.click('a:has-text("Settings")');
    await expect(page).toHaveURL('/settings');
  });
});
