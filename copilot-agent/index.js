#!/usr/bin/env node

/**
 * PBK CRM Copilot Agent
 * AI-powered Telegram bot for CRM management
 */

require('dotenv').config({ path: '../.env' });
const TelegramBot = require('node-telegram-bot-api');
const { Pool } = require('pg');
const OpenAI = require('openai');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'copilot-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'copilot.log' }),
    new winston.transports.Console()
  ]
});

// Configuration
const BOT_TOKEN = process.env.COPILOT_TELEGRAM_BOT_TOKEN;
const ALLOWED_USERS = process.env.COPILOT_ALLOWED_USERS?.split(',').map(id => parseInt(id)) || [];
const WORKING_DIR = '/root/pbk-crm-unified';

// Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Telegram Bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// System Prompt
const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, 'SYSTEM_PROMPT.md'),
  'utf-8'
);

// User sessions
const userSessions = new Map();

logger.info('🤖 PBK CRM Copilot Agent started');

/**
 * Check if user is authorized
 */
function isAuthorized(userId) {
  if (ALLOWED_USERS.length === 0) return true;
  return ALLOWED_USERS.includes(userId);
}

/**
 * Get user session
 */
function getSession(userId) {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, {
      conversationHistory: [],
      context: {}
    });
  }
  return userSessions.get(userId);
}

/**
 * Execute database query
 */
async function executeQuery(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return { success: true, data: result.rows };
  } catch (error) {
    logger.error('Database error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Process user command with OpenAI
 */
async function processWithAI(userId, userMessage) {
  const session = getSession(userId);
  
  // Add user message to history
  session.conversationHistory.push({
    role: 'user',
    content: userMessage
  });

  // Keep only last 10 messages to avoid token limits
  if (session.conversationHistory.length > 20) {
    session.conversationHistory = session.conversationHistory.slice(-20);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...session.conversationHistory
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const assistantMessage = completion.choices[0].message.content;
    
    // Add assistant response to history
    session.conversationHistory.push({
      role: 'assistant',
      content: assistantMessage
    });

    return assistantMessage;
  } catch (error) {
    logger.error('OpenAI error:', error);
    return '❌ Произошла ошибка при обработке запроса. Попробуйте еще раз.';
  }
}

/**
 * Handle /start command
 */
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAuthorized(userId)) {
    return bot.sendMessage(chatId, '❌ У вас нет доступа к этому боту.');
  }

  const welcomeMessage = `
🤖 <b>PBK CRM Copilot Agent</b>

Я - ваш AI-ассистент для управления CRM системой PBK Construction.

<b>Что я могу:</b>
✅ Управлять лидами и клиентами
📞 Создавать и отслеживать звонки
✉️ Работать с почтой
💼 Генерировать коммерческие предложения
📊 Предоставлять аналитику и отчеты
⚙️ Автоматизировать процессы

<b>Примеры команд:</b>
• "Создай лид для компании ABC"
• "Покажи все звонки за сегодня"
• "Создай предложение для лида #123"
• "Статистика по лидам за неделю"
• "Отправь письмо клиенту"

Просто напиши мне, что нужно сделать!
`;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'HTML' });
});

/**
 * Handle /help command
 */
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `
📖 <b>Помощь по командам</b>

<b>Управление лидами:</b>
• создай лид [детали]
• найди лид [название/ID]
• обнови лид #123 [изменения]
• удали лид #123

<b>Звонки:</b>
• создай звонок [детали]
• покажи звонки [период]
• расшифровка звонка #123
• статистика по звонкам

<b>Почта:</b>
• отправь письмо [детали]
• покажи письма [фильтр]
• непрочитанные письма

<b>Предложения:</b>
• создай предложение [детали]
• покажи предложения

<b>Аналитика:</b>
• статистика [тип] за [период]
• отчет по конверсии
• топ менеджеров

Для подробной информации напишите конкретный вопрос.
`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'HTML' });
});

/**
 * Handle /reset command
 */
bot.onText(/\/reset/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  userSessions.delete(userId);
  bot.sendMessage(chatId, '🔄 История диалога сброшена.');
});

/**
 * Handle all other messages
 */
bot.on('message', async (msg) => {
  // Skip commands
  if (msg.text?.startsWith('/')) return;
  
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userMessage = msg.text;

  if (!isAuthorized(userId)) {
    return bot.sendMessage(chatId, '❌ У вас нет доступа к этому боту.');
  }

  if (!userMessage) return;

  // Show typing indicator
  bot.sendChatAction(chatId, 'typing');

  logger.info(`User ${userId}: ${userMessage}`);

  try {
    const response = await processWithAI(userId, userMessage);
    
    logger.info(`Assistant: ${response}`);
    
    // Send response (split if too long)
    if (response.length > 4096) {
      const chunks = response.match(/[\s\S]{1,4096}/g);
      for (const chunk of chunks) {
        await bot.sendMessage(chatId, chunk, { parse_mode: 'HTML' });
      }
    } else {
      bot.sendMessage(chatId, response, { parse_mode: 'HTML' });
    }
  } catch (error) {
    logger.error('Error processing message:', error);
    bot.sendMessage(chatId, '❌ Произошла ошибка. Попробуйте еще раз.');
  }
});

/**
 * Handle errors
 */
bot.on('polling_error', (error) => {
  logger.error('Polling error:', error);
});

process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  await pool.end();
  process.exit(0);
});
