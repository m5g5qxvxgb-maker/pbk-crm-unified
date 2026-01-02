const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const BOT_TOKEN = '8003573668:AAHHs6GUJx-pUEL-fxe_lwVJCRutftrCZ30';
const CHAT_ID = '533868685';

const bot = new TelegramBot(BOT_TOKEN);

async function sendReport() {
    try {
        const report = fs.readFileSync('/root/pbk-crm-unified/LOGIN_REDESIGN_COMPLETE.md', 'utf8');
        
        await bot.sendMessage(CHAT_ID, 
            '🎨 *СТРАНИЦА ВХОДА ОБНОВЛЕНА*\n\n' + report,
            { parse_mode: 'Markdown' }
        );
        
        console.log('✅ Отчет отправлен в Telegram');
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        process.exit(1);
    }
}

sendReport();
