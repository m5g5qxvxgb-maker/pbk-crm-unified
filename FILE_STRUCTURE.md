# 📁 Структура файлов проекта

## Корневая директория

```
/root/pbk-crm-unified/
│
├── 📄 README.md                    # Главное описание проекта
├── 📄 QUICKSTART.md                # Быстрый старт
├── 📄 SETUP.md                     # Полная инструкция установки
├── 📄 CREDENTIALS_GUIDE.md         # Гайд по всем кредам
├── 📄 DEVELOPMENT_ROADMAP.md       # План разработки и задачи
├── 📄 PROJECT_OVERVIEW.md          # Обзор проекта
├── 📄 package.json                 # Root dependencies
├── 📄 .env.example                 # Пример переменных окружения
├── 📄 .env                         # Реальные креды (НЕ В GIT!)
├── 📄 .gitignore                   # Git ignore rules
├── 📄 docker-compose.yml           # Docker конфигурация
│
├── 📁 frontend/                    # Next.js приложение
├── 📁 backend/                     # Express API
├── 📁 copilot-agent/               # Telegram AI бот
├── 📁 database/                    # База данных
├── 📁 config/                      # Конфигурации
├── 📁 scripts/                     # Утилиты
└── 📁 docs/                        # Документация
```

---

## Frontend (`/frontend/`)

```
frontend/
│
├── 📄 package.json                 # Dependencies
├── 📄 next.config.js               # Next.js config
├── 📄 tailwind.config.ts           # Tailwind config
├── 📄 tsconfig.json                # TypeScript config
│
├── 📁 app/                         # Pages (App Router)
│   ├── 📄 layout.tsx               # Root layout
│   ├── 📄 page.tsx                 # Home (Dashboard)
│   ├── 📄 globals.css              # Global styles
│   │
│   ├── 📁 dashboard/
│   │   └── 📄 page.tsx             # Дашборд с метриками
│   │
│   ├── 📁 leads/
│   │   ├── 📄 page.tsx             # Список лидов (Kanban)
│   │   └── 📄 [id]/page.tsx        # Карточка лида
│   │
│   ├── 📁 clients/
│   │   ├── 📄 page.tsx             # Список клиентов
│   │   └── 📄 [id]/page.tsx        # Карточка клиента
│   │
│   ├── 📁 calls/                   # ⭐ Звонки Retell
│   │   ├── 📄 page.tsx             # Все звонки
│   │   ├── 📄 [id]/page.tsx        # Детали звонка
│   │   └── 📁 components/
│   │       ├── 📄 CallList.tsx
│   │       ├── 📄 CallCard.tsx
│   │       ├── 📄 CallRequestForm.tsx
│   │       ├── 📄 CallApprovalModal.tsx
│   │       └── 📄 TranscriptViewer.tsx
│   │
│   ├── 📁 emails/
│   │   ├── 📄 page.tsx             # Inbox/Sent
│   │   └── 📁 components/
│   │       ├── 📄 EmailList.tsx
│   │       ├── 📄 EmailComposer.tsx
│   │       └── 📄 EmailViewer.tsx
│   │
│   ├── 📁 proposals/
│   │   ├── 📄 page.tsx             # Коммерческие предложения
│   │   └── 📁 components/
│   │       ├── 📄 ProposalList.tsx
│   │       ├── 📄 ProposalGenerator.tsx
│   │       └── 📄 ProposalEditor.tsx
│   │
│   ├── 📁 pipelines/
│   │   ├── 📄 page.tsx             # Управление воронками
│   │   └── 📁 components/
│   │       ├── 📄 PipelineBuilder.tsx
│   │       ├── 📄 StageEditor.tsx
│   │       └── 📄 AutomationRules.tsx
│   │
│   ├── 📁 settings/                # ⭐ Настройки
│   │   ├── 📄 page.tsx             # Главная страница настроек
│   │   └── 📁 components/
│   │       ├── 📄 RetellSettings.tsx
│   │       ├── 📄 OpenAISettings.tsx
│   │       ├── 📄 EmailSettings.tsx
│   │       ├── 📄 TelegramSettings.tsx
│   │       └── 📄 CopilotSettings.tsx
│   │
│   └── 📁 api/                     # API routes (если нужны)
│
├── 📁 components/                  # Компоненты
│   ├── 📁 ui/                      # UI компоненты
│   │   ├── 📄 Button.tsx
│   │   ├── 📄 Input.tsx
│   │   ├── 📄 Select.tsx
│   │   ├── 📄 Modal.tsx
│   │   ├── 📄 Card.tsx
│   │   ├── 📄 Table.tsx
│   │   ├── 📄 Badge.tsx
│   │   ├── 📄 Avatar.tsx
│   │   └── 📄 Tabs.tsx
│   │
│   ├── 📁 layout/                  # Layout компоненты
│   │   ├── 📄 Sidebar.tsx
│   │   ├── 📄 Header.tsx
│   │   ├── 📄 Breadcrumbs.tsx
│   │   └── 📄 Providers.tsx
│   │
│   └── 📁 features/                # Feature компоненты
│       ├── 📄 Dashboard.tsx
│       ├── 📄 KanbanBoard.tsx
│       ├── 📄 MetricCard.tsx
│       ├── 📄 ActivityFeed.tsx
│       └── 📄 ChartWrapper.tsx
│
├── 📁 lib/                         # Утилиты
│   ├── 📄 api.ts                   # API client (axios)
│   ├── 📄 socket.ts                # Socket.io client
│   ├── 📄 utils.ts                 # Общие утилиты
│   └── 📄 constants.ts             # Константы
│
├── 📁 hooks/                       # Custom hooks
│   ├── 📄 useAuth.ts
│   ├── 📄 useCalls.ts
│   ├── 📄 useLeads.ts
│   └── 📄 useSocket.ts
│
└── 📁 public/                      # Статика
    ├── 📄 logo.svg
    └── 📄 favicon.ico
```

