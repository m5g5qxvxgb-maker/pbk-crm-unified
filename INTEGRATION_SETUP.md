# PBK CRM - Unified Integration System

## 📋 Обзор

Создана единая система интеграций для PBK CRM, объединяющая все внешние сервисы:
- **Fixly.pl** - автоматические заявки на ремонт
- **Offerteo.pl** - строительные тендеры
- **Retell AI** - голосовые звонки через AI
- **Telegram Bot** - уведомления и управление

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────────────────┐
│              Unified Integration Manager                │
│            (Docker: pbk-integrations)                   │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │ Telegram │  │  Fixly   │  │ Offerteo │  │ Retell  ││
│  │   Bot    │  │ Webhook  │  │ Webhook  │  │   AI    ││
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘│
│       │             │              │             │     │
│       └─────────────┴──────────────┴─────────────┘     │
│                          │                             │
└──────────────────────────┼─────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  PBK CRM    │
                    │  Backend    │
                    │  (REST API) │
                    └─────────────┘
                           │
                    ┌──────▼──────┐
                    │ PostgreSQL  │
                    │  Database   │
                    └─────────────┘
```

## 📁 Структура файлов

### Новые файлы

```
/root/pbk-crm-unified/
├── backend/src/
│   ├── integrations/
│   │   └── unified-integration-manager.js  # Главный менеджер интеграций
│   └── api/
│       └── webhooks.js                     # Обновлен - webhook endpoints
├── docker/
│   └── Dockerfile.integrations             # Docker image для интеграций
└── docker-compose.server.yml               # Обновлен - добавлен integrations service
```

### Обновленные файлы

- `/backend/src/api/webhooks.js` - добавлены endpoints для Fixly и Offerteo
- `/docker-compose.server.yml` - заменен telegram-bot на integrations

## 🔧 Компоненты

### 1. Unified Integration Manager

**Файл:** `/backend/src/integrations/unified-integration-manager.js`

**Функции:**
- Telegram Bot с меню управления
- Обработка callback queries
- Уведомления о новых заявках (Fixly, Offerteo)
- Интеграция с Retell AI
- Статистика и отчеты

**Команды Telegram:**
- `/start` - Главное меню
- `/help` - Справка
- `/ping` - Проверка связи
- `/id` - Получить Chat ID
- `/leads` - Список новых лидов
- `/stats` - Статистика CRM

**Меню:**
- 📞 CRM - Управление (лиды, звонки, статистика)
- 🏗️ Fixly - Заявки (ожидающие, принятые)
- 🏗️ Offerteo - Тендеры (новые, активные)
- 🤖 Retell - AI Звонки (создать, история)

### 2. Webhook Endpoints

**Файл:** `/backend/src/api/webhooks.js`

**Endpoints:**

```
POST /api/webhooks/fixly
```
Принимает заявки от Fixly bot:
- Создает лида в CRM
- Отправляет уведомление в Telegram
- Возвращает leadId

```
POST /api/webhooks/offerteo
```
Принимает тендеры от Offerteo bot:
- Создает лида в CRM  
- Отправляет уведомление в Telegram
- Возвращает leadId

```
POST /api/webhooks/retell
```
Принимает события от Retell AI:
- Обновляет статус звонка
- Сохраняет транскрипт и запись

```
GET /api/webhooks/test
```
Тестовый endpoint для проверки

## 🐳 Docker Setup

### Сборка образа

```bash
cd /root/pbk-crm-unified
docker build -f docker/Dockerfile.integrations -t pbk-integrations:latest .
```

### Запуск контейнера

```bash
docker-compose -f docker-compose.server.yml up -d integrations
```

### Проверка логов

```bash
docker logs pbk-integrations --tail 50 -f
```

### Переменные окружения

```env
NODE_ENV=production
TELEGRAM_BOT_TOKEN=8003573668:AAHHs6GUJx-pUEL-fxe_lwVJCRutftrCZ30
TELEGRAM_OWNER_CHAT_ID=443876287
TELEGRAM_APPROVAL_GROUP=-5088238645
CRM_API_URL=http://backend:5002/api
BASE_URL=https://appp2p-01.tail96f20b.ts.net
RETELL_API_KEY=<your_key>
RETELL_AGENT_ID=<your_agent_id>
RETELL_PHONE_NUMBER=<your_number>
OFFERTEO_API_KEY=<your_key>
```

## 🔗 Интеграции

### Fixly.pl

**Bot location:** `/opt/fixly-automation/`
**Service:** `fixly-bot.service` (systemd)

**Настройка webhook:**

В Fixly bot добавить отправку данных в CRM:

```javascript
// В /opt/fixly-automation/scripts/fixly-bot.js
// После создания сделки отправить в CRM:

const webhookUrl = 'http://localhost:5002/api/webhooks/fixly';
const leadData = {
  fixlyId: orderId,
  title: orderTitle,
  customerName: customerName,
  phone: phoneNumber,
  email: email,
  description: description,
  district: district,
  budget: budget
};

await axios.post(webhookUrl, leadData);
```

### Offerteo.pl

**Bot location:** `/root/offerteo-bot/`
**Main file:** `offerteo-hybrid-bot.js`

**Настройка webhook:**

```javascript
// В /root/offerteo-bot/offerteo-hybrid-bot.js
// После получения новой заявки:

