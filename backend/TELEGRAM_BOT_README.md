# 🤖 Telegram Bot с OpenAI GPT-4

## Быстрый старт

### 1. Подготовка

#### Создать Telegram бота:
1. Открыть Telegram
2. Найти @BotFather
3. Отправить `/newbot`
4. Следовать инструкциям
5. Получить **Bot Token**

#### Получить OpenAI API Key:
1. Зайти на https://platform.openai.com/api-keys
2. Создать новый API key
3. Скопировать ключ

### 2. Настройка

Добавить в `.env`:

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# OpenAI
OPENAI_API_KEY=sk-your_openai_api_key_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pbk_crm
```

### 3. База данных

Выполнить миграцию:

```bash
cd /root/pbk-crm-unified
psql $DATABASE_URL -f database/migrations/003_bot_system.sql
```

Или через psql:

```bash
psql -U postgres -d pbk_crm -f database/migrations/003_bot_system.sql
```

### 4. Запуск бота

```bash
cd /root/pbk-crm-unified/backend
node src/start-telegram-bot.js
```

Или через npm (добавить в package.json):

```bash
npm run bot:telegram
```

---

## 📋 Возможности бота

### Команды:
- `/start` - Приветствие и начало разговора
- `/help` - Справка и контакты

### AI функции:
- ✅ Умные ответы через GPT-4
- ✅ Понимание контекста разговора
- ✅ Определение намерений клиента
- ✅ Извлечение контактных данных
- ✅ Автоматическое создание лидов
- ✅ История разговоров

### Что бот умеет:
- Отвечать на вопросы об услугах
- Консультировать по ценам
- Собирать контактные данные
- Создавать заявки в CRM
- Предлагать консультацию со специалистом

---

## 🏗️ Архитектура

```
User Message (Telegram)
        ↓
Telegram Bot API
        ↓
telegram-controller.js
        ↓
openai-service.js
        ↓
OpenAI GPT-4 API
        ↓
AI Response
        ↓
Save to Database
        ↓
Create Lead (if ready)
        ↓
Send Response to User
```

---

## 📁 Структура файлов

```
backend/src/
├── bots/
│   └── telegram-controller.js    # Telegram бот контроллер
├── services/
│   └── ai/
│       └── openai-service.js     # OpenAI сервис
├── start-telegram-bot.js         # Точка входа
└── utils/
    └── logger.js                 # Логирование

database/migrations/
└── 003_bot_system.sql            # Миграция БД
```

---

## 🔧 Настройки

### Изменить System Prompt:

Открыть `backend/src/services/ai/openai-service.js` и отредактировать `systemPrompt`.

### Изменить модель GPT:

В `openai-service.js` найти:

```javascript
model: 'gpt-4-turbo-preview'
```

Изменить на:
- `gpt-4` - стандартный GPT-4
- `gpt-3.5-turbo` - дешевле и быстрее

### Изменить параметры:

```javascript
temperature: 0.7,    // Креативность (0-1)
max_tokens: 500,     # Максимум токенов ответа
```

---

## 📊 База данных

### Таблицы:

**bot_conversations**
- Хранит все разговоры
- Связь с лидами и клиентами
- Контекст разговора (JSONB)

**bot_messages**
- Все сообщения
- AI ответы и намерения
- Использованные токены

**bot_settings**
- Настройки ботов
- API токены
- Статус активности

### Просмотр данных:

```sql
-- Последние разговоры
SELECT * FROM bot_conversations 
ORDER BY updated_at DESC 
LIMIT 10;

-- Сообщения разговора
SELECT * FROM bot_messages 
WHERE conversation_id = 1 
ORDER BY created_at;

-- Статистика
SELECT 
  platform,
  COUNT(*) as conversations,
  COUNT(DISTINCT lead_id) as leads_created
FROM bot_conversations
GROUP BY platform;
```

---

## 🚀 Деплой

### PM2 (production):

```bash
npm install -g pm2

# Запустить
pm2 start src/start-telegram-bot.js --name telegram-bot

# Авто-запуск при перезагрузке
pm2 startup
pm2 save

# Логи
pm2 logs telegram-bot

# Остановка
pm2 stop telegram-bot
```

### Docker:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/src ./src
CMD ["node", "src/start-telegram-bot.js"]
```

---

## 💰 Стоимость

### OpenAI GPT-4 Turbo:
- Input: $0.01 / 1K tokens
- Output: $0.03 / 1K tokens

### Примерная стоимость:
- 1 диалог (10 сообщений): ~$0.02-0.05
- 1000 диалогов/месяц: ~$20-50

### Оптимизация:
- Использовать `gpt-3.5-turbo` для простых вопросов (дешевле в 10 раз)
- Ограничить `max_tokens` до 300-400
- Очищать старую историю

---

## 🐛 Troubleshooting

### Бот не отвечает:
```bash
# Проверить токен
echo $TELEGRAM_BOT_TOKEN

# Проверить логи
tail -f logs/combined.log
```

### Ошибка OpenAI:
```bash
# Проверить API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Ошибка БД:
```bash
# Проверить подключение
psql $DATABASE_URL -c "SELECT 1"

# Проверить таблицы
psql $DATABASE_URL -c "\dt bot_*"
```

---

## 📝 TODO

- [ ] WhatsApp бот
- [ ] Instagram бот
- [ ] Unified бот контроллер
- [ ] Dashboard для ботов
- [ ] Analytics
- [ ] Multi-language support
- [ ] Voice messages support (через Whisper)

---

## 🔗 Ссылки

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [Node Telegram Bot API](https://github.com/yagop/node-telegram-bot-api)

---

**Создано:** 21 декабря 2024  
**Статус:** Ready to use ✅  
**Версия:** 1.0
