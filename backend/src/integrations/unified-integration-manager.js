#!/usr/bin/env node
/**
 * PBK CRM - Unified Integration Manager
 * 
 * Единая точка управления всеми интеграциями:
 * - Fixly.pl (автоматические заявки на ремонт)
 * - Offerteo.pl (строительные тендеры)
 * - Retell AI (голосовые звонки)
 * - Telegram Bot (уведомления и управление)
 * - CRM Backend (сохранение данных)
 */

require('dotenv').config({ path: '../../.env' });
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const pool = require('../database/db');
const logger = require('../utils/logger');

// Конфигурация
const CONFIG = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || '8003573668:AAHHs6GUJx-pUEL-fxe_lwVJCRutftrCZ30',
    ownerChatId: process.env.TELEGRAM_OWNER_CHAT_ID || '443876287',
    approvalGroupId: process.env.TELEGRAM_APPROVAL_GROUP || '-5088238645',
    salesGroupId: process.env.TELEGRAM_SALES_GROUP || ''
  },
  crm: {
    apiUrl: process.env.CRM_API_URL || 'http://localhost:5002/api/bot-internal',
    baseUrl: process.env.BASE_URL || 'http://localhost:5002'
  },
  retell: {
    apiKey: process.env.RETELL_API_KEY || '',
    baseUrl: 'https://api.retellai.com',
    agentId: process.env.RETELL_AGENT_ID || '',
    phoneNumber: process.env.RETELL_PHONE_NUMBER || ''
  },
  fixly: {
    serviceUrl: 'http://localhost:3001', // Fixly bot API (если нужен прокси)
    enabled: true
  },
  offerteo: {
    apiKey: process.env.OFFERTEO_API_KEY || '',
    enabled: true
  }
};

// Инициализация Telegram бота (polling режим - webhook не работает через Cloudflare/Starlink)
const bot = new TelegramBot(CONFIG.telegram.token, { polling: true });

// Хранилище сессий для пользователей
const userSessions = new Map();
const pendingApprovals = new Map(); // Ожидающие подтверждения заявки

logger.info('🤖 PBK Unified Integration Manager starting...');
logger.info(`📱 Telegram Bot Token: ${CONFIG.telegram.token.substring(0, 20)}...`);
logger.info(`👤 Owner Chat ID: ${CONFIG.telegram.ownerChatId}`);
logger.info(`📊 CRM API: ${CONFIG.crm.apiUrl}`);

// ============================================
// TELEGRAM BOT - ГЛАВНОЕ МЕНЮ
// ============================================

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  logger.info(`📱 /start from Chat ID: ${chatId} | User: @${msg.from.username || 'unknown'}`);
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📞 CRM - Управление', callback_data: 'menu_crm' },
          { text: '🏗️ Fixly - Заявки', callback_data: 'menu_fixly' }
        ],
        [
          { text: '🏗️ Offerteo - Тендеры', callback_data: 'menu_offerteo' },
          { text: '🤖 Retell - AI Звонки', callback_data: 'menu_retell' }
        ],
        [
          { text: '📊 Статистика', callback_data: 'menu_stats' },
          { text: '⚙️ Настройки', callback_data: 'menu_settings' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, `🏗️ *PBK Construction CRM*

🤖 Единая система управления всеми интеграциями

*📞 CRM функции:*
• Управление лидами и клиентами
• Звонки и задачи
• Финансовый учет

*🏗️ Fixly.pl:*
• Автоматический прием заявок
• Создание сделок в CRM
• Уведомления о новых заявках

*🏗️ Offerteo.pl:*
• Мониторинг тендеров
• Автоподтверждение заявок
• Создание проектов в CRM

*🤖 Retell AI:*
• Автоматические звонки клиентам
• Сбор информации
• Назначение встреч

Выберите раздел:`, { parse_mode: 'Markdown', ...keyboard });
});

// ============================================
// CRM МЕНЮ
// ============================================

function showCRMMenu(chatId) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '👥 Новые лиды', callback_data: 'crm_leads' }],
        [{ text: '📞 Создать звонок', callback_data: 'crm_call' }],
        [{ text: '📊 Статистика CRM', callback_data: 'crm_stats' }],
        [{ text: '⬅️ Назад', callback_data: 'menu_main' }]
      ]
    }
  };

  bot.sendMessage(chatId, `📞 *CRM - Управление*

Доступные функции:
• Просмотр новых лидов
• Создание звонков через Retell AI
• Статистика по сделкам
• Управление задачами`, { parse_mode: 'Markdown', ...keyboard });
}

