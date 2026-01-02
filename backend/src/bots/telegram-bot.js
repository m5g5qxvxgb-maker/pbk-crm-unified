#!/usr/bin/env node

/**
 * PBK Telegram Bot для управления Retell AI
 */

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const {
  createRetellCall,
  getCallStatus,
  getCallAnalysis
} = require('./pbk-retell-integration');

// Конфигурация
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

const CONFIG = {
  retell: {
    apiKey: 'key_786fb7dcafb79358855d31b440ea',
    baseUrl: 'https://api.retellai.com'
  },
  crm: {
    baseUrl: 'http://100.97.148.123:5000/api'
  }
};

// Создаем бота
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Временное хранилище для процесса создания звонка
const pendingCalls = {};

console.log('🤖 PBK Telegram Bot запущен');

/**
 * Команда /start
 */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, `
🤖 <b>PBK AI Voice Manager</b>

Управление автоматическими звонками через Retell AI

<b>Команды:</b>
/call - Создать звонок
/leads - Список лидов из CRM
/status - Статус звонка
/history - История звонков

<b>Процесс работы:</b>
1. Получаете заявку в Telegram
2. Подтверждаете → создается в CRM
3. Добавляете инструкции для AI
4. AI звонит и собирает информацию
5. Получаете отчет с деталями встречи
  `, { parse_mode: 'HTML' });
});

/**
 * Команда /call - Создать звонок
 */
bot.onText(/\/call/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    // Получить список новых лидов из CRM
    const response = await axios.get(`${CONFIG.crm.baseUrl}/leads?status=new`);
    const leads = response.data;
    
    if (leads.length === 0) {
      bot.sendMessage(chatId, '❌ Нет новых лидов в CRM');
      return;
    }
    
    // Показать список лидов для выбора
    const keyboard = {
      inline_keyboard: leads.slice(0, 10).map(lead => [{
        text: `${lead.name} - ${lead.phone}`,
        callback_data: `call_${lead.id}`
      }])
    };
    
    bot.sendMessage(chatId, '📋 Выберите лида для звонка:', {
      reply_markup: keyboard
    });
    
  } catch (error) {
    bot.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
  }
});

/**
 * Обработка выбора лида
 */
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  if (data.startsWith('call_')) {
    const leadId = data.replace('call_', '');
    
    // Запросить инструкции для AI
    pendingCalls[chatId] = { leadId };
    
    bot.sendMessage(chatId, `
📝 <b>Инструкции для AI</b>

Напишите что должен узнать AI во время звонка.

<b>Примеры:</b>
• Узнать площадь квартиры и район
• Уточнить бюджет и сроки
• Договориться о встрече на завтра
• Просто следовать основному скрипту

Или отправьте /skip для стандартного скрипта
    `, { parse_mode: 'HTML' });
    
    bot.answerCallbackQuery(query.id);
  }
  
  if (data.startsWith('confirm_call_')) {
    const leadId = data.replace('confirm_call_', '');
    
    bot.answerCallbackQuery(query.id, { text: '📞 Инициирую звонок...' });
    
    try {
      // Получить данные из временного хранилища
      const callData = pendingCalls[chatId];
      
      // Создать звонок
      const call = await makeCallForLead(leadId, callData.instructions);
      
      delete pendingCalls[chatId];
      
      bot.sendMessage(chatId, `
✅ <b>Звонок инициирован</b>

📞 Call ID: <code>${call.call_id}</code>
👤 Клиент: ${call.retell_llm_dynamic_variables.customer_name}
📱 Телефон: ${call.retell_llm_dynamic_variables.customer_phone}

⏳ Ожидаем завершения звонка...
Вы получите уведомление с результатами.
      `, { parse_mode: 'HTML' });
      
      // Мониторинг звонка
      monitorCall(chatId, call.call_id);
      
    } catch (error) {
      bot.sendMessage(chatId, `❌ Ошибка создания звонка: ${error.message}`);
    }
  }
  
  if (data === 'cancel_call') {
    delete pendingCalls[chatId];
    bot.sendMessage(chatId, '❌ Звонок отменен');
    bot.answerCallbackQuery(query.id);
  }
});

/**
 * Получение текстовых инструкций
 */
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Пропускаем команды
  if (text.startsWith('/')) return;
  
  // Если есть ожидающий звонок
  if (pendingCalls[chatId]) {
    pendingCalls[chatId].instructions = text;
    
    // Получить данные лида для подтверждения
    try {
      const leadId = pendingCalls[chatId].leadId;
      const response = await axios.get(`${CONFIG.crm.baseUrl}/leads/${leadId}`);
      const lead = response.data;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Подтвердить звонок', callback_data: `confirm_call_${leadId}` },
            { text: '❌ Отменить', callback_data: 'cancel_call' }
          ]
        ]
      };
      
      bot.sendMessage(chatId, `
📋 <b>Подтверждение звонка</b>

👤 <b>Клиент:</b> ${lead.name}
📱 <b>Телефон:</b> ${lead.phone}
🏢 <b>Услуга:</b> ${lead.service_type || 'Не указано'}

💬 <b>Инструкции для AI:</b>
${text}

Подтвердить звонок?
      `, { 
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      
    } catch (error) {
      bot.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
      delete pendingCalls[chatId];
    }
  }
});

