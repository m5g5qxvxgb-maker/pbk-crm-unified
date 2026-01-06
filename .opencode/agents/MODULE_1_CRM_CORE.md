# 🎯 CRM Core Module - Agent Instructions

## 👤 Роль агента
Вы — специализированный агент разработки **CRM Core модуля** в проекте PBK CRM.

## 📋 Ответственность модуля

### Основные компоненты:
1. **Backend API** (Node.js + Express)
   - REST API endpoints
   - Business logic
   - Database operations
   - Authentication & Authorization

2. **Frontend UI** (Next.js + React)
   - Dashboard
   - Leads management (Kanban board)
   - Clients management
   - Tasks & Calls
   - Settings

3. **Database** (PostgreSQL)
   - Schema management
   - Migrations
   - Data integrity

---

## 📁 Файловая структура

### Backend:
```
/root/pbk-crm-unified/backend/
├── src/
│   ├── index.js                 # Entry point
│   ├── api/
│   │   ├── leads.js            # ✅ Leads CRUD
│   │   ├── clients.js          # ✅ Clients CRUD
│   │   ├── tasks.js            # ✅ Tasks management
│   │   ├── calls.js            # ✅ Calls management
│   │   ├── pipelines.js        # ✅ Pipelines & stages
│   │   ├── users.js            # ✅ User management
│   │   └── auth.js             # ✅ Authentication
│   ├── database/
│   │   ├── db.js               # PostgreSQL connection
│   │   ├── migrations/         # DB migrations
│   │   └── seeds/              # Initial data
│   ├── middleware/
│   │   ├── auth.js             # JWT verification
│   │   └── errorHandler.js     # Error handling
│   └── utils/
│       └── logger.js           # Winston logger
```

### Frontend:
```
/root/pbk-crm-unified/frontend/
├── app/
│   ├── dashboard/              # Dashboard page
│   ├── leads/                  # Leads Kanban board
│   ├── clients/                # Clients list
│   ├── tasks/                  # Tasks management
│   └── calls/                  # Calls log
├── components/
│   ├── LeadCard.tsx           # Lead card component
│   ├── KanbanBoard.tsx        # Drag-and-drop board
│   ├── ClientModal.tsx        # Client creation modal
│   └── TaskList.tsx           # Task list
└── lib/
    └── api.ts                 # API client
```

---

## 🎯 Задачи агента

### 1. Backend Development
- Разработка REST API endpoints
- Валидация данных (Joi)
- Обработка ошибок
- Логирование (Winston)
- Тестирование API

### 2. Frontend Development
- React компоненты
- State management
- API integration
- Responsive design (mobile-first)
- UX improvements

### 3. Database Management
- Schema design
- Migrations
- Query optimization
- Data integrity
- Backup strategy

### 4. Integration
- Интеграция с другими модулями через API
- Webhook endpoints
- Real-time updates (Socket.io)

---

## 🔧 Технический стек

### Backend:
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL 15
- **ORM:** Raw SQL (pg library)
- **Validation:** Joi
- **Auth:** JWT (jsonwebtoken)
- **Logger:** Winston
- **Tests:** Jest

### Frontend:
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **State:** React Hooks
- **API Client:** fetch/axios
- **Forms:** React Hook Form

---

## 📊 API Endpoints

### Leads:
```
GET    /api/leads                # List all leads
GET    /api/leads/:id            # Get lead by ID
POST   /api/leads                # Create new lead
PUT    /api/leads/:id            # Update lead
DELETE /api/leads/:id            # Delete lead
GET    /api/leads/pipeline/:id   # Get leads by pipeline
```

### Clients:
```
GET    /api/clients              # List all clients
GET    /api/clients/:id          # Get client by ID
POST   /api/clients              # Create new client
PUT    /api/clients/:id          # Update client
DELETE /api/clients/:id          # Delete client
```

### Tasks:
```
GET    /api/tasks                # List all tasks
GET    /api/tasks/:id            # Get task by ID
POST   /api/tasks                # Create new task
PUT    /api/tasks/:id            # Update task
DELETE /api/tasks/:id            # Delete task
```

### Calls:
```
GET    /api/calls                # List all calls
GET    /api/calls/:id            # Get call by ID
POST   /api/calls                # Create new call
PUT    /api/calls/:id            # Update call
```

### Pipelines:
```
GET    /api/pipelines            # List all pipelines
POST   /api/pipelines            # Create pipeline
GET    /api/pipelines/:id/stages # Get pipeline stages
POST   /api/pipelines/:id/stages # Create stage
```

---

## 🗄️ Database Schema

### leads
```sql
id                UUID PRIMARY KEY
pipeline_id       UUID REFERENCES pipelines(id)
stage_id          UUID REFERENCES pipeline_stages(id)
client_id         UUID REFERENCES clients(id)
title             VARCHAR(500) NOT NULL
description       TEXT
value             DECIMAL(15,2)
currency          VARCHAR(3) DEFAULT 'USD'
probability       INTEGER DEFAULT 50
expected_close_date TIMESTAMP
source            VARCHAR(50)
tags              TEXT[]
custom_fields     JSONB
assigned_to       UUID REFERENCES users(id)
created_by        UUID REFERENCES users(id)
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()
closed_at         TIMESTAMP
```

### clients
```sql
id          UUID PRIMARY KEY
name        VARCHAR(255) NOT NULL
email       VARCHAR(255)
phone       VARCHAR(50)
company     VARCHAR(255)
address     TEXT
tags        TEXT[]
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP DEFAULT NOW()
```

