# PBK CRM - Production-Ready CRM System
### Unified Customer Relationship Management System with AI Agent Integration

[![License](https://img.shields.io/badge/license-PROPRIETARY-red.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-15+-blue.svg)](https://www.postgresql.org/)
[![Next.js](https://img.shields.io/badge/next.js-14-black.svg)](https://nextjs.org/)

## 🎯 Overview

PBK CRM is a comprehensive, production-ready Customer Relationship Management system designed for construction and service businesses. It features advanced AI agent capabilities, multi-channel communication, and seamless integrations.

### ✨ Key Features

- 📊 **Complete CRM**: Clients, Projects, Tasks, Leads, Meetings
- 🤖 **AI Agent**: OpenRouter-powered natural language assistant
- 📞 **Retell AI**: Automated voice calling system
- 💬 **Offerteo**: Telegram bot order management
- 📧 **Email Integration**: Full email management
- 💰 **Financial Tracking**: Expenses, budgets, proposals
- 📈 **Analytics Dashboard**: Real-time insights and reports
- 🔐 **Enterprise Security**: RBAC, encryption, audit logs
- 🎨 **Modern UI**: Next.js 14, Tailwind CSS, responsive design

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 15
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/pbk-crm-unified.git
cd pbk-crm-unified

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Setup database
npm run db:migrate
npm run db:seed

# Start development servers
npm run dev
```

### Access the System

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Default Login**: admin / admin123

---

## 📦 Project Structure

```
pbk-crm-unified/
├── frontend/              # Next.js frontend application
│   ├── app/              # Next.js 14 app directory
│   ├── components/       # Reusable React components
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utility functions
├── backend/              # Node.js/Express backend
│   ├── src/
│   │   ├── api/         # API routes
│   │   ├── database/    # Database configuration
│   │   └── utils/       # Helper functions
│   └── uploads/         # File uploads
├── copilot-agent/        # AI Agent system
│   └── core/            # Agent core modules
├── tests/               # Test suites
│   └── e2e/            # End-to-end tests
└── docs/               # Documentation
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://pbk_admin:password@localhost:5432/pbk_crm

# API Configuration
API_PORT=5000
FRONTEND_URL=http://localhost:3000

# AI Agent (OpenRouter)
OPENROUTER_API_KEY=your-api-key
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free

# Retell AI Integration
RETELL_API_KEY=your-retell-key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Security
JWT_SECRET=your-secret-key-change-in-production
```

---

## 🧪 Testing

### Automated Tests

```bash
# Run quick test suite
./run-tests.sh
```

### Manual Testing

Follow the comprehensive [Manual Testing Checklist](./MANUAL_TESTING_CHECKLIST.md) for thorough testing of all features (150+ test cases).

---

## 🏗️ Development

```bash
# Start all services
npm run dev

# Start frontend only
npm run dev:frontend

# Start backend only
npm run dev:backend

# Build for production
npm run build
```

---

## 🐳 Docker Deployment

```bash
# Build and start
npm run docker:build
npm run docker:up

# Stop
npm run docker:down
```

---

## 🔐 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- SQL injection protection
- XSS prevention
- Audit logging

### User Roles

- **User**: Read and create basic records
- **Manager**: User permissions + proposals, advanced features
- **Admin**: Full system access

---

## 📊 Database Schema

### Main Tables

- `clients` - Customer information
- `projects` - Project details
- `leads` - Sales leads
- `tasks` - Task management
- `users` - System users
- `calls` - Retell AI call records
- `offerteo_orders` - Telegram bot orders
- `proposals` - Commercial proposals
- `expenses` - Financial records
- `agent_interactions` - AI agent logs

---

## 🌐 API Documentation

### Authentication

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Example Endpoints

- `GET /api/clients` - List all clients
- `POST /api/clients` - Create new client
- `GET /api/projects` - List projects
- `GET /api/leads` - List leads
- `GET /api/dashboard` - Dashboard stats

---

## 📝 License

This project is proprietary software.

---

## 🐛 Troubleshooting

### Common Issues

**Database connection fails**
```bash
systemctl status postgresql
# Verify DATABASE_URL in .env
```

**Port already in use**
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

**Frontend not loading**
```bash
cd frontend && rm -rf .next && npm run dev
```

---

## 🗺️ Roadmap

- [ ] Mobile apps (iOS/Android)
- [ ] WhatsApp integration
- [ ] Advanced reporting
- [ ] Multi-language support
- [ ] Custom workflows
- [ ] Document management
- [ ] Invoice generation

---

## 📞 Support

- **Issues**: https://github.com/YOUR_USERNAME/pbk-crm-unified/issues
- **Documentation**: See `/docs` folder

---

**Built with ❤️ for PBK Construction**

**Version**: 1.0.0 | **Last Updated**: January 2026
