import { test, expect } from '@playwright/test';

test.describe('PBK CRM - Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@pbkconstruction.net');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.click('a:has-text("Settings")');
  });

  test('should display settings tabs', async ({ page }) => {
    await expect(page.locator('text=Retell AI')).toBeVisible();
    await expect(page.locator('text=OpenAI')).toBeVisible();
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Telegram')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.click('button:has-text("OpenAI")');
    await expect(page.locator('input[name="openai_api_key"]')).toBeVisible();
    
    await page.click('button:has-text("Email")');
    await expect(page.locator('input[name="smtp_host"]')).toBeVisible();
    
    await page.click('button:has-text("Telegram")');
    await expect(page.locator('input[name="telegram_main_bot_token"]')).toBeVisible();
  });

  test('should save Retell AI settings', async ({ page }) => {
    await page.fill('input[name="retell_api_key"]', 'test_key_123');
    await page.fill('input[name="retell_agent_id"]', 'agent_123');
    
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);
  });
});
