# 🚀 СЛЕДУЮЩИЕ ШАГИ - Руководство к действию

## ✅ ЧТО СДЕЛАНО

Создана полная структура единой CRM системы PBK:

### Документация (100% готово)
- ✅ README.md - полное описание проекта
- ✅ QUICKSTART.md - быстрый старт
- ✅ SETUP.md - инструкция по установке
- ✅ CREDENTIALS_GUIDE.md - все креды
- ✅ DEVELOPMENT_ROADMAP.md - план разработки
- ✅ PROJECT_OVERVIEW.md - обзор проекта
- ✅ FILE_STRUCTURE.md - структура файлов

### Инфраструктура (90% готово)
- ✅ База данных (schema.sql)
- ✅ Docker Compose конфигурация
- ✅ Структура frontend (Next.js)
- ✅ Структура backend (Express)
- ✅ Copilot Agent (Telegram bot)
- ✅ .env.example
- ✅ .gitignore

### Backend (30% готово)
- ✅ Main entry point (index.js)
- ✅ Database connection
- ✅ Logger (Winston)
- ✅ Calls API (полностью)
- ✅ Retell AI service
- ✅ OpenAI service

### Frontend (10% готово)
- ✅ Layout
- ✅ Package.json
- ✅ Структура директорий

### Copilot Agent (60% готово)
- ✅ Telegram bot основа
- ✅ Системный промпт
- ✅ OpenAI интеграция

---

## 🎯 ЧТО ДЕЛАТЬ ДАЛЬШЕ

### PHASE 1: Backend API (3-5 дней) - **НАЧАТЬ ЗДЕСЬ**

#### День 1-2: Базовые API routes

Создать файлы:

**1. `backend/src/api/auth.js`**
```javascript
// POST /api/auth/login
// POST /api/auth/register  
// GET /api/auth/me
// JWT authentication
```

**2. `backend/src/api/users.js`**
```javascript
// GET /api/users
// POST /api/users
// PUT /api/users/:id
// PUT /api/users/:id/permissions
```

**3. `backend/src/api/clients.js`**
```javascript
// CRUD для клиентов
// GET /api/clients/:id/calls
// GET /api/clients/:id/emails
```

**4. `backend/src/api/leads.js`**
```javascript
// CRUD для лидов
// PUT /api/leads/:id/stage
// GET /api/leads/:id/activities
```

**5. `backend/src/middleware/auth.js`**
```javascript
// authenticateToken
// authorizeRole
// checkPermission
```

#### День 3: Pipelines & Settings

**6. `backend/src/api/pipelines.js`**
```javascript
// CRUD воронок
// POST /api/pipelines/generate (NLP)
// Управление стадиями
```

**7. `backend/src/api/settings.js`** ⭐ КРИТИЧНО
```javascript
// GET/PUT для каждого сервиса:
// - Retell AI
// - OpenAI
// - Email
// - Telegram
// POST /api/settings/test (тестирование соединений)
```

#### День 4-5: Email & Остальное

**8. `backend/src/services/email/smtp.js`**
```javascript
// sendEmail()
// Templates
```

**9. `backend/src/services/email/imap.js`**
```javascript
// fetchEmails()
// parseEmail()
```

**10. `backend/src/api/emails.js`**
```javascript
// GET /api/emails
// POST /api/emails/send
// POST /api/emails/sync
```

**11. `backend/src/api/proposals.js`**
```javascript
// GET /api/proposals
// POST /api/proposals/generate (OpenAI)
// POST /api/proposals/:id/send
```

**12. `backend/src/api/dashboard.js`**
```javascript
// GET /api/dashboard/metrics
// GET /api/dashboard/activity
```

**13. `backend/src/api/webhooks.js`**
```javascript
// POST /api/webhooks/retell
// POST /api/webhooks/telegram
```

---

### PHASE 2: Frontend - Settings Page (2-3 дня) - **ПРИОРИТЕТ #1**

⭐ Самая важная страница - без неё нельзя настроить систему!

#### `frontend/app/settings/page.tsx`

Создать страницу с табами:

