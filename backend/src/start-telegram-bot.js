/**
 * Start Telegram Bot
 * Инициализация и запуск Telegram бота с AI
 */

require('dotenv').config({ path: '../.env' });
const telegramBotController = require('./bots/telegram-controller');
const openAIService = require('./services/ai/openai-service');
const { Pool } = require('pg');
const logger = require('./utils/logger');

// Проверка переменных окружения
const requiredEnvVars = [
  'TELEGRAM_BOT_TOKEN',
  'OPENAI_API_KEY',
  'DATABASE_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Подключение к БД
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function startBot() {
  try {
    logger.info('Starting Telegram bot...');

    // Тест подключения к БД
    await db.query('SELECT NOW()');
    logger.info('Database connected');

    // Инициализация OpenAI
    openAIService.initialize(process.env.OPENAI_API_KEY);
    logger.info('OpenAI service initialized');

    // Инициализация Telegram бота
    await telegramBotController.initialize(
      process.env.TELEGRAM_BOT_TOKEN,
      db
    );

    logger.info('✅ Telegram bot is running!');
    logger.info('Press Ctrl+C to stop');

  } catch (error) {
    logger.error('Failed to start Telegram bot', { error: error.message });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Stopping Telegram bot...');
  telegramBotController.stop();
  await db.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Stopping Telegram bot...');
  telegramBotController.stop();
  await db.end();
  process.exit(0);
});

// Запуск
startBot();
