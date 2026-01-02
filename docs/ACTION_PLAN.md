# 🎯 ПЛАН РАБОТЫ НАД PBK CRM
## Дата: 21 декабря 2024

---

## 📋 РЕЗЮМЕ

### Текущая ситуация:
- ✅ Базовая структура CRM готова (75%)
- ✅ Backend API частично реализован
- ✅ Frontend основа создана
- ✅ Login page готова (красивый дизайн)
- ✅ Dashboard базовый работает
- 🔄 Требуется доработка функционала и UI

### Цели:
1. **Спроектировать** функционал и интеграции
2. **Улучшить** интерфейс (UI/UX)
3. **Проверить** возможность использования Retell AI для чат-ботов

---

## ⚠️ ВАЖНО: Retell AI и чат-боты

### ❌ Retell AI НЕ подходит для текстовых чат-ботов

**Retell AI** - это платформа для **голосовых AI-агентов** (voice calls).

#### ✅ Что МОЖНО с Retell AI:
- Исходящие звонки клиентам
- Входящие звонки с AI-ответами
- Квалификация лидов по телефону
- Запись и расшифровка звонков
- Voice messages в Telegram (через Speech-to-Text)

#### ❌ Что НЕЛЬЗЯ с Retell AI:
- Текстовые чат-боты в Instagram
- Текстовые чат-боты в WhatsApp
- Текстовые чат-боты в Telegram
- Direct messages обработка

### ✅ Решение для чат-ботов

Для текстовых чат-ботов используем:

**Instagram + WhatsApp + Telegram:**
```
┌─────────────────┐
│  Meta/Telegram  │
│   Bot API       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   OpenAI GPT-4  │ ← AI для умных ответов
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PBK CRM       │ ← Создание лидов
└─────────────────┘
```

**Retell AI отдельно для голосовых звонков:**
```
┌─────────────────┐
│   Retell AI     │ ← Voice calls
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PBK CRM       │ ← Сохранение звонков
└─────────────────┘
```

---

## 🎯 ПЛАН РАБОТЫ

---

## ФАЗА 1: Архитектура и проектирование (2-3 дня)

### 1.1 Проектирование интеграций ✅
**Статус:** Готово  
**Документ:** `docs/INTEGRATION_ARCHITECTURE.md`

#### Что спроектировано:
- ✅ Telegram Bot с OpenAI
- ✅ WhatsApp Business API
- ✅ Instagram Messaging API
- ✅ Retell AI для voice calls
- ✅ Unified Bot Controller
- ✅ База данных для разговоров
- ✅ Поток обработки сообщений

### 1.2 Проектирование UI/UX ✅
**Статус:** Готово  
**Документ:** `docs/UI_UX_IMPROVEMENT_PLAN.md`

#### Что спроектировано:
- ✅ Design System
- ✅ Component Library структура
- ✅ Dashboard улучшенный дизайн
- ✅ Sidebar Navigation
- ✅ Leads Kanban Board
- ✅ Calls Management UI
- ✅ Settings Page с табами
- ✅ Responsive design принципы

### 1.3 API Endpoints планирование
**Задача:** Определить все необходимые API

#### Messenger Bot APIs:
```javascript
// Telegram
POST /api/bots/telegram/webhook
GET  /api/bots/telegram/conversations
POST /api/bots/telegram/send

// WhatsApp
POST /api/bots/whatsapp/webhook
GET  /api/bots/whatsapp/conversations
POST /api/bots/whatsapp/send

// Instagram
POST /api/bots/instagram/webhook
GET  /api/bots/instagram/conversations
POST /api/bots/instagram/send

// Unified
GET  /api/bots/conversations
POST /api/bots/process-message
GET  /api/bots/analytics
```

---

## ФАЗА 2: Backend разработка (5-7 дней)

### 2.1 Улучшение существующих API (2 дня)

#### Dashboard API
```bash
✅ GET /api/dashboard/metrics - готов
🔄 Добавить:
  - GET /api/dashboard/activity - Recent activity feed
  - GET /api/dashboard/charts - Chart data
  - GET /api/dashboard/quick-stats - Quick statistics
```

