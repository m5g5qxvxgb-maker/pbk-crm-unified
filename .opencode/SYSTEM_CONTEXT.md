# 📋 PBK CRM - Общий контекст системы

## 🏗️ Архитектура проекта

### Базовая информация
- **Проект:** PBK CRM Unified System
- **Компания:** PBK Construction (строительство и ремонт)
- **Локация:** Польша (Fixly.pl, Offerteo.pl)
- **Пользователь:** Yugen Ostrov (@yostrov)
- **Репозиторий:** `/root/pbk-crm-unified`

### Серверная инфраструктура
- **IP Tailscale:** 100.91.124.46
- **IP Public:** 212.105.131.15
- **Интернет:** Starlink (CGNAT - нет прямых входящих портов)
- **Frontend:** http://100.91.124.46:3010
- **Backend API:** http://100.91.124.46:5002
- **База данных:** PostgreSQL на 100.91.124.46:5432 (pbk_crm)

### Docker контейнеры
```
pbk-frontend       Port 3010  (Next.js + React)
pbk-backend        Port 5002  (Node.js + Express)
pbk-integrations   Polling    (Telegram bot + integrations)
pbk-postgres       Port 5432  (Orphaned - не используется)
```

---

## 🎯 Цель системы

Единая CRM система для автоматизации:
1. Приема заявок с Fixly.pl и Offerteo.pl
2. Управления лидами и клиентами
3. Звонков и задач через Telegram и Retell AI
4. Генерации коммерческих предложений через AI
5. Финансового учета (ERP)

---

## 📊 Модули системы

### 1️⃣ CRM Core (Ядро)
**Статус:** ✅ Работает  
**Компоненты:**
- Backend API (Node.js + Express)
- Frontend (Next.js + React)
- PostgreSQL база данных
- Управление: leads, clients, tasks, calls, pipeline

**Основные файлы:**
- `/root/pbk-crm-unified/backend/` - API
- `/root/pbk-crm-unified/frontend/` - React UI
- `/root/pbk-crm-unified/backend/src/database/` - БД схемы

**API endpoints:**
- `/api/leads` - Управление лидами
- `/api/clients` - Клиенты
- `/api/tasks` - Задачи
- `/api/calls` - Звонки
- `/api/pipelines` - Воронки продаж

---

### 2️⃣ Bots (Fixly & Offerteo)
**Статус:** ⚠️ Код исправлен, нужна интеграция  
**Компоненты:**
- Fixly bot - автоматический прием заявок на ремонт
- Offerteo bot - участие в строительных тендерах
- Puppeteer automation

**Основные файлы:**
- `/opt/fixly-automation/scripts/fixly-bot.js`
- `/root/offerteo-bot/offerteo-automation.js`
- `/root/offerteo-bot/manual-login.js`

**Webhooks:**
- `POST /api/webhooks/fixly` - создает лид из Fixly
- `POST /api/webhooks/offerteo` - создает лид из Offerteo

**Исправленные баги:**
1. Redirect check после acceptance
2. Message sending после acceptance
3. Success verification (3 проверки)

---

### 3️⃣ Telegram Bot
**Статус:** ✅ Работает  
**Компоненты:**
- Telegram bot @Pbkauto_bot
- Уведомления о новых лидах
- Интерактивные кнопки управления
- Callback handlers

**Основные файлы:**
- `/root/pbk-crm-unified/backend/src/integrations/unified-integration-manager.js`
- `/root/pbk-crm-unified/backend/src/utils/telegram-notifier.js`

**Конфигурация:**
```env
TELEGRAM_BOT_TOKEN=8003573668:AAHHs6GUJx-pUEL-fxe_lwVJCRutftrCZ30
TELEGRAM_OWNER_CHAT_ID=443876287
TELEGRAM_APPROVAL_GROUP=-5088238645  # Группа заявок
TELEGRAM_SALES_GROUP=-5040305781     # Группа продаж
```

**Функции:**
- Уведомления о новых лидах в группу продаж
- Кнопки: Звонок, Карточка, Передать, Заметка, Задача, Автозвонок
- Callback handlers для всех действий

---

### 4️⃣ Retell AI
**Статус:** ⚙️ API настроен, нужна интеграция  
**Компоненты:**
- Retell AI API для голосовых звонков
- Webhook обработка результатов
- Интеграция с лидами

**Основные файлы:**
- `/root/pbk-crm-unified/backend/src/api/retell.js`

**API endpoints:**
- `/api/retell/create-call` - Создать звонок
- `/api/retell/webhook` - Обработка результатов

---

### 5️⃣ AI Assistant
**Статус:** ✅ Работает  
**Компоненты:**
- OpenRouter API (Nvidia Nemotron)
- Endpoint для чата с AI
- Контекст CRM данных

**Основные файлы:**
- `/root/pbk-crm-unified/backend/src/routes/ai.js`