async function showCRMLeads(chatId) {
  try {
    const response = await axios.get(`${CONFIG.crm.apiUrl}/leads?limit=10&stage=new`);
    const leads = response.data;

    if (!leads || leads.length === 0) {
      bot.sendMessage(chatId, '📋 Нет новых лидов в системе');
      return;
    }

    let message = '📋 *Новые лиды:*\n\n';
    leads.slice(0, 10).forEach((lead, index) => {
      message += `${index + 1}. *${lead.title || lead.name || 'Без названия'}*\n`;
      message += `   📞 ${lead.phone || 'Нет телефона'}\n`;
      message += `   💰 ${lead.value ? formatMoney(lead.value) : 'Не указано'}\n`;
      message += `   🏷️ Источник: ${lead.source || 'CRM'}\n\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error('Error fetching CRM leads:', error.message);
    bot.sendMessage(chatId, '❌ Ошибка получения лидов из CRM');
  }
}

async function showCRMStats(chatId) {
  try {
    const response = await axios.get(`${CONFIG.crm.apiUrl}/dashboard/metrics`);
    const stats = response.data;

    const message = `📊 *Статистика CRM*

👥 *Лиды:* ${stats.leads || 0}
✅ *Клиенты:* ${stats.clients || 0}
📞 *Звонки:* ${stats.calls || 0}
📋 *Задачи:* ${stats.tasks || 0}

💰 *Сделки:* ${stats.deals || 0}
💵 *Сумма сделок:* ${formatMoney(stats.dealsValue || 0)}`;

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error('Error fetching CRM stats:', error.message);
    bot.sendMessage(chatId, '❌ Ошибка получения статистики');
  }
}

// ============================================
// FIXLY МЕНЮ
// ============================================

function showFixlyMenu(chatId) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📋 Ожидающие заявки', callback_data: 'fixly_pending' }],
        [{ text: '✅ Принятые заявки', callback_data: 'fixly_accepted' }],
        [{ text: '📊 Статистика Fixly', callback_data: 'fixly_stats' }],
        [{ text: '⬅️ Назад', callback_data: 'menu_main' }]
      ]
    }
  };

  bot.sendMessage(chatId, `🏗️ *Fixly.pl - Заявки на ремонт*

Fixly bot работает в фоне и автоматически:
• Мониторит новые заявки каждые 2 минуты
• Отправляет их для утверждения
• Создает сделки в CRM после подтверждения
• Отправляет уведомления в группу продаж

*Статус:* ${CONFIG.fixly.enabled ? '✅ Активен' : '⚠️ Отключен'}`, 
    { parse_mode: 'Markdown', ...keyboard });
}

// ============================================
// OFFERTEO МЕНЮ
// ============================================

function showOfferteoMenu(chatId) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📋 Новые тендеры', callback_data: 'offerteo_new' }],
        [{ text: '✅ Активные предложения', callback_data: 'offerteo_active' }],
        [{ text: '📊 Статистика Offerteo', callback_data: 'offerteo_stats' }],
        [{ text: '⬅️ Назад', callback_data: 'menu_main' }]
      ]
    }
  };

  bot.sendMessage(chatId, `🏗️ *Offerteo.pl - Строительные тендеры*

Offerteo bot работает через API:
• Проверяет новые тендеры каждые 5 минут
• Отправляет для утверждения
• Автоматически подтверждает участие
• Создает проекты в CRM

*Статус:* ${CONFIG.offerteo.enabled ? '✅ Активен' : '⚠️ Отключен'}
*API Key:* ${CONFIG.offerteo.apiKey ? '✅ Настроен' : '❌ Не настроен'}`, 
    { parse_mode: 'Markdown', ...keyboard });
}

async function showOfferteoLeads(chatId) {
  try {
    const response = await axios.get(`${CONFIG.crm.apiUrl}/offerteo/leads`);
    const leads = response.data.data || [];

    if (leads.length === 0) {
      bot.sendMessage(chatId, '📋 Нет заявок от Offerteo');
      return;
    }

    let message = '📋 *Заявки от Offerteo:*\n\n';
    leads.slice(0, 10).forEach((lead, index) => {
      message += `${index + 1}. *${lead.name || 'Без названия'}*\n`;
      message += `   📞 ${lead.phone || 'Нет'}\n`;
      message += `   🏷️ ${lead.service_type || 'Тип не указан'}\n`;
      message += `   📍 ${lead.location || 'Локация не указана'}\n\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error('Error fetching Offerteo leads:', error.message);
    bot.sendMessage(chatId, '❌ Ошибка получения заявок Offerteo');
  }
}

// ============================================
// RETELL AI МЕНЮ
// ============================================

function showRetellMenu(chatId) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📞 Создать звонок', callback_data: 'retell_create' }],
        [{ text: '📊 История звонков', callback_data: 'retell_history' }],
        [{ text: '⚙️ Статус Retell AI', callback_data: 'retell_status' }],
        [{ text: '⬅️ Назад', callback_data: 'menu_main' }]
      ]
    }
  };

  const status = CONFIG.retell.apiKey && CONFIG.retell.agentId ? '✅ Активен' : '❌ Не настроен';

  bot.sendMessage(chatId, `🤖 *Retell AI - Автоматические звонки*

Retell AI позволяет:
• Создавать автоматические звонки клиентам
• Собирать информацию о проекте
• Назначать встречи
• Получать транскрипты разговоров

*Статус:* ${status}
*Номер:* ${CONFIG.retell.phoneNumber || 'Не настроен'}`, 
    { parse_mode: 'Markdown', ...keyboard });
}

