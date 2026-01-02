# PBK CRM - Credentials Configuration

## ВАЖНО: Этот файл содержит все креды для настройки системы

### 1. Database (PostgreSQL)
```
DATABASE_URL=postgresql://pbk_admin:YOUR_PASSWORD@localhost:5432/pbk_crm
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pbk_crm
DB_USER=pbk_admin
DB_PASSWORD=YOUR_STRONG_PASSWORD
```

### 2. Retell AI
Получить на: https://retellai.com/dashboard
```
RETELL_API_KEY=key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RETELL_AGENT_ID=agent_xxxxxxxxxxxxxxxxxxxxx
RETELL_FROM_NUMBER=+1234567890
RETELL_WEBHOOK_URL=https://crm.pbkconstruction.net/api/webhooks/retell
```

**Настройка в Retell:**
1. Создать агента
2. Настроить System Prompt (можно через CRM Settings)
3. Добавить Knowledge Base
4. Настроить Webhook

### 3. OpenAI
Получить на: https://platform.openai.com/api-keys
```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_ORGANIZATION_ID=org-xxxxxxxxxxxxx (опционально)
OPENAI_MODEL=gpt-4-turbo-preview
```

### 4. Telegram Bots

#### Основной бот (уведомления из CRM)
Создать через: @BotFather
```
TELEGRAM_BOT_TOKEN=1234567890:ABCDefGHIjklMNOpqrsTUVwxyz
TELEGRAM_ADMIN_CHAT_IDS=123456789,987654321
TELEGRAM_WEBHOOK_URL=https://crm.pbkconstruction.net/api/webhooks/telegram
```

#### Copilot Agent бот
Создать через: @BotFather (отдельный бот)
```
COPILOT_TELEGRAM_BOT_TOKEN=9876543210:ZYXwvuTSRqponMLKjiHGFedCBA
COPILOT_ALLOWED_USERS=123456789,987654321
```

**Как получить Chat ID:**
1. Написать @userinfobot
2. Или использовать @getmyid_bot
3. Добавить в список разрешенных

### 5. Корпоративная почта

#### Gmail / Google Workspace
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=info@pbkconstruction.net
SMTP_PASSWORD=xxxx xxxx xxxx xxxx (App Password)

IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=info@pbkconstruction.net
IMAP_PASSWORD=xxxx xxxx xxxx xxxx (App Password)
```

**Как получить App Password (Gmail):**
1. Включить 2FA: https://myaccount.google.com/security
2. Перейти: https://myaccount.google.com/apppasswords
3. Создать новый App Password для "Mail"
4. Скопировать 16-значный пароль

#### Microsoft 365 / Outlook
```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=info@pbkconstruction.net
SMTP_PASSWORD=your_password

IMAP_HOST=outlook.office365.com
IMAP_PORT=993
```

### 6. Application Security
```
NODE_ENV=production
PORT=3000
API_PORT=5000

# Сгенерировать случайные строки:
# openssl rand -base64 32
SECRET_KEY=your_64_character_random_string_here
JWT_SECRET=your_64_character_random_string_here
SESSION_SECRET=your_64_character_random_string_here
```

### 7. Cloudflare
```
CLOUDFLARE_TUNNEL_TOKEN=your_tunnel_token
DOMAIN=crm.pbkconstruction.net
```

**Как получить:**
1. https://one.dash.cloudflare.com/
2. Zero Trust -> Access -> Tunnels
3. Create tunnel
4. Скопировать token

### 8. Redis (для кеша)
```
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
```

### 9. Storage
```
UPLOAD_DIR=/var/pbk-crm/uploads
TEMP_DIR=/var/pbk-crm/temp
```

### 10. Monitoring (опционально)
```
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
LOG_LEVEL=info
```

---

## Чеклист настройки

- [ ] PostgreSQL база данных создана
- [ ] Retell AI аккаунт и агент созданы
- [ ] OpenAI API ключ получен
- [ ] Telegram бот (основной) создан
- [ ] Telegram бот (Copilot) создан
- [ ] Корпоративная почта настроена
- [ ] JWT секреты сгенерированы
- [ ] Cloudflare Tunnel настроен
- [ ] Redis запущен
- [ ] Директории для uploads созданы
- [ ] Все креды добавлены в .env
- [ ] docker-compose up -d запущен
- [ ] npm run db:migrate выполнен
- [ ] Первый вход в систему выполнен

---

## Тестирование

### База данных
```bash
psql postgresql://pbk_admin:password@localhost:5432/pbk_crm
```

### API
```bash
curl http://localhost:5000/health
```

### Frontend
```
http://localhost:3000
```

### Telegram боты
Отправить /start обоим ботам

### Email
Отправить тестовое письмо через Settings

---

## Безопасность

⚠️ **НИКОГДА не коммитьте .env файл в git!**
⚠️ **Используйте сильные пароли для всех сервисов!**
⚠️ **Регулярно меняйте JWT секреты!**
⚠️ **Ограничьте доступ к базе данных по IP!**
⚠️ **Включите SSL для всех соединений!**

---

## Контакты для получения кредов

- **Retell AI:** support@retellai.com
- **OpenAI:** https://help.openai.com
- **Telegram:** @BotFather
- **Cloudflare:** support@cloudflare.com
