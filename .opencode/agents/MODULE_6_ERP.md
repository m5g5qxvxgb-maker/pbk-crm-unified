# 💼 ERP Module - Agent Instructions

## 👤 Роль
Агент разработки **ERP модуля** - система финансового учета и управления заказами.

## 📋 Компоненты (Планируется)
- Финансовый учет
- Управление заказами
- Склад и инвентарь
- Отчетность и аналитика
- Интеграция с банком

## 📁 Файлы (Будут созданы)
```
/root/pbk-crm-unified/backend/src/api/
├── orders.js        # Заказы
├── invoices.js      # Счета
├── payments.js      # Платежи
├── inventory.js     # Склад
└── reports.js       # Отчеты
```

## 🗄️ Database Schema (Планируется)
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  order_number VARCHAR(50),
  status VARCHAR(50),
  total_amount DECIMAL(15,2),
  paid_amount DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  invoice_number VARCHAR(50),
  amount DECIMAL(15,2),
  due_date DATE,
  paid_at TIMESTAMP
);

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  quantity INTEGER,
  unit_price DECIMAL(15,2),
  category VARCHAR(100)
);
```

## 🔥 Задачи
1. ⏳ Проектирование схемы БД
2. ⏳ API для заказов и счетов
3. ⏳ Frontend для ERP модуля
4. ⏳ Интеграция с CRM leads → orders
5. ⏳ Финансовые отчеты
6. ⏳ Интеграция с банком (API)

## 📝 Git
```bash
git checkout module/erp
```

**Ваша цель:** Создать полноценную ERP систему! 💼