#### Calls API
```bash
✅ Базовые endpoints готовы
🔄 Улучшить:
  - Фильтрация (status, date range)
  - Пагинация
  - Сортировка
  - Real-time updates (Socket.io)
```

### 2.2 Messenger Bots Backend (3-4 дня)

#### 2.2.1 Telegram Bot Controller
**Файл:** `backend/src/bots/telegram-controller.js`

```javascript
class TelegramBotController {
  // Webhook обработка
  async handleWebhook(req, res) {}
  
  // AI обработка сообщения
  async processMessage(message) {
    // 1. Получить историю разговора
    // 2. Сформировать prompt для GPT
    // 3. Получить AI ответ
    // 4. Проверить намерение (create lead, etc)
    // 5. Выполнить действие
    // 6. Отправить ответ
  }
  
  // Создание лида из разговора
  async createLeadFromConversation(conversation) {}
  
  // Отправка уведомлений менеджерам
  async notifyManagers(lead) {}
}
```

#### 2.2.2 WhatsApp Bot Controller
**Файл:** `backend/src/bots/whatsapp-controller.js`

```javascript
class WhatsAppBotController {
  // Аналогично Telegram
  // + Templates handling
  // + Media messages support
}
```

#### 2.2.3 Instagram Bot Controller
**Файл:** `backend/src/bots/instagram-controller.js`

```javascript
class InstagramBotController {
  // Facebook Graph API integration
  // Instagram Direct messages
}
```

#### 2.2.4 Unified Bot Service
**Файл:** `backend/src/services/bot-service.js`

```javascript
class BotService {
  // Общая логика для всех ботов
  async processWithAI(message, context) {
    // OpenAI GPT-4 integration
  }
  
  async detectIntent(message) {
    // Определение намерения пользователя
    // Examples: 
    // - request_info
    // - schedule_call
    // - get_quote
    // - complain
  }
  
  async createLead(data, platform) {
    // Создание лида в CRM
  }
}
```

### 2.3 База данных для ботов (1 день)

#### Миграция
**Файл:** `database/migrations/003_bot_system.sql`

```sql
-- Conversations table
CREATE TABLE bot_conversations (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(20) NOT NULL,
  platform_user_id VARCHAR(255) NOT NULL,
  platform_username VARCHAR(255),
  lead_id INTEGER REFERENCES leads(id),
  client_id INTEGER REFERENCES clients(id),
  status VARCHAR(50) DEFAULT 'active',
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(platform, platform_user_id)
);

-- Messages table
CREATE TABLE bot_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES bot_conversations(id),
  direction VARCHAR(10) NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  message_text TEXT,
  message_data JSONB,
  ai_processed BOOLEAN DEFAULT false,
  ai_response TEXT,
  ai_intent VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bot settings table
CREATE TABLE bot_settings (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(20) UNIQUE NOT NULL,
  api_token TEXT,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversations_platform ON bot_conversations(platform);
CREATE INDEX idx_conversations_lead ON bot_conversations(lead_id);
CREATE INDEX idx_messages_conversation ON bot_messages(conversation_id);
CREATE INDEX idx_messages_created ON bot_messages(created_at);
```

---

## ФАЗА 3: Frontend разработка (7-10 дней)

### 3.1 Design System (2 дня)

#### 3.1.1 UI Components
**Папка:** `frontend/components/ui/`

Создать компоненты:
```bash
[ ] Button.tsx - универсальные кнопки
[ ] Card.tsx - карточки контента
[ ] Input.tsx - поля ввода
[ ] Select.tsx - выпадающие списки
[ ] Badge.tsx - статусные бейджи
[ ] Avatar.tsx - аватары
[ ] Modal.tsx - модальные окна
[ ] Tabs.tsx - табы
[ ] Table.tsx - таблицы
[ ] Dropdown.tsx - dropdown меню
[ ] Toast.tsx - уведомления (react-hot-toast)
[ ] Spinner.tsx - загрузка
```

#### 3.1.2 Layout Components
**Папка:** `frontend/components/layout/`

