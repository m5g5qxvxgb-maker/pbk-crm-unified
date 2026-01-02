# 🚀 PBK CRM/ERP - ИНСТРУКЦИЯ ПО ДЕПЛОЮ

## Текущий статус

✅ Backend: работает на localhost:5000
✅ Frontend: работает на localhost:3008
⚠️ Telegram Bot: готов, но конфликт токенов

## Домен

Предположительно должен быть доступен на:
- https://crm.pbkconstruction.net

## Вариант 1: Cloudflare Tunnel (РЕКОМЕНДУЕТСЯ)

```bash
# Проверить существующие туннели
cloudflared tunnel list

# Создать новый туннель для CRM (если нужно)
cloudflared tunnel create pbk-crm

# Настроить конфигурацию
cat > /root/.cloudflared/pbk-crm-config.yml << 'CFEOF'
tunnel: pbk-crm
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: crm.pbkconstruction.net
    service: http://localhost:3008
  - hostname: api.crm.pbkconstruction.net
    service: http://localhost:5000
  - service: http_status:404
CFEOF

# Запустить туннель
cloudflared tunnel run pbk-crm
```

## Вариант 2: Nginx Reverse Proxy

```bash
# Создать конфиг nginx
cat > /etc/nginx/sites-available/pbk-crm << 'NGINXEOF'
server {
    listen 80;
    server_name crm.pbkconstruction.net;
    
    location / {
        proxy_pass http://localhost:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name api.crm.pbkconstruction.net;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINXEOF

# Активировать
ln -s /etc/nginx/sites-available/pbk-crm /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Вариант 3: PM2 Process Manager

```bash
# Создать PM2 ecosystem
cat > /root/pbk-crm-unified/ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [
    {
      name: 'pbk-crm-backend',
      cwd: '/root/pbk-crm-unified/backend/src',
      script: 'index.js',
      node_args: '-r dotenv/config',
      env: {
        dotenv_config_path: '../../.env'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'pbk-crm-frontend',
      cwd: '/root/pbk-crm-unified/frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3008',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3008
      }
    },
    {
      name: 'pbk-unified-bot',
      cwd: '/root/pbk-crm-unified/telegram-bot',
      script: 'unified-bot.js',
      instances: 1,
      autorestart: true,
      watch: false
    }
  ]
};
PM2EOF

# Собрать frontend для production
cd /root/pbk-crm-unified/frontend
npm run build

# Запустить через PM2
pm2 start /root/pbk-crm-unified/ecosystem.config.js
pm2 save
pm2 startup
```

## DNS настройки

В Cloudflare добавить A-записи:
- crm.pbkconstruction.net → IP сервера
- api.crm.pbkconstruction.net → IP сервера

Или CNAME для Cloudflare Tunnel:
- crm.pbkconstruction.net → <TUNNEL_ID>.cfargotunnel.com

## SSL сертификаты

### Через Cloudflare:
- Автоматически если используется Cloudflare Tunnel

### Через Let's Encrypt:
```bash
certbot --nginx -d crm.pbkconstruction.net -d api.crm.pbkconstruction.net
```

## Проверка

```bash
# Backend health
curl https://api.crm.pbkconstruction.net/health

# Frontend
curl -I https://crm.pbkconstruction.net

# Telegram Bot
# Отправьте /start в @Pbkauto_bot
```

## Финальные шаги

1. ✅ Запустить backend (PM2 или nohup)
2. ✅ Собрать и запустить frontend
3. ⚠️ Решить конфликт Telegram бота
4. ✅ Настроить Cloudflare Tunnel или Nginx
5. ✅ Обновить DNS
6. ✅ Протестировать доступ

---

**Создано:** 10 декабря 2024
**Статус:** Готово к деплою
