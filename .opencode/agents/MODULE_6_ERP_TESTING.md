# Тестирование ERP модуля

## Быстрый старт

### 1. Применить миграции БД

```bash
cd /root/pbk-crm-unified

# Проверить подключение к БД
psql postgresql://pbk_admin:pbk2024secure@localhost:5432/pbk_crm -c "SELECT version();"

# Применить миграции (если еще не применены)
psql postgresql://pbk_admin:pbk2024secure@localhost:5432/pbk_crm -f database/erp_migration.sql
psql postgresql://pbk_admin:pbk2024secure@localhost:5432/pbk_crm -f database/migrations/006_add_deal_amount_to_projects.sql

# Проверить структуру
psql postgresql://pbk_admin:pbk2024secure@localhost:5432/pbk_crm -c "\d projects"
psql postgresql://pbk_admin:pbk2024secure@localhost:5432/pbk_crm -c "\d+ project_stats"
```

### 2. Запустить backend

```bash
cd backend
npm install  # если нужно
npm start    # или npm run dev
```

Backend должен запуститься на порту 3001 (или том, что указан в .env)

### 3. Запустить frontend

```bash
cd frontend
npm install  # если нужно
npm run dev
```

Frontend запустится на http://localhost:3000

### 4. Тестирование через UI

1. Откройте браузер: http://localhost:3000/login
2. Войдите в систему
3. Перейдите в раздел "Проекты" (http://localhost:3000/projects)

**Создайте тестовый проект:**
- Название: "Тест бюджетирования"
- Сумма сделки: 100000 PLN
- Плановый бюджет: 70000 PLN
- Даты: сегодня - через месяц

**Добавьте несколько расходов:**
- Откройте созданный проект
- Добавьте расход 1: 15000 PLN, Материалы, "Закупка материалов"
- Добавьте расход 2: 20000 PLN, Работа, "Оплата рабочих"
- Добавьте расход 3: 5000 PLN, Транспорт, "Доставка"

**Проверьте аналитику:**
- Должны увидеть:
  - Потрачено: 40,000 PLN
  - Прибыль: 60,000 PLN (100,000 - 40,000)
  - Маржа: 60%
  - % бюджета: 57% (40,000 / 70,000)
  - Уровень риска: LOW (зеленый)
  - Средний расход в день
  - Прогноз итоговых затрат

### 5. Тестирование через API

**Получить токен авторизации:**
```bash
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | jq -r '.token')
```

**Создать проект:**
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "API Test Project",
    "deal_amount": 50000,
    "budget_amount": 35000,
    "currency": "PLN",
    "start_date": "2026-01-01",
    "end_date": "2026-03-01",
    "description": "Тестовый проект через API"
  }' | jq
```

**Получить список проектов:**
```bash
curl -X GET http://localhost:3001/api/projects \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Добавить расход:**
```bash
# Замените PROJECT_ID на ID созданного проекта
PROJECT_ID=1

curl -X POST http://localhost:3001/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "project_id": '$PROJECT_ID',
    "amount": 5000,
    "category": "materials",
    "description": "Тестовый расход",
    "expense_date": "2026-01-07"
  }' | jq
```

**Получить аналитику:**
```bash
curl -X GET http://localhost:3001/api/projects/$PROJECT_ID/analytics \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 6. Проверка данных в БД

```bash
# Посмотреть проекты
psql postgresql://pbk_admin:pbk2024secure@localhost:5432/pbk_crm \
  -c "SELECT id, name, deal_amount, budget_amount FROM projects;"

# Посмотреть статистику проектов
psql postgresql://pbk_admin:pbk2024secure@localhost:5432/pbk_crm \
  -c "SELECT * FROM project_stats;"

# Посмотреть расходы
psql postgresql://pbk_admin:pbk2024secure@localhost:5432/pbk_crm \
  -c "SELECT id, project_id, amount, category, description FROM expenses ORDER BY expense_date DESC LIMIT 10;"
```

## Ожидаемые результаты

### ✅ Frontend работает корректно:
- Список проектов отображается
- Карточки показывают все метрики
- Форма создания проекта работает
- Страница детализации загружается
- Аналитика отображается правильно
- Добавление расходов работает

### ✅ Backend API работает:
- Все endpoints отвечают
- Данные сохраняются в БД
- Аналитика рассчитывается верно
- View project_stats возвращает корректные данные

### ✅ База данных:
- Таблицы созданы
- View работает
- Триггеры обновляют updated_at
- Foreign keys настроены

## Troubleshooting

**Проблема:** View project_stats не создается
**Решение:** 
```bash
# Пересоздать view вручную
psql postgresql://pbk_admin:pbk2024secure@localhost:5432/pbk_crm \
  -f database/migrations/006_add_deal_amount_to_projects.sql
```

**Проблема:** API возвращает 500
**Решение:** Проверить логи backend, возможно не применены миграции

**Проблема:** Frontend не подключается к API
**Решение:** Проверить настройки в `/frontend/lib/api.js`

---

**Статус:** Готово к тестированию
**Дата:** 07.01.2026