```bash
[ ] Sidebar.tsx - навигация
[ ] Header.tsx - верхняя панель
[ ] AppLayout.tsx - улучшить текущий
[ ] PageHeader.tsx - заголовки страниц
```

### 3.2 Dashboard улучшение (1 день)

**Файл:** `frontend/app/dashboard/page.tsx`

Добавить:
```bash
[ ] Улучшенные MetricCards
[ ] Activity Feed (real-time)
[ ] Quick Actions Bar
[ ] Charts (recharts)
[ ] Loading states
[ ] Empty states
```

### 3.3 Leads Page (Kanban) (2 дня)

**Файл:** `frontend/app/leads/page.tsx`

```bash
[ ] Kanban Board (@dnd-kit/core)
[ ] Lead Cards
[ ] Drag & Drop между колонками
[ ] Фильтры и поиск
[ ] Lead creation modal
[ ] Lead detail view
[ ] Real-time updates
```

### 3.4 Calls Page улучшение (1-2 дня)

**Файл:** `frontend/app/calls/page.tsx`

```bash
[ ] Улучшенный CallList
[ ] Фильтры (status, date)
[ ] Call Request Modal
[ ] Transcript Viewer с переводом
[ ] Call Approval UI
[ ] Real-time статусы
```

### 3.5 Settings Page (2 дня)

**Файл:** `frontend/app/settings/page.tsx`

Табы:
```bash
[ ] General Settings
[ ] AI Services (OpenAI, Retell AI)
[ ] Email Configuration
[ ] Messenger Bots (Telegram, WhatsApp, Instagram)
[ ] Pipelines Management
[ ] Users & Permissions
```

### 3.6 Messenger Bots UI (1 день)

**Новая страница:** `frontend/app/bots/page.tsx`

```bash
[ ] Список всех разговоров
[ ] Фильтр по платформам
[ ] Просмотр истории сообщений
[ ] Ручной ответ (если нужно)
[ ] Статистика ботов
[ ] Analytics dashboard
```

---

## ФАЗА 4: Интеграции (5-7 дней)

### 4.1 Telegram Bot (1-2 дня)

**Статус:** Базовая структура есть  
**Задачи:**
```bash
[ ] Webhook setup
[ ] OpenAI GPT-4 integration
[ ] Intent detection
[ ] Lead creation from chat
[ ] Manager notifications
[ ] Rich messages (buttons, images)
```

### 4.2 WhatsApp Business (2-3 дня)

**Задачи:**
```bash
[ ] Meta Business Account setup
[ ] WhatsApp Business API registration
[ ] Webhook configuration
[ ] OpenAI integration
[ ] Template messages
[ ] Media handling
```

**Альтернатива:** `whatsapp-web.js` (проще, но неофициально)

### 4.3 Instagram Messaging (2-3 дня)

**Задачи:**
```bash
[ ] Facebook App creation
[ ] Instagram Business account connection
[ ] Messaging permissions
[ ] Webhook setup
[ ] OpenAI integration
[ ] Story replies handling
```

### 4.4 Retell AI для звонков (1 день)

**Задачи:**
```bash
[ ] Webhook улучшение
[ ] Call recording storage
[ ] Transcript processing
[ ] Analytics integration
[ ] Voice message support в Telegram
```

---

## ФАЗА 5: Testing & Polish (3-5 дней)

### 5.1 Testing
```bash
[ ] Unit tests (backend)
[ ] Integration tests (API)
[ ] E2E tests (frontend)
[ ] Bot testing (все платформы)
```

### 5.2 UI Polish
```bash
[ ] Animations (framer-motion)
[ ] Loading states везде
[ ] Empty states
[ ] Error handling
[ ] Mobile optimization
[ ] Dark mode (optional)
```

### 5.3 Documentation
```bash
[ ] API documentation (Swagger)
[ ] User manual
[ ] Admin guide
[ ] Bot setup instructions
```

---

## 📊 TIMELINE

### Week 1-2: Foundation
- [x] Проектирование (готово)
- [ ] Backend API (messenger bots)
- [ ] Database migrations
- [ ] Design System UI components

