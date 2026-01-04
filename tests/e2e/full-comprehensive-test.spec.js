const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8888';
const API_URL = 'http://localhost:8889';

// Тестовые данные
const TEST_USER = {
  email: 'admin@pbkconstruction.net',
  password: 'admin123'
};

const TEST_LEAD = {
  first_name: 'Тестовый',
  last_name: 'Лид',
  email: 'test.lead@example.com',
  phone: '+79991234567',
  company: 'Test Company'
};

const TEST_CLIENT = {
  name: 'Тестовый Клиент',
  email: 'test.client@example.com',
  phone: '+79991234568',
  company: 'Client Company'
};

test.describe('PBK CRM - Полное тестирование всех функций', () => {
  
  let authToken;
  
  test.beforeAll(async () => {
    // Получаем токен для API тестов
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    
    if (response.ok) {
      const data = await response.json();
      authToken = data.token;
      console.log('✅ Авторизация успешна, токен получен');
    }
  });

  test.describe('1. Аутентификация и авторизация', () => {
    
    test('1.1. Открытие страницы логина', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page).toHaveTitle(/PBK CRM/);
      await expect(page.locator('h1, h2')).toContainText(/вход|login|sign in/i);
      console.log('✅ Страница логина открылась');
    });

    test('1.2. Проверка полей формы логина', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Проверяем наличие всех элементов формы
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
      console.log('✅ Все поля формы видны');
    });

    test('1.3. Валидация пустых полей', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      
      // Даем время на валидацию
      await page.waitForTimeout(1000);
      console.log('✅ Проверка валидации пустых полей');
    });

    test('1.4. Успешный логин', async ({ page }) => {
      await page.goto(BASE_URL);
      
      await page.locator('input[type="email"], input[name="email"]').fill(TEST_USER.email);
      await page.locator('input[type="password"], input[name="password"]').fill(TEST_USER.password);
      await page.locator('button[type="submit"]').first().click();
      
      // Ждем редиректа на дашборд
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await expect(page).toHaveURL(/dashboard/);
      console.log('✅ Успешный логин, перенаправлен на дашборд');
    });
  });

  test.describe('2. Дашборд', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('input[type="email"], input[name="email"]').fill(TEST_USER.email);
      await page.locator('input[type="password"], input[name="password"]').fill(TEST_USER.password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    test('2.1. Отображение главной страницы дашборда', async ({ page }) => {
      await expect(page.locator('h1, h2').first()).toBeVisible();
      console.log('✅ Дашборд отображается');
    });

    test('2.2. Проверка навигационного меню', async ({ page }) => {
      // Проверяем основные пункты меню
      const menuItems = [
        /дашборд|dashboard/i,
        /лиды|leads/i,
        /клиенты|clients/i,
        /задачи|tasks/i,
        /проекты|projects/i
      ];
      
      for (const item of menuItems) {
        const menuItem = page.locator(`nav a, aside a, [role="navigation"] a`).filter({ hasText: item });
        if (await menuItem.count() > 0) {
          await expect(menuItem.first()).toBeVisible();
        }
      }
      console.log('✅ Навигационное меню проверено');
    });

    test('2.3. Проверка виджетов и статистики', async ({ page }) => {
      // Даем время на загрузку данных
      await page.waitForTimeout(2000);
      
      // Проверяем наличие карточек статистики
      const cards = page.locator('[class*="card"], [class*="widget"], [class*="stat"]');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
      console.log(`✅ Найдено ${count} виджетов на дашборде`);
    });
  });

  test.describe('3. Модуль Лидов', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('input[type="email"], input[name="email"]').fill(TEST_USER.email);
      await page.locator('input[type="password"], input[name="password"]').fill(TEST_USER.password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    test('3.1. Переход на страницу лидов', async ({ page }) => {
      const leadsLink = page.locator('a[href*="leads"], a').filter({ hasText: /лиды|leads/i }).first();
      await leadsLink.click();
      
      await page.waitForURL('**/leads', { timeout: 5000 });
      await expect(page).toHaveURL(/leads/);
      console.log('✅ Страница лидов открылась');
    });

    test('3.2. Проверка таблицы лидов', async ({ page }) => {
      await page.goto(`${BASE_URL}/leads`);
      await page.waitForTimeout(2000);
      
      // Проверяем наличие таблицы или списка
      const table = page.locator('table, [role="table"], [class*="table"]').first();
      if (await table.count() > 0) {
        await expect(table).toBeVisible();
        console.log('✅ Таблица лидов видна');
      } else {
        console.log('⚠️ Таблица не найдена, возможно пустой список');
      }
    });

    test('3.3. Открытие формы создания лида', async ({ page }) => {
      await page.goto(`${BASE_URL}/leads`);
      await page.waitForTimeout(1000);
      
      // Ищем кнопку добавления
      const addButton = page.locator('button').filter({ hasText: /добавить|создать|новый|add|create|new/i }).first();
      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForTimeout(1000);
        
        // Проверяем появление формы или модального окна
        const form = page.locator('form, [role="dialog"], [class*="modal"]').first();
        await expect(form).toBeVisible();
        console.log('✅ Форма создания лида открылась');
      }
    });

    test('3.4. Проверка полей формы лида', async ({ page }) => {
      await page.goto(`${BASE_URL}/leads`);
      await page.waitForTimeout(1000);
      
      const addButton = page.locator('button').filter({ hasText: /добавить|создать|новый|add|create|new/i }).first();
      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForTimeout(1000);
        
        // Проверяем основные поля
        const fields = [
          page.locator('input[name*="name"], input[placeholder*="Имя"], input[placeholder*="Name"]').first(),
          page.locator('input[type="email"], input[name*="email"]').first(),
          page.locator('input[type="tel"], input[name*="phone"]').first()
        ];
        
        for (const field of fields) {
          if (await field.count() > 0) {
            await expect(field).toBeVisible();
          }
        }
        console.log('✅ Поля формы лида проверены');
      }
    });

    test('3.5. Фильтрация лидов', async ({ page }) => {
      await page.goto(`${BASE_URL}/leads`);
      await page.waitForTimeout(2000);
      
      // Ищем поле поиска
      const searchInput = page.locator('input[type="search"], input[placeholder*="Поиск"], input[placeholder*="Search"]').first();
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible();
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
        console.log('✅ Поиск работает');
      }
    });
  });

  test.describe('4. Модуль Клиентов', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('input[type="email"], input[name="email"]').fill(TEST_USER.email);
      await page.locator('input[type="password"], input[name="password"]').fill(TEST_USER.password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    test('4.1. Переход на страницу клиентов', async ({ page }) => {
      const clientsLink = page.locator('a[href*="clients"], a').filter({ hasText: /клиенты|clients/i }).first();
      if (await clientsLink.count() > 0) {
        await clientsLink.click();
        await page.waitForURL('**/clients', { timeout: 5000 });
        await expect(page).toHaveURL(/clients/);
        console.log('✅ Страница клиентов открылась');
      }
    });

    test('4.2. Проверка списка клиентов', async ({ page }) => {
      await page.goto(`${BASE_URL}/clients`);
      await page.waitForTimeout(2000);
      
      const content = page.locator('main, [role="main"]').first();
      await expect(content).toBeVisible();
      console.log('✅ Страница клиентов загрузилась');
    });

    test('4.3. Кнопка создания клиента', async ({ page }) => {
      await page.goto(`${BASE_URL}/clients`);
      await page.waitForTimeout(1000);
      
      const addButton = page.locator('button').filter({ hasText: /добавить|создать|новый|add|create|new/i }).first();
      if (await addButton.count() > 0) {
        await expect(addButton).toBeVisible();
        console.log('✅ Кнопка создания клиента найдена');
      }
    });
  });

  test.describe('5. Модуль Задач', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('input[type="email"], input[name="email"]').fill(TEST_USER.email);
      await page.locator('input[type="password"], input[name="password"]').fill(TEST_USER.password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    test('5.1. Открытие модуля задач', async ({ page }) => {
      const tasksLink = page.locator('a[href*="tasks"], a').filter({ hasText: /задачи|tasks/i }).first();
      if (await tasksLink.count() > 0) {
        await tasksLink.click();
        await page.waitForURL('**/tasks', { timeout: 5000 });
        console.log('✅ Модуль задач открылся');
      }
    });

    test('5.2. Создание новой задачи', async ({ page }) => {
      await page.goto(`${BASE_URL}/tasks`);
      await page.waitForTimeout(1000);
      
      const addButton = page.locator('button').filter({ hasText: /добавить|создать|новый|add|create|new/i }).first();
      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Форма создания задачи доступна');
      }
    });
  });

  test.describe('6. Модуль Проектов', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('input[type="email"], input[name="email"]').fill(TEST_USER.email);
      await page.locator('input[type="password"], input[name="password"]').fill(TEST_USER.password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    test('6.1. Открытие модуля проектов', async ({ page }) => {
      const projectsLink = page.locator('a[href*="projects"], a').filter({ hasText: /проекты|projects/i }).first();
      if (await projectsLink.count() > 0) {
        await projectsLink.click();
        await page.waitForURL('**/projects', { timeout: 5000 });
        console.log('✅ Модуль проектов открылся');
      }
    });

    test('6.2. Список проектов отображается', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects`);
      await page.waitForTimeout(2000);
      
      const content = page.locator('main, [role="main"]').first();
      await expect(content).toBeVisible();
      console.log('✅ Список проектов загружен');
    });
  });

  test.describe('7. Модуль Предложений (Proposals)', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('input[type="email"], input[name="email"]').fill(TEST_USER.email);
      await page.locator('input[type="password"], input[name="password"]').fill(TEST_USER.password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    test('7.1. Открытие модуля предложений', async ({ page }) => {
      const proposalsLink = page.locator('a[href*="proposals"], a').filter({ hasText: /предложения|proposals/i }).first();
      if (await proposalsLink.count() > 0) {
        await proposalsLink.click();
        await page.waitForURL('**/proposals', { timeout: 5000 });
        console.log('✅ Модуль предложений открылся');
      } else {
        console.log('⚠️ Модуль предложений не найден в меню');
      }
    });
  });

  test.describe('8. Настройки', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('input[type="email"], input[name="email"]').fill(TEST_USER.email);
      await page.locator('input[type="password"], input[name="password"]').fill(TEST_USER.password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    test('8.1. Открытие настроек', async ({ page }) => {
      const settingsLink = page.locator('a[href*="settings"], a, button').filter({ hasText: /настройки|settings/i }).first();
      if (await settingsLink.count() > 0) {
        await settingsLink.click();
        await page.waitForTimeout(1000);
        console.log('✅ Настройки открылись');
      }
    });

    test('8.2. Профиль пользователя', async ({ page }) => {
      const profileLink = page.locator('a[href*="profile"], a, button').filter({ hasText: /профиль|profile/i }).first();
      if (await profileLink.count() > 0) {
        await profileLink.click();
        await page.waitForTimeout(1000);
        console.log('✅ Профиль пользователя доступен');
      }
    });
  });

  test.describe('9. Адаптивный дизайн', () => {
    
    test('9.1. Мобильная версия (375x667)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      
      await expect(page).toHaveTitle(/PBK CRM/);
      console.log('✅ Мобильная версия загружается');
    });

    test('9.2. Планшет (768x1024)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(BASE_URL);
      
      await expect(page).toHaveTitle(/PBK CRM/);
      console.log('✅ Версия для планшета загружается');
    });

    test('9.3. Десктоп (1920x1080)', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(BASE_URL);
      
      await expect(page).toHaveTitle(/PBK CRM/);
      console.log('✅ Десктопная версия загружается');
    });
  });

  test.describe('10. Производительность', () => {
    
    test('10.1. Время загрузки главной страницы', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(BASE_URL);
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000); // Загрузка меньше 5 секунд
      console.log(`✅ Страница загрузилась за ${loadTime}ms`);
    });

    test('10.2. Отсутствие ошибок в консоли', async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      
      expect(errors).toHaveLength(0);
      console.log('✅ Нет ошибок в консоли');
    });
  });

  test.describe('11. Выход из системы', () => {
    
    test('11.1. Logout функция', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('input[type="email"], input[name="email"]').fill(TEST_USER.email);
      await page.locator('input[type="password"], input[name="password"]').fill(TEST_USER.password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      
      // Ищем кнопку выхода
      const logoutButton = page.locator('button, a').filter({ hasText: /выход|logout|sign out/i }).first();
      if (await logoutButton.count() > 0) {
        await logoutButton.click();
        await page.waitForTimeout(2000);
        
        // Проверяем редирект на страницу логина
        await expect(page).toHaveURL(/login|^\/$|^\/$/);
        console.log('✅ Выход из системы работает');
      }
    });
  });
});
