const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const BOT_TOKEN = '8003573668:AAHHs6GUJx-pUEL-fxe_lwVJCRutftrCZ30';
const CHAT_ID = '-5040305781'; // Группа "Продажи"

const bot = new TelegramBot(BOT_TOKEN);

async function sendReport() {
  try {
    console.log('Отправка отчетов в Telegram...');
    
    // Краткий отчет
    const shortReport = `🎉 PBK CRM + ERP СИСТЕМА ГОТОВА!

✅ Прогресс: 100%

📋 Что выполнено:

CRM: ✅
• Управление лидами и клиентами
• Retell AI звонки
• Email интеграция
• OpenAI генерация КП
• Воронки продаж

ERP: ✅  
• Учет расходов по проектам
• Общие расходы бизнеса
• 8 категорий расходов
• Контроль бюджетов
• Уведомления и алерты

Telegram Bot: ✅
• Объединенный CRM+ERP бот
• Интерактивное меню
• Все команды работают
• Автоматические сводки

🤖 Бот: @Pbkauto_bot
📝 Команда: /start

🔗 Web: http://localhost:3008
📧 admin@pbkconstruction.net
🔐 admin123

📄 Полный отчет во вложении ⬇️`;

    await bot.sendMessage(CHAT_ID, shortReport);
    console.log('✅ Краткий отчет отправлен');

    // Отправка полного отчета
    await bot.sendDocument(CHAT_ID, 'FINAL_COMPLETION_REPORT.md', {
      caption: '📄 Полный отчет о завершении проекта'
    });
    console.log('✅ Полный отчет отправлен');

    // Отправка оригинальных требований
    await bot.sendDocument(CHAT_ID, 'ORIGINAL_REQUIREMENTS_AND_STATUS.md', {
      caption: '📋 Оригинальные требования и статус выполнения'
    });
    console.log('✅ Оригинальные требования отправлены');

    // Отправка unified bot
    await bot.sendDocument(CHAT_ID, 'telegram-bot/unified-bot.js', {
      caption: '🤖 Объединенный CRM+ERP Telegram бот'
    });
    console.log('✅ Unified bot отправлен');

    // Инструкция по запуску
    const startInstruction = `🚀 Как запустить систему:

1. Telegram Bot:
cd /root/pbk-crm-unified/telegram-bot
node unified-bot.js

2. Backend API:
cd /root/pbk-crm-unified/backend
npm start

3. Frontend:
cd /root/pbk-crm-unified/frontend
PORT=3008 npm run dev

4. Проверка:
• Откройте @Pbkauto_bot
• Отправьте /start
• Попробуйте /expense или /projects

✅ Все готово к использованию!`;

    await bot.sendMessage(CHAT_ID, startInstruction);
    console.log('✅ Инструкция отправлена');

    console.log('\n🎉 Все отчеты успешно отправлены в Telegram!');
  } catch (error) {
    console.error('❌ Ошибка отправки:', error.message);
    if (error.response) {
      console.error('Response:', error.response.body);
    }
  }
}

sendReport();
