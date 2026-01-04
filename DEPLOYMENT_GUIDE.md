# 🚀 Deployment Guide - PBK CRM Unified

## Быстрый старт на VPS/VDS сервере

### Требования

- **OS:** Ubuntu 20.04+ / Debian 11+
- **RAM:** Минимум 2GB (рекомендуется 4GB)
- **CPU:** 2 cores
- **Disk:** 20GB свободного места
- **Доступ:** SSH с root или sudo

---

## 📦 Вариант 1: Развертывание через Docker (РЕКОМЕНДУЕТСЯ)

### Шаг 1: Установка Docker

```bash
# Подключаемся к серверу
ssh root@YOUR_SERVER_IP

# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Устанавливаем Docker Compose
apt install docker-compose -y

# Проверяем установку
docker --version
docker-compose --version
```

### Шаг 2: Клонируем репозиторий

```bash
# Устанавливаем git если нужно
apt install git -y

# Клонируем проект
cd /opt
git clone https://github.com/m5g5qxvxgb-maker/pbk-crm-unified.git
cd pbk-crm-unified
```

### Шаг 3: Настраиваем окружение

```bash
# Копируем .env файл
cp .env.example .env

# Редактируем .env
nano .env
```

**Обязательные настройки в .env:**

```env
# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=pbk_crm
POSTGRES_USER=pbk_user
POSTGRES_PASSWORD=СГЕНЕРИРУЙТЕ_СЛОЖНЫЙ_ПАРОЛЬ

# Backend
NODE_ENV=production
PORT=5001
JWT_SECRET=СГЕНЕРИРУЙТЕ_СЕКРЕТНЫЙ_КЛЮЧ_64_СИМВОЛА

# Frontend
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:5001

# Telegram Bot
TELEGRAM_BOT_TOKEN=8003573668:AAHHs6GUJx-pUEL-fxe_lwVJCRutftrCZ30
TELEGRAM_ADMIN_CHAT_ID=533868685

# Retell AI
RETELL_API_KEY=key_786fb7dcafb79358855d31b440ea
RETELL_AGENT_ID=agent_71ccc151eb0e467fa379c139a6
RETELL_PHONE_NUMBER=48223762013

# OpenAI
OPENAI_API_KEY=sk-proj-147bC_7Y3arL9uY9SvrG...
```

### Шаг 4: Запускаем через Docker Compose

```bash
# Собираем и запускаем контейнеры
docker-compose up -d --build

# Проверяем статус
docker-compose ps

# Ожидаемый вывод:
# NAME                COMMAND             SERVICE    STATUS
# pbk-postgres        "docker-entrypoint" postgres   Up
# pbk-backend         "node src/index.js" backend    Up
# pbk-frontend        "npm run dev"       frontend   Up
# pbk-telegram-bot    "node unified-bot"  telegram   Up
```

### Шаг 5: Инициализируем базу данных

```bash
# Подключаемся к контейнеру backend
docker exec -it pbk-backend bash

# Запускаем миграции
npm run migrate

# Выходим
exit
```

### Шаг 6: Проверяем работу

```bash
# Backend
curl http://localhost:5001/health
# Должно вернуть: {"status":"ok","timestamp":"..."}

# Frontend
curl http://localhost:3000
# Должна вернуться HTML страница

# Логи
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 🔧 Вариант 2: Развертывание без Docker (PM2)

### Шаг 1: Установка зависимостей

```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# PostgreSQL 14+
apt install -y postgresql postgresql-contrib

# PM2 (Process Manager)
npm install -g pm2

# Проверка
node --version  # v18.x.x
npm --version   # 9.x.x
psql --version  # 14.x
```

### Шаг 2: Настройка PostgreSQL

```bash
# Входим в PostgreSQL
sudo -u postgres psql

# Создаем базу и пользователя
CREATE DATABASE pbk_crm;
CREATE USER pbk_user WITH PASSWORD 'ВАШ_СЛОЖНЫЙ_ПАРОЛЬ';
GRANT ALL PRIVILEGES ON DATABASE pbk_crm TO pbk_user;
\q

# Редактируем pg_hba.conf для доступа
nano /etc/postgresql/14/main/pg_hba.conf

# Добавляем строку:
# local   pbk_crm   pbk_user   md5

# Перезапускаем PostgreSQL
systemctl restart postgresql
```

### Шаг 3: Клонируем и настраиваем проект

```bash
cd /opt
git clone https://github.com/m5g5qxvxgb-maker/pbk-crm-unified.git
cd pbk-crm-unified

# Настраиваем .env
cp .env.example .env
nano .env

# Изменяем:
# POSTGRES_HOST=localhost
# NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:5001
```

### Шаг 4: Устанавливаем зависимости

```bash
# Backend
cd backend
npm install --production
cd ..

# Frontend
cd frontend
npm install
npm run build
cd ..

# Telegram bot
cd telegram-bot
npm install
cd ..
```

### Шаг 5: Запускаем миграции

```bash
cd backend
npm run migrate
cd ..
```

### Шаг 6: Запускаем через PM2

```bash
# Backend
pm2 start backend/src/index.js --name pbk-backend

# Frontend
cd frontend
pm2 start npm --name pbk-frontend -- start

# Telegram Bot
cd ../telegram-bot
pm2 start unified-bot.js --name pbk-telegram

# Сохраняем конфигурацию PM2
pm2 save
pm2 startup

