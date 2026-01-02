# 🎯 ЗАДАЧИ ДЛЯ РАЗРАБОТКИ

## ✅ Выполнено

- [x] Создана структура проекта
- [x] Разработана схема базы данных
- [x] Создан Copilot Agent с системным промптом
- [x] Настроены конфигурационные файлы
- [x] Написана документация (README, SETUP, CREDENTIALS_GUIDE)
- [x] Создан API для звонков (calls.js)
- [x] Интеграция Retell AI сервиса
- [x] Интеграция OpenAI сервиса
- [x] Docker Compose конфигурация
- [x] Базовая структура frontend (Next.js)
- [x] Базовая структура backend (Express)

---

## 🚧 В процессе разработки

### Frontend (приоритет: ВЫСОКИЙ)

#### 1. Dashboard Page
```typescript
app/dashboard/page.tsx
- Metrics cards (лиды, звонки, конверсия)
- Recent activity feed
- Charts (recharts)
- Quick actions
```

#### 2. Calls Page (КРИТИЧНО)
```typescript
app/calls/page.tsx
- Список всех звонков с фильтрами
- Создание заявки на звонок
- Подтверждение/отклонение заявок
- Просмотр расшифровки
- Перевод расшифровки
- Real-time обновления (Socket.io)
```

#### 3. Leads & Clients Pages
```typescript
app/leads/page.tsx
app/clients/page.tsx
- Kanban board для лидов
- Карточки с полной информацией
- Сводка по звонкам в каждой карточке
- История активностей
```

#### 4. Settings Page (КРИТИЧНО)
```typescript
app/settings/page.tsx
- Tabs: Retell AI, OpenAI, Email, Telegram, Pipelines
- Форма для ввода всех кредов
- Тестирование соединений
- Настройка системных промптов Retell
- Настройка Knowledge Base
- Создание/редактирование воронок
```

#### 5. Email Page
```typescript
app/emails/page.tsx
- Inbox/Sent
- Compose
- Templates
- Integration с клиентами
```

#### 6. Proposals Page
```typescript
app/proposals/page.tsx
- List предложений
- Generate new (OpenAI)
- Edit & Send
```

#### 7. Pipelines Management
```typescript
app/pipelines/page.tsx
- Визуальный редактор воронок
- Drag & drop stages
- Automation rules
- Natural language pipeline creation
```

---

### Backend (приоритет: ВЫСОКИЙ)

#### 1. API Routes (требуют реализации)

**auth.js**
```javascript
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET /api/auth/me
```

**users.js**
```javascript
GET /api/users
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id
PUT /api/users/:id/permissions
```

**leads.js**
```javascript
GET /api/leads
POST /api/leads
PUT /api/leads/:id
DELETE /api/leads/:id
PUT /api/leads/:id/stage
GET /api/leads/:id/calls
GET /api/leads/:id/emails
GET /api/leads/:id/activities
```

**clients.js**
```javascript
GET /api/clients
POST /api/clients
PUT /api/clients/:id
DELETE /api/clients/:id
GET /api/clients/:id/calls
GET /api/clients/:id/emails
GET /api/clients/:id/leads
```

**pipelines.js** (КРИТИЧНО)
```javascript
GET /api/pipelines
POST /api/pipelines
PUT /api/pipelines/:id
DELETE /api/pipelines/:id
POST /api/pipelines/generate (NLP создание)
GET /api/pipelines/:id/stages
POST /api/pipelines/:id/stages
PUT /api/pipelines/:id/stages/:stageId
DELETE /api/pipelines/:id/stages/:stageId
```

**emails.js**
```javascript
GET /api/emails
POST /api/emails/send
GET /api/emails/:id
POST /api/emails/sync (IMAP sync)
```

**proposals.js**
```javascript
GET /api/proposals
POST /api/proposals/generate (OpenAI)
PUT /api/proposals/:id
POST /api/proposals/:id/send
```

**settings.js** (КРИТИЧНО)
```javascript
GET /api/settings
PUT /api/settings/retell
PUT /api/settings/openai
PUT /api/settings/email
PUT /api/settings/telegram
POST /api/settings/test (test connections)
```

**webhooks.js**
```javascript
POST /api/webhooks/retell (от Retell AI)
POST /api/webhooks/telegram (от Telegram)
```

**dashboard.js**
```javascript
GET /api/dashboard/metrics
GET /api/dashboard/activity
GET /api/dashboard/charts
```

#### 2. Services (требуют доработки)

**email/service.js**
```javascript
- sendEmail()
- fetchEmails() (IMAP)
- parseEmail()
- saveAttachments()
```

**telegram/service.js**
```javascript
- sendNotification()
- sendCallRequest()
- sendCallUpdate()
```

**retell/service.js** (дополнить)
```javascript
- updateKnowledgeBase()
- updateSystemPrompt()
- getAnalytics()
```

#### 3. Middleware

**auth.js**
```javascript
- authenticateToken (JWT)
- authorizeRole
- checkPermission
```

**validation.js**
```javascript
- validateCall
- validateLead
- validateEmail
```

**rateLimit.js**
```javascript
- apiLimiter
- authLimiter
```

---

### Database (приоритет: СРЕДНИЙ)

#### Migrations
```sql
database/migrations/
- 001_initial_schema.sql (уже есть в schema.sql)
- 002_add_indexes.sql
- 003_add_triggers.sql
```

#### Seed Data
```sql
database/seeds/
- users.sql (admin user)
- pipelines.sql (default pipelines)
- settings.sql (default settings)
```

---

