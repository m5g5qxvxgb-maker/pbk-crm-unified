# ⚡ Быстрый Deploy на Сервер

## Вариант 1: Docker (1 команда!)

```bash
# На сервере (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh && \
apt install -y docker-compose git && \
git clone https://github.com/m5g5qxvxgb-maker/pbk-crm-unified.git && \
cd pbk-crm-unified && \
cp .env.example .env && \
nano .env  # Замени YOUR_SERVER_IP на реальный IP
./deploy.sh production
```

**Готово!** Система доступна на `http://YOUR_IP:3000`

---

## Вариант 2: PM2 (для production без Docker)

```bash
# 1. Установка
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs postgresql git
npm install -g pm2

# 2. База данных
sudo -u postgres psql -c "CREATE DATABASE pbk_crm;"
sudo -u postgres psql -c "CREATE USER pbk_user WITH PASSWORD 'STRONG_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE pbk_crm TO pbk_user;"

# 3. Клонируем
git clone https://github.com/m5g5qxvxgb-maker/pbk-crm-unified.git
cd pbk-crm-unified

# 4. Настройка .env
cp .env.example .env
nano .env  # Редактируем

# 5. Установка зависимостей
cd backend && npm install --production && cd ..
cd frontend && npm install && npm run build && cd ..
cd telegram-bot && npm install && cd ..

# 6. Миграции
cd backend && npm run migrate && cd ..

# 7. Запуск
pm2 start backend/src/index.js --name pbk-backend
cd frontend && pm2 start npm --name pbk-frontend -- start && cd ..
pm2 start telegram-bot/unified-bot.js --name pbk-telegram
pm2 save
pm2 startup
```

---

## С Nginx и SSL

```bash
# Nginx
apt install nginx certbot python3-certbot-nginx -y

# Конфиг
cat > /etc/nginx/sites-available/pbk-crm << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN.COM;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5001;
    }
}
EOF

# Активация
ln -s /etc/nginx/sites-available/pbk-crm /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# SSL
certbot --nginx -d YOUR_DOMAIN.COM
```

---

## Проверка работы

```bash
# Health check
curl http://localhost:5001/health

# Login test
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pbkconstruction.net","password":"admin123"}'

# Frontend
curl -I http://localhost:3000
```

---

## Команды управления

### Docker
```bash
./deploy.sh production  # Запуск
./deploy.sh stop        # Остановка
./deploy.sh restart     # Перезапуск
./deploy.sh logs        # Логи
./deploy.sh status      # Статус
```

### PM2
```bash
pm2 status              # Статус
pm2 logs                # Логи
pm2 restart all         # Перезапуск
pm2 stop all            # Остановка
```

---

## Обновление

```bash
cd /opt/pbk-crm-unified
git pull origin master
./deploy.sh restart production  # Для Docker
# ИЛИ
pm2 restart all                 # Для PM2
```

---

## Полная документация

См. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

## Важные замены в .env

```env
POSTGRES_PASSWORD=СГЕНЕРИРУЙ_СЛОЖНЫЙ_ПАРОЛЬ
JWT_SECRET=СГЕНЕРИРУЙ_СЛУЧАЙНУЮ_СТРОКУ_64_СИМВОЛА
NEXT_PUBLIC_API_URL=http://ВАШ_IP_ИЛИ_ДОМЕН:5001
```

Генератор пароля:
```bash
openssl rand -base64 32
```

---

**Репозиторий:** https://github.com/m5g5qxvxgb-maker/pbk-crm-unified  
**Дата:** 4 января 2026
