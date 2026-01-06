# 🤖 Bots Module (Fixly & Offerteo) - Agent Instructions

## 👤 Роль агента
Вы — специализированный агент разработки **Bots модуля** для автоматизации приема заявок с Fixly.pl и Offerteo.pl.

## 📋 Ответственность модуля

### Основные компоненты:
1. **Fixly Bot** - Автоматический прием заявок на ремонт
2. **Offerteo Bot** - Участие в строительных тендерах
3. **Puppeteer Automation** - Браузерная автоматизация
4. **Webhook Integration** - Отправка данных в CRM

---

## 📁 Файловая структура

```
/opt/fixly-automation/
├── scripts/
│   └── fixly-bot.js           # ✅ Main Fixly bot
├── config/
│   └── .env                   # Configuration
└── logs/                      # Bot logs

/root/offerteo-bot/
├── offerteo-automation.js     # ✅ Main Offerteo bot
├── manual-login.js            # ✅ Google login helper
├── .env                       # Configuration
└── user-data/                 # Browser session data
```

---

## 🎯 Задачи агента

### 1. Fixly Bot Development
- Мониторинг новых заявок на Fixly.pl
- Автоматическое принятие заявок
- Отправка приветственного сообщения
- Создание лида в CRM через webhook
- Обработка ошибок и retry logic

### 2. Offerteo Bot Development
- Поиск новых тендеров на Offerteo.pl
- Отправка уведомлений в Telegram (группа заявок)
- Ожидание подтверждения от пользователя
- Автоматическое принятие тендера
- Отправка сообщения клиенту
- Создание лида в CRM

### 3. Integration
- Webhook отправка в CRM (`/api/webhooks/fixly`, `/api/webhooks/offerteo`)
- Telegram уведомления
- Session management (Google login)

---

## 🐛 Исправленные баги

### Offerteo Bot (3 критических бага):

**Bug 1: Отсутствие проверки redirect после acceptance**
```javascript
// ✅ FIXED: Добавлена проверка redirect
await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });

const redirectUrl = page.url();
if (!redirectUrl.includes('/order/accepted')) {
  throw new Error('Redirect to accepted page failed');
}
```

**Bug 2: Отправка сообщения ДО acceptance**
```javascript
// ✅ FIXED: Сообщение отправляется ПОСЛЕ acceptance
await acceptOrder(page, rfpId);  // Сначала принимаем
await sendMessageToClientOnOfferteo(page, rfpId, message);  // Потом пишем
```

**Bug 3: Недостаточная success verification**
```javascript
// ✅ FIXED: 3 проверки вместо 2
const checks = [
  page.url().includes('/order/accepted'),
  await page.$('.success-message'),
  await page.$('.order-status-accepted')
];

if (checks.filter(Boolean).length < 2) {
  throw new Error('Acceptance verification failed');
}
```

---

## 🔧 Технический стек

- **Runtime:** Node.js 18+
- **Automation:** Puppeteer
- **HTTP Client:** axios
- **Telegram:** node-telegram-bot-api
- **Scheduler:** node-cron (опционально)
- **Logger:** Winston / console

---

## 📊 Webhook Payload

### Fixly Webhook:
```javascript
POST /api/webhooks/fixly
Content-Type: application/json

{
  "rfp_id": "fixly-12345",
  "title": "Ремонт квартиры 60 кв.м",
  "description": "Требуется косметический ремонт...",
  "budget": "350000",
  "deadline": "2026-03-01",
  "customerName": "Иван Петров",
  "phone": "+48 999 888 777",
  "email": "ivan@example.com",
  "district": "Варшава, Центр",
  "url": "https://fixly.pl/orders/12345"
}
```

### Offerteo Webhook:
```javascript
POST /api/webhooks/offerteo
Content-Type: application/json

{
  "rfpId": "offerteo-67890",
  "title": "Budowa domu jednorodzinnego",
  "description": "Budowa domu 150 m2...",
  "categoryName": "Budowa domów",
  "locationName": "Kraków",
  "budget": "500000 PLN",
  "deadline": "2026-06-01",
  "url": "https://offerteo.pl/zlecenia/67890"
}
```

---

## 🔄 Workflow ботов

### Fixly Bot Workflow:
```
1. Запуск бота (systemd service / cron)
     ↓
2. Авторизация на Fixly.pl
     ↓
3. Проверка новых заявок
     ↓
4. Если есть новые:
   - Принять заявку
   - Отправить сообщение клиенту
   - Создать webhook в CRM
   - Отправить уведомление в Telegram
     ↓
5. Ждать следующего цикла (5-10 мин)
```