async function showRetellHistory(chatId) {
  try {
    const response = await axios.get(`${CONFIG.crm.apiUrl}/retell/calls`);
    const calls = response.data.data || [];

    if (calls.length === 0) {
      bot.sendMessage(chatId, '📞 Нет истории звонков');
      return;
    }

    let message = '📞 *История звонков Retell AI:*\n\n';
    calls.slice(0, 10).forEach((call, index) => {
      const duration = call.duration ? Math.round(call.duration) + 's' : 'N/A';
      message += `${index + 1}. ${call.lead_name || 'Неизвестно'}\n`;
      message += `   ⏱️ ${duration} | ${call.status}\n`;
      message += `   📅 ${new Date(call.created_at).toLocaleString('ru-RU')}\n\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error('Error fetching Retell history:', error.message);
    bot.sendMessage(chatId, '❌ Ошибка получения истории звонков');
  }
}

// ============================================
// ОБРАБОТКА CALLBACK QUERIES
// ============================================

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const userId = query.from.id;

  logger.info(`📥 Callback from ${chatId}: ${data}`);

  try {
    // ============================================
    // FIXLY - APPROVAL GROUP ACTIONS
    // ============================================
    
    // Принять заявку Fixly
    if (data.startsWith('fixly_accept_')) {
      const fixlyId = data.replace('fixly_accept_', '');
      const leadData = pendingApprovals.get(fixlyId);
      
      if (!leadData) {
        bot.answerCallbackQuery(query.id, { text: '❌ Заявка не найдена' });
        return;
      }
      
      // TODO: Вызвать Fixly bot API для принятия заявки
      // TODO: Отправить welcome message клиенту
      // TODO: Создать лид в CRM (уже создан через webhook, получить ID)
      
      await bot.answerCallbackQuery(query.id, { text: '✅ Заявка принята! Создаю лид...' });
      
      // Обновляем сообщение с информацией о принятии
      await bot.editMessageReplyMarkup(
        { inline_keyboard: [] },
        { chat_id: chatId, message_id: query.message.message_id }
      );
      
      await bot.sendMessage(chatId, `✅ *Заявка #${fixlyId} принята*\n\n👤 ${query.from.first_name} принял заявку\n📞 Отправляем уведомление в группу продаж...`, { parse_mode: 'Markdown' });
      
      // Отправляем в группу продаж
      await notifyLeadToSalesGroup({
        ...leadData,
        crmLeadId: leadData.id,
        source: 'fixly'
      });
      
      pendingApprovals.delete(fixlyId);
    }
    
    // Отклонить заявку Fixly
    else if (data.startsWith('fixly_reject_')) {
      const fixlyId = data.replace('fixly_reject_', '');
      
      await bot.answerCallbackQuery(query.id, { text: '❌ Заявка отклонена' });
      
      await bot.editMessageReplyMarkup(
        { inline_keyboard: [] },
        { chat_id: chatId, message_id: query.message.message_id }
      );
      
      await bot.sendMessage(chatId, `❌ *Заявка #${fixlyId} отклонена*\n\n👤 ${query.from.first_name} отклонил заявку`, { parse_mode: 'Markdown' });
      
      pendingApprovals.delete(fixlyId);
    }
    
    // Поделиться заявкой Fixly
    else if (data.startsWith('fixly_share_')) {
      const fixlyId = data.replace('fixly_share_', '');
      
      // Получаем список пользователей CRM
      try {
        const response = await axios.get(`${CONFIG.crm.apiUrl}/users/list`);
        const users = response.data.data || response.data || [];
        
        if (users.length === 0) {
          bot.answerCallbackQuery(query.id, { text: '❌ Нет пользователей для шэринга' });
          return;
        }
        
        // Создаем кнопки с пользователями
        const userButtons = users.map(user => [{
          text: `👤 ${user.name || user.email}`,
          callback_data: `fixly_share_user_${fixlyId}_${user.id}`
        }]);
        
        userButtons.push([{ text: '❌ Отмена', callback_data: 'cancel' }]);
        
        await bot.sendMessage(chatId, `👥 *Поделиться заявкой #${fixlyId}*\n\nВыберите пользователя:`, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: userButtons }
        });
        
        bot.answerCallbackQuery(query.id);
      } catch (error) {
        logger.error('Error fetching users:', error.message);
        bot.answerCallbackQuery(query.id, { text: '❌ Ошибка получения пользователей' });
      }
    }
    
    // Поделиться с конкретным пользователем
    else if (data.startsWith('fixly_share_user_')) {
      const parts = data.replace('fixly_share_user_', '').split('_');
      const fixlyId = parts[0];
      const targetUserId = parts[1];
      
      // TODO: Получить Telegram ID пользователя из CRM и отправить ему заявку
      
      bot.answerCallbackQuery(query.id, { text: '✅ Заявка отправлена пользователю' });
      await bot.sendMessage(chatId, `✅ Заявка #${fixlyId} отправлена пользователю`, { parse_mode: 'Markdown' });
    }
    
    // Показать подробности заявки Fixly
    else if (data.startsWith('fixly_details_')) {
      const fixlyId = data.replace('fixly_details_', '');
      const leadData = pendingApprovals.get(fixlyId);
      
      if (!leadData) {
        bot.answerCallbackQuery(query.id, { text: '❌ Заявка не найдена' });
        return;
      }
      
      const detailsMessage = `📄 *ПОДРОБНОСТИ ЗАЯВКИ #${fixlyId}*

📋 *${leadData.title}*

👤 *Клиент:* ${leadData.customerName || 'Не указано'}
📞 *Телефон:* ||${leadData.phone || 'Будет доступен после принятия'}||
📧 *Email:* ${leadData.email || 'Не указано'}
📍 *Район:* ${leadData.district || 'Не указано'}
💰 *Бюджет:* ${leadData.budget || 'Не указано'}

📝 *Полное описание:*
${leadData.description || 'Нет описания'}

🔗 *Fixly URL:* ${leadData.url || 'N/A'}`;

      await bot.sendMessage(chatId, detailsMessage, { parse_mode: 'Markdown' });
      bot.answerCallbackQuery(query.id);
    }
    
    // ============================================
    // OFFERTEO - APPROVAL GROUP ACTIONS
    // ============================================
    
    // Принять тендер Offerteo
    else if (data.startsWith('offerteo_accept_')) {
      const rfpId = data.replace('offerteo_accept_', '');
      const leadData = pendingApprovals.get(`offerteo_${rfpId}`);
      
      if (!leadData) {
        bot.answerCallbackQuery(query.id, { text: '❌ Тендер не найден' });
        return;
      }
      
      // TODO: Вызвать Offerteo API для подтверждения участия
      // TODO: Создать проект в CRM
      
      await bot.answerCallbackQuery(query.id, { text: '✅ Участие подтверждено!' });
      
      await bot.editMessageReplyMarkup(
        { inline_keyboard: [] },
        { chat_id: chatId, message_id: query.message.message_id }
      );
      
      await bot.sendMessage(chatId, `✅ *Тендер #${rfpId} принят*\n\n👤 ${query.from.first_name} подтвердил участие\n📞 Отправляем уведомление в группу продаж...`, { parse_mode: 'Markdown' });
      
      // Отправляем в группу продаж
      await notifyLeadToSalesGroup({
        ...leadData,
        crmLeadId: leadData.id,
        source: 'offerteo'
      });
      
      pendingApprovals.delete(`offerteo_${rfpId}`);
    }
    
    // Отклонить тендер Offerteo
    else if (data.startsWith('offerteo_reject_')) {
      const rfpId = data.replace('offerteo_reject_', '');
      
      await bot.answerCallbackQuery(query.id, { text: '❌ Тендер пропущен' });
      
      await bot.editMessageReplyMarkup(
        { inline_keyboard: [] },
        { chat_id: chatId, message_id: query.message.message_id }
      );
      
      await bot.sendMessage(chatId, `❌ *Тендер #${rfpId} пропущен*\n\n👤 ${query.from.first_name} пропустил тендер`, { parse_mode: 'Markdown' });
      
      pendingApprovals.delete(`offerteo_${rfpId}`);
    }
    
    // Поделиться тендером Offerteo
    else if (data.startsWith('offerteo_share_')) {
      const rfpId = data.replace('offerteo_share_', '');
      
      try {
        const response = await axios.get(`${CONFIG.crm.apiUrl}/users`);
        const users = response.data.data || response.data || [];
        
        if (users.length === 0) {
          bot.answerCallbackQuery(query.id, { text: '❌ Нет пользователей для шэринга' });
          return;
        }
        
        const userButtons = users.map(user => [{
          text: `👤 ${user.name || user.email}`,
          callback_data: `offerteo_share_user_${rfpId}_${user.id}`
        }]);
        
        userButtons.push([{ text: '❌ Отмена', callback_data: 'cancel' }]);
        
        await bot.sendMessage(chatId, `👥 *Поделиться тендером #${rfpId}*\n\nВыберите пользователя:`, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: userButtons }
        });
        
        bot.answerCallbackQuery(query.id);
      } catch (error) {
        logger.error('Error fetching users:', error.message);
        bot.answerCallbackQuery(query.id, { text: '❌ Ошибка получения пользователей' });
      }
    }
    
    // Поделиться с конкретным пользователем (Offerteo)
    else if (data.startsWith('offerteo_share_user_')) {
      const parts = data.replace('offerteo_share_user_', '').split('_');
      const rfpId = parts[0];
      const targetUserId = parts[1];
      
      // TODO: Получить Telegram ID пользователя из CRM и отправить ему тендер
      
      bot.answerCallbackQuery(query.id, { text: '✅ Тендер отправлен пользователю' });
      await bot.sendMessage(chatId, `✅ Тендер #${rfpId} отправлен пользователю`, { parse_mode: 'Markdown' });
    }
    
    // Показать подробности тендера Offerteo
    else if (data.startsWith('offerteo_details_')) {
      const rfpId = data.replace('offerteo_details_', '');
      const leadData = pendingApprovals.get(`offerteo_${rfpId}`);
      
      if (!leadData) {
        bot.answerCallbackQuery(query.id, { text: '❌ Тендер не найден' });
        return;
      }
      
      const detailsMessage = `📄 *ПОДРОБНОСТИ ТЕНДЕРА #${rfpId}*

📋 *${leadData.title}*

🏷️ *Категория:* ${leadData.categoryName || 'Не указано'}
📍 *Локация:* ${leadData.locationName || 'Не указано'}
💰 *Бюджет:* ${leadData.budget || 'Не указано'}
⏰ *Дедлайн:* ${leadData.deadline || 'Не указано'}

📝 *Полное описание:*
${leadData.description || 'Нет описания'}

🔗 *Offerteo URL:* ${leadData.url || 'N/A'}`;

      await bot.sendMessage(chatId, detailsMessage, { parse_mode: 'Markdown' });
      bot.answerCallbackQuery(query.id);
    }
    
    // ============================================
    // SALES GROUP - LEAD ACTIONS
    // ============================================
    
    // Создать звонок Retell AI
    else if (data.startsWith('lead_call_')) {
      const leadId = data.replace('lead_call_', '');
      
      // TODO: Получить данные лида и создать звонок через Retell AI
      
      bot.answerCallbackQuery(query.id, { text: '📞 Создаю звонок...' });
      await bot.sendMessage(chatId, `📞 Звонок для лида #${leadId} создается через Retell AI...`, { parse_mode: 'Markdown' });
    }
    
    // Открыть карточку лида
    else if (data.startsWith('lead_card_')) {
      const leadId = data.replace('lead_card_', '');
      const webUrl = process.env.CRM_WEB_URL || CONFIG.crm.baseUrl;
      
      bot.answerCallbackQuery(query.id, { 
        text: '📋 Открываю карточку...', 
        url: `${webUrl}/leads/${leadId}` 
      });
    }
    
    // Передать лид менеджеру
    else if (data.startsWith('lead_assign_')) {
      const leadId = data.replace('lead_assign_', '');
      
      // Получаем список пользователей CRM
      try {
        const response = await axios.get(`${CONFIG.crm.apiUrl}/users/list`);
        const users = response.data.data || response.data || [];
        
        const userButtons = users.map(user => [{
          text: `👤 ${user.name || user.email}`,
          callback_data: `lead_assign_user_${leadId}_${user.id}`
        }]);
        
        userButtons.push([{ text: '❌ Отмена', callback_data: 'cancel' }]);
        
        await bot.sendMessage(chatId, `👤 *Передать лид #${leadId}*\n\nВыберите менеджера:`, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: userButtons }
        });
        
        bot.answerCallbackQuery(query.id);
      } catch (error) {
        logger.error('Error fetching users:', error.message);
        bot.answerCallbackQuery(query.id, { text: '❌ Ошибка получения пользователей' });
      }
    }
    
    // Подтверждение назначения лида
    else if (data.startsWith('lead_assign_user_')) {
      const parts = data.replace('lead_assign_user_', '').split('_');
      const leadId = parts[0];
      const targetUserId = parts[1];
      
      // TODO: Обновить assigned_to в базе данных
      
      bot.answerCallbackQuery(query.id, { text: '✅ Лид передан менеджеру' });
      await bot.sendMessage(chatId, `✅ Лид #${leadId} передан менеджеру`, { parse_mode: 'Markdown' });
    }
    
    // Добавить заметку к лиду
    else if (data.startsWith('lead_note_')) {
      const leadId = data.replace('lead_note_', '');
      
      userSessions.set(userId, { action: 'add_note', leadId });
      
      bot.answerCallbackQuery(query.id);
      await bot.sendMessage(chatId, `✏️ *Добавить заметку к лиду #${leadId}*\n\nОтправьте текст заметки:`, { parse_mode: 'Markdown' });
    }
    
    // Создать задачу
    else if (data.startsWith('lead_task_')) {
      const leadId = data.replace('lead_task_', '');
      
      userSessions.set(userId, { action: 'create_task', leadId });
      
      bot.answerCallbackQuery(query.id);
      await bot.sendMessage(chatId, `⏰ *Создать задачу для лида #${leadId}*\n\nОтправьте описание задачи и дедлайн в формате:\n\n<i>Текст задачи\nДата: 2026-01-10 15:00</i>`, { parse_mode: 'HTML' });
    }
    
    // Создать автозвонок
    else if (data.startsWith('lead_autocall_')) {
      const leadId = data.replace('lead_autocall_', '');
      
      userSessions.set(userId, { action: 'schedule_autocall', leadId });
      
      bot.answerCallbackQuery(query.id);
      await bot.sendMessage(chatId, `🤖 *Создать автозвонок для лида #${leadId}*\n\nОтправьте дату и время звонка в формате:\n\n<i>2026-01-10 15:00</i>\n\nЗа 5 минут до звонка вы получите уведомление для подтверждения.`, { parse_mode: 'HTML' });
    }
    
    // ============================================
    // MAIN MENU
    // ============================================
    
    else if (data === 'menu_main') {
      bot.sendMessage(chatId, 'Используйте /start для главного меню');
    } else if (data === 'menu_crm') {
      showCRMMenu(chatId);
    } else if (data === 'menu_fixly') {
      showFixlyMenu(chatId);
    } else if (data === 'menu_offerteo') {
      showOfferteoMenu(chatId);
    } else if (data === 'menu_retell') {
      showRetellMenu(chatId);
    } else if (data === 'menu_stats') {
      showCRMStats(chatId);
    } else if (data === 'menu_settings') {
      bot.sendMessage(chatId, `⚙️ *Настройки*

🔗 Web интерфейс: ${CONFIG.crm.baseUrl}
🔑 Используйте веб-интерфейс для детальных настроек

Ваш Chat ID: \`${chatId}\``, { parse_mode: 'Markdown' });
    }
    
    // CRM
    else if (data === 'crm_leads') {
      showCRMLeads(chatId);
    } else if (data === 'crm_stats') {
      showCRMStats(chatId);
    } else if (data === 'crm_call') {
      bot.sendMessage(chatId, '📞 Функция создания звонка в разработке. Используйте Retell AI меню.');
    }
    
    // Fixly
    else if (data === 'fixly_pending') {
      bot.sendMessage(chatId, '📋 Ожидающие заявки Fixly отображаются автоматически при поступлении.');
    } else if (data === 'fixly_accepted') {
      bot.sendMessage(chatId, '✅ История принятых заявок доступна в CRM.');
    } else if (data === 'fixly_stats') {
      bot.sendMessage(chatId, '📊 Статистика Fixly в разработке.');
    }
    
    // Offerteo
    else if (data === 'offerteo_new') {
      showOfferteoLeads(chatId);
    } else if (data === 'offerteo_active') {
      bot.sendMessage(chatId, '✅ Активные предложения в разработке.');
    } else if (data === 'offerteo_stats') {
      bot.sendMessage(chatId, '📊 Статистика Offerteo в разработке.');
    }
    
    // Retell
    else if (data === 'retell_create') {
      bot.sendMessage(chatId, '📞 Создание звонка: выберите лида из /leads');
    } else if (data === 'retell_history') {
      showRetellHistory(chatId);
    } else if (data === 'retell_status') {
      const status = CONFIG.retell.apiKey ? 'Подключен' : 'Не настроен';
      bot.sendMessage(chatId, `⚙️ *Статус Retell AI*

API Key: ${CONFIG.retell.apiKey ? '✅ Настроен' : '❌ Не настроен'}
Agent ID: ${CONFIG.retell.agentId || 'Не настроен'}
Телефон: ${CONFIG.retell.phoneNumber || 'Не настроен'}

Статус: ${status}`, { parse_mode: 'Markdown' });
    }
    
    // Cancel
    else if (data === 'cancel') {
      bot.answerCallbackQuery(query.id, { text: '❌ Отменено' });
    }

    bot.answerCallbackQuery(query.id);

  } catch (error) {
    logger.error('Callback error:', error.message);
    bot.answerCallbackQuery(query.id, { text: '❌ Ошибка' });
  }
});

