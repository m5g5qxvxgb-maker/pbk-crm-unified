#!/usr/bin/env node

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const https = require('https');
const path = require('path');

const TOKEN = '8003573668:AAHHs6GUJx-pUEL-fxe_lwVJCRutftrCZ30';
const bot = new TelegramBot(TOKEN, { polling: true });
const DESIGN_DIR = '/tmp/design';

if (!fs.existsSync(DESIGN_DIR)) {
  fs.mkdirSync(DESIGN_DIR, { recursive: true });
}

console.log('✅ Telegram бот запущен!');
console.log('📸 Отправьте картинку с дизайном login page');
console.log('📂 Картинки сохраняются в:', DESIGN_DIR);
console.log('');

bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const photo = msg.photo[msg.photo.length - 1];
    const file = await bot.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
    
    const fileName = `login-design-${Date.now()}.jpg`;
    const localPath = path.join(DESIGN_DIR, fileName);
    const fileStream = fs.createWriteStream(localPath);
    
    console.log('📸 Получена картинка от:', msg.from.first_name);
    
    https.get(fileUrl, (response) => {
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log('✅ Сохранено:', localPath);
        bot.sendMessage(chatId, `
✅ Картинка дизайна сохранена!

📁 ${fileName}
📂 ${localPath}

Теперь дизайнер создаст такой же login page! 🎨
        `);
      });
    });
  } catch (error) {
    console.error('❌ Ошибка:', error);
    bot.sendMessage(chatId, '❌ Ошибка при сохранении картинки');
  }
});

bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  if (!msg.document || !msg.document.file_name.match(/\.(jpg|jpeg|png|gif|webp|pdf)$/i)) {
    return;
  }
  
  try {
    const file = await bot.getFile(msg.document.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
    const localPath = path.join(DESIGN_DIR, msg.document.file_name);
    const fileStream = fs.createWriteStream(localPath);
    
    console.log('📎 Получен файл:', msg.document.file_name);
    
    https.get(fileUrl, (response) => {
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log('✅ Сохранено:', localPath);
        bot.sendMessage(chatId, `✅ Файл сохранен!\n📁 ${msg.document.file_name}`);
      });
    });
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
});

process.on('SIGINT', () => {
  console.log('\n👋 Останавливаю бота...');
  bot.stopPolling();
  process.exit(0);
});
