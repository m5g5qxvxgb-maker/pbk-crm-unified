# PBK CRM Unified - Setup Guide

## Быстрый старт

### 1. Установка зависимостей

```bash
# Главная директория
npm install

# Установить зависимости для всех модулей
npm run setup
```

### 2. Конфигурация

```bash
# Скопировать пример env файла
cp .env.example .env

# Отредактировать .env и заполнить все креды
nano .env
```

**Обязательные параметры для заполнения:**
- `DATABASE_URL` - PostgreSQL connection string
- `RETELL_API_KEY` - Retell AI API ключ
- `OPENAI_API_KEY` - OpenAI API ключ
- `TELEGRAM_BOT_TOKEN` - Telegram bot token (основной)
- `COPILOT_TELEGRAM_BOT_TOKEN` - Telegram bot token (для Copilot)
- `SMTP_USER` и `SMTP_PASSWORD` - корпоративная почта
- `JWT_SECRET` - секрет для JWT токенов

### 3. База данных

```bash
# Запустить PostgreSQL (если через Docker)
docker-compose up -d postgres

# Или установить локально PostgreSQL 15+

# Создать схему базы данных
npm run db:migrate

# Заполнить начальными данными
npm run db:seed
```

### 4. Запуск в режиме разработки

```bash
# Запустить все сервисы
npm run dev

# Или по отдельности:
npm run dev:frontend   # Frontend на :3000
npm run dev:backend    # Backend API на :5000
npm run dev:copilot    # Copilot Agent
```

### 5. Запуск в продакшене (Docker)

```bash
# Собрать и запустить все контейнеры
docker-compose up -d

# Проверить статус
docker-compose ps

# Просмотреть логи
docker-compose logs -f
```

## Настройка Cloudflare Tunnel

```bash
# Установить cloudflared (если не установлен)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/

# Авторизоваться
cloudflared tunnel login

# Создать туннель
cloudflared tunnel create pbk-crm

# Настроить конфиг
nano ~/.cloudflared/config.yml
```

**config.yml:**
```yaml
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: crm.pbkconstruction.net
    service: http://localhost:3000
  - service: http_status:404
```

```bash
# Создать DNS запись
cloudflared tunnel route dns pbk-crm crm.pbkconstruction.net

# Запустить туннель
cloudflared tunnel run pbk-crm
```

## Настройка Telegram ботов

### Основной бот (для уведомлений из CRM)

1. Создать бота через @BotFather
2. Получить токен
3. Добавить в `.env` как `TELEGRAM_BOT_TOKEN`
4. Добавить разрешенные chat ID в `TELEGRAM_ADMIN_CHAT_IDS`

### Copilot Agent бот

1. Создать отдельного бота через @BotFather
2. Получить токен
3. Добавить в `.env` как `COPILOT_TELEGRAM_BOT_TOKEN`
4. Добавить разрешенных пользователей в `COPILOT_ALLOWED_USERS`

## Настройка Retell AI

1. Зарегистрироваться на https://retellai.com
2. Создать агента
3. Скопировать API Key и Agent ID
4. Добавить в `.env`:
   - `RETELL_API_KEY`
   - `RETELL_AGENT_ID`
5. Настроить webhook URL: `https://crm.pbkconstruction.net/api/webhooks/retell`

## Настройка корпоративной почты

### Gmail/Google Workspace

1. Включить 2FA для аккаунта
2. Создать App Password
3. Добавить в `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=info@pbkconstruction.net
   SMTP_PASSWORD=<app_password>
   IMAP_HOST=imap.gmail.com
   IMAP_PORT=993
   ```

### Другой провайдер

Найти SMTP/IMAP настройки вашего провайдера и добавить в `.env`

## Первый вход в систему

1. Открыть https://crm.pbkconstruction.net
2. Использовать дефолтные креды:
   - Email: `admin@pbkconstruction.net`
   - Password: `admin123` (изменить после входа!)
3. Перейти в Settings и настроить все сервисы

## Настройка через интерфейс

### Settings -> Retell AI
- API Key
- Agent ID
- System Prompt для звонков
- Knowledge Base
- Voice Settings

### Settings -> OpenAI
- API Key
- Organization ID
- Model (gpt-4-turbo-preview)
- Шаблоны предложений

### Settings -> Email
- SMTP настройки
- IMAP настройки
- Подпись писем
- Шаблоны писем

### Settings -> Copilot Agent
- Telegram Bot Token
- Разрешенные пользователи
- System Prompt
- Ограничения доступа

### Settings -> Pipelines
- Создать/редактировать воронки продаж
- Настроить стадии
- Добавить правила автоматизации

## Структура проекта

```
pbk-crm-unified/
├── frontend/          # Next.js приложение
├── backend/           # Express API
├── copilot-agent/     # Telegram Copilot бот
├── database/          # SQL схемы и миграции
├── config/            # Конфигурационные файлы
├── scripts/           # Утилиты
├── docs/              # Документация
├── .env               # Переменные окружения
├── docker-compose.yml # Docker конфигурация
└── package.json       # Root package
```

## Поддержка

При проблемах проверьте:
1. Логи: `docker-compose logs -f [service]`
2. База данных подключена: `docker-compose exec postgres psql -U pbk_admin -d pbk_crm`
3. Все env переменные заполнены
4. Порты не заняты другими сервисами

## Бэкап

```bash
# База данных
docker-compose exec postgres pg_dump -U pbk_admin pbk_crm > backup.sql

# Файлы
tar -czf uploads-backup.tar.gz /var/pbk-crm/uploads
```

## Обновление

```bash
git pull origin main
npm install
docker-compose build
docker-compose up -d
npm run db:migrate
```
