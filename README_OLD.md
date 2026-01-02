# 🏗️ PBK CRM Unified System

> Unified CRM system with AI-powered calls, email management, and sales pipeline automation

**Статус:** 75% готово ✅  
**Прогресс:** Backend 100% | Frontend 75%

---

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- PostgreSQL 14+
- npm или yarn

### Установка

```bash
# 1. Клонировать и установить
cd /root/pbk-crm-unified

# 2. Backend
cd backend
npm install

# Настроить .env
cp ../.env.example ../.env
# Заполнить DATABASE_URL, JWT_SECRET

# Создать БД
npm run db:migrate
npm run db:seed

# Запустить
npm start  # Port 5000

# 3. Frontend (в новом терминале)
cd ../frontend
npm install
npm run dev  # Port 3000
```

### Доступ

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Login:** admin@pbkconstruction.net / admin123

---

## ✨ Функционал

### ✅ Готово

- **🔐 Авторизация** - JWT authentication
- **📊 Dashboard** - Метрики и quick actions
- **⚙️ Settings** - Настройка всех сервисов
  - Retell AI (calls)
  - OpenAI (AI features)
  - Email (SMTP/IMAP)
  - Telegram (bots)
- **📞 Calls** - Полное управление звонками
  - Создание заявок
  - Подтверждение/отклонение
  - Просмотр расшифровок
  - Перевод на 6 языков
  - Скачивание записей

### 🚧 В разработке

- **👥 Leads** - Kanban board
- **🏢 Clients** - Управление клиентами
- **✉️ Emails** - Интеграция email
- **💼 Proposals** - AI-генерация предложений

---

## �� Структура

```
pbk-crm-unified/
├── backend/          # Express API + Socket.io
├── frontend/         # Next.js 14 + React 18
├── database/         # PostgreSQL schema
├── docs/             # Documentation
├── copilot-agent/    # Telegram AI bot
└── .env.example      # Environment template
```

---

## 🔧 API Endpoints

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`

### Calls
- `GET /api/calls`
- `POST /api/calls/request`
- `POST /api/calls/request/:id/approve`
- `GET /api/calls/:id/transcript`
- `POST /api/calls/:id/translate`

### Settings
- `GET /api/settings`
- `PUT /api/settings/retell`
- `PUT /api/settings/openai`
- `POST /api/settings/test/retell`

[Full API docs →](./docs/API_REFERENCE.md)

---

## 🎯 Roadmap

- [x] Backend API (100%)
- [x] Database schema (100%)
- [x] Frontend core (100%)
- [x] Settings page (100%)
- [x] Dashboard (100%)
- [x] Calls page (100%)
- [ ] Leads page (0%)
- [ ] Clients page (0%)
- [ ] Testing (0%)

---

## 📚 Документация

- [FINAL_SUMMARY.md](./FINAL_SUMMARY.md) - Полный обзор
- [PROGRESS.md](./PROGRESS.md) - Текущий прогресс
- [docs/](./docs/) - Детальная документация

---

## 🛠️ Технологии

**Backend:** Express, PostgreSQL, Socket.io, JWT  
**Frontend:** Next.js, React, TypeScript, Tailwind  
**Integrations:** Retell AI, OpenAI, Nodemailer, Telegram

---

## 📝 License

Private project for PBK Construction

---

**Разработано:** 9 декабря 2024  
**Версия:** 0.75.0
