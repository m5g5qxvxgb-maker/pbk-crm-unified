# ⚡ Quick Start: Модульные агенты PBK CRM

## 🎯 Как создать агента для модуля

### Шаг 1: Выберите модуль
```
1. CRM Core         - Backend/Frontend/Database
2. Bots             - Fixly/Offerteo automation
3. Telegram         - Telegram bot integration
4. Retell AI        - Voice calls
5. AI Assistant     - AI helper
6. ERP              - Finance & orders
7. Website          - Public website
8. Email            - Email service
9. AI Proposals     - Document generation
```

### Шаг 2: Откройте файл агента
```bash
# Откройте соответствующий файл:
/root/pbk-crm-unified/.opencode/agents/MODULE_X_NAME.md

# Например для CRM Core:
/root/pbk-crm-unified/.opencode/agents/MODULE_1_CRM_CORE.md
```

### Шаг 3: Создайте новую сессию в OpenCode
1. Откройте OpenCode
2. Создайте новый чат
3. Скопируйте **весь контент** из файла агента
4. Вставьте как первое сообщение (это станет системным промптом)

### Шаг 4: Начните работу
```
Пример задачи для CRM Core агента:

"Привет! Мне нужно добавить фильтр по дате создания лида
в endpoint GET /api/leads. Параметры:
- created_after (date)
- created_before (date)

Помоги реализовать backend и обновить frontend."
```

---

## 📋 Готовые команды для копирования

### CRM Core Agent
```bash
cat /root/pbk-crm-unified/.opencode/agents/MODULE_1_CRM_CORE.md
```

### Bots Agent
```bash
cat /root/pbk-crm-unified/.opencode/agents/MODULE_2_BOTS.md
```

### Telegram Agent
```bash
cat /root/pbk-crm-unified/.opencode/agents/MODULE_3_TELEGRAM.md
```

### Retell AI Agent
```bash
cat /root/pbk-crm-unified/.opencode/agents/MODULE_4_RETELL_AI.md
```

### AI Assistant Agent
```bash
cat /root/pbk-crm-unified/.opencode/agents/MODULE_5_AI_ASSISTANT.md
```

### ERP Agent
```bash
cat /root/pbk-crm-unified/.opencode/agents/MODULE_6_ERP.md
```

### Website Agent
```bash
cat /root/pbk-crm-unified/.opencode/agents/MODULE_7_WEBSITE.md
```

### Email Agent
```bash
cat /root/pbk-crm-unified/.opencode/agents/MODULE_8_EMAIL.md
```

### AI Proposals Agent
```bash
cat /root/pbk-crm-unified/.opencode/agents/MODULE_9_AI_PROPOSALS.md
```

---

## 📚 Дополнительные ресурсы

### Общий контекст системы:
```bash
cat /root/pbk-crm-unified/.opencode/SYSTEM_CONTEXT.md
```

### Полное руководство:
```bash
cat /root/pbk-crm-unified/.opencode/HOW_TO_USE_AGENTS.md
```

### Структура модулей:
```bash
cat /root/pbk-crm-unified/MODULES_STRUCTURE.md
```

---

## 🚀 Быстрый старт: Пример использования

### Задача: Исправить баг в Telegram уведомлениях

**1. Определяем модуль:** Telegram (Module 3)

**2. Копируем промпт:**
```bash
cat /root/pbk-crm-unified/.opencode/agents/MODULE_3_TELEGRAM.md
```

**3. Создаем агента в OpenCode:**
- Новый чат
- Вставляем весь контент
- Агент готов!

**4. Описываем задачу:**
```
Привет! У меня баг: уведомления приходят в группу заявок (-5088238645),
а должны в группу продаж (-5040305781).

Проверь файл telegram-notifier.js и исправь.
```

**5. Агент работает:**
- Понимает контекст
- Находит файл
- Исправляет
- Тестирует
- Коммитит

---

## 💡 Советы

1. **Всегда читайте общий контекст** перед началом работы
2. **Один агент = один модуль** - не смешивайте ответственности
3. **Работайте в своей ветке** (`module/xxx`)
4. **Тестируйте интеграции** после изменений
5. **Документируйте** что сделали

---

**Готово! Теперь у вас есть 9 специализированных агентов для разработки PBK CRM!** 🎉

**Дата:** 2026-01-06
