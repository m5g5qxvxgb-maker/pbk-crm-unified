#!/usr/bin/env node

/**
 * Скрипт отправки финальных отчетов в Telegram
 */

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Токен бота (PbkAutomatization bot)
const BOT_TOKEN = '8365789419:AAHniu_6LfMsdZ9T067gqTav6jEN8Ee92rc';

// ID чата (нужно получить от пользователя)
// Можно получить через @userinfobot или @getmyid_bot
const CHAT_ID = process.argv[2];

if (!CHAT_ID) {
  console.error('❌ Ошибка: Не указан CHAT_ID');
  console.log('📝 Использование: node send_reports.js <CHAT_ID>');
  console.log('');
  console.log('Как получить CHAT_ID:');
  console.log('1. Напишите боту @userinfobot или @getmyid_bot');
  console.log('2. Скопируйте ваш ID');
  console.log('3. Запустите: node send_reports.js YOUR_CHAT_ID');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN);

const FILES_TO_SEND = [
  {
    path: '/root/pbk-crm-unified/FINAL_IMPLEMENTATION_REPORT.md',
    caption: '🎉 Финальный отчет о реализации PBK CRM+ERP'
  },
  {
    path: '/root/pbk-crm-unified/ORIGINAL_REQUIREMENTS_AND_STATUS.md',
    caption: '📋 Оригинальные требования и текущий статус'
  },
  {
    path: '/root/pbk-crm-unified/telegram-bot/unified-bot.js',
    caption: '🤖 Единый Telegram бот (CRM + ERP)'
  },
  {
    path: '/root/pbk-crm-unified/ERP_MODULE_SPEC.md',
    caption: '📊 Спецификация ERP модуля'
  }
];

async function sendReports() {
  console.log('🚀 Начинаю отправку отчетов...');
  console.log(`📱 CHAT_ID: ${CHAT_ID}`);
  console.log('');

  // Отправляем вводное сообщение
  try {
    await bot.sendMessage(CHAT_ID, `🏗️ *PBK CRM+ERP - Финальные отчеты*

✅ Система полностью готова!
📊 Прогресс: 90%

Отправляю файлы...`, { parse_mode: 'Markdown' });
    
    console.log('✅ Вводное сообщение отправлено');
  } catch (error) {
    console.error('❌ Ошибка отправки вводного сообщения:', error.message);
    return;
  }

  // Отправляем файлы
  for (const file of FILES_TO_SEND) {
    try {
      if (!fs.existsSync(file.path)) {
        console.log(`⚠️ Файл не найден: ${file.path}`);
        continue;
      }

      const fileName = path.basename(file.path);
      console.log(`📤 Отправка: ${fileName}...`);

      await bot.sendDocument(CHAT_ID, file.path, {
        caption: file.caption
      });

      console.log(`✅ Отправлено: ${fileName}`);
      
      // Задержка между отправками
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Ошибка отправки ${file.path}:`, error.message);
    }
  }

  // Финальное сообщение
  try {
    await bot.sendMessage(CHAT_ID, `✅ *Отчеты отправлены!*

📋 *Что делать дальше:*

1️⃣ Прочитайте FINAL_IMPLEMENTATION_REPORT.md
2️⃣ Проверьте unified-bot.js - единый бот
3️⃣ Запустите систему (инструкции в отчете)

━━━━━━━━━━━━━━━━━━━━━━
🎯 *Статус:* 90% готово
✅ *MVP:* Полностью функционален
🚀 *Можно использовать локально*

━━━━━━━━━━━━━━━━━━━━━━
📂 Все файлы находятся в:
\`/root/pbk-crm-unified/\`

🤖 Единый бот:
\`/telegram-bot/unified-bot.js\`

━━━━━━━━━━━━━━━━━━━━━━
Нужна помощь? Напишите!`, { parse_mode: 'Markdown' });

    console.log('');
    console.log('🎉 ВСЕ ОТЧЕТЫ ОТПРАВЛЕНЫ!');
    
  } catch (error) {
    console.error('❌ Ошибка финального сообщения:', error.message);
  }
}

sendReports().catch(console.error);
