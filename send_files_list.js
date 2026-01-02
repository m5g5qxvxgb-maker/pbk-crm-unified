const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = '8003573668:AAHHs6GUJx-pUEL-fxe_lwVJCRutftrCZ30';
const CHAT_ID = '-5040305781';

const bot = new TelegramBot(BOT_TOKEN);

async function send() {
  try {
    await bot.sendDocument(CHAT_ID, 'FILES_SENT_TO_TELEGRAM.txt', {
      caption: '📁 Список всех отправленных файлов'
    });
    console.log('✅ Список файлов отправлен');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

send();
