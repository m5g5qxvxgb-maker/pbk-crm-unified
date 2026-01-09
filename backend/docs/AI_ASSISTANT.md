# AI Assistant Module - Умный помощник CRM

## Описание
AI Assistant - интеллектуальный помощник для менеджеров CRM системы. Понимает естественный язык и выполняет команды для управления лидами, задачами и клиентами.

## Возможности

### 1. Умный чат с контекстом CRM
- Отвечает на вопросы о лидах, задачах, клиентах
- Понимает контекст разговора
- Дает рекомендации по работе с CRM

### 2. Выполнение команд
AI Assistant распознает и выполняет следующие команды:

#### Работа с лидами
```
"Покажи лиды со статусом Переговоры"
"Покажи все новые лиды"
"Найди лид Иван Петров"
```

#### Работа с задачами
```
"Создать задачу Позвонить клиенту"
"Покажи мои задачи"
"Создай задачу на завтра"
```

#### Работа с клиентами
```
"Покажи клиентов"
"Список клиентов"
```

### 3. Генерация ответов клиентам
AI помогает составлять профессиональные ответы на сообщения клиентов с учетом:
- Тона общения (профессиональный, дружелюбный, формальный)
- Контекста общения
- Специфики строительной компании

## API Endpoints

### POST /api/ai/copilot
Основной endpoint для общения с AI и выполнения команд.

**Request:**
```json
{
  "message": "Покажи лиды со статусом Переговоры",
  "context": "Дополнительный контекст",
  "history": [
    {"role": "user", "content": "Предыдущее сообщение"},
    {"role": "assistant", "content": "Предыдущий ответ"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Найдено 5 лидов со статусом Переговоры: ...",
  "provider": "openrouter",
  "model": "google/gemini-2.0-flash-001:free",
  "usage": {...},
  "action": {
    "type": "showLeads",
    "data": [...]
  }
}
```

### POST /api/ai/generate-response
Генерация ответов клиентам.

**Request:**
```json
{
  "clientMessage": "Когда будет готова смета?",
  "context": "Клиент заказал ремонт квартиры 50 кв.м",
  "tone": "professional"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Добрый день! Смета по ремонту вашей квартиры будет готова в течение 2-3 рабочих дней...",
  "provider": "openrouter",
  "model": "google/gemini-2.0-flash-001:free"
}
```

### POST /api/ai/execute
Прямое выполнение команды без AI чата.

**Request:**
```json
{
  "command": "Покажи мои задачи"
}
```

**Response:**
```json
{
  "success": true,
  "action": "showTasks",
  "data": [...],
  "message": "Найдено задач: 5"
}
```

### POST /api/ai/analyze
Анализ данных лида или клиента.

**Request:**
```json
{
  "type": "lead",
  "data": {
    "title": "Ремонт офиса",
    "value": 500000,
    "stage": "negotiations"
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysis": "Это крупная сделка со средней конверсией. Рекомендации: ...",
  "usage": {...}
}
```

## Распознаваемые команды

### Создание задачи
- `создать задачу`, `создай задачу`, `новая задача`
- `добавить задачу`, `create task`

### Показ лидов
- `покажи лиды`, `показать лиды`, `список лидов`
- `лиды со статусом`, `show leads`, `list leads`

### Показ задач
- `покажи задачи`, `показать задачи`, `список задач`
- `мои задачи`, `show tasks`

### Показ клиентов
- `покажи клиентов`, `показать клиентов`
- `список клиентов`, `show clients`

### Обновление лида
- `обновить лид`, `обнови лид`, `переместить лид`
- `измени лид`, `update lead`

### Поиск лида
- `найди лид`, `найти лид`, `поиск лид`
- `search lead`

### Генерация ответа
- `напиши ответ`, `сгенерируй ответ`
- `составь ответ`, `write response`

## Конфигурация

Настройки в `.env`:

```env
# OpenRouter (бесплатная модель)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-2.0-flash-001:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# OpenAI (fallback)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
```

## Примеры использования

### Пример 1: Показать лиды со статусом
```javascript
const response = await fetch('/api/ai/copilot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Покажи лиды со статусом Переговоры'
  })
});

const data = await response.json();
console.log(data.message); // AI ответ
console.log(data.action.data); // Список лидов
```

### Пример 2: Создать задачу
```javascript
const response = await fetch('/api/ai/copilot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Создать задачу "Позвонить клиенту Иван"'
  })
});

const data = await response.json();
console.log(data.message); // "Задача создана успешно!"
console.log(data.action.data); // Данные созданной задачи
```

### Пример 3: Генерация ответа клиенту
```javascript
const response = await fetch('/api/ai/generate-response', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clientMessage: 'Когда приедет бригада?',
    context: 'Клиент заказал ремонт квартиры, бригада назначена на завтра',
    tone: 'friendly'
  })
});

const data = await response.json();
console.log(data.response); // Сгенерированный ответ
```

## Расширение функциональности

### Добавление новой команды

1. Добавить паттерн в `parseCommand()`:
```javascript
const patterns = {
  ...
  myNewCommand: /новая команда|new command/i
};
```

2. Добавить обработчик в `executeCRMAction()`:
```javascript
case 'myNewCommand': {
  // Логика выполнения команды
  const result = await db.query('...');
  return {
    action: 'myNewCommand',
    data: result.rows,
    response: 'Команда выполнена'
  };
}
```

## Интеграция с Telegram Bot

AI Assistant можно интегрировать с Telegram ботом для обработки команд:

```javascript
bot.on('message', async (msg) => {
  const response = await fetch('/api/ai/copilot', {
    method: 'POST',
    body: JSON.stringify({
      message: msg.text
    })
  });
  
  const data = await response.json();
  bot.sendMessage(msg.chat.id, data.message);
});
```

## Безопасность

- Все endpoints защищены `authenticateToken` middleware
- Команды выполняются только от имени авторизованного пользователя
- SQL injection защита через параметризованные запросы
- Rate limiting для AI API запросов

## Производительность

- Кеширование частых запросов
- Оптимизированные SQL запросы с лимитами
- Использование бесплатной модели OpenRouter для снижения затрат
- Fallback на OpenAI при недоступности OpenRouter

## Будущие улучшения

- [ ] NLP для более точного извлечения параметров из команд
- [ ] Поддержка множественных действий в одной команде
- [ ] Голосовое управление через Telegram
- [ ] Аналитика и отчеты по запросу
- [ ] Интеграция с календарем для планирования
- [ ] Умные напоминания и уведомления