// ============================================
// КОМАНДЫ
// ============================================

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, `🆘 *Помощь - Команды*

*📞 CRM:*
/start - Главное меню
/leads - Список новых лидов
/stats - Статистика CRM

*🏗️ Fixly:*
Автоматическая работа
Заявки приходят автоматически

*🏗️ Offerteo:*
Автоматическая работа
Тендеры приходят автоматически

*🤖 Retell AI:*
/call - Создать звонок
/history - История звонков

*⚙️ Общее:*
/help - Эта справка
/ping - Проверка связи
/id - Получить Chat ID`, { parse_mode: 'Markdown' });
});

bot.onText(/\/ping/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `✅ Pong!

<b>Информация:</b>
• Chat ID: <code>${chatId}</code>
• Username: @${msg.from.username || 'нет'}
• Имя: ${msg.from.first_name || ''} ${msg.from.last_name || ''}

Бот работает! 🤖`, { parse_mode: 'HTML' });
});

bot.onText(/\/id/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `📱 Ваш Chat ID: \`${chatId}\`

Используйте этот ID для настройки уведомлений.`, { parse_mode: 'Markdown' });
});

bot.onText(/\/leads/, async (msg) => {
  const chatId = msg.chat.id;
  await showCRMLeads(chatId);
});

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  await showCRMStats(chatId);
});