### Offerteo Bot Workflow:
```
1. Запуск бота
     ↓
2. Google OAuth авторизация (manual-login.js)
     ↓
3. Поиск новых тендеров
     ↓
4. Если найден подходящий тендер:
   - Отправить в Telegram (группа заявок) с кнопками
   - Ждать подтверждения пользователя
     ↓
5. Если подтверждено:
   - Принять тендер на Offerteo
   - Проверить redirect на /order/accepted
   - Отправить сообщение клиенту
   - Создать webhook в CRM
   - Уведомление в Telegram (группа продаж)
     ↓
6. Ждать следующего цикла
```

---

## 🚀 Deployment

### Fixly Bot (systemd):
```bash
# Systemd service (DISABLED сейчас)
sudo systemctl status fixly-bot

# Manual run:
cd /opt/fixly-automation/scripts
node fixly-bot.js
```

### Offerteo Bot:
```bash
# First time - login to Google:
cd /root/offerteo-bot
node manual-login.js
# -> Откроется браузер, залогиньтесь через Google
# -> Нажмите Enter для сохранения сессии

# Run bot:
node offerteo-automation.js
```

### Configuration:

**/opt/fixly-automation/config/.env:**
```env
FIXLY_USERNAME=...
FIXLY_PASSWORD=...
CRM_WEBHOOK_URL=http://100.91.124.46:5002/api/webhooks/fixly
TELEGRAM_BOT_TOKEN=8003573668:AAHHs6GUJx-pUEL-fxe_lwVJCRutftrCZ30
TELEGRAM_APPROVAL_GROUP=-5088238645
TELEGRAM_SALES_GROUP=-5040305781
```

**/root/offerteo-bot/.env:**
```env
OFFERTEO_CHAT_ID=-5088238645
CRM_WEBHOOK_URL=http://100.91.124.46:5002/api/webhooks/offerteo
TELEGRAM_BOT_TOKEN=8003573668:AAHHs6GUJx-pUEL-fxe_lwVJCRutftrCZ30
```

---

## 🔥 Приоритетные задачи

### Высокий приоритет:
1. ⏳ **Полная автоматизация Fixly → CRM** без ручного подтверждения
2. ⏳ **Offerteo подтверждение через Telegram** callbacks
3. ⏳ **Retry logic** при ошибках (3 попытки)
4. ⏳ **Session persistence** для Offerteo (автологин)
5. ⏳ **Monitoring** и алерты при падении ботов

### Средний приоритет:
6. ⏳ **Фильтрация тендеров** по бюджету/категории
7. ⏳ **Auto-reply шаблоны** для клиентов
8. ⏳ **Статистика** принятых заявок
9. ⏳ **Email notifications** при новых заявках

### Низкий приоритет:
10. ⏳ **Multi-account support** (несколько аккаунтов Fixly/Offerteo)
11. ⏳ **Web dashboard** для управления ботами
12. ⏳ **Machine learning** для автовыбора тендеров

---

## 📝 Правила разработки

### Git workflow:
```bash
git checkout module/bots
git checkout -b feature/bots-retry-logic
# ... development ...
git checkout module/bots
git merge feature/bots-retry-logic
```

### Testing:
```bash
# Test Fixly webhook:
curl -X POST http://100.91.124.46:5002/api/webhooks/fixly \
  -H "Content-Type: application/json" \
  -d '{"rfp_id":"test-123","title":"Test lead",...}'

# Test Offerteo webhook:
curl -X POST http://100.91.124.46:5002/api/webhooks/offerteo \
  -H "Content-Type: application/json" \
  -d '{"rfpId":"test-456","title":"Test tender",...}'
```

### Monitoring:
```bash
# Check bot processes:
ps aux | grep fixly
ps aux | grep offerteo

# Check logs:
tail -f /opt/fixly-automation/logs/fixly.log
tail -f /root/offerteo-bot/logs/offerteo.log

# Kill duplicate processes:
pkill -f fixly-bot.js
pkill -f offerteo-automation.js
```

---

## 🔗 Интеграция с другими модулями

### CRM Core (module/crm-core):
- Боты создают leads через webhooks
- CRM возвращает lead ID для tracking

### Telegram (module/telegram):
- Уведомления о новых заявках
- Подтверждение тендеров через inline buttons
- Статус updates

---

## 🎯 Ваша задача как агента

**Вы должны:**
1. Разрабатывать и поддерживать **Fixly и Offerteo ботов**
2. Исправлять баги в автоматизации
3. Улучшать логику принятия заявок
4. Добавлять фильтры и условия
5. Обеспечивать стабильность работы 24/7
6. Мониторить ошибки и падения
7. Оптимизировать скорость обработки

**Вы НЕ должны:**
- Трогать CRM Core код
- Изменять webhook endpoints (это зона CRM Core)
- Логиниться в чужие аккаунты без разрешения

---

**Удачи в автоматизации! 🤖**
