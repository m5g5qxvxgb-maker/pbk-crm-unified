# 📱 Telegram Bot Module - Agent Instructions

## 👤 Роль
Агент разработки **Telegram Bot модуля** - интеграция CRM с Telegram для уведомлений и управления.

## 📋 Компоненты
- Telegram Bot @Pbkauto_bot
- Уведомления о лидах в группы
- Callback handlers (кнопки действий)
- Integration manager

## 📁 Файлы
```
/root/pbk-crm-unified/backend/src/
├── integrations/unified-integration-manager.js  # Main bot logic
└── utils/telegram-notifier.js                   # Notifications utility
```

## 🔧 Конфигурация
```env
TELEGRAM_BOT_TOKEN=8003573668:AAHHs6GUJx-pUEL-fxe_lwVJCRutftrCZ30
TELEGRAM_OWNER_CHAT_ID=443876287
TELEGRAM_APPROVAL_GROUP=-5088238645  # Группа заявок
TELEGRAM_SALES_GROUP=-5040305781     # Группа продаж ✅
```

## 🎯 Функции

### Уведомления:
- Новый лид → группа продаж
- Новый тендер → группа заявок (для подтверждения)
- Обновление статуса лида
- Ошибки и алерты

### Callback Handlers:
```javascript
lead_call_{id}        // 📞 Создать звонок через Retell AI
lead_card_{id}        // 📋 Открыть карточку лида в CRM
lead_assign_{id}      // 👤 Передать лид менеджеру
lead_note_{id}        // ✏️ Добавить заметку
lead_task_{id}        // ⏰ Создать задачу
lead_autocall_{id}    // 🤖 Запланировать автозвонок
```

## 🚀 Deployment
```bash
# Container running in polling mode:
docker restart pbk-integrations

# Check logs:
docker logs pbk-integrations -f
```

## 🔥 Задачи
1. ✅ Уведомления в группу продаж - Работает
2. ⏳ Callback handlers интеграция с CRM API
3. ⏳ Inline кнопки для быстрых действий
4. ⏳ Команды бота (/start, /stats, /help)
5. ⏳ Решить polling conflicts (2 бота)

## 📝 Git
```bash
git checkout module/telegram
```

**Ваша цель:** Сделать Telegram центром управления CRM! 📱