**Tab 1: Retell AI**
- Input: API Key
- Input: Agent ID
- Input: From Number
- Textarea: System Prompt
- Textarea: Knowledge Base
- Button: Test Connection
- Button: Save

**Tab 2: OpenAI**
- Input: API Key
- Input: Organization ID (optional)
- Select: Model
- Textarea: Proposal Template
- Button: Test Connection
- Button: Save

**Tab 3: Email**
- Input: SMTP Host
- Input: SMTP Port
- Input: SMTP User
- Input: SMTP Password
- Input: IMAP Host
- Input: IMAP Port
- Button: Test Connection
- Button: Save

**Tab 4: Telegram**
- Input: Main Bot Token
- Input: Admin Chat IDs
- Input: Copilot Bot Token
- Input: Allowed User IDs
- Button: Test Bots
- Button: Save

**Tab 5: Pipelines**
- List существующих воронок
- Button: Create New (с NLP)
- Редактор стадий
- Automation rules

Компоненты для создания:
```typescript
frontend/app/settings/components/
├── RetellSettings.tsx
├── OpenAISettings.tsx
├── EmailSettings.tsx
├── TelegramSettings.tsx
├── PipelineSettings.tsx
└── SettingsTabs.tsx
```

---

### PHASE 3: Frontend - Calls Page (2-3 дня) - **ПРИОРИТЕТ #2**

⭐ Ключевая страница для работы со звонками

#### `frontend/app/calls/page.tsx`

Разделы:

**1. Filters & Search**
- Date range picker
- Status filter (все, ожидание, в процессе, завершен)
- Search by phone/client

**2. Call Requests (pending approval)**
- Карточки заявок на подтверждение
- Buttons: Approve / Reject
- Real-time updates

**3. Calls List**
- Table или Cards
- Columns: Date, Client, Phone, Duration, Status
- Click → открыть детали

**4. Call Details Modal**
- Recording player
- Transcript (оригинал)
- Translate button → показать перевод
- Summary/Analysis
- Link to client/lead

**5. Create Call Button**
- Form:
  - Select client/lead
  - Phone number
  - Purpose
  - Additional instructions
  - Schedule time
- Submit → отправить на подтверждение

Компоненты:
```typescript
frontend/app/calls/components/
├── CallList.tsx
├── CallCard.tsx
├── CallRequestForm.tsx
├── CallApprovalModal.tsx
├── TranscriptViewer.tsx
├── CallFilters.tsx
└── CallDetails.tsx
```

---

### PHASE 4: Frontend - Dashboard (1-2 дня)

#### `frontend/app/dashboard/page.tsx`

Виджеты:
- Metric Cards (лиды, звонки, конверсия)
- Chart: Leads по времени
- Chart: Calls по статусам
- Recent Activity Feed
- Upcoming Calls
- Unread Emails count

Компоненты:
```typescript
frontend/components/features/
├── Dashboard.tsx
├── MetricCard.tsx
├── ActivityFeed.tsx
└── ChartWrapper.tsx
```

---

### PHASE 5: Frontend - Leads & Clients (2-3 дня)

#### `frontend/app/leads/page.tsx`
- Kanban Board (по стадиям)
- Drag & drop между стадиями
- Filters
- Create new lead

#### `frontend/app/clients/page.tsx`
- Table/Grid view
- Search & filters
- Create new client

#### Карточки клиента/лида
- Основная информация
- **Сводка по звонкам** ⭐
- История emails
- Timeline активностей
- Create call button
- Create email button

---

### PHASE 6: Socket.io Real-time (1 день)

Добавить real-time обновления для:
- Новые заявки на звонки
- Изменение статуса звонков
- Новые письма
- Изменения в лидах
- Dashboard metrics

---

### PHASE 7: Telegram Bots (2 дня)

#### Основной бот (уведомления)
```javascript
pbk-telegram-bot/index.js
- /calls - список звонков
- /approve <id> - подтвердить
- /reject <id> - отклонить
- Notifications о новых заявках
```

