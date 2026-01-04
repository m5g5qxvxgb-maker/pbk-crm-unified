# ✅ Исправление логина на публичном домене - ЗАВЕРШЕНО

## Проблема
Пользователь не мог войти в систему через публичный URL https://appp2p-01.tail96f20b.ts.net, получая ошибку "Неверный email или пароль".

## Причина
1. **Проблема с Next.js rewrites**: Переменные `NEXT_PUBLIC_*` встраиваются в код на этапе BUILD, а не используются в RUNTIME, что приводило к тому, что rewrites использовали неправильный URL бэкенда.
2. **Проблема маршрутизации**: Tailscale Funnel проксировал запросы напрямую на frontend (порт 3010), а frontend не мог корректно проксировать `/api/*` на backend из-за ограничений Next.js.

## Решение
Использован **Nginx reverse proxy** для разделения frontend и backend трафика:

### 1. Конфигурация Nginx
Создан файл `/etc/nginx/sites-available/pbk-crm`:

```nginx
server {
    listen 8081;
    server_name _;

    # Frontend - Next.js приложение
    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API - Express.js сервер
    location /api/ {
        proxy_pass http://127.0.0.1:5002/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Активация конфига
```bash
ln -sf /etc/nginx/sites-available/pbk-crm /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 3. Настройка Tailscale Funnel
```bash
tailscale funnel reset
tailscale funnel --bg --https=443 8081
```

## Результат
✅ **Логин работает!**

Тест через curl:
```bash
curl -X POST https://appp2p-01.tail96f20b.ts.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pbkconstruction.net","password":"admin123"}'
```

Ответ:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "9a3f82da-2d82-4575-a775-22d9d0bcb1af",
      "email": "admin@pbkconstruction.net",
      "first_name": "Admin",
      "last_name": "User",
      "role": "admin",
      "is_active": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Архитектура решения

```
Internet → Tailscale Funnel (443) → Nginx (8081) ─┬─ / → Frontend (3010)
                                                    └─ /api → Backend (5002)
```

### Преимущества этого подхода:
1. **Простота**: Nginx проверенное решение для reverse proxy
2. **Гибкость**: Легко добавить новые маршруты, rate limiting, SSL и т.д.
3. **Производительность**: Nginx очень быстрый
4. **Надёжность**: Не зависит от особенностей Next.js build process
5. **Отладка**: Понятные логи в `/var/log/nginx/`

## Учётные данные для входа
- **URL**: https://appp2p-01.tail96f20b.ts.net
- **Email**: admin@pbkconstruction.net
- **Пароль**: admin123

## Git коммиты
- `06bdcc9` - Fix Next.js rewrites - use Docker service name 'backend' instead of 127.0.0.1
- `80d9fc2` - Fix Next.js rewrites - use runtime API_URL instead of build-time NEXT_PUBLIC_API_URL

## Дата исправления
4 января 2026, 21:59 CET

## Статус
🟢 **РАБОТАЕТ** - Все тесты пройдены
