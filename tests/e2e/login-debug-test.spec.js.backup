const { test, expect } = require('@playwright/test');

test('Дебаг логина с консолью', async ({ page }) => {
  // Слушаем все события консоли
  page.on('console', msg => {
    const type = msg.type();
    console.log(`[CONSOLE ${type}]`, msg.text());
  });
  
  // Слушаем ошибки
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR]`, error.message);
  });
  
  // Слушаем сетевые запросы
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log(`[REQUEST]`, request.method(), request.url());
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      console.log(`[RESPONSE]`, response.status(), response.url());
      try {
        const body = await response.text();
        console.log(`[BODY]`, body.substring(0, 200));
      } catch(e) {}
    }
  });
  
  await page.goto('http://localhost:3010', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  await page.locator('input[type="email"]').fill('admin@pbkconstruction.net');
  await page.locator('input[type="password"]').fill('admin123');
  await page.locator('button[type="submit"]').first().click();
  
  await page.waitForTimeout(5000);
  
  console.log('Финальный URL:', page.url());
});
