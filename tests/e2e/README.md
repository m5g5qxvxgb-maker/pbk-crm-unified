# PBK CRM E2E Tests

## Запуск тестов

### 1. Визуальные тесты (Puppeteer)
```bash
NODE_PATH=/usr/lib/node_modules node tests/e2e/visual-test-crm-v2.js
```

### 2. API тесты (cURL)
```bash
./tests/e2e/test-crm.sh
```

## Требования

- Node.js v22+
- Puppeteer (установлен глобально)
- Frontend на http://localhost:3333
- Backend на http://localhost:5000

## Скриншоты

Сохраняются в `/tmp/`:
- 01-login-page.png
- 02-login-filled.png
- 03-dashboard.png
- ... (всего 12 файлов)

## Отчёты

См. `/root/CRM_E2E_TEST_REPORT.md` для полного отчёта.