// ============================================
// ОБРАБОТКА ТЕКСТОВЫХ СООБЩЕНИЙ (для заметок, задач и т.д.)
// ============================================

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  // Игнорируем команды
  if (!text || text.startsWith('/')) return;

  const session = userSessions.get(userId);
  if (!session) return;

  try {
    // Добавить заметку к лиду
    if (session.action === 'add_note') {
      const { leadId } = session;
      
      // TODO: Сохранить заметку в базу данных через API
      // await axios.post(`${CONFIG.crm.apiUrl}/leads/${leadId}/notes`, { note: text });
      
      await bot.sendMessage(chatId, `✅ *Заметка добавлена к лиду #${leadId}*\n\n📝 "${text}"`, { parse_mode: 'Markdown' });
      
      userSessions.delete(userId);
    }
    
    // Создать задачу
    else if (session.action === 'create_task') {
      const { leadId } = session;
      
      // Парсим текст задачи (формат: "Текст задачи\nДата: 2026-01-10 15:00")
      const lines = text.split('\n');
      const taskDescription = lines[0];
      const dateMatch = text.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
      const deadline = dateMatch ? dateMatch[1] : null;
      
      // TODO: Сохранить задачу в базу данных через API
      // await axios.post(`${CONFIG.crm.apiUrl}/tasks`, { 
      //   lead_id: leadId, 
      //   description: taskDescription, 
      //   deadline 
      // });
      
      await bot.sendMessage(chatId, `✅ *Задача создана для лида #${leadId}*\n\n📋 ${taskDescription}\n⏰ Дедлайн: ${deadline || 'Не указан'}`, { parse_mode: 'Markdown' });
      
      userSessions.delete(userId);
    }
    
    // Запланировать автозвонок
    else if (session.action === 'schedule_autocall') {
      const { leadId } = session;
      
      // Парсим дату и время
      const dateMatch = text.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
      
      if (!dateMatch) {
        await bot.sendMessage(chatId, `❌ Неверный формат даты. Используйте: 2026-01-10 15:00`);
        return;
      }
      
      const callTime = dateMatch[1];
      
      // TODO: Сохранить запланированный звонок в базу данных
      // TODO: Создать задачу для cron, которая за 5 минут до звонка отправит уведомление
      // await axios.post(`${CONFIG.crm.apiUrl}/leads/${leadId}/schedule-call`, { 
      //   scheduled_time: callTime 
      // });
      
      await bot.sendMessage(chatId, `✅ *Автозвонок запланирован для лида #${leadId}*\n\n🤖 Дата: ${callTime}\n⏰ За 5 минут до звонка вы получите уведомление для подтверждения.`, { parse_mode: 'Markdown' });
      
      userSessions.delete(userId);
    }
    
  } catch (error) {
    logger.error('Message handling error:', error.message);
    await bot.sendMessage(chatId, '❌ Ошибка обработки сообщения');
    userSessions.delete(userId);
  }
});

