const { test, expect } = require('@playwright/test');

test('Простой тест логина на сервере', async ({ page }) => {
  console.log('1. Переходим на главную...');
  await page.goto('http://localhost:3010', { waitUntil: 'networkidle' });
  
  console.log('2. Текущий URL:', page.url());
  
  // Ждем загрузки страницы
  await page.waitForTimeout(3000);
  
  console.log('3. Ищем поле email...');
  const emailField = page.locator('input[type="email"], input[name="email"]');
  const emailCount = await emailField.count();
  console.log('   Найдено полей email:', emailCount);
  
  if (emailCount > 0) {
    console.log('4. Заполняем email...');
    await emailField.first().fill('admin@pbkconstruction.net');
    
    console.log('5. Ищем поле password...');
    const passwordField = page.locator('input[type="password"]');
    await passwordField.first().fill('admin123');
    
    console.log('6. Ищем кнопку submit...');
    const submitButton = page.locator('button[type="submit"]');
    const buttonCount = await submitButton.count();
    console.log('   Найдено кнопок submit:', buttonCount);
    
    console.log('7. Кликаем кнопку...');
    await submitButton.first().click();
    
    console.log('8. Ждем ответа...');
    await page.waitForTimeout(5000);
    
    console.log('9. Финальный URL:', page.url());
  } else {
    console.log('❌ Поле email не найдено!');
    console.log('HTML содержит:', await page.content());
  }
});