**Конфигурация:**
```env
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=nvidia/nemotron-nano-9b-v2:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

**API endpoint:**
- `POST /api/ai/copilot` - Чат с AI ассистентом

---

### 6️⃣ ERP
**Статус:** 🔮 Планируется  
**Компоненты:**
- Финансовый учет
- Управление заказами
- Склад и инвентарь
- Отчетность

---

### 7️⃣ Website
**Статус:** 🔮 Требует редизайна  
**Компоненты:**
- Публичный сайт компании
- Форма заявки
- Портфолио
- Контакты

---

### 8️⃣ Email Service
**Статус:** ⚠️ API есть, SMTP не настроен  
**Компоненты:**
- Отправка email через SMTP
- Email шаблоны
- IMAP получение писем
- Привязка к лидам

**Основные файлы:**
- `/root/pbk-crm-unified/backend/src/api/emails.js`

**Нужно настроить:**
```env
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

---

### 9️⃣ AI Proposals
**Статус:** ⚙️ БД готова, нужна логика  
**Компоненты:**
- Генерация коммерческих предложений
- AI анализ требований клиента
- PDF экспорт
- Шаблоны документов

**Основные файлы:**
- `/root/pbk-crm-unified/backend/src/api/proposals.js`

**Таблица БД:**
```sql
CREATE TABLE ai_proposals (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  title VARCHAR(500),
  content TEXT,
  status VARCHAR(50),
  created_at TIMESTAMP
);
```

---

## 🔄 Workflow системы

```
1. Fixly/Offerteo Bot находит новый тендер
         ↓
2. Бот отправляет уведомление в Telegram (группа заявок)
         ↓
3. Пользователь подтверждает тендер
         ↓
4. Бот принимает тендер на сайте
         ↓
5. Бот отправляет приветственное сообщение клиенту
         ↓
6. Бот создает Lead в CRM через webhook
         ↓
7. Backend отправляет уведомление в Telegram (группа продаж)
         ↓
8. Менеджер нажимает кнопку (Звонок/Задача/Назначить)
         ↓
9. Telegram bot обрабатывает callback
         ↓
10. CRM обновляется через API
```

---

## 📁 Структура базы данных

### Основные таблицы:
```sql
leads             -- Лиды/сделки
clients           -- Клиенты
users             -- Пользователи CRM
tasks             -- Задачи
calls             -- Звонки
call_requests     -- Запросы на звонки
pipelines         -- Воронки продаж
pipeline_stages   -- Этапы воронки
lead_messages     -- Сообщения от клиентов
ai_proposals      -- AI коммерческие предложения
email_messages    -- Email переписка
```

### Связи:
- `leads.client_id` → `clients.id`
- `leads.pipeline_id` → `pipelines.id`
- `leads.stage_id` → `pipeline_stages.id`
- `tasks.lead_id` → `leads.id`
- `calls.lead_id` → `leads.id`
- `ai_proposals.lead_id` → `leads.id`

---

## 🔐 Доступы

### База данных:
- Host: `100.91.124.46:5432`
- Database: `pbk_crm`
- Admin: `pbk_admin` / `pbk2024secure`
- App: `pbk_user` / `pbk_crm_password_2026`

### CRM пользователь:
- Email: `yugen_ostrov@me.com`
- Password: `CRYSTALPG123890!`

### Telegram:
- Bot: `@Pbkauto_bot`
- Token: `8003573668:AAHHs6GUJx-pUEL-fxe_lwVJCRutftrCZ30`
- Owner: `443876287`
- Группа заявок: `-5088238645`
- Группа продаж: `-5040305781`

---

## 🚀 Git структура

### Ветки:
```
master                  # Главная ветка
module/crm-core         # Ядро CRM
module/bots             # Fixly & Offerteo
module/telegram         # Telegram бот
module/retell-ai        # Retell AI звонки
module/ai-assistant     # AI ассистент
module/erp              # ERP система
module/website          # Веб-сайт
module/email            # Email сервис
module/ai-proposals     # AI предложения
```

---

## 📝 Важные файлы

### Конфигурация:
- `/root/pbk-crm-unified/.env` - Переменные окружения
- `/root/pbk-crm-unified/docker-compose.server.yml` - Docker конфигурация
- `/root/pbk-crm-unified/MODULES_STRUCTURE.md` - Структура модулей

### Боты:
- `/opt/fixly-automation/scripts/fixly-bot.js`
- `/root/offerteo-bot/offerteo-automation.js`

### Backend:
- `/root/pbk-crm-unified/backend/src/index.js` - Entry point
- `/root/pbk-crm-unified/backend/src/api/` - API routes
- `/root/pbk-crm-unified/backend/src/database/` - БД миграции

### Frontend:
- `/root/pbk-crm-unified/frontend/app/` - Next.js pages
- `/root/pbk-crm-unified/frontend/components/` - React компоненты

---

## ⚠️ Известные проблемы

1. **Telegram polling conflicts** - Два контейнера пытаются polling
2. **Email SMTP не настроен** - Нет SMTP credentials
3. **Offerteo bot требует login** - Нужен Google account login
4. **Code в контейнерах** - Изменения нужно копировать вручную
5. **Orphaned postgres container** - Старый контейнер не удален

---

## 🎯 Приоритеты разработки

### Высокий приоритет:
1. Полная автоматизация Fixly/Offerteo → CRM
2. Retell AI интеграция для звонков
3. Мобильная версия CRM (responsive design)

### Средний приоритет:
4. Email сервис настройка
5. AI Proposals генерация
6. Monitoring dashboard

### Низкий приоритет:
7. ERP модуль
8. Website редизайн
9. Аналитика и отчеты

---

**Дата создания:** 2026-01-06  
**Версия:** 1.0
