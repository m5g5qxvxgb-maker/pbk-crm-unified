# 📞 Retell AI Module - Agent Instructions

## 👤 Роль
Агент разработки **Retell AI модуля** - интеграция AI голосовых звонков с CRM.

## 📋 Компоненты
- Retell AI API integration
- Voice calls creation
- Webhook results processing
- Call logs в CRM

## 📁 Файлы
```
/root/pbk-crm-unified/backend/src/
└── api/retell.js    # Retell AI API routes
```

## 🔧 Конфигурация
```env
RETELL_API_KEY=...
RETELL_AGENT_ID=...
RETELL_PHONE_NUMBER=...
```

## 🎯 API Endpoints
```
POST /api/retell/create-call     # Создать звонок
POST /api/retell/webhook          # Обработка результатов
GET  /api/retell/call-status/:id  # Статус звонка
```

## 🔥 Задачи
1. ⏳ Создание звонков из Telegram кнопки "Звонок"
2. ⏳ Webhook обработка и сохранение в `calls` таблицу
3. ⏳ AI agent настройка (скрипт звонка)
4. ⏳ Call recording и transcription
5. ⏳ Интеграция с Lead timeline

## 📝 Git
```bash
git checkout module/retell-ai
```

**Ваша цель:** Автоматизировать звонки клиентам через AI! 📞