#### Copilot Agent (команды)
Добавить обработку команд:
```javascript
copilot-agent/commands/
├── leads.js      // Создание, поиск лидов
├── calls.js      // Управление звонками
├── emails.js     // Отправка писем
└── stats.js      // Статистика
```

---

### PHASE 8: Интеграции (2-3 дня)

1. **Retell Webhook**
   - Обработка колбэков
   - Сохранение расшифровок
   - Обновление статусов

2. **Email IMAP**
   - Фоновый процесс получения писем
   - Парсинг и сохранение
   - Auto-link к клиентам

3. **OpenAI**
   - Генерация предложений
   - Перевод текстов
   - NLP pipeline creation

---

## 📋 ЧЕКЛИСТ РАЗРАБОТКИ

### Backend
- [ ] auth.js
- [ ] users.js
- [ ] clients.js
- [ ] leads.js
- [ ] pipelines.js
- [ ] settings.js ⭐
- [ ] emails.js
- [ ] proposals.js
- [ ] dashboard.js
- [ ] webhooks.js
- [ ] Middleware (auth, validation)
- [ ] Email service (SMTP/IMAP)

### Frontend
- [ ] Settings page ⭐⭐⭐
- [ ] Calls page ⭐⭐
- [ ] Dashboard
- [ ] Leads page
- [ ] Clients page
- [ ] Emails page
- [ ] Proposals page
- [ ] Pipelines management
- [ ] UI components
- [ ] Socket.io client

### Integration
- [ ] Retell webhook
- [ ] Email sync (IMAP)
- [ ] OpenAI proposals
- [ ] Telegram notifications
- [ ] Socket.io real-time

### Copilot
- [ ] Команды управления
- [ ] Database queries
- [ ] Telegram formatting

### DevOps
- [ ] Dockerfiles
- [ ] Database migrations
- [ ] Seed data
- [ ] Backup scripts
- [ ] CI/CD

---

## 🎯 РЕКОМЕНДУЕМЫЙ ПОРЯДОК

1. **Неделя 1:**
   - Backend API routes (auth, users, clients, leads)
   - Middleware
   - Settings API ⭐

2. **Неделя 2:**
   - Frontend Settings page ⭐
   - Frontend Calls page ⭐
   - Socket.io setup

3. **Неделя 3:**
   - Dashboard
   - Leads/Clients pages
   - Email service

4. **Неделя 4:**
   - Telegram bots
   - Webhooks
   - Интеграции
   - Testing

5. **Неделя 5:**
   - Pipelines
   - Proposals
   - Polish & Deploy

---

## 🚀 КАК НАЧАТЬ ПРЯМО СЕЙЧАС

```bash
cd /root/pbk-crm-unified

# 1. Начать с Backend API
cd backend/src/api

# Создать auth.js (используй calls.js как пример)
# Создать users.js
# Создать settings.js ⭐

# 2. Потом Frontend Settings
cd ../../frontend/app/settings

# Создать page.tsx
# Создать components/

# 3. Тестировать
npm run dev
```

---

## 💡 СОВЕТЫ

1. **Используй созданные файлы как шаблоны:**
   - `backend/src/api/calls.js` - пример API route
   - `backend/src/services/retell/service.js` - пример сервиса
   - `copilot-agent/index.js` - пример Telegram бота

2. **Начни с Settings page:**
   - Без неё нельзя настроить систему
   - Самая критичная страница

3. **Используй Socket.io сразу:**
   - Добавь в каждый API endpoint
   - `io.emit('event', data)`

4. **Тестируй по частям:**
   - Каждый API endpoint отдельно
   - Каждая страница отдельно

5. **Документируй по ходу:**
   - Добавляй комментарии
   - Обновляй README если нужно

---

## 📞 ГДЕ ПОЛУЧИТЬ ПОМОЩЬ

- **Документация:** Все файлы .md в корне
- **Примеры кода:** Уже созданные файлы
- **План:** DEVELOPMENT_ROADMAP.md
- **Структура:** FILE_STRUCTURE.md

---

**Начинай с Backend API → Settings page → Calls page!**

Удачи! 🚀
