/**
 * Telegram Webhook Endpoint
 * Receives updates from Telegram Bot API via webhook
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// This will be set by the integration manager
let telegramBotInstance = null;

/**
 * Register Telegram bot instance to process incoming updates
 */
function registerBot(botInstance) {
  telegramBotInstance = botInstance;
  logger.info('📱 Telegram bot instance registered for webhook processing');
}

/**
 * Telegram Webhook Endpoint
 * POST /api/telegram-webhook
 */
router.post('/', async (req, res) => {
  try {
    const update = req.body;
    
    logger.info(`📥 Received Telegram update: ${JSON.stringify(update).substring(0, 200)}...`);
    
    // If bot instance is registered, process the update
    if (telegramBotInstance && telegramBotInstance.processUpdate) {
      await telegramBotInstance.processUpdate(update);
      logger.info('✅ Telegram update processed successfully');
    } else {
      logger.warn('⚠️ Telegram bot instance not registered, update ignored');
    }
    
    // Always respond with 200 OK to Telegram
    res.sendStatus(200);
    
  } catch (error) {
    logger.error('❌ Error processing Telegram webhook:', error);
    // Still send 200 to prevent Telegram from retrying
    res.sendStatus(200);
  }
});

/**
 * GET endpoint for verification
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Telegram webhook endpoint is active',
    bot_registered: !!telegramBotInstance
  });
});

module.exports = router;
module.exports.registerBot = registerBot;