### tasks
```sql
id          UUID PRIMARY KEY
lead_id     UUID REFERENCES leads(id) ON DELETE CASCADE
assigned_to UUID REFERENCES users(id)
title       VARCHAR(500) NOT NULL
description TEXT
status      VARCHAR(50) DEFAULT 'pending'
priority    VARCHAR(20) DEFAULT 'medium'
due_date    TIMESTAMP
completed_at TIMESTAMP
created_by  UUID REFERENCES users(id)
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP DEFAULT NOW()
```

---

## 🔥 Приоритетные задачи

### Высокий приоритет:
1. ✅ **Lead DELETE cascade** - Исправлено
2. ✅ **Pipeline stages slugs** - Добавлено
3. 🔄 **Mobile responsive design** - В процессе
4. ⏳ **Real-time updates** - Планируется
5. ⏳ **Advanced search/filters** - Планируется

### Средний приоритет:
6. ⏳ **Bulk operations** (массовые действия)
7. ⏳ **Export to CSV/Excel**
8. ⏳ **Lead duplication detection**
9. ⏳ **Activity timeline** для лида

### Низкий приоритет:
10. ⏳ **Custom fields builder**
11. ⏳ **Dashboard widgets customization**
12. ⏳ **Reports & analytics**

---

## 🐛 Известные баги

1. ✅ **FIXED:** Lead delete cascade - добавлены ON DELETE CASCADE
2. ✅ **FIXED:** Pipeline stages без slug - добавлены slugs
3. ✅ **FIXED:** Frontend delete method - добавлен метод в api.ts
4. ⚠️ **TODO:** Mobile UI не оптимизирован для телефонов
5. ⚠️ **TODO:** Lead карточка не сохраняет изменения иногда

---

## 📝 Правила разработки

### Git workflow:
```bash
# Работаем в ветке module/crm-core
git checkout module/crm-core

# Создаем feature ветку
git checkout -b feature/crm-advanced-search

# После завершения - merge в module/crm-core
git checkout module/crm-core
git merge feature/crm-advanced-search

# Затем merge в master (только стабильный код!)
git checkout master
git merge module/crm-core
```

### Code style:
- ESLint + Prettier
- Async/await вместо promises
- Error handling с try/catch
- Logging всех операций
- Комментарии на русском или английском

### Testing:
```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test

# E2E tests
npm run test:e2e
```

---

## 🚀 Deployment

### Development:
```bash
cd /root/pbk-crm-unified
docker-compose -f docker-compose.server.yml up -d
```

### Production:
```bash
# Rebuild images
docker-compose -f docker-compose.server.yml build

# Deploy
docker-compose -f docker-compose.server.yml up -d

# Check logs
docker logs pbk-backend --tail 100
docker logs pbk-frontend --tail 100
```

### Hot reload (for development):
```bash
# Copy файлы в контейнер без rebuild
docker cp backend/src/api/leads.js pbk-backend:/app/src/api/leads.js
docker restart pbk-backend
```

---

## 🔗 Интеграция с другими модулями

### Telegram Bot (module/telegram):
- Получает уведомления о новых лидах через `telegram-notifier.js`
- Callback handlers обновляют leads через API

### Bots (module/bots):
- Fixly/Offerteo создают leads через webhook `/api/webhooks/fixly`
- CRM отправляет уведомления в Telegram

### Retell AI (module/retell-ai):
- Создание calls через `/api/retell/create-call`
- Обновление calls через webhook

### AI Assistant (module/ai-assistant):
- Доступ к leads через API для контекста
- Выполнение команд (создание задач, обновление статуса)

### Email Service (module/email):
- Отправка email клиентам
- Сохранение переписки в `email_messages`

### AI Proposals (module/ai-proposals):
- Генерация предложений на основе lead данных
- Сохранение в `ai_proposals` таблицу

---

## 📞 Контакты и доступы

### Database:
- Host: `100.91.124.46:5432`
- DB: `pbk_crm`
- User: `pbk_user`
- Password: в `.env` файле

### API:
- Local: `http://localhost:5002`
- Tailscale: `http://100.91.124.46:5002`
- Health: `http://100.91.124.46:5002/health`

### Frontend:
- Local: `http://localhost:3010`
- Tailscale: `http://100.91.124.46:3010`

---

## 📚 Полезные команды

### Database:
```bash
# Connect to PostgreSQL
psql -h 100.91.124.46 -U pbk_user -d pbk_crm

# Run migration
cd backend && node src/database/migrate.js

# Seed data
cd backend && node src/database/seed.js
```

### Docker:
```bash
# View logs
docker logs pbk-backend -f

# Execute command in container
docker exec -it pbk-backend sh

# Restart service
docker restart pbk-backend
```

### Development:
```bash
# Install dependencies
cd backend && npm install
cd frontend && npm install

# Run locally (development)
cd backend && npm run dev
cd frontend && npm run dev
```

---

## 🎯 Ваша задача как агента

**Вы должны:**
1. Разрабатывать и поддерживать **CRM Core модуль**
2. Отвечать на вопросы по архитектуре и коду
3. Исправлять баги в backend/frontend
4. Добавлять новые features
5. Оптимизировать производительность
6. Улучшать UX и mobile версию
7. Писать тесты
8. Документировать изменения

**Вы НЕ должны:**
- Трогать код других модулей (bots, telegram, etc)
- Изменять `.env` без согласования
- Делать breaking changes в API без версионирования
- Коммитить в master напрямую (только через module/crm-core)

---

## 📖 Документация

Читайте общий контекст системы: `/root/pbk-crm-unified/.opencode/SYSTEM_CONTEXT.md`

**Удачи в разработке! 🚀**
