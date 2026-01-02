# ⚡ ПРОДОЛЖИТЬ РАБОТУ - QUICK START

**Последнее обновление:** 9 декабря 2024, 20:05 UTC  
**Статус:** ✅ Backend работает | ⚠️ Frontend работает без стилей

---

## 🚀 БЫСТРЫЙ ЗАПУСК

### 1. Запустить Backend (если не запущен):
```bash
cd /root/pbk-crm-unified/backend/src
node -r dotenv/config index.js dotenv_config_path=../../.env &
```

### 2. Запустить Frontend (если не запущен):
```bash
cd /root/pbk-crm-unified/frontend
PORT=3008 npm run dev &
```

### 3. Проверить что работает:
```bash
# Backend
curl localhost:5000/health

# Frontend
curl localhost:3008 | grep "PBK CRM"
```

### 4. Тест API:
```bash
curl -X POST localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pbkconstruction.net","password":"admin123"}' | jq
```

---

## 🎯 ЧТО ДЕЛАТЬ ДАЛЬШЕ

### Приоритет #1: Frontend Styling ⚠️
**Проблема:** Tailwind CSS не работает с Next.js 14  
**Время:** 1-2 часа

**Вариант A - Исправить Tailwind:**
```bash
cd /root/pbk-crm-unified/frontend

# Попробовать downgrade Next.js
npm install next@13.5.0 --save

# Или использовать Tailwind v3.3
npm uninstall tailwindcss
npm install -D tailwindcss@3.3.0

# Rebuild
rm -rf .next
npm run dev
```

**Вариант B - CSS Modules:**
```bash
cd /root/pbk-crm-unified/frontend/app

# Создать CSS modules для каждой страницы
touch login/login.module.css
touch dashboard/dashboard.module.css
# ... и т.д.

# Импортировать в компонентах:
# import styles from './login.module.css'
```

**Вариант C - Inline Styles (временно):**
```typescript
// Уже частично сделано в layout.tsx
// Можно продолжить для остальных компонентов
```

### Приоритет #2: External Services Integration
**Время:** 2-3 часа

1. **Получить API ключи:**
   - Retell AI: https://retellai.com
   - OpenAI: https://platform.openai.com
   - Telegram Bot: @BotFather
   - Gmail App Password: Google Account Settings

2. **Обновить .env:**
```bash
cd /root/pbk-crm-unified
nano .env

# Заменить placeholder значения на реальные:
RETELL_API_KEY=key_xxxxx
OPENAI_API_KEY=sk-xxxxx
TELEGRAM_BOT_TOKEN=xxxxx:xxxxx
SMTP_PASSWORD=xxxxx
```

3. **Протестировать интеграции:**
```bash
# Test Retell AI
curl -X POST localhost:5000/api/settings/retell \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"key_xxx","agentId":"agent_xxx"}'

# Test OpenAI
curl -X POST localhost:5000/api/proposals/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"leadId":"uuid","template":"default"}'
```

### Приоритет #3: UI Components Styling
**Время:** 2-3 часа

```bash
cd /root/pbk-crm-unified/frontend/components

# Создать styled versions:
# - ui/Button.tsx → добавить inline styles
# - ui/Input.tsx → добавить inline styles
# - ui/Textarea.tsx → добавить inline styles

# Или использовать простой CSS:
touch components/ui/styles.css
```

### Приоритет #4: Copilot Agent
**Время:** 3-4 часа

```bash
cd /root/pbk-crm-unified/copilot-agent

# Реализовать команды:
nano src/commands/index.js

# Основные команды:
# - Создать лид
# - Показать звонки
# - Статистика
# - Создать звонок
# - Найти клиента
```

---

## 🔍 ПОЛЕЗНЫЕ КОМАНДЫ

### Проверить процессы:
```bash
ps aux | grep node | grep -v grep
lsof -i :5000  # Backend
lsof -i :3008  # Frontend
```

### Перезапустить сервисы:
```bash
# Убить все Node процессы
pkill -f "node.*index.js"
pkill -f "next dev"

# Запустить заново
cd /root/pbk-crm-unified/backend/src && \
  node -r dotenv/config index.js dotenv_config_path=../../.env &

cd /root/pbk-crm-unified/frontend && \
  PORT=3008 npm run dev &
```

