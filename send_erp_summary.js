require('dotenv').config({ path: '.env' });
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_IDS;

if (!BOT_TOKEN || BOT_TOKEN === 'placeholder:placeholder') {
  console.log('❌ Telegram bot token не настроен в .env');
  console.log('   Добавьте TELEGRAM_BOT_TOKEN=ваш_токен в .env');
  process.exit(1);
}

if (!ADMIN_CHAT_ID) {
  console.log('❌ ADMIN_CHAT_ID не настроен в .env');
  console.log('   Добавьте ADMIN_CHAT_ID=ваш_chat_id в .env');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

async function sendSummary() {
  try {
    const summary = fs.readFileSync('/root/PBK_ERP_IMPLEMENTATION_SUMMARY.md', 'utf8');
    
    // Split into chunks if too long
    const maxLength = 4000;
    const chunks = [];
    let currentChunk = '';
    
    summary.split('\n').forEach(line => {
      if ((currentChunk + line + '\n').length > maxLength) {
        chunks.push(currentChunk);
        currentChunk = line + '\n';
      } else {
        currentChunk += line + '\n';
      }
    });
    
    if (currentChunk) chunks.push(currentChunk);
    
    // Send chunks
    for (let i = 0; i < chunks.length; i++) {
      await bot.sendMessage(ADMIN_CHAT_ID, chunks[i], { parse_mode: 'Markdown' });
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('✅ Сводка отправлена в Telegram!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка отправки:', error.message);
    process.exit(1);
  }
}

sendSummary();