---

## Backend (`/backend/`)

```
backend/
│
├── 📄 package.json                 # Dependencies
│
├── 📁 src/
│   ├── 📄 index.js                 # ⭐ Main entry point
│   │
│   ├── 📁 api/                     # API Routes
│   │   ├── 📄 auth.js              # Авторизация
│   │   ├── 📄 users.js             # Пользователи
│   │   ├── 📄 clients.js           # Клиенты
│   │   ├── 📄 leads.js             # Лиды
│   │   ├── 📄 pipelines.js         # Воронки
│   │   ├── 📄 calls.js             # ⭐ Звонки (уже создан)
│   │   ├── 📄 emails.js            # Почта
│   │   ├── 📄 proposals.js         # Предложения
│   │   ├── 📄 settings.js          # Настройки
│   │   ├── 📄 webhooks.js          # Webhooks
│   │   └── 📄 dashboard.js         # Dashboard API
│   │
│   ├── 📁 services/                # Сервисы
│   │   ├── 📁 retell/
│   │   │   └── 📄 service.js       # ⭐ Retell AI (создан)
│   │   ├── 📁 openai/
│   │   │   └── 📄 service.js       # ⭐ OpenAI (создан)
│   │   ├── 📁 email/
│   │   │   ├── 📄 smtp.js          # Отправка
│   │   │   └── 📄 imap.js          # Получение
│   │   └── 📁 telegram/
│   │       ├── 📄 bot.js           # Основной бот
│   │       └── 📄 notifications.js # Уведомления
│   │
│   ├── 📁 database/
│   │   ├── 📄 db.js                # ⭐ DB connection (создан)
│   │   ├── 📄 migrate.js           # Migration runner
│   │   └── 📄 seed.js              # Seed data
│   │
│   ├── 📁 middleware/
│   │   ├── 📄 auth.js              # JWT auth
│   │   ├── 📄 validation.js        # Input validation
│   │   ├── 📄 rateLimit.js         # Rate limiting
│   │   └── 📄 errorHandler.js      # Error handler
│   │
│   └── 📁 utils/
│       ├── 📄 logger.js             # ⭐ Winston logger (создан)
│       └── 📄 helpers.js            # Утилиты
│
└── 📁 logs/                        # Логи (auto-created)
```