### Week 3: Frontend Core
- [ ] Dashboard улучшение
- [ ] Leads Kanban
- [ ] Calls улучшение
- [ ] Settings page

### Week 4: Integrations
- [ ] Telegram Bot
- [ ] WhatsApp Bot
- [ ] Instagram Bot
- [ ] Retell AI calls

### Week 5: Polish
- [ ] Testing
- [ ] Bug fixes
- [ ] UI animations
- [ ] Documentation

**Итого:** ~5 недель полноценной разработки

---

## 🔑 КЛЮЧЕВЫЕ ТЕХНОЛОГИИ

### Backend:
- Express.js
- PostgreSQL
- Socket.io (real-time)
- OpenAI API (GPT-4)
- Retell AI API
- Telegram Bot API
- Meta Graph API (WhatsApp, Instagram)

### Frontend:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Headless UI / Radix UI
- Framer Motion
- react-hot-toast
- @dnd-kit/core
- recharts

---

## 💰 СТОИМОСТЬ ИНТЕГРАЦИЙ

### API Costs (примерно):
- **OpenAI GPT-4:** ~$0.03 / 1K tokens (входящие), ~$0.06 / 1K tokens (исходящие)
- **Retell AI:** от $0.08/минута звонка
- **Telegram Bot:** Бесплатно
- **WhatsApp Business API:** ~$0.005-0.05 за сообщение (зависит от страны)
- **Instagram Messaging:** Бесплатно (через Facebook)

### Рекомендации:
- Начать с Telegram (бесплатно)
- Добавить Instagram (бесплатно)
- WhatsApp - по необходимости (платно)
- Retell AI - для ценных звонков

---

## 🎯 СЛЕДУЮЩИЕ ШАГИ (СЕЙЧАС)

### 1. Начать Backend для ботов (3-4 дня)
```bash
cd /root/pbk-crm-unified/backend
# Создать структуру
mkdir -p src/bots src/services/ai
# Файлы:
- src/bots/telegram-controller.js
- src/bots/whatsapp-controller.js
- src/bots/instagram-controller.js
- src/services/ai/openai-service.js
- src/services/bot-service.js
```

### 2. Database migrations (1 день)
```bash
cd /root/pbk-crm-unified/database
# Создать миграцию
- migrations/003_bot_system.sql
```

### 3. Frontend Design System (2 дня)
```bash
cd /root/pbk-crm-unified/frontend
# Создать компоненты
mkdir -p components/ui components/features
```

### 4. Telegram Bot proof-of-concept (2 дня)
```bash
# Запустить базовую версию с OpenAI
# Проверить создание лидов
# Тестировать AI-ответы
```

---

## 📝 ФАЙЛЫ ДЛЯ ИЗУЧЕНИЯ

Созданные документы:
- `docs/INTEGRATION_ARCHITECTURE.md` - архитектура интеграций
- `docs/UI_UX_IMPROVEMENT_PLAN.md` - план UI/UX
- `docs/ACTION_PLAN.md` - этот файл

Существующие:
- `README.md` - обзор проекта
- `DEVELOPMENT_ROADMAP.md` - дорожная карта
- `backend/src/api/calls.js` - пример API
- `frontend/app/login/page.tsx` - пример UI

---

## ✅ ВЫВОДЫ

### Что выяснили:
1. ✅ **Retell AI** - только для голосовых звонков, НЕ для чат-ботов
2. ✅ **Чат-боты** - делаем через OpenAI GPT-4
3. ✅ **Архитектура** - спроектирована и документирована
4. ✅ **UI/UX план** - готов к реализации

### Рекомендации:
1. Начать с **Telegram бота** (проще всего)
2. Параллельно работать над **UI components**
3. **WhatsApp и Instagram** - после успешного Telegram
4. **Retell AI** оставить для голосовых звонков

### Риски:
- WhatsApp API требует верификации бизнеса (может занять время)
- Instagram API требует review от Facebook
- Нужны тестовые аккаунты для всех платформ

---

**Создано:** 21 декабря 2024  
**Статус:** Готов к выполнению  
**Приоритет:** ВЫСОКИЙ

**Следующее действие:** Начать разработку Telegram бота с OpenAI
