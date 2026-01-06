# ARCHITECTURE — System Structure

## Services
1. **Frontend** (Next.js)
   - Port: 8888
   - Location: `/root/pbk-crm-unified/frontend`
   - Start: `npm run dev:frontend`

2. **Backend** (NestJS API)
   - Port: 3000
   - Location: `/root/pbk-crm-unified/backend`
   - Start: `npm run dev:backend`

3. **Database** (PostgreSQL)
   - Port: 5432
   - Docker container: `pbk-crm-db`
   - Data: `/root/pbk-crm-unified/database`

4. **Copilot Agent**
   - Location: `/root/pbk-crm-unified/copilot-agent`
   - Integration: Chat interface in frontend

5. **Telegram Bot**
   - Location: `/root/pbk-crm-unified/telegram-bot`
   - Integration: External access to CRM

## Folder Map
```
/root/pbk-crm-unified/
├── frontend/          # Next.js app
├── backend/           # NestJS API
├── database/          # PostgreSQL schema
├── copilot-agent/     # AI agent
├── telegram-bot/      # Telegram integration
├── tests/e2e/         # Playwright tests
├── docs/agent/        # Agent knowledge base
├── docker-compose.yml # Container orchestration
└── playwright.config.js
```

## Database Schema
- clients
- projects
- tasks
- meetings
- users
- sessions

## Integrations
- Telegram Bot API
- OpenAI/Copilot API (for agent)
- PostgreSQL

## Last updated
2026-01-05 by OpenCode agent setup