---

## Copilot Agent (`/copilot-agent/`)

```
copilot-agent/
│
├── 📄 package.json                 # Dependencies
├── 📄 index.js                     # ⭐ Main bot (создан)
├── 📄 SYSTEM_PROMPT.md             # ⭐ Системный промпт (создан)
│
├── 📁 commands/                    # Команды (TODO)
│   ├── 📄 leads.js
│   ├── 📄 calls.js
│   ├── 📄 emails.js
│   └── 📄 statistics.js
│
├── 📁 utils/                       # Утилиты
│   ├── 📄 database.js
│   └── 📄 formatter.js
│
└── 📄 *.log                        # Логи (auto-created)
```

---

## Database (`/database/`)

```
database/
│
├── 📄 schema.sql                   # ⭐ Главная схема (создана)
│
├── 📁 migrations/                  # Миграции (TODO)
│   ├── 📄 001_initial.sql
│   ├── 📄 002_add_indexes.sql
│   └── 📄 003_add_triggers.sql
│
└── 📁 seeds/                       # Seed данные (TODO)
    ├── 📄 users.sql
    ├── 📄 pipelines.sql
    └── 📄 settings.sql
```

---

## Config (`/config/`)

```
config/
│
├── 📄 credentials.json             # Креды (не в git!)
├── 📄 settings.json                # Настройки приложения
└── 📄 retell-config.json           # Retell конфигурация
```

---

## Scripts (`/scripts/`)

```
scripts/
│
├── 📄 setup.sh                     # Скрипт установки
├── 📄 backup.sh                    # Бэкап БД
├── 📄 deploy.sh                    # Деплой
└── 📄 migrate.sh                   # Миграции
```

---

## Docs (`/docs/`)

```
docs/
│
├── 📄 API.md                       # API документация
├── 📄 DATABASE.md                  # Схема БД
├── 📄 DEPLOYMENT.md                # Инструкция деплоя
└── 📄 USER_MANUAL.md               # Руководство пользователя
```

---

## Что уже создано? ✅

- ✅ README.md
- ✅ QUICKSTART.md
- ✅ SETUP.md
- ✅ CREDENTIALS_GUIDE.md
- ✅ DEVELOPMENT_ROADMAP.md
- ✅ PROJECT_OVERVIEW.md
- ✅ package.json (root)
- ✅ .env.example
- ✅ .gitignore
- ✅ docker-compose.yml
- ✅ database/schema.sql
- ✅ backend/package.json
- ✅ backend/src/index.js
- ✅ backend/src/utils/logger.js
- ✅ backend/src/database/db.js
- ✅ backend/src/api/calls.js
- ✅ backend/src/services/retell/service.js
- ✅ backend/src/services/openai/service.js
- ✅ copilot-agent/package.json
- ✅ copilot-agent/index.js
- ✅ copilot-agent/SYSTEM_PROMPT.md
- ✅ frontend/package.json
- ✅ frontend/app/layout.tsx
- ✅ frontend/app/page.tsx

---

## Что нужно создать дальше? 🚧

### Приоритет ВЫСОКИЙ:
1. Backend API routes (auth, users, leads, clients, etc.)
2. Frontend Settings page (ввод кредов)
3. Frontend Calls page (список звонков, создание)
4. Backend middleware (auth, validation)
5. Email service (SMTP/IMAP)

### Приоритет СРЕДНИЙ:
6. Frontend Dashboard
7. Frontend Leads/Clients pages
8. Backend webhooks
9. Telegram bots (основной + copilot команды)
10. Socket.io integration

### Приоритет НИЗКИЙ:
11. UI components
12. Database migrations
13. Tests
14. Documentation

---

**Используйте этот файл как карту проекта!**
