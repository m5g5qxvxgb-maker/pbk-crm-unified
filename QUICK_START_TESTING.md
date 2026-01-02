# 🚀 Quick Start - Testing Guide

## Шаг 1: Проверка Системы (30 сек)

```bash
cd /root/pbk-crm-unified
pm2 status
```

Должно быть:
- ✅ `pbk-crm-backend` - online
- ✅ `crm-frontend` - online

---

## Шаг 2: Перезапуск (если нужно)

```bash
# Backend
cd /root/pbk-crm-unified/backend
pm2 restart pbk-crm-backend

# Frontend (rebuild)
cd /root/pbk-crm-unified/frontend
rm -rf .next
npm run build
pm2 restart crm-frontend
```

---

## Шаг 3: Открыть CRM

**URL:** https://crm.pbkconstruction.net  
**Login:** admin@pbkconstruction.net  
**Password:** (проверить в .env)

---

## Шаг 4: Быстрые Тесты (5 мин)

### ✅ Test 1: Dashboard
1. Открыть /dashboard
2. Проверить 4 карточки статистики
3. Навести мышь на карточку → должна подняться вверх
4. Проверить золотую границу при hover

### ✅ Test 2: Pipeline
1. Открыть /pipelines
2. Увидеть Kanban board с 6 колонками
3. Увидеть карточки сделок
4. Попробовать перетащить карточку (drag & drop)

### ✅ Test 3: Responsive
1. Открыть Chrome DevTools (F12)
2. Нажать Toggle Device Toolbar (Ctrl+Shift+M)
3. Переключить между Desktop/Tablet/Mobile
4. Проверить что карточки перестраиваются

---

## Шаг 5: Playwright Тесты

```bash
cd /root/pbk-crm-unified
npx playwright test tests/modern-ui.spec.js --headed
```

**Ожидаемый результат:** 10/10 тестов пройдено ✅

---

## 🐛 Troubleshooting

### Проблема: Frontend не запускается
```bash
cd /root/pbk-crm-unified/frontend
rm -rf .next node_modules
npm install
npm run build
pm2 restart crm-frontend
```

### Проблема: "Cannot find module"
```bash
cd /root/pbk-crm-unified/frontend
npm install @hello-pangea/dnd framer-motion recharts lucide-react react-hot-toast date-fns
```

### Проблема: Deals не отображаются
```bash
# Добавить тестовые данные
cd /root/pbk-crm-unified/backend
psql -U pbk_admin -d pbk_crm << 'SQL'
INSERT INTO deals (title, client, value, stage) VALUES 
('Office Renovation', 'ABC Corp', 50000, 'lead'),
('Website Project', 'XYZ Inc', 25000, 'qualified'),
('App Development', 'Tech Co', 75000, 'proposal');
SQL
```

---

## ✅ Success Checklist

Пройдись по этому списку:

- [ ] Backend online
- [ ] Frontend online
- [ ] Login работает
- [ ] Dashboard показывает карточки
- [ ] Карточки поднимаются при hover
- [ ] Pipeline показывает Kanban
- [ ] Можно перетаскивать карточки
- [ ] Toast уведомления работают
- [ ] Responsive design работает
- [ ] Нет ошибок в консоли

---

## 📋 Полный Чек-Лист

Для полного тестирования используй:

```bash
cat /root/pbk-crm-unified/MANUAL_TESTING_CHECKLIST.md
```

**372 тест-кейса** охватывают все аспекты системы.

---

## 🎯 Что Ожидать

### Dashboard:
![Stats Cards]
- 4 карточки с иконками
- Цветные иконки в кружках
- Hover эффекты
- Процент изменения (↑ ↓)

### Pipeline:
![Kanban Board]
- 6 колонок (stages)
- Карточки сделок
- Drag & drop
- Суммы в золотом цвете

### Дизайн:
- Темный фон
- Золотые акценты
- Плавные анимации
- Современные иконки

---

**Готов тестировать? Поехали!** 🚀