// ============================================
// WEBHOOK HANDLERS (для Fixly и Offerteo)
// ============================================

/**
 * Отправить уведомление о новой заявке Fixly в группу утверждения
 */
async function notifyFixlyLead(leadData) {
  try {
    const message = `🏗️ *НОВАЯ ЗАЯВКА FIXLY.PL #${leadData.fixlyId}*

📋 *${leadData.title || 'Без названия'}*

👤 Клиент: ${leadData.customerName || 'Не указано'}
📍 Район: ${leadData.district || 'Не указано'}
💰 Бюджет: ${leadData.budget || 'Не указано'}

📝 Описание (кратко):
${leadData.description ? leadData.description.substring(0, 200) + '...' : 'Нет'}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Принять', callback_data: `fixly_accept_${leadData.fixlyId}` },
          { text: '❌ Отклонить', callback_data: `fixly_reject_${leadData.fixlyId}` }
        ],
        [
          { text: '👥 Поделиться', callback_data: `fixly_share_${leadData.fixlyId}` },
          { text: '📄 Подробнее', callback_data: `fixly_details_${leadData.fixlyId}` }
        ]
      ]
    };

    await bot.sendMessage(CONFIG.telegram.approvalGroupId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    // Сохраняем данные заявки для последующих действий
    pendingApprovals.set(leadData.fixlyId, leadData);

    logger.info(`✅ Fixly lead notification sent: ${leadData.fixlyId}`);
    return true;
  } catch (error) {
    logger.error('Error sending Fixly notification:', error.message);
    return false;
  }
}

/**
 * Отправить уведомление о новом лиде в группу продаж
 */
async function notifyLeadToSalesGroup(leadData) {
  try {
    const salesGroupId = CONFIG.telegram.salesGroupId || CONFIG.telegram.approvalGroupId;
    
    const message = `🆕 *НОВЫЙ ЛИД #${leadData.crmLeadId || leadData.id}*

📋 ${leadData.title || 'Без названия'}
👤 ${leadData.customerName || 'Не указано'}
📞 ${leadData.phone || 'Не указано'}
💰 ${leadData.budget || 'Не указано'}

📍 Источник: ${leadData.source === 'fixly' ? 'Fixly.pl' : 'Offerteo.pl'}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📞 Звонок', callback_data: `lead_call_${leadData.crmLeadId}` },
          { text: '📋 Карточка', callback_data: `lead_card_${leadData.crmLeadId}` }
        ],
        [
          { text: '👤 Передать', callback_data: `lead_assign_${leadData.crmLeadId}` },
          { text: '✏️ Заметка', callback_data: `lead_note_${leadData.crmLeadId}` }
        ],
        [
          { text: '⏰ Задача', callback_data: `lead_task_${leadData.crmLeadId}` },
          { text: '🤖 Автозвонок', callback_data: `lead_autocall_${leadData.crmLeadId}` }
        ]
      ]
    };

    await bot.sendMessage(salesGroupId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    logger.info(`✅ Lead notification sent to sales group: ${leadData.crmLeadId}`);
    return true;
  } catch (error) {
    logger.error('Error sending sales notification:', error.message);
    return false;
  }
}