/**
 * Команда /skip - пропустить инструкции
 */
bot.onText(/\/skip/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (pendingCalls[chatId]) {
    pendingCalls[chatId].instructions = null;
    
    // Автоматически подтвердить
    const leadId = pendingCalls[chatId].leadId;
    
    try {
      const call = await makeCallForLead(leadId, null);
      delete pendingCalls[chatId];
      
      bot.sendMessage(chatId, `
✅ <b>Звонок инициирован (стандартный скрипт)</b>

📞 Call ID: <code>${call.call_id}</code>
👤 Клиент: ${call.retell_llm_dynamic_variables.customer_name}

⏳ Ожидаем завершения...
      `, { parse_mode: 'HTML' });
      
      monitorCall(chatId, call.call_id);
      
    } catch (error) {
      bot.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
    }
  }
});

/**
 * Команда /status - Статус звонка
 */
bot.onText(/\/status (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const callId = match[1].trim();
  
  try {
    const status = await getCallStatus(callId);
    
    bot.sendMessage(chatId, `
📊 <b>Статус звонка</b>

📞 Call ID: <code>${callId}</code>
📈 Status: ${status.call_status}
⏱ Duration: ${Math.round((status.end_timestamp - status.start_timestamp) / 1000)}s

${status.recording_url ? `🎧 <a href="${status.recording_url}">Запись</a>` : ''}
    `, { parse_mode: 'HTML' });
    
  } catch (error) {
    bot.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
  }
});

/**
 * Мониторинг звонка и отправка результатов
 */
async function monitorCall(chatId, callId) {
  let attempts = 0;
  const maxAttempts = 60; // 5 минут
  
  const checkStatus = setInterval(async () => {
    attempts++;
    
    try {
      const status = await getCallStatus(callId);
      
      if (status.call_status === 'ended') {
        clearInterval(checkStatus);
        
        // Получить полный анализ
        const analysis = await getCallAnalysis(callId);
        
        // Отправить результаты
        const duration = Math.round(analysis.duration / 1000);
        
        bot.sendMessage(chatId, `
🎉 <b>Звонок завершен</b>

📞 Call ID: <code>${callId}</code>
⏱ Длительность: ${duration} сек

${analysis.collected_data?.square_meters ? `📐 Площадь: ${analysis.collected_data.square_meters} м²\n` : ''}
${analysis.collected_data?.location ? `📍 Район: ${analysis.collected_data.location}\n` : ''}
${analysis.collected_data?.budget ? `💰 Бюджет: ${analysis.collected_data.budget}\n` : ''}
${analysis.collected_data?.meeting_date ? `📅 Встреча: ${analysis.collected_data.meeting_date} ${analysis.collected_data.meeting_time}\n` : ''}

${analysis.recording_url ? `🎧 <a href="${analysis.recording_url}">Прослушать запись</a>\n` : ''}

<b>📝 Заметки AI:</b>
${analysis.collected_data?.notes?.substring(0, 500) || 'Нет'}
        `, { parse_mode: 'HTML' });
        
      } else if (status.call_status === 'error' || attempts >= maxAttempts) {
        clearInterval(checkStatus);
        bot.sendMessage(chatId, `⚠️ Звонок ${callId}: ${status.call_status}`);
      }
      
    } catch (error) {
      clearInterval(checkStatus);
      bot.sendMessage(chatId, `❌ Ошибка мониторинга: ${error.message}`);
    }
  }, 5000); // Проверяем каждые 5 секунд
}

/**
 * Создать звонок для лида
 */
async function makeCallForLead(leadId, instructions) {
  // Получить данные лида из CRM
  const response = await axios.get(`${CONFIG.crm.baseUrl}/leads/${leadId}`);
  const lead = response.data;
  
  // Создать звонок
  const callData = {
    customer_name: lead.name,
    customer_phone: lead.phone,
    lead_source: lead.source,
    service_type: lead.service_type,
    property_type: lead.property_type,
    square_meters: lead.square_meters,
    location: lead.location,
    budget: lead.budget,
    timeline: lead.timeline,
    ai_instructions: instructions
  };
  
  return await createRetellCall(callData);
}

/**
 * Webhook для уведомлений от Retell AI
 */
const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook/retell', async (req, res) => {
  const { event, call } = req.body;
  
  console.log('📥 Retell webhook:', event);
  
  if (event === 'call_ended' && ADMIN_CHAT_ID) {
    const analysis = await getCallAnalysis(call.call_id);
    
    bot.sendMessage(ADMIN_CHAT_ID, `
🎉 <b>Звонок завершен</b>

👤 ${call.retell_llm_dynamic_variables?.customer_name}
📞 ${call.retell_llm_dynamic_variables?.customer_phone}
⏱ ${Math.round((call.end_timestamp - call.start_timestamp) / 1000)} сек

${call.recording_url ? `🎧 <a href="${call.recording_url}">Запись</a>` : ''}
    `, { parse_mode: 'HTML' });
  }
  
  res.json({ success: true });
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`🌐 Webhook сервер запущен на порту ${PORT}`);
});

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

process.on('SIGINT', () => {
  console.log('\n👋 Остановка бота...');
  bot.stopPolling();
  process.exit(0);
});
