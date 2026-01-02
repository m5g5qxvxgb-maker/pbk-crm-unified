# 🚀 БЫСТРЫЙ СТАРТ: Telegram Bot

## ⚡ За 5 минут

### 1. Создать бота в Telegram

1. Открыть Telegram → найти **@BotFather**
2. Отправить: `/newbot`
3. Название: **PBK Construction Bot**
4. Username: **pbk_construction_bot** (или свой)
5. **Сохранить токен!** (выглядит как `7123456789:AAHdqT...`)

### 2. Получить OpenAI API Key

1. Зайти: https://platform.openai.com/api-keys
2. Login → Create new secret key
3. **Скопировать ключ!** (начинается с `sk-...`)

### 3. Настроить .env

```bash
cd /root/pbk-crm-unified
nano .env
```

Добавить:
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
OPENAI_API_KEY=sk-your_openai_key_here
DATABASE_URL=postgresql://postgres:password@localhost:5432/pbk_crm
```

Сохранить: `Ctrl+O`, Enter, `Ctrl+X`

### 4. Создать таблицы БД

```bash
psql -U postgres -d pbk_crm -f /root/pbk-crm-unified/database/migrations/003_bot_system.sql
```

Или с DATABASE_URL:
```bash
psql $DATABASE_URL -f /root/pbk-crm-unified/database/migrations/003_bot_system.sql
```

### 5. Запустить бота

```bash
cd /root/pbk-crm-unified/backend
node src/start-telegram-bot.js
```

### 6. Протестировать

1. Открыть Telegram
2. Найти своего бота по username
3. Нажать **START**
4. Написать: "Сколько стоит ремонт квартиры?"

Бот должен ответить! 🎉

---

## 🔍 Проверка

### Проверить что бот работает:
```bash
# Должно быть "✅ Telegram bot is running!"
# И нет ошибок
```

### Проверить в БД:
```sql
-- Должны быть записи
SELECT * FROM bot_conversations;
SELECT * FROM bot_messages ORDER BY created_at DESC LIMIT 5;
```

---

## ❌ Если не работает

### Ошибка: "TELEGRAM_BOT_TOKEN is required"
```bash
# Проверить .env
cat .env | grep TELEGRAM

# Должно показать ваш токен
```

### Ошибка: "OpenAI API error"
```bash
# Проверить ключ
cat .env | grep OPENAI

# Проверить что ключ валидный
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" | jq '.data[0]'
```

### Ошибка: "Database connection failed"
```bash
# Проверить БД
psql $DATABASE_URL -c "SELECT 1"

# Проверить таблицы
psql $DATABASE_URL -c "\dt bot_*"
```

---

## 🎯 Следующие шаги

После успешного запуска:

1. **Кастомизировать промпты** - открыть `backend/src/services/ai/openai-service.js`
2. **Добавить в PM2** для auto-restart
3. **Настроить webhook** (для production)
4. **Добавить WhatsApp бот**
5. **Улучшить UI в CRM** для просмотра разговоров

---

## 📞 Помощь

Логи бота:
```bash
tail -f /root/pbk-crm-unified/backend/logs/combined.log
```

Остановить бота:
```bash
Ctrl+C
```

Запустить в фоне (PM2):
```bash
pm2 start src/start-telegram-bot.js --name telegram-bot
pm2 logs telegram-bot
```

---

**Готово!** Ваш Telegram бот с AI работает! 🎉
