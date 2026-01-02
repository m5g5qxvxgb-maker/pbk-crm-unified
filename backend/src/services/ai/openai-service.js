/**
 * OpenAI GPT-4 Service
 * Обработка текстовых сообщений через OpenAI API
 */

const OpenAI = require('openai');
const logger = require('../../utils/logger');

class OpenAIService {
  constructor() {
    this.client = null;
    this.systemPrompt = `
Вы - AI-помощник компании PBK Construction (строительная компания).

Ваши задачи:
1. Отвечать на вопросы о строительных услугах компании
2. Собирать контактные данные потенциальных клиентов
3. Квалифицировать лидов (узнать бюджет, сроки, тип работ)
4. Предлагать консультацию или звонок специалиста
5. Создавать заявки в CRM при готовности клиента

Услуги PBK Construction:
- Ремонт квартир (под ключ, частичный)
- Строительство домов и коттеджей
- Дизайн интерьеров
- Проектирование и смета
- Отделочные работы
- Фасадные работы

Информация для клиентов:
- Работаем в Москве и Московской области
- Опыт работы: более 10 лет
- Гарантия на все работы: 2 года
- Бесплатная консультация и выезд на замер
- Рассрочка и поэтапная оплата

Стиль общения:
- Будьте вежливы и профессиональны
- Отвечайте кратко и по делу
- Используйте эмодзи для дружелюбия (но не переборщите)
- Если клиент готов - предложите оставить контакты
- Если вопрос сложный - предложите звонок специалиста

Формат ответов:
- Короткие абзацы (2-3 предложения)
- Используйте списки для перечислений
- Выделяйте важное (цены, сроки, контакты)

ВАЖНО:
- Если клиент спрашивает цену - уточните детали проекта
- Если клиент готов - попросите телефон и имя
- Не придумывайте конкретные цены - говорите "от X рублей"
- Всегда предлагайте бесплатную консультацию
`;
  }

  /**
   * Инициализация OpenAI клиента
   */
  initialize(apiKey) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: apiKey,
    });

    logger.info('OpenAI service initialized');
  }

  /**
   * Проверка инициализации
   */
  ensureInitialized() {
    if (!this.client) {
      throw new Error('OpenAI service not initialized. Call initialize() first.');
    }
  }

  /**
   * Обработка сообщения через GPT-4
   */
  async processMessage(userMessage, conversationHistory = [], context = {}) {
    this.ensureInitialized();

    try {
      const messages = [
        {
          role: 'system',
          content: this.systemPrompt,
        },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user',
          content: userMessage,
        },
      ];

      if (context.userName) {
        messages[0].content += `\n\nИмя клиента: ${context.userName}`;
      }

      logger.info('Sending message to OpenAI', {
        messagesCount: messages.length,
        userMessage: userMessage.substring(0, 100),
      });

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const assistantMessage = completion.choices[0].message.content;

      return {
        success: true,
        message: assistantMessage,
        usage: completion.usage,
      };
    } catch (error) {
      logger.error('OpenAI API error', { error: error.message });

      return {
        success: false,
        error: error.message,
        fallbackMessage: 'Извините, произошла ошибка. Попробуйте позже.',
      };
    }
  }

  /**
   * Определение намерения пользователя
   */
  async detectIntent(message) {
    this.ensureInitialized();

    const intentPrompt = `
Определи намерение пользователя.

Возможные намерения:
- request_info: Запрос информации
- get_quote: Запрос цены
- schedule_call: Хочет звонок
- provide_contacts: Даёт контакты
- ready_to_order: Готов заказать

Сообщение: "${message}"

Ответь JSON:
{
  "intent": "название",
  "confidence": 0.95,
  "entities": {}
}
`;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: intentPrompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const intentData = JSON.parse(completion.choices[0].message.content);
      
      return {
        success: true,
        ...intentData,
      };
    } catch (error) {
      return {
        success: false,
        intent: 'unknown',
        confidence: 0,
      };
    }
  }

  /**
   * Извлечение контактов
   */
  extractContactInfo(message) {
    const contactInfo = { phone: null, email: null, name: null };

    const phoneRegex = /(\+7|8)?[\s-]?\(?(\d{3})\)?[\s-]?(\d{3})[\s-]?(\d{2})[\s-]?(\d{2})/;
    const phoneMatch = message.match(phoneRegex);
    if (phoneMatch) {
      contactInfo.phone = phoneMatch[0].replace(/\s/g, '');
    }

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const emailMatch = message.match(emailRegex);
    if (emailMatch) {
      contactInfo.email = emailMatch[0];
    }

    return contactInfo;
  }
}

const openAIService = new OpenAIService();
module.exports = openAIService;