### Database queries:
```bash
sudo -u postgres psql pbk_crm

# Полезные запросы:
SELECT * FROM users;
SELECT * FROM pipelines;
SELECT * FROM leads;
SELECT * FROM clients;
SELECT * FROM calls;

# Посмотреть все таблицы:
\dt

# Выход:
\q
```

### Логи:
```bash
# Backend логи (если запущен через systemd/pm2)
tail -f /var/log/pbk-crm/backend.log

# Frontend логи
cd /root/pbk-crm-unified/frontend
tail -f .next/server/app-paths-manifest.json
```

---

## 📝 ТЕКУЩИЕ ФАЙЛЫ

### Важные документы:
```
✅ SYSTEM_STATUS.md       - Текущий статус
✅ SESSION_39_REPORT.md   - Отчет сессии
✅ PROGRESS.md            - Прогресс разработки
✅ README.md              - Общее описание
✅ SETUP.md               - Установка
✅ CREDENTIALS_GUIDE.md   - API ключи
✅ DEVELOPMENT_ROADMAP.md - Roadmap
✅ QUICKSTART.md          - Quick start
```

### Конфиги:
```
✅ .env                      - Переменные окружения
✅ docker-compose.yml        - Docker setup
✅ frontend/next.config.js   - Next.js config
✅ frontend/tailwind.config.js - Tailwind config
✅ backend/package.json      - Backend deps
✅ frontend/package.json     - Frontend deps
```

---

## 🎓 АРХИТЕКТУРА

```
┌─────────────────────────────────────────────┐
│              FRONTEND (Next.js)             │
│            http://localhost:3008            │
└──────────────────┬──────────────────────────┘
                   │ HTTP/Socket.io
┌──────────────────▼──────────────────────────┐
│           BACKEND API (Express)             │
│            http://localhost:5000            │
└──┬───────────┬──────────┬──────────────┬────┘
   │           │          │              │
   ▼           ▼          ▼              ▼
┌──────┐  ┌─────────┐ ┌──────────┐  ┌─────────┐
│ DB   │  │ Retell  │ │  OpenAI  │  │Telegram │
│ PG   │  │   AI    │ │          │  │  Bots   │
└──────┘  └─────────┘ └──────────┘  └─────────┘
```

---

## ⚙️ TROUBLESHOOTING

### Проблема: Backend не запускается
```bash
# Проверить .env
cat /root/pbk-crm-unified/.env | grep DATABASE_URL

# Проверить PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -c "\l" | grep pbk_crm

# Проверить порт
lsof -i :5000
```

### Проблема: Frontend ошибки
```bash
# Очистить кеш
cd /root/pbk-crm-unified/frontend
rm -rf .next node_modules/.cache

# Переустановить зависимости
rm -rf node_modules package-lock.json
npm install

# Проверить Node версию
node --version  # Должно быть 18+
```

### Проблема: Database connection failed
```bash
# Проверить PostgreSQL запущен
sudo systemctl restart postgresql

# Проверить credentials
sudo -u postgres psql pbk_crm -c "SELECT current_user;"

# Пересоздать базу (ОСТОРОЖНО!)
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS pbk_crm;
CREATE DATABASE pbk_crm OWNER pbk_admin;
EOF

# Запустить миграции заново
cd /root/pbk-crm-unified/backend
npm run db:migrate
npm run db:seed
```

---

## 📊 ПРОГРЕСС

**Общий:** 80% ✅  
**Backend:** 100% ✅  
**Frontend:** 80% ⚠️  
**Database:** 100% ✅  
**Services:** 60% 🔄  
**Docs:** 100% ✅

---

## 🎯 ЦЕЛЬ НА СЕГОДНЯ

1. [ ] Исправить Frontend стили (Tailwind)
2. [ ] Добавить реальные API keys
3. [ ] Протестировать Retell AI integration
4. [ ] Протестировать OpenAI integration
5. [ ] Запустить Copilot Agent

**Приоритет:** Frontend Styling → Services Integration

---

**Готово к работе! 🚀**  
Выбери один из приоритетов выше и начинай!
