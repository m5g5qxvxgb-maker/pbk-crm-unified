# ⚡ Быстрая настройка OpenAI для AI Assistant

## Текущий статус

❌ **OpenAI не настроен** (PRIMARY provider)  
✅ **OpenRouter настроен** (FALLBACK)

## Что нужно сделать

### 1. Получите OpenAI API ключ

Зайдите на https://platform.openai.com/api-keys и создайте новый ключ.

### 2. Обновите .env файл

```bash
# Откройте файл
nano /root/pbk-crm-unified/.env

# Найдите строку
OPENAI_API_KEY=sk-placeholder

# Замените на ваш ключ
OPENAI_API_KEY=sk-ваш-настоящий-ключ-здесь
```

### 3. Проверьте настройку

```bash
cd /root/pbk-crm-unified/backend
node tests/check-ai-status.js
```

Должно показать:
```
✅ OpenAI Configuration:
   ✅ API Key: sk-...
   ✅ Status: Configured (PRIMARY)
```

### 4. Протестируйте

```bash
node tests/test-ai-integration.js
```

## Что изменилось

### ДО (старая конфигурация):
1. OpenRouter - первый выбор
2. OpenAI - fallback

### ПОСЛЕ (новая конфигурация):
1. **OpenAI - первый выбор** ⭐
2. OpenRouter - fallback

## Код изменен

Файл `backend/src/routes/ai.js`:

```javascript
// Было:
if (openrouterKey) {
  // use OpenRouter
} else if (openaiKey) {
  // use OpenAI
}

// Стало:
if (openaiKey) {
  // use OpenAI (PRIMARY)
} else if (openrouterKey) {
  // use OpenRouter (FALLBACK)
}
```

## Преимущества OpenAI

✅ Лучшее качество ответов  
✅ Выше точность команд  
✅ Стабильнее работа  
✅ Официальная поддержка  

## Стоимость

- GPT-4 Turbo: ~$0.03 за запрос
- GPT-3.5 Turbo: ~$0.002 за запрос

Начните с $5-10 на балансе.

## Документация

📖 Полная инструкция: `backend/docs/OPENAI_SETUP.md`  
📖 Тесты: `backend/tests/test-ai-integration.js`  
📖 Проверка: `backend/tests/check-ai-status.js`

## Помощь

Если возникли проблемы, см. раздел Troubleshooting в `backend/docs/OPENAI_SETUP.md`
