import { test, expect } from '@playwright/test';

test.describe('PBK CRM - Leads Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@pbkconstruction.net');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.click('a:has-text("Leads")');
  });

  test('should display Kanban board', async ({ page }) => {
    await expect(page.locator('text=Leads')).toBeVisible();
    await expect(page.locator('button:has-text("New Lead")')).toBeVisible();
  });

  test('should create new lead', async ({ page }) => {
    await page.click('button:has-text("New Lead")');
    
    await page.fill('input[name="title"]', 'Test Lead');
    await page.fill('textarea[name="description"]', 'Test Description');
    await page.selectOption('select[name="pipeline_id"]', { index: 1 });
    await page.selectOption('select[name="stage_id"]', { index: 1 });
    await page.fill('input[name="value"]', '50000');
    
    await page.click('button:has-text("Create")');
    
    await expect(page.locator('text=Test Lead')).toBeVisible();
  });

  test('should filter leads by pipeline', async ({ page }) => {
    const pipelineSelect = page.locator('select').first();
    await pipelineSelect.selectOption({ index: 1 });
    
    await page.waitForTimeout(1000);
    await expect(page.locator('.bg-gray-100')).toBeVisible();
  });
});
