/**
 * Telegram Notifier Utility
 * Sends notifications to Telegram groups from webhooks
 */

const TelegramBot = require('node-telegram-bot-api');
const logger = require('./logger');

// Initialize bot (no polling, just for sending messages)
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8003573668:AAHHs6GUJx-pUEL-fxe_lwVJCRutftrCZ30';
const SALES_GROUP_ID = process.env.TELEGRAM_SALES_GROUP || '-5088238645';

let bot = null;

try {
  bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });
  logger.info('✅ Telegram notifier initialized');
} catch (error) {
  logger.error('❌ Failed to initialize Telegram notifier:', error.message);
}

/**
 * Send lead notification to sales group
 */
async function notifyLeadToSalesGroup(leadData) {
  if (!bot) {
    logger.error('Telegram bot not initialized');
    return false;
  }

  try {
    const message = `🆕 *НОВЫЙ ЛИД #${leadData.crmLeadId || leadData.id}*

📋 ${leadData.title || 'Без названия'}
👤 ${leadData.customerName || 'Не указано'}
📞 ${leadData.phone || 'Не указано'}
💰 ${leadData.budget || 'Не указано'}

📍 Источник: ${leadData.source === 'fixly' ? 'Fixly.pl' : leadData.source === 'offerteo' ? 'Offerteo.pl' : leadData.source}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📞 Звонок', callback_data: `lead_call_${leadData.crmLeadId || leadData.id}` },
          { text: '📋 Карточка', callback_data: `lead_card_${leadData.crmLeadId || leadData.id}` }
        ],
        [
          { text: '👤 Передать', callback_data: `lead_assign_${leadData.crmLeadId || leadData.id}` },
          { text: '✏️ Заметка', callback_data: `lead_note_${leadData.crmLeadId || leadData.id}` }
        ],
        [
          { text: '⏰ Задача', callback_data: `lead_task_${leadData.crmLeadId || leadData.id}` },
          { text: '🤖 Автозвонок', callback_data: `lead_autocall_${leadData.crmLeadId || leadData.id}` }
        ]
      ]
    };

    await bot.sendMessage(SALES_GROUP_ID, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    logger.info(`✅ Lead notification sent to sales group: ${leadData.crmLeadId || leadData.id}`);
    return true;
  } catch (error) {
    logger.error('Error sending sales notification:', error.message);
    return false;
  }
}

module.exports = {
  notifyLeadToSalesGroup
};
