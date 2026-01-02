# 🏗️ Архитектура интеграций PBK CRM

## 📱 Мессенджеры и чат-боты

### 1. Telegram Bot
**Статус:** ✅ Частично готово  
**API:** Telegram Bot API  
**AI Engine:** OpenAI GPT-4

#### Функционал:
- ✅ Базовый бот уже существует
- 🔄 Нужно добавить:
  - Обработка входящих лидов
  - AI-ответы на вопросы
  - Создание заявок на звонки
  - Уведомления менеджерам
  - CRM integration (создание лидов, клиентов)

#### Технологии:
```javascript
- node-telegram-bot-api
- OpenAI API (GPT-4 для умных ответов)
- WebSocket для real-time связи с CRM
```

---

### 2. WhatsApp Business Bot
**Статус:** 🆕 Требует реализации  
**API:** WhatsApp Business API (Meta)  
**AI Engine:** OpenAI GPT-4

#### Требования:
- Meta Business Account
- WhatsApp Business API access (платный)
- Webhook для получения сообщений
- Phone number verification

#### Функционал:
- Прием входящих сообщений
- AI-ответы клиентам
- Создание лидов в CRM
- Отправка уведомлений
- Шаблоны сообщений (templates)

#### Технологии:
```javascript
- whatsapp-web.js (альтернатива официальному API)
- или официальный WhatsApp Business Cloud API
- OpenAI для AI-ответов
```

---

### 3. Instagram Messaging Bot
**Статус:** 🆕 Требует реализации  
**API:** Instagram Messaging API (Meta)  
**AI Engine:** OpenAI GPT-4

#### Требования:
- Facebook Business Account
- Instagram Business/Creator Account
- Facebook App с Instagram Messaging permissions
- Webhook setup

#### Функционал:
- Прием сообщений из Instagram Direct
- AI-ответы на вопросы
- Создание лидов
- Отправка информации о услугах

#### Технологии:
```javascript
- Facebook Graph API
- Instagram Messaging API
- OpenAI GPT-4
```

---

## 🎙️ Голосовые интеграции (Retell AI)

### Retell AI Voice Agent
**Статус:** ✅ Частично готово  
**Назначение:** Голосовые звонки (НЕ текстовые чаты)

#### Использование Retell AI:
✅ **Можно:**
- Исходящие звонки клиентам
- Входящие звонки с AI-ответами
- Квалификация лидов по телефону
- Voice messages в Telegram (речь → текст → AI → текст → речь)

❌ **Нельзя:**
- Текстовые чат-боты
- Instagram Direct messages
- WhatsApp текстовые сообщения

#### Интеграция с мессенджерами:
```
Telegram → Voice Message → Speech-to-Text → GPT-4 → Text-to-Speech → Voice Reply
```

---

## 🤖 AI-движок для чат-ботов

### OpenAI GPT-4
**Статус:** ✅ Готово  
**Назначение:** Умные ответы во всех чатах

#### Функционал:
- Понимание контекста разговора
- Ответы на вопросы о услугах
- Квалификация лидов
- Назначение встреч/звонков
- Создание заявок

#### Система промптов:
```javascript
const systemPrompt = `
Вы - AI-помощник PBK Construction.
Задачи:
1. Отвечать на вопросы о строительных услугах
2. Собирать контактные данные
3. Квалифицировать лидов
4. Предлагать консультацию/звонок
5. Создавать заявки в CRM

Услуги PBK:
- Ремонт квартир
- Строительство домов
- Дизайн интерьеров
- Проектирование

Будьте вежливы, профессиональны, помогайте клиентам.
`;
```

---

## 📊 Архитектура системы

```
┌─────────────────────────────────────────────────────┐
│                   PBK CRM Backend                    │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Leads DB   │  │  Clients DB  │  │  Calls DB  │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │         Unified Bot Controller               │   │
│  │  (Обработка сообщений из всех источников)   │   │
│  └──────────────────────────────────────────────┘   │
│         │           │            │                   │
└─────────┼───────────┼────────────┼───────────────────┘
          │           │            │
          ▼           ▼            ▼
┌─────────────┐ ┌──────────┐ ┌───────────┐
│  Telegram   │ │ WhatsApp │ │ Instagram │
│  Bot API    │ │ Business │ │   API     │
└─────────────┘ └──────────┘ └───────────┘
          │           │            │
          ▼           ▼            ▼
     ┌────────────────────────────────┐
     │      OpenAI GPT-4 Engine       │
     │   (Генерация умных ответов)    │
     └────────────────────────────────┘
                    │
                    ▼
          ┌──────────────────┐
          │   Retell AI      │
          │ (Voice Calls)    │
          └──────────────────┘
```

