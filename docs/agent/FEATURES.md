# FEATURES — Functional Specification

## Core Modules
1. **Dashboard**
   - Metrics overview
   - Recent activity
   - Quick actions

2. **Clients Management**
   - Create/edit/delete clients
   - Search and filter
   - Export functionality

3. **Projects**
   - Project lifecycle tracking
   - Status management
   - Client association

4. **Tasks**
   - Task creation and assignment
   - Drag-and-drop kanban
   - Due dates and priorities

5. **Meetings**
   - Schedule meetings
   - Calendar view
   - Notifications

6. **Agent System**
   - AI-powered chat assistant
   - Context-aware responses
   - Integration with CRM data

## Business Rules
- Users must login to access system
- Session persistence for 7 days
- Dark/light theme per user preference
- Multi-language support (EN/RU)
- Role-based access control
- Audit logging for all changes

## Security
- NO public internet access
- Tailscale-only access
- JWT authentication
- HTTPS via Tailscale serve
- Environment variables for secrets

## Last updated
2026-01-05 by OpenCode agent setup
