/**
 * Telegram Bot Controller
 * Управление Telegram ботом с AI интеграцией
 */

const TelegramBot = require('node-telegram-bot-api');
const openAIService = require('../services/ai/openai-service');
const logger = require('../utils/logger');

class TelegramBotController {
  constructor() {
    this.bot = null;
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Инициализация бота
   */
  async initialize(token, database) {
    if (!token) {
      throw new Error('Telegram bot token is required');
    }

    this.bot = new TelegramBot(token, { polling: true });
    this.db = database;
    this.isInitialized = true;

    this.setupHandlers();
    
    logger.info('Telegram bot initialized and started');
  }

  /**
   * Настройка обработчиков команд и сообщений
   */
  setupHandlers() {
    // Команда /start
    this.bot.onText(/\/start/, async (msg) => {
      await this.handleStartCommand(msg);
    });

    // Команда /help
    this.bot.onText(/\/help/, async (msg) => {
      await this.handleHelpCommand(msg);
    });

    // Обычные текстовые сообщения
    this.bot.on('message', async (msg) => {
      // Игнорируем команды (они обрабатываются выше)
      if (msg.text && !msg.text.startsWith('/')) {
        await this.handleTextMessage(msg);
      }
    });

    // Обработка ошибок
    this.bot.on('polling_error', (error) => {
      logger.error('Telegram polling error', { error: error.message });
    });

    logger.info('Telegram bot handlers set up');
  }

  /**
   * Обработка команды /start
   */
  async handleStartCommand(msg) {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name;

    const welcomeMessage = `
👋 Привет, ${userName}!

Я - AI-помощник компании PBK Construction.

Могу помочь вам с:
• Информацией о наших услугах
• Расчётом стоимости работ
• Записью на консультацию
• Ответами на вопросы

Просто напишите мне, что вас интересует! 😊
`;

    await this.bot.sendMessage(chatId, welcomeMessage);

    // Создать или обновить запись о разговоре
    await this.getOrCreateConversation(chatId, msg.from);
  }

  /**
   * Обработка команды /help
   */
  async handleHelpCommand(msg) {
    const chatId = msg.chat.id;

    const helpMessage = `
📋 **Что я умею:**

• Отвечать на вопросы об услугах
• Рассчитывать примерную стоимость
• Записывать на бесплатную консультацию
• Соединять со специалистом

**Наши услуги:**
🏠 Ремонт квартир
🏗️ Строительство домов
🎨 Дизайн интерьеров
📐 Проектирование

**Контакты:**
📞 +7 (XXX) XXX-XX-XX
📧 info@pbkconstruction.com
🌐 pbkconstruction.com

Просто напишите ваш вопрос!
`;

    await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }

  /**
   * Обработка текстового сообщения
   */
  async handleTextMessage(msg) {
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    const userId = msg.from.id;

    try {
      logger.info('Processing Telegram message', {
        chatId,
        userId,
        message: userMessage.substring(0, 100),
      });

      // Показать "печатает..."
      await this.bot.sendChatAction(chatId, 'typing');

      // Получить историю разговора
      const conversationHistory = await this.getConversationHistory(chatId);

      // Контекст пользователя
      const context = {
        userName: msg.from.first_name,
        platform: 'telegram',
        userId: userId,
      };

      // Обработать через OpenAI
      const aiResponse = await openAIService.processMessage(
        userMessage,
        conversationHistory,
        context
      );

      if (aiResponse.success) {
        // Отправить ответ пользователю
        await this.bot.sendMessage(chatId, aiResponse.message);

        // Сохранить сообщения в базу
        await this.saveMessage(chatId, 'user', userMessage);
        await this.saveMessage(chatId, 'assistant', aiResponse.message);

        // Определить намерение для аналитики
        const intent = await openAIService.detectIntent(userMessage);
        
        // Если пользователь готов - создать лид
        if (intent.intent === 'ready_to_order' || intent.intent === 'provide_contacts') {
          await this.handleLeadCreation(chatId, msg, userMessage, intent);
        }

      } else {
        // Ошибка AI - отправить fallback
        await this.bot.sendMessage(chatId, aiResponse.fallbackMessage);
        logger.error('AI response failed', { error: aiResponse.error });
      }

    } catch (error) {
      logger.error('Error handling Telegram message', {
        error: error.message,
        chatId,
      });

      await this.bot.sendMessage(
        chatId,
        'Извините, произошла ошибка. Пожалуйста, попробуйте позже или свяжитесь с нами по телефону.'
      );
    }
  }

  /**
   * Получить или создать разговор
   */
  async getOrCreateConversation(chatId, fromUser) {
    try {
      const query = `
        INSERT INTO bot_conversations (platform, platform_user_id, platform_username, context)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (platform, platform_user_id) 
        DO UPDATE SET updated_at = NOW()
        RETURNING id
      `;

      const result = await this.db.query(query, [
        'telegram',
        chatId.toString(),
        fromUser.username || fromUser.first_name,
        JSON.stringify({ firstName: fromUser.first_name, lastName: fromUser.last_name }),
      ]);

      return result.rows[0].id;
    } catch (error) {
      logger.error('Error creating conversation', { error: error.message });
      return null;
    }
  }

  /**
   * Получить историю разговора
   */
  async getConversationHistory(chatId, limit = 10) {
    try {
      const query = `
        SELECT bm.direction, bm.message_text, bm.ai_response
        FROM bot_messages bm
        JOIN bot_conversations bc ON bc.id = bm.conversation_id
        WHERE bc.platform = 'telegram' 
          AND bc.platform_user_id = $1
        ORDER BY bm.created_at DESC
        LIMIT $2
      `;

      const result = await this.db.query(query, [chatId.toString(), limit]);

      // Преобразовать в формат для OpenAI
      const history = result.rows.reverse().map(row => ({
        role: row.direction === 'incoming' ? 'user' : 'assistant',
        content: row.direction === 'incoming' ? row.message_text : row.ai_response,
      }));

      return history;
    } catch (error) {
      logger.error('Error getting conversation history', { error: error.message });
      return [];
    }
  }

  /**
   * Сохранить сообщение в базу
   */
  async saveMessage(chatId, direction, text) {
    try {
      const query = `
        INSERT INTO bot_messages (conversation_id, direction, message_text, ai_processed)
        SELECT id, $2, $3, true
        FROM bot_conversations
        WHERE platform = 'telegram' AND platform_user_id = $1
      `;

      await this.db.query(query, [
        chatId.toString(),
        direction === 'user' ? 'incoming' : 'outgoing',
        text,
      ]);
    } catch (error) {
      logger.error('Error saving message', { error: error.message });
    }
  }

  /**
   * Создание лида из разговора
   */
  async handleLeadCreation(chatId, msg, message, intent) {
    try {
      // Извлечь контактную информацию
      const contactInfo = openAIService.extractContactInfo(message);
      
      if (contactInfo.phone || contactInfo.email) {
        // Создать лида в CRM
        const leadQuery = `
          INSERT INTO leads (
            name, phone, email, source, status, notes, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `;

        const leadResult = await this.db.query(leadQuery, [
          contactInfo.name || msg.from.first_name,
          contactInfo.phone,
          contactInfo.email,
          'telegram_bot',
          'new',
          `Создан из Telegram бота. Username: @${msg.from.username || 'unknown'}`,
          1, // system user
        ]);

        const leadId = leadResult.rows[0].id;

        logger.info('Lead created from Telegram', {
          leadId,
          chatId,
          phone: contactInfo.phone,
        });

        // Уведомить пользователя
        await this.bot.sendMessage(
          chatId,
          '✅ Отлично! Ваша заявка принята. Наш менеджер свяжется с вами в ближайшее время.'
        );

        // TODO: Уведомить менеджеров в Telegram

        return leadId;
      }
    } catch (error) {
      logger.error('Error creating lead', { error: error.message });
    }

    return null;
  }

  /**
   * Отправка сообщения
   */
  async sendMessage(chatId, text, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Telegram bot not initialized');
    }

    try {
      await this.bot.sendMessage(chatId, text, options);
      logger.info('Message sent to Telegram', { chatId });
    } catch (error) {
      logger.error('Error sending Telegram message', {
        error: error.message,
        chatId,
      });
      throw error;
    }
  }

  /**
   * Остановка бота
   */
  stop() {
    if (this.bot) {
      this.bot.stopPolling();
      logger.info('Telegram bot stopped');
    }
  }
}

// Singleton instance
const telegramBotController = new TelegramBotController();

module.exports = telegramBotController;
