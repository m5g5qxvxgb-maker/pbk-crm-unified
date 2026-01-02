#!/usr/bin/env node

/**
 * PBK Retell AI Integration
 * Интеграция между Retell AI, CRM и Telegram ботом
 */

const axios = require('axios');

// Конфигурация
const CONFIG = {
  retell: {
    apiKey: 'key_786fb7dcafb79358855d31b440ea',
    baseUrl: 'https://api.retellai.com',
    agentId: 'agent_71ccc151eb0e467fa379c139a6',
    phoneNumber: '48223762013'
  },
  crm: {
    baseUrl: 'http://100.97.148.123:5000/api',
    // API endpoints для работы с лидами
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN',
    chatId: process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID'
  }
};

/**
 * Создать звонок в Retell AI
 */
async function createRetellCall(leadData) {
  const {
    customer_name,
    customer_phone,
    lead_source,
    service_type,
    property_type,
    square_meters,
    location,
    budget,
    timeline,
    ai_instructions
  } = leadData;

  const payload = {
    from_number: CONFIG.retell.phoneNumber,
    to_number: customer_phone,
    agent_id: CONFIG.retell.agentId,
    retell_llm_dynamic_variables: {
      customer_name,
      customer_phone,
      lead_source: lead_source || 'CRM',
      service_type,
      property_type,
      square_meters,
      location,
      budget,
      timeline,
      ai_instructions
    }
  };

  try {
    const response = await axios.post(
      `${CONFIG.retell.baseUrl}/v2/create-phone-call`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.retell.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Звонок создан:', response.data.call_id);
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка создания звонка:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Получить статус звонка
 */
async function getCallStatus(callId) {
  try {
    const response = await axios.get(
      `${CONFIG.retell.baseUrl}/get-call/${callId}`,
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.retell.apiKey}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка получения статуса:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Получить транскрипт и анализ звонка
 */
async function getCallAnalysis(callId) {
  try {
    const response = await axios.get(
      `${CONFIG.retell.baseUrl}/get-call/${callId}`,
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.retell.apiKey}`
        }
      }
    );

    const callData = response.data;
    
    return {
      duration: callData.end_timestamp - callData.start_timestamp,
      transcript: callData.transcript,
      recording_url: callData.recording_url,
      analysis: callData.call_analysis,
      // Извлекаем собранную информацию
      collected_data: extractCollectedData(callData.transcript)
    };
  } catch (error) {
    console.error('❌ Ошибка получения анализа:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Извлечь собранную информацию из транскрипта
 */
function extractCollectedData(transcript) {
  // TODO: Парсинг транскрипта для извлечения данных
  // Можно использовать LLM или регулярные выражения
  return {
    square_meters: null,
    location: null,
    budget: null,
    timeline: null,
    meeting_date: null,
    meeting_time: null,
    notes: transcript
  };
}

/**
 * Обновить лид в CRM
 */
async function updateCRMLead(leadId, callData) {
  try {
    const response = await axios.patch(
      `${CONFIG.crm.baseUrl}/leads/${leadId}`,
      {
        call_status: callData.call_status,
        call_duration: callData.duration,
        recording_url: callData.recording_url,
        transcript: callData.transcript,
        ...callData.collected_data,
        last_contact: new Date().toISOString()
      }
    );

    console.log('✅ CRM обновлена');
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка обновления CRM:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Отправить уведомление в Telegram
 */
async function sendTelegramNotification(leadData, callData) {
  const message = formatTelegramMessage(leadData, callData);
  
  try {
    await axios.post(
      `https://api.telegram.org/bot${CONFIG.telegram.botToken}/sendMessage`,
      {
        chat_id: CONFIG.telegram.chatId,
        text: message,
        parse_mode: 'HTML'
      }
    );

    console.log('✅ Уведомление отправлено в Telegram');
  } catch (error) {
    console.error('❌ Ошибка отправки в Telegram:', error.response?.data || error.message);
  }
}

/**
 * Форматировать сообщение для Telegram
 */
function formatTelegramMessage(leadData, callData) {
  const duration = Math.round(callData.duration / 1000);
  const status = callData.call_status === 'ended' ? '✅ Завершен' : '⚠️ ' + callData.call_status;

  return `
🤖 <b>Звонок Retell AI</b>

👤 <b>Клиент:</b> ${leadData.customer_name || 'Неизвестно'}
📞 <b>Телефон:</b> ${leadData.customer_phone}

📊 <b>Статус:</b> ${status}
⏱ <b>Длительность:</b> ${duration} сек

${callData.collected_data?.square_meters ? `📐 <b>Площадь:</b> ${callData.collected_data.square_meters} м²\n` : ''}
${callData.collected_data?.location ? `📍 <b>Район:</b> ${callData.collected_data.location}\n` : ''}
${callData.collected_data?.budget ? `💰 <b>Бюджет:</b> ${callData.collected_data.budget}\n` : ''}
${callData.collected_data?.meeting_date ? `📅 <b>Встреча:</b> ${callData.collected_data.meeting_date} ${callData.collected_data.meeting_time}\n` : ''}

${callData.recording_url ? `🎧 <a href="${callData.recording_url}">Прослушать запись</a>` : ''}

<b>Заметки AI:</b>
${callData.collected_data?.notes || 'Нет'}
  `.trim();
}

/**
 * Webhook обработчик для Retell AI
 */
async function handleRetellWebhook(webhookData) {
  const { event, call } = webhookData;

  console.log(`📥 Webhook event: ${event}`);

  switch (event) {
    case 'call_started':
      console.log(`📞 Звонок начался: ${call.call_id}`);
      break;

    case 'call_ended':
      console.log(`✅ Звонок завершен: ${call.call_id}`);
      
      // Получить полный анализ
      const analysis = await getCallAnalysis(call.call_id);
      
      // Обновить CRM (если есть lead_id в metadata)
      if (call.metadata?.lead_id) {
        await updateCRMLead(call.metadata.lead_id, analysis);
      }
      
      // Отправить уведомление в Telegram
      await sendTelegramNotification(call.retell_llm_dynamic_variables, analysis);
      break;

    case 'call_analyzed':
      console.log(`📊 Анализ готов: ${call.call_id}`);
      break;
  }
}

/**
 * Основная функция - создать звонок для лида из CRM
 */
async function makeCallForLead(leadId, aiInstructions = null) {
  try {
    // 1. Получить данные лида из CRM
    const leadResponse = await axios.get(`${CONFIG.crm.baseUrl}/leads/${leadId}`);
    const lead = leadResponse.data;

    // 2. Подготовить данные для звонка
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
      ai_instructions: aiInstructions || lead.ai_instructions
    };

    // 3. Создать звонок
    const call = await createRetellCall(callData);

    // 4. Сохранить call_id в CRM
    await axios.patch(`${CONFIG.crm.baseUrl}/leads/${leadId}`, {
      last_call_id: call.call_id,
      call_status: 'initiated'
    });

    console.log(`✅ Звонок создан для лида ${leadId}, call_id: ${call.call_id}`);
    
    return call;
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    throw error;
  }
}

/**
 * Тестовый звонок
 */
async function testCall() {
  const testLead = {
    customer_name: 'Petr',
    customer_phone: '+48572778993',
    lead_source: 'Test',
    service_type: 'Remont mieszkania',
    property_type: 'Mieszkanie',
    ai_instructions: 'Узнать площадь квартиры и район Варшавы. Договориться о встрече.'
  };

  console.log('🧪 Запуск тестового звонка...');
  const call = await createRetellCall(testLead);
  
  console.log('\n📊 Данные звонка:');
  console.log(JSON.stringify(call, null, 2));
  
  // Мониторинг статуса
  console.log('\n⏳ Ожидание завершения звонка...');
  let status = 'registered';
  while (status !== 'ended' && status !== 'error') {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const callStatus = await getCallStatus(call.call_id);
    status = callStatus.call_status;
    console.log(`Status: ${status}`);
  }
  
  // Получить результаты
  if (status === 'ended') {
    const analysis = await getCallAnalysis(call.call_id);
    console.log('\n📊 Результаты звонка:');
    console.log(JSON.stringify(analysis, null, 2));
  }
}

// CLI команды
if (require.main === module) {
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  switch (command) {
    case 'test':
      testCall().catch(console.error);
      break;

    case 'call':
      if (!arg1) {
        console.error('Usage: node pbk-retell-integration.js call <lead_id> [ai_instructions]');
        process.exit(1);
      }
      makeCallForLead(arg1, arg2).catch(console.error);
      break;

    case 'status':
      if (!arg1) {
        console.error('Usage: node pbk-retell-integration.js status <call_id>');
        process.exit(1);
      }
      getCallStatus(arg1).then(data => {
        console.log(JSON.stringify(data, null, 2));
      }).catch(console.error);
      break;

    default:
      console.log(`
PBK Retell AI Integration

Использование:
  node pbk-retell-integration.js test                           - Тестовый звонок
  node pbk-retell-integration.js call <lead_id> [instructions]  - Звонок по лиду из CRM
  node pbk-retell-integration.js status <call_id>               - Статус звонка

Примеры:
  node pbk-retell-integration.js test
  node pbk-retell-integration.js call 123 "Узнать бюджет"
  node pbk-retell-integration.js status call_258e170272093ab12a4c52720e5
      `);
  }
}

module.exports = {
  createRetellCall,
  getCallStatus,
  getCallAnalysis,
  updateCRMLead,
  sendTelegramNotification,
  handleRetellWebhook,
  makeCallForLead
};
