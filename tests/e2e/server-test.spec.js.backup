const { test, expect } = require('@playwright/test');

// Для запуска на сервере - используем localhost
const BASE_URL = 'http://localhost:3010';
const API_URL = 'http://localhost:5002';

const TEST_USER = {
  email: 'admin@pbkconstruction.net',
  password: 'admin123'
};

test.describe('PBK CRM - Полное тестирование на сервере', () => {
  
  test.describe('1. Аутентификация', () => {
    
    test('1.1. Страница логина загружается', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page).toHaveTitle(/PBK CRM/);
      console.log('✅ Страница логина загрузилась');
    });

    test('1.2. Успешный логин и редирект', async ({ page }) => {
      await page.goto(BASE_URL);
      
      await page.locator('input[type="email"]').fill(TEST_USER.email);
      await page.locator('input[type="password"]').fill(TEST_USER.password);
      await page.locator('button[type="submit"]').first().click();
      
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await expect(page).toHaveURL(/dashboard/);
      console.log('✅ Успешный логин и редирект на дашборд');
    });
  });

  test.describe('2. Дашборд', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('input[type="email"]').fill(TEST_USER.email);
      await page.locator('input[type="password"]').fill(TEST_USER.password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    test('2.1. Дашборд отображается', async ({ page }) => {
      await expect(page.locator('h1, h2').first()).toBeVisible();
      console.log('✅ Дашборд отображается');
    });

    test('2.2. Навигационное меню видно', async ({ page }) => {
      const nav = page.locator('nav, aside, [role="navigation"]').first();
      await expect(nav).toBeVisible();
      console.log('✅ Навигация видна');
    });
  });

  test.describe('3. Модуль Лидов', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('input[type="email"]').fill(TEST_USER.email);
      await page.locator('input[type="password"]').fill(TEST_USER.password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    test('3.1. Переход на страницу лидов', async ({ page }) => {
      const leadsLink = page.locator('a[href*="leads"], a').filter({ hasText: /лиды|leads/i }).first();
      if (await leadsLink.count() > 0) {
        await leadsLink.click();
        await page.waitForURL('**/leads', { timeout: 5000 });
        await expect(page).toHaveURL(/leads/);
        console.log('✅ Страница лидов открылась');
      }
    });

    test('3.2. Таблица/список лидов видна', async ({ page }) => {
      await page.goto(`${BASE_URL}/leads`);
      await page.waitForTimeout(2000);
      
      const content = page.locator('main, [role="main"]').first();
      await expect(content).toBeVisible();
      console.log('✅ Контент лидов загружен');
    });
  });

  test.describe('4. Модуль Клиентов', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('input[type="email"]').fill(TEST_USER.email);
      await page.locator('input[type="password"]').fill(TEST_USER.password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    test('4.1. Переход на страницу клиентов', async ({ page }) => {
      const clientsLink = page.locator('a[href*="clients"], a').filter({ hasText: /клиенты|clients/i }).first();
      if (await clientsLink.count() > 0) {
        await clientsLink.click();
        await page.waitForURL('**/clients', { timeout: 5000 });
        console.log('✅ Страница клиентов открылась');
      }
    });
  });

  test.describe('5. Модуль Задач', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('input[type="email"]').fill(TEST_USER.email);
      await page.locator('input[type="password"]').fill(TEST_USER.password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    test('5.1. Переход на страницу задач', async ({ page }) => {
      const tasksLink = page.locator('a[href*="tasks"], a').filter({ hasText: /задачи|tasks/i }).first();
      if (await tasksLink.count() > 0) {
        await tasksLink.click();
        await page.waitForURL('**/tasks', { timeout: 5000 });
        console.log('✅ Страница задач открылась');
      }
    });
  });

  test.describe('6. Модуль Проектов', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('input[type="email"]').fill(TEST_USER.email);
      await page.locator('input[type="password"]').fill(TEST_USER.password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    test('6.1. Переход на страницу проектов', async ({ page }) => {
      const projectsLink = page.locator('a[href*="projects"], a').filter({ hasText: /проекты|projects/i }).first();
      if (await projectsLink.count() > 0) {
        await projectsLink.click();
        await page.waitForURL('**/projects', { timeout: 5000 });
        console.log('✅ Страница проектов открылась');
      }
    });
  });

  test.describe('7. API Эндпоинты', () => {
    
    test('7.1. Health check работает', async ({ request }) => {
      const response = await request.get(`${API_URL}/health`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.status).toBe('ok');
      console.log('✅ Health check работает');
    });

    test('7.2. Login API работает', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/auth/login`, {
        data: TEST_USER
      });
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.token).toBeTruthy();
      console.log('✅ Login API работает');
    });
  });

  test.describe('8. Производительность', () => {
    
    test('8.1. Скорость загрузки главной страницы', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(BASE_URL);
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000);
      console.log(`✅ Страница загрузилась за ${loadTime}ms`);
    });

    test('8.2. Отсутствие ошибок в консоли', async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      
      expect(errors.length).toBe(0);
      console.log('✅ Нет ошибок в консоли');
    });
  });

  test.describe('9. Адаптивность', () => {
    
    test('9.1. Мобильная версия (375x667)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      await expect(page).toHaveTitle(/PBK CRM/);
      console.log('✅ Мобильная версия работает');
    });

    test('9.2. Планшет (768x1024)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(BASE_URL);
      await expect(page).toHaveTitle(/PBK CRM/);
      console.log('✅ Планшетная версия работает');
    });

    test('9.3. Десктоп (1920x1080)', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(BASE_URL);
      await expect(page).toHaveTitle(/PBK CRM/);
      console.log('✅ Десктопная версия работает');
    });
  });
});