---

## 🔄 Поток обработки сообщения

### 1. Входящее сообщение
```
Клиент → Messenger → Webhook → CRM Backend
```

### 2. Обработка AI
```
Message → Check History → GPT-4 Prompt → AI Response
```

### 3. Создание лида (если нужно)
```
Extract Data → Create Lead → Assign Pipeline → Notify Manager
```

### 4. Ответ клиенту
```
AI Response → Messenger API → Client
```

---

## 📝 Структура базы данных для ботов

### Таблица: bot_conversations
```sql
CREATE TABLE bot_conversations (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(20) NOT NULL, -- telegram, whatsapp, instagram
  platform_user_id VARCHAR(255) NOT NULL,
  lead_id INTEGER REFERENCES leads(id),
  client_id INTEGER REFERENCES clients(id),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(platform, platform_user_id)
);
```

### Таблица: bot_messages
```sql
CREATE TABLE bot_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES bot_conversations(id),
  direction VARCHAR(10) NOT NULL, -- incoming, outgoing
  message_text TEXT,
  ai_processed BOOLEAN DEFAULT false,
  ai_response TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 План реализации

### Phase 1: Улучшение Telegram бота (1-2 дня)
- ✅ Базовая структура уже есть
- Добавить AI-ответы через GPT-4
- Интеграция с CRM (создание лидов)
- История разговоров
- Квалификация лидов

### Phase 2: WhatsApp бот (3-5 дней)
- Регистрация WhatsApp Business API
- Webhook setup
- AI-интеграция
- CRM integration
- Templates setup

### Phase 3: Instagram бот (3-5 дней)
- Facebook App setup
- Instagram API permissions
- Webhook для Direct messages
- AI-интеграция
- CRM integration

### Phase 4: Unified Bot Controller (2-3 дня)
- Единый контроллер для всех платформ
- Общая логика AI
- Centralized lead creation
- Analytics dashboard

---

## 🔐 Безопасность

### API Keys Management
```javascript
// .env
TELEGRAM_BOT_TOKEN=xxx
WHATSAPP_API_TOKEN=xxx
INSTAGRAM_ACCESS_TOKEN=xxx
OPENAI_API_KEY=xxx
RETELL_API_KEY=xxx
```

### Webhook Security
- Token verification для всех webhooks
- IP whitelisting
- HTTPS only
- Rate limiting

---

## 📊 Метрики и аналитика

### Отслеживание:
- Количество сообщений по платформам
- Время ответа AI
- Conversion rate (сообщение → лид)
- Качество лидов по источникам
- Популярные вопросы

### Dashboard виджеты:
- Messages by platform (chart)
- Response time (avg)
- Leads created from bots
- Active conversations

---

## 💡 Дополнительные возможности

### 1. Multi-language support
- Автоопределение языка
- GPT-4 отвечает на языке клиента

### 2. Rich media
- Отправка изображений проектов
- Видео-презентации
- PDF прайс-листы

### 3. Appointment booking
- Интеграция с календарем
- AI назначает встречи
- Автоматические напоминания

### 4. Voice в мессенджерах
```
Voice Message → Speech-to-Text (Whisper) → GPT-4 → 
Text-to-Speech (OpenAI TTS) → Voice Reply
```

---

## ✅ Выводы

### Retell AI:
- ✅ Использовать для голосовых звонков
- ✅ Можно для voice messages в Telegram
- ❌ НЕ для текстовых чат-ботов

### Текстовые боты:
- Telegram: Telegram Bot API + GPT-4
- WhatsApp: WhatsApp Business API + GPT-4
- Instagram: Instagram Messaging API + GPT-4

### AI Engine:
- OpenAI GPT-4 для всех текстовых ботов
- Retell AI для voice calls
- OpenAI Whisper для speech-to-text
- OpenAI TTS для text-to-speech

---

**Создано:** 21 декабря 2024  
**Версия:** 1.0