const webhookUrl = 'http://localhost:5002/api/webhooks/offerteo';
const leadData = {
  rfpId: rfp.id,
  title: rfp.title,
  description: rfp.description,
  categoryName: rfp.categoryName,
  locationName: rfp.locationName,
  budget: rfp.budget,
  deadline: rfp.deadline
};

await axios.post(webhookUrl, leadData);
```

### Retell AI

**API endpoints:** `/api/retell/*`

**Использование:**

```javascript
// Создать звонок
POST /api/retell/call
{
  "lead_id": "uuid",
  "phone_number": "+48123456789",
  "ai_instructions": "Узнать бюджет и район"
}

// Получить статус
GET /api/retell/call/:call_id

// Список звонков
GET /api/retell/calls
```

## ⚠️ Известные проблемы

### Telegram Bot - 409 Conflict Error

**Проблема:** Несколько ботов пытаются использовать один токен одновременно.

**Причина:**
- На сервере запущено множество Telegram ботов с одинаковым токеном
- Systemd сервисы автоматически перезапускают ботов

**Отключенные сервисы:**
- `fixly-bot.service` - остановлен
- `pumpmaster-bot.service` - остановлен и отключен
- `p2p-subscription-bot.service` - остановлен и отключен  
- `twa-bot.service` - остановлен и отключен
- `voiceover-bot.service` - остановлен и отключен

**Решение 1: Подождать**
Telegram API может удерживать соединение до 2 минут после остановки бота.

```bash
# Остановить все telegram боты
systemctl stop fixly-bot pumpmaster-bot p2p-subscription-bot twa-bot voiceover-bot

# Подождать 2 минуты
sleep 120

# Перезапустить integrations
docker restart pbk-integrations
```

**Решение 2: Использовать webhook вместо polling**

Изменить в `unified-integration-manager.js`:

```javascript
// Вместо polling
const bot = new TelegramBot(CONFIG.telegram.token, { polling: true });

// Использовать webhook
const bot = new TelegramBot(CONFIG.telegram.token, { webHook: true });
bot.setWebHook(`${CONFIG.crm.baseUrl}/telegram-webhook/${CONFIG.telegram.token}`);
```

**Решение 3: Создать отдельный токен**

Создать нового бота через @BotFather специально для PBK CRM.

## 📊 Мониторинг

### Проверка статуса контейнеров

```bash
docker ps --filter "name=pbk" --format "table {{.Names}}\t{{.Status}}"
```

### Проверка логов

```bash
# Integration Manager
docker logs pbk-integrations --tail 100 -f

# Backend
docker logs pbk-backend --tail 100 -f

# Database
docker logs pbk-postgres --tail 100
```

### Проверка Telegram Bot

```bash
# Проверить webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo" | jq .

# Отправить тестовое сообщение
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -d "chat_id=443876287" \
  -d "text=Test"
```

### Проверка webhook endpoints

```bash
# Test endpoint
curl http://localhost:5002/api/webhooks/test | jq .

# Test Fixly webhook
curl -X POST http://localhost:5002/api/webhooks/fixly \
  -H "Content-Type: application/json" \
  -d '{
    "fixlyId": "test123",
    "title": "Test order",
    "customerName": "Test Customer",
    "phone": "+48123456789"
  }' | jq .
```

## 🚀 Запуск в продакшн

### 1. Остановить все конфликтующие боты

```bash
systemctl stop fixly-bot pumpmaster-bot p2p-subscription-bot twa-bot voiceover-bot
systemctl disable pumpmaster-bot p2p-subscription-bot twa-bot voiceover-bot
pkill -9 -f telegram
pkill -9 -f bot.py
```

### 2. Подождать освобождения Telegram API

```bash
sleep 120
```

### 3. Запустить Unified Integration Manager

```bash
cd /root/pbk-crm-unified
docker-compose -f docker-compose.server.yml up -d integrations
```

### 4. Проверить логи

```bash
docker logs pbk-integrations --tail 50 -f
```

### 5. Отправить тестовое сообщение

Отправить `/start` боту @Pbkauto_bot в Telegram

### 6. Настроить Fixly bot

Обновить Fixly bot для отправки webhook в CRM после создания сделки.

### 7. Настроить Offerteo bot

Запустить Offerteo bot с отправкой webhook в CRM.

### 8. Запустить Fixly bot

```bash
systemctl start fixly-bot
```

## 📝 TODO

- [ ] Решить проблему 409 Conflict с Telegram Bot
- [ ] Настроить webhook от Fixly bot к CRM
- [ ] Настроить webhook от Offerteo bot к CRM
- [ ] Протестировать Retell AI интеграцию
- [ ] Добавить обработку ошибок и retry logic
- [ ] Настроить мониторинг и алерты
- [ ] Создать dashboard для статистики интеграций

## 🆘 Поддержка

При проблемах:

1. Проверить логи контейнеров
2. Проверить статус Telegram Bot через API
3. Убедиться, что нет конфликтующих процессов
4. Проверить переменные окружения

---

**Дата создания:** 2026-01-06  
**Версия:** 1.0  
**Автор:** OpenCode AI Assistant