/**
 * Отправить уведомление о новом тендере Offerteo в группу утверждения
 */
async function notifyOfferteoLead(leadData) {
  try {
    const message = `🏗️ *НОВЫЙ ТЕНДЕР OFFERTEO.PL #${leadData.rfpId}*

📋 *${leadData.title || 'Без названия'}*

🏷️ Категория: ${leadData.categoryName || 'Не указано'}
📍 Локация: ${leadData.locationName || 'Не указано'}
💰 Бюджет: ${leadData.budget || 'Не указано'}
⏰ Дедлайн: ${leadData.deadline || 'Не указано'}

📝 Описание (кратко):
${leadData.description ? leadData.description.substring(0, 200) + '...' : 'Нет'}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Принять', callback_data: `offerteo_accept_${leadData.rfpId}` },
          { text: '❌ Отклонить', callback_data: `offerteo_reject_${leadData.rfpId}` }
        ],
        [
          { text: '👥 Поделиться', callback_data: `offerteo_share_${leadData.rfpId}` },
          { text: '📄 Подробнее', callback_data: `offerteo_details_${leadData.rfpId}` }
        ]
      ]
    };

    await bot.sendMessage(CONFIG.telegram.approvalGroupId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    // Сохраняем данные тендера для последующих действий
    pendingApprovals.set(`offerteo_${leadData.rfpId}`, leadData);

    logger.info(`✅ Offerteo lead notification sent: ${leadData.rfpId}`);
    return true;
  } catch (error) {
    logger.error('Error sending Offerteo notification:', error.message);
    return false;
  }
}

// ============================================
// УТИЛИТЫ
// ============================================

function formatMoney(amount) {
  if (!amount) return '0 PLN';
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// ============================================
// ОБРАБОТКА ОШИБОК
// ============================================

// Polling mode - обработка ошибок polling
bot.on('polling_error', (error) => {
  // Игнорируем 409 конфликты - они решаются автоматически
  if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
    logger.warn('⚠️ Telegram polling conflict (resolving automatically)');
    return;
  }
  
  logger.error('Telegram polling error:', {
    message: error.message,
    code: error.code,
    stack: error.stack
  });
});

process.on('SIGINT', () => {
  logger.info('\n🛑 Stopping Unified Integration Manager...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('\n🛑 Stopping Unified Integration Manager...');
  process.exit(0);
});

// ============================================
// ЭКСПОРТ
// ============================================

module.exports = {
  bot,
  notifyFixlyLead,
  notifyOfferteoLead,
  notifyLeadToSalesGroup,
  CONFIG
};

// Запуск если вызван напрямую
if (require.main === module) {
  logger.info('✅ PBK Unified Integration Manager started!');
  logger.info(`📱 Telegram webhook mode active`);
  logger.info(`🔗 CRM API: ${CONFIG.crm.apiUrl}`);
  logger.info(`👤 Owner Chat ID: ${CONFIG.telegram.ownerChatId}`);
  
  // Startup message disabled - sends too frequently on container restarts
  // Use /start command to check status instead
}
