# 📄 AI Proposals Module - Agent Instructions

## 👤 Роль
Агент разработки **AI Proposals модуля** - автоматическая генерация коммерческих предложений через AI.

## 📋 Компоненты
- AI генерация текста предложения
- Шаблоны документов
- PDF export
- Интеграция с lead данными
- Email отправка предложений

## 📁 Файлы
```
/root/pbk-crm-unified/backend/src/
├── api/proposals.js           # ✅ Proposals API
└── utils/
    ├── ai-generator.js        # AI text generation
    ├── pdf-generator.js       # PDF creation
    └── proposal-templates.js  # Document templates
```

## 🗄️ Database
```sql
-- ✅ Таблица существует
CREATE TABLE ai_proposals (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  title VARCHAR(500),
  content TEXT,              -- Generated proposal text
  html_content TEXT,         -- HTML version
  pdf_url TEXT,             -- Link to generated PDF
  status VARCHAR(50),       -- 'draft' | 'sent' | 'accepted' | 'rejected'
  sent_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 API Endpoints
```
POST /api/proposals/generate      # Генерация через AI
GET  /api/proposals/:id           # Получить предложение
PUT  /api/proposals/:id           # Обновить
POST /api/proposals/:id/send      # Отправить по email
POST /api/proposals/:id/pdf       # Генерация PDF
```

## 🔥 Workflow
```
1. Менеджер открывает лид
     ↓
2. Нажимает "Создать предложение"
     ↓
3. AI анализирует данные лида:
   - Описание работ
   - Бюджет
   - Сроки
   - История сообщений
     ↓
4. AI генерирует текст предложения через OpenRouter
     ↓
5. Менеджер редактирует (опционально)
     ↓
6. Генерация PDF с брендингом PBK
     ↓
7. Отправка по email клиенту
     ↓
8. Tracking открытий и скачиваний
```

## 🤖 AI Prompt Template
```javascript
const proposalPrompt = `
Jesteś profesjonalnym menedżerem sprzedaży PBK Construction.
Wygeneruj szczegółową ofertę komercyjną na podstawie danych:

Klient: ${lead.client.name}
Projekt: ${lead.title}
Opis: ${lead.description}
Budżet: ${lead.value} ${lead.currency}
Lokalizacja: ${lead.custom_fields.district}

Oferta powinna zawierać:
1. Powitanie i podziękowanie za zainteresowanie
2. Opis proponowanych prac
3. Harmonogram realizacji
4. Szczegółową wycenę
5. Warunki płatności
6. Zakończenie z zaproszeniem do kontaktu

Ton: profesjonalny, przyjazny, przekonujący
Język: polski
`;
```

## 🔥 Задачи
1. ⏳ AI генерация предложений через OpenRouter
2. ⏳ PDF генерация с брендингом (logo, цвета)
3. ⏳ Редактируемые шаблоны
4. ⏳ Email интеграция для отправки
5. ⏳ Tracking открытий (pixel tracking)
6. ⏳ Версионирование предложений
7. ⏳ Digital signature (опционально)

## 📝 Git
```bash
git checkout module/ai-proposals
```

**Ваша цель:** Автоматизировать создание коммерческих предложений! 📄
