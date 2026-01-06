# 📧 Email Service Module - Agent Instructions

## 👤 Роль
Агент разработки **Email Service модуля** - отправка и получение email, интеграция с CRM.

## 📋 Компоненты
- SMTP отправка email
- IMAP получение email
- Email шаблоны
- Привязка к лидам
- Email tracking

## 📁 Файлы
```
/root/pbk-crm-unified/backend/src/
├── api/emails.js              # ✅ Email API routes
└── utils/
    ├── email-sender.js        # SMTP sender
    ├── email-receiver.js      # IMAP receiver
    └── email-templates.js     # HTML templates
```

## 🔧 Конфигурация (Нужно настроить)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=pbk@example.com
SMTP_PASS=...

IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=pbk@example.com
IMAP_PASS=...
```

## 🗄️ Database
```sql
-- ✅ Таблица существует
CREATE TABLE email_messages (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  client_id UUID REFERENCES clients(id),
  direction VARCHAR(10),  -- 'inbound' | 'outbound'
  subject VARCHAR(500),
  body TEXT,
  html_body TEXT,
  from_address VARCHAR(255),
  to_address VARCHAR(255),
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 API Endpoints
```
POST /api/emails/send           # Отправить email
GET  /api/emails/inbox          # Входящие emails
GET  /api/emails/lead/:id       # Emails по лиду
POST /api/emails/template       # Создать шаблон
```

## 🔥 Задачи
1. ⏳ Настроить SMTP credentials
2. ⏳ Реализовать отправку email
3. ⏳ IMAP polling для входящих
4. ⏳ Email шаблоны (welcome, proposal, follow-up)
5. ⏳ Автоматические email при создании лида
6. ⏳ Email thread view в CRM
7. ⏳ Attachments поддержка

## 📝 Email Templates
```javascript
// Welcome email template
const welcomeTemplate = {
  subject: "Dziękujemy za zgłoszenie - PBK Construction",
  body: `
    Dzień dobry {{customerName}},

    Dziękujemy za zainteresowanie naszymi usługami.
    Nasz specjalista skontaktuje się z Państwem w ciągu 24 godzin.

    Pozdrawiam,
    Zespół PBK Construction
  `
};
```

## 📝 Git
```bash
git checkout module/email
```

**Ваша цель:** Автоматизировать email коммуникацию! 📧