### Copilot Agent (приоритет: СРЕДНИЙ)

#### Функции для реализации

**commands.js**
```javascript
- handleCreateLead()
- handleFindClient()
- handleCreateCall()
- handleShowCalls()
- handleSendEmail()
- handleGenerateProposal()
- handleStatistics()
```

**database.js**
```javascript
- executeQuery()
- searchLeads()
- searchClients()
- getCalls()
```

**telegram.js**
```javascript
- formatCallList()
- formatLeadCard()
- formatStatistics()
- sendNotification()
```

---

### Telegram Bots

#### Fixly Bot (основной)
```javascript
pbk-telegram-bot/index.js
- /start
- /calls (список звонков)
- /create_call (создать звонок)
- /approve_call (подтвердить)
- /reject_call (отклонить)
- Notifications о новых заявках
```

---

### Integration & Testing

#### 1. Retell AI
- [ ] Настроить webhook endpoint
- [ ] Тестирование создания звонков
- [ ] Обработка колбэков
- [ ] Сохранение расшифровок
- [ ] Обновление статусов в реальном времени

#### 2. OpenAI
- [ ] Генерация предложений
- [ ] Перевод текстов
- [ ] Анализ звонков
- [ ] Natural language pipeline creation

#### 3. Email (SMTP/IMAP)
- [ ] Отправка через SMTP
- [ ] Получение через IMAP
- [ ] Парсинг писем
- [ ] Сохранение вложений
- [ ] Автоматическая привязка к клиентам

#### 4. Socket.io
- [ ] Real-time обновления звонков
- [ ] Live dashboard metrics
- [ ] Notifications

---

## 🎨 UI/UX Components

### Создать компоненты:

**Layout**
```
- Sidebar (navigation)
- Header (user menu, notifications)
- Breadcrumbs
```

**UI Components**
```
- Button
- Input
- Select
- Modal
- Card
- Table
- Kanban Board
- Chart (wrapper для recharts)
- Badge
- Avatar
- Tabs
```

**Feature Components**
```
- CallCard (информация о звонке)
- LeadCard
- ClientCard
- CallRequestForm
- CallApprovalModal
- TranscriptViewer
- EmailComposer
- PipelineBuilder
- MetricCard
- ActivityFeed
```

---

## 📝 Документация (дополнить)

- [ ] API Documentation (Swagger/OpenAPI)
- [ ] Database ERD diagram
- [ ] User Manual (на русском)
- [ ] Admin Guide
- [ ] Development Guide
- [ ] Deployment Guide (Cloudflare, Docker)

---

## 🔒 Безопасность

- [ ] Implement JWT refresh tokens
- [ ] Add rate limiting
- [ ] Input validation (Joi)
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Encrypt sensitive settings in DB
- [ ] Implement audit logs

---

## 🚀 DevOps

- [ ] Dockerfile для frontend
- [ ] Dockerfile для backend
- [ ] Dockerfile для copilot-agent
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated backups
- [ ] Monitoring (Sentry, Prometheus)
- [ ] Logging aggregation

---

## 📱 Mobile (будущее)

- [ ] React Native app
- [ ] Push notifications
- [ ] Offline mode

---

## 🔄 Приоритет задач

### Phase 1: MVP (2-3 недели)
1. ✅ Структура проекта
2. ✅ База данных
3. Backend API (auth, leads, clients, calls) - **В ПРОЦЕССЕ**
4. Frontend (dashboard, calls page, settings) - **СЛЕДУЮЩЕЕ**
5. Базовая интеграция Retell AI
6. Базовая интеграция OpenAI

### Phase 2: Core Features (2-3 недели)
1. Email integration
2. Telegram bots (оба)
3. Copilot Agent функционал
4. Pipelines management
5. Real-time updates (Socket.io)

### Phase 3: Advanced Features (2-3 недели)
1. Natural language pipeline creation
2. AI proposal generation
3. Advanced analytics
4. Automation rules
5. Templates system

### Phase 4: Polish & Deploy (1-2 недели)
1. UI/UX improvements
2. Testing
3. Documentation
4. Security audit
5. Production deployment

---

## 🎯 Следующие шаги (СЕЙЧАС)

### 1. Завершить Backend API (3-5 дней)
- Реализовать все роуты (auth, users, leads, clients, etc.)
- Добавить middleware (auth, validation, rate limit)
- Дописать сервисы (email, telegram)
- Тестирование API

### 2. Разработать Frontend Pages (5-7 дней)
- Settings page (ввод кредов) - **ПРИОРИТЕТ #1**
- Calls page (список, создание, подтверждение) - **ПРИОРИТЕТ #2**
- Dashboard (метрики)
- Leads/Clients pages

### 3. Интеграции (3-5 дней)
- Retell AI webhook и обработка
- OpenAI генерация
- Email SMTP/IMAP
- Socket.io real-time

### 4. Copilot Agent (2-3 дня)
- Реализовать команды
- Подключить к базе
- Тестирование через Telegram

### 5. Deployment (1-2 дня)
- Docker build
- Cloudflare Tunnel
- Production testing

---

## 💡 Идеи для будущего

- Voice commands через Telegram
- WhatsApp integration
- Instagram/Facebook leads
- SMS notifications
- Calendar integration (Google Calendar)
- Advanced AI analytics
- Predictive lead scoring
- Automated follow-ups
- Video calls integration
- CRM mobile app

---

**Статус:** 🟡 В активной разработке  
**Прогресс:** ~25% (структура готова, начинаем реализацию)  
**Следующий milestone:** Backend API + Settings Page