# Проверяем статус
pm2 status
```

---

## 🌐 Настройка Nginx (Reverse Proxy)

### Установка Nginx

```bash
apt install nginx -y
```

### Создаем конфигурацию

```bash
nano /etc/nginx/sites-available/pbk-crm
```

**Конфигурация:**

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN.COM;  # или IP адрес

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Статические файлы
    location /_next/static {
        proxy_pass http://localhost:3000/_next/static;
        proxy_cache_valid 60m;
    }
}
```

### Активируем конфигурацию

```bash
# Создаем симлинк
ln -s /etc/nginx/sites-available/pbk-crm /etc/nginx/sites-enabled/

# Проверяем конфигурацию
nginx -t

# Перезапускаем Nginx
systemctl restart nginx

# Автозапуск
systemctl enable nginx
```

---

## 🔒 SSL/HTTPS (Let's Encrypt)

```bash
# Устанавливаем Certbot
apt install certbot python3-certbot-nginx -y

# Получаем сертификат
certbot --nginx -d YOUR_DOMAIN.COM

# Автопродление (добавляется автоматически)
certbot renew --dry-run
```

---

## 🔥 Настройка Firewall

```bash
# UFW (Ubuntu Firewall)
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# Проверяем
ufw status
```

---

## 📊 Мониторинг и логи

### PM2 Monitoring

```bash
# Статус процессов
pm2 status

# Логи в реальном времени
pm2 logs

# Логи конкретного приложения
pm2 logs pbk-backend
pm2 logs pbk-frontend

# Мониторинг ресурсов
pm2 monit

# Перезапуск при ошибках
pm2 restart all
```

### Docker Logs

```bash
# Все логи
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f frontend

# Последние 100 строк
docker-compose logs --tail=100 backend
```

### System Logs

```bash
# Nginx логи
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PostgreSQL логи
tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## 🔄 Обновление системы

### Docker

```bash
cd /opt/pbk-crm-unified

# Получаем последние изменения
git pull origin master

# Пересобираем контейнеры
docker-compose down
docker-compose up -d --build

# Проверяем
docker-compose ps
```

### PM2

```bash
cd /opt/pbk-crm-unified

# Получаем последние изменения
git pull origin master

# Backend
cd backend
npm install --production
pm2 restart pbk-backend

# Frontend
cd ../frontend
npm install
npm run build
pm2 restart pbk-frontend

# Telegram
cd ../telegram-bot
npm install
pm2 restart pbk-telegram
```

---

## 🔧 Troubleshooting

### Backend не запускается

```bash
# Проверяем логи
pm2 logs pbk-backend --lines 50

# Или для Docker
docker-compose logs backend --tail=50

# Проверяем подключение к БД
docker exec -it pbk-postgres psql -U pbk_user -d pbk_crm -c "SELECT 1;"
```

### Frontend показывает 502 Error

```bash
# Проверяем статус Frontend
pm2 status pbk-frontend

# Проверяем .env.local
cat frontend/.env.local
# Должно быть: NEXT_PUBLIC_API_URL=http://YOUR_IP:5001

# Перезапускаем
pm2 restart pbk-frontend
```

### Telegram Bot не отвечает

```bash
# Проверяем логи
pm2 logs pbk-telegram

# Проверяем токен
curl https://api.telegram.org/bot8003573668:AAHHs6GUJx-pUEL-fxe_lwVJCRutftrCZ30/getMe

# Перезапускаем
pm2 restart pbk-telegram
```

### База данных не мигрирует

```bash
# Проверяем подключение
cd backend
node -e "require('./src/config/database').query('SELECT NOW()').then(r => console.log(r.rows))"

# Запускаем миграции вручную
psql -U pbk_user -d pbk_crm -f database/schema.sql
```

---

## 📋 Checklist перед production

- [ ] Изменен JWT_SECRET на случайную строку 64+ символов
- [ ] Изменен POSTGRES_PASSWORD на сложный пароль
- [ ] Настроен домен в .env (NEXT_PUBLIC_API_URL)
- [ ] Настроен SSL/HTTPS через Certbot
- [ ] Firewall настроен (только 22, 80, 443)
- [ ] PM2 автозапуск настроен (`pm2 startup`)
- [ ] Nginx автозапуск активен (`systemctl enable nginx`)
- [ ] PostgreSQL бэкапы настроены (cron)
- [ ] Логи мониторятся
- [ ] Telegram бот работает
- [ ] Retell AI подключен и работает
- [ ] Создан первый admin пользователь

---

## 🎯 Быстрая проверка после deployment

```bash
# 1. Health check
curl http://YOUR_SERVER/api/health
# ✅ Должно вернуть: {"status":"ok"}

# 2. Frontend
curl -I http://YOUR_SERVER
# ✅ Должно вернуть: HTTP/1.1 200 OK

# 3. Login test
curl -X POST http://YOUR_SERVER/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pbkconstruction.net","password":"admin123"}'
# ✅ Должно вернуть токен

# 4. PM2 status
pm2 status
# ✅ Все процессы должны быть online

# 5. Docker status (если используется)
docker-compose ps
# ✅ Все контейнеры Up
```

---

## 📞 Поддержка

- **GitHub:** https://github.com/m5g5qxvxgb-maker/pbk-crm-unified
- **Issues:** https://github.com/m5g5qxvxgb-maker/pbk-crm-unified/issues

---

**Дата создания:** 4 января 2026  
**Версия:** 1.0 - Production Ready  
**Статус тестирования:** 83% тестов пройдено
