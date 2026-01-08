# 💼 ERP Module - Agent Instructions

## 👤 Роль
Агент разработки **ERP модуля** - система финансового учета и управления проектами.

## 📋 Компоненты
- ✅ Управление проектами и бюджетами
- ✅ Учет расходов с загрузкой чеков
- ✅ Финансовая аналитика и прогнозы
- ⏳ Интеграция с банком (планируется)

## 📁 Файлы
```
/root/pbk-crm-unified/backend/src/api/
├── projects.js      # API управления проектами (262 строки)
└── expenses.js      # API учета расходов (440 строк)

/root/pbk-crm-unified/frontend/app/projects/
├── page.tsx         # Список проектов
└── [id]/page.tsx    # Детализация проекта с аналитикой

/root/pbk-crm-unified/database/
├── erp_migration.sql                               # Основная миграция
└── migrations/006_add_deal_amount_to_projects.sql  # Обновление с аналитикой
```

## 🗄️ Database Schema
```sql
-- Проекты
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  lead_id UUID REFERENCES leads(id),
  name VARCHAR(255) NOT NULL,
  
  -- Финансы
  deal_amount DECIMAL(12, 2),      -- Сумма сделки с клиентом
  budget_amount DECIMAL(12, 2) NOT NULL,  -- Плановый бюджет
  currency VARCHAR(3) DEFAULT 'PLN',
  
  -- Статус и даты
  status VARCHAR(50) DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  description TEXT,
  
  -- Метаданные
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Расходы
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  client_id UUID REFERENCES clients(id),
  
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PLN',
  
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  description TEXT NOT NULL,
  notes TEXT,
  
  receipt_url VARCHAR(500),
  receipt_number VARCHAR(100),
  expense_date DATE NOT NULL,
  
  created_by UUID REFERENCES users(id),
  created_via VARCHAR(50) DEFAULT 'web',
  
  -- Telegram интеграция
  telegram_message_id BIGINT,
  telegram_user_id BIGINT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- View для аналитики
CREATE VIEW project_stats AS
SELECT 
  p.id,
  p.name,
  p.client_id,
  p.lead_id,
  p.deal_amount,                                    -- Сумма сделки
  p.budget_amount,                                  -- Плановый бюджет
  COALESCE(SUM(e.amount), 0) as total_spent,       -- Потрачено
  p.budget_amount - COALESCE(SUM(e.amount), 0) as remaining,  -- Остаток
  
  -- % использования бюджета
  CASE 
    WHEN p.budget_amount > 0 
    THEN ROUND((COALESCE(SUM(e.amount), 0) / p.budget_amount * 100)::numeric, 2)
    ELSE 0 
  END as spent_percentage,
  
  -- Отклонение от бюджета
  CASE 
    WHEN p.budget_amount > 0 
    THEN ROUND((p.budget_amount - COALESCE(SUM(e.amount), 0))::numeric, 2)
    ELSE 0 
  END as budget_deviation,
  
  -- Прибыль (deal_amount - total_spent)
  CASE 
    WHEN p.deal_amount IS NOT NULL 
    THEN ROUND((p.deal_amount - COALESCE(SUM(e.amount), 0))::numeric, 2)
    ELSE NULL
  END as profit,
  
  -- Маржа в %
  CASE 
    WHEN p.deal_amount > 0 
    THEN ROUND(((p.deal_amount - COALESCE(SUM(e.amount), 0)) / p.deal_amount * 100)::numeric, 2)
    ELSE NULL
  END as profit_margin,
  
  COUNT(e.id) as expense_count
FROM projects p
LEFT JOIN expenses e ON e.project_id = p.id
GROUP BY p.id, p.name, p.client_id, p.lead_id, p.deal_amount, p.budget_amount;
```

## 🔥 Задачи
1. ✅ Проектирование схемы БД
2. ✅ API для проектов и расходов
3. ✅ Frontend для ERP модуля
4. ⏳ Интеграция с CRM leads → projects (частично готово)
5. ✅ Финансовые отчеты и аналитика
6. ⏳ Интеграция с банком (API) - планируется

## ✅ Реализовано (07.01.2026)

### База данных:
- Таблица `projects` - проекты с deal_amount и budget_amount
- Таблица `expenses` - расходы по проектам
- Таблица `expense_categories` - категории расходов
- Таблица `budget_alerts` - уведомления о превышении бюджета
- View `project_stats` - автоматическая аналитика

### Backend API:
- `/api/projects` - CRUD операции
- `/api/projects/:id/analytics` - расширенная аналитика с прогнозами
- `/api/expenses` - CRUD операции
- `/api/expenses/upload-receipt` - загрузка чеков
- Статистика и отчеты

### Frontend:
- `/projects` - список проектов с карточками
- `/projects/[id]` - детализация с аналитикой и прогнозами
- Формы создания проектов и добавления расходов

### Аналитика:
- Прибыль и маржа
- Прогноз затрат
- Средний расход в день (daily burn rate)
- Оценка рисков (low/medium/high/critical)
- Тренды по месяцам

Подробнее: см. MODULE_6_ERP_COMPLETED.md

## 📝 Git
```bash
git checkout module/erp
```

**Ваша цель:** Создать полноценную систему управления проектами и бюджетами! 💼
