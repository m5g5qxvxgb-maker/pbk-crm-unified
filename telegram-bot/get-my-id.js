#!/usr/bin/env node
require('dotenv').config({ path: '../.env' });
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8003573668:AAHHs6GUJx-pUEL-fxe_lwVJCRutftrCZ30';
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Временный бот для получения Chat ID запущен!');
console.log('Напишите боту @Pbkauto_bot любое сообщение');

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || 'нет';
  const name = `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim();
  
  console.log('');
  console.log('='.repeat(60));
  console.log('✅ ПОЛУЧЕНО СООБЩЕНИЕ!');
  console.log('='.repeat(60));
  console.log(`📱 Chat ID: ${chatId}`);
  console.log(`👤 Username: @${username}`);
  console.log(`👤 Имя: ${name}`);
  console.log(`💬 Текст: ${msg.text || '[нет текста]'}`);
  console.log('='.repeat(60));
  
  bot.sendMessage(chatId, `✅ <b>Ваш Chat ID определен!</b>

📱 <b>Chat ID:</b> <code>${chatId}</code>
👤 <b>Username:</b> @${username}
👤 <b>Имя:</b> ${name}

Этот ID будет использован для отправки уведомлений о прогрессе аудита.

Бот перезапустится через 5 секунд...`, { parse_mode: 'HTML' });
  
  setTimeout(() => {
    console.log('');
    console.log('🛑 Останавливаю временный бот...');
    process.exit(0);
  }, 5000);
});

bot.on('polling_error', (error) => {
  if (error.code === 'ETELEGRAM' && error.response.body.error_code === 409) {
    console.error('❌ Ошибка: другой экземпляр бота уже работает!');
    console.error('Остановите PM2 бот командой: pm2 stop crm-telegram-bot');
    process.exit(1);
  }
  console.error('Polling error:', error.message);
});
