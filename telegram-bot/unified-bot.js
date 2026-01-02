#!/usr/bin/env node
require('dotenv').config({ path: '../.env' });
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Конфигурация
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8003573668:AAHHs6GUJx-pUEL-fxe_lwVJCRutftrCZ30';
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const userSessions = new Map();

// Категории расходов для ERP
const CATEGORIES = {
  materials: { name: 'materials', ru: '🏗️ Материалы', icon: '🏗️' },
  labor: { name: 'labor', ru: '👷 Работа', icon: '👷' },
  equipment: { name: 'equipment', ru: '🔧 Оборудование', icon: '🔧' },
  transport: { name: 'transport', ru: '🚚 Транспорт', icon: '🚚' },
  subcontractor: { name: 'subcontractor', ru: '🤝 Субподряд', icon: '🤝' },
  general: { name: 'general', ru: '📦 Общие расходы', icon: '📦' },
  utilities: { name: 'utilities', ru: '💡 Коммунальные', icon: '💡' },
  other: { name: 'other', ru: '📝 Другое', icon: '📝' }
};

console.log('🤖 PBK Unified Bot (CRM + ERP) запущен!');
console.log(`📱 Bot: @Pbkauto_bot`);
console.log(`🔌 API: ${API_URL}`);

// ============================================
// ГЛАВНОЕ МЕНЮ
// ============================================

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📞 CRM - Звонки', callback_data: 'menu_crm' },
          { text: '💰 ERP - Финансы', callback_data: 'menu_erp' }
        ],
        [
          { text: '📊 Статистика', callback_data: 'menu_stats' },
          { text: '⚙️ Настройки', callback_data: 'menu_settings' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, `🏗️ *PBK Construction Management*

🤖 Единая система управления CRM и ERP

*📞 CRM функции:*
• Управление звонками Retell AI
• Работа с лидами
• История взаимодействий

*💰 ERP функции:*
• Учет расходов по проектам
• Контроль бюджетов
• Финансовая аналитика

Выберите раздел:`, { parse_mode: 'Markdown', ...keyboard });
});

function showCRMMenu(chatId) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📞 Создать звонок', callback_data: 'crm_call' }],
        [{ text: '📋 Список лидов', callback_data: 'crm_leads' }],
        [{ text: '📊 История звонков', callback_data: 'crm_history' }],
        [{ text: '⬅️ Назад', callback_data: 'menu_main' }]
      ]
    }
  };

  bot.sendMessage(chatId, `📞 *CRM - Управление звонками*

Доступные команды:
/call - Создать новый звонок
/leads - Список лидов
/status - Статус звонка
/history - История звонков`, { parse_mode: 'Markdown', ...keyboard });
}

function showERPMenu(chatId) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💰 Добавить расход', callback_data: 'erp_expense' }],
        [{ text: '📊 Проекты', callback_data: 'erp_projects' }],
        [{ text: '📈 Статистика', callback_data: 'erp_stats' }],
        [{ text: '📅 Месячный отчет', callback_data: 'erp_monthly' }],
        [{ text: '⬅️ Назад', callback_data: 'menu_main' }]
      ]
    }
  };

  bot.sendMessage(chatId, `💰 *ERP - Финансовый учет*

Доступные команды:
/expense - Добавить расход
/projects - Список проектов
/stats - Статистика расходов
/monthly - Месячный отчет`, { parse_mode: 'Markdown', ...keyboard });
}

async function showStats(chatId) {
  try {
    // CRM Stats
    const dashboardResponse = await axios.get(`${API_URL}/dashboard/metrics`);
    const crmStats = dashboardResponse.data;

    // ERP Stats
    const erpResponse = await axios.get(`${API_URL}/expenses/stats/summary`);
    const erpStats = erpResponse.data;

    const message = `📊 *Общая статистика*

📞 *CRM:*
👥 Лидов: ${crmStats.leads || 0}
✅ Клиентов: ${crmStats.clients || 0}
📞 Звонков: ${crmStats.calls || 0}

💰 *ERP:*
💵 Общие расходы: ${formatMoney(erpStats.total_expenses)}
📊 Проектов: ${erpStats.active_projects || 0}
📦 Расходов: ${erpStats.total_count || 0}`;

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error fetching stats:', error.message);
    bot.sendMessage(chatId, '❌ Ошибка получения статистики');
  }
}

function showSettings(chatId) {
  bot.sendMessage(chatId, `⚙️ *Настройки*

🔗 Web интерфейс: http://localhost:3008
📧 Email: admin@pbkconstruction.net
🔐 Password: admin123

Для расширенных настроек используйте веб-интерфейс.`, { parse_mode: 'Markdown' });
}

// ============================================
// CRM - ЗВОНКИ
// ============================================

bot.onText(/\/call/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const response = await axios.get(`${API_URL}/leads?status=new`);
    const leads = response.data;
    
    if (leads.length === 0) {
      bot.sendMessage(chatId, '❌ Нет новых лидов для звонков');
      return;
    }
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: leads.slice(0, 10).map(lead => [{
          text: `${lead.name} - ${lead.phone}`,
          callback_data: `call_lead_${lead.id}`
        }])
      }
    };
    
    bot.sendMessage(chatId, '📞 Выберите лида для звонка:', keyboard);
  } catch (error) {
    console.error('Error fetching leads:', error.message);
    bot.sendMessage(chatId, '❌ Ошибка получения списка лидов');
  }
});

bot.onText(/\/leads/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const response = await axios.get(`${API_URL}/leads`);
    const leads = response.data;
    
    if (leads.length === 0) {
      bot.sendMessage(chatId, '📋 Нет активных лидов');
      return;
    }
    
    let message = '📋 *Список лидов:*\n\n';
    leads.slice(0, 15).forEach((lead, index) => {
      message += `${index + 1}. ${lead.name}\n`;
      message += `   📞 ${lead.phone}\n`;
      message += `   📊 Статус: ${lead.status}\n\n`;
    });
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error fetching leads:', error.message);
    bot.sendMessage(chatId, '❌ Ошибка получения лидов');
  }
});

bot.onText(/\/history/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const response = await axios.get(`${API_URL}/calls?limit=10`);
    const calls = response.data;
    
    if (calls.length === 0) {
      bot.sendMessage(chatId, '📞 Нет истории звонков');
      return;
    }
    
    let message = '📞 *История звонков:*\n\n';
    calls.forEach((call, index) => {
      message += `${index + 1}. ${call.lead_name || 'Неизвестно'}\n`;
      message += `   📅 ${new Date(call.created_at).toLocaleString('ru-RU')}\n`;
      message += `   ⏱️ ${call.duration ? Math.round(call.duration) + 's' : 'N/A'}\n`;
      message += `   ✅ ${call.status}\n\n`;
    });
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error fetching calls:', error.message);
    bot.sendMessage(chatId, '❌ Ошибка получения истории');
  }
});

// ============================================
// ERP - РАСХОДЫ
// ============================================

bot.onText(/\/expense/, (msg) => {
  const chatId = msg.chat.id;
  
  userSessions.set(chatId, { step: 'awaiting_project' });
  
  bot.sendMessage(chatId, `💰 *Добавление расхода*

Пожалуйста, опишите расход в одном сообщении:

Пример:
"Купил материалы для клиента Иван на 5000"
или
"Бензин 2000"

Или отправьте фото чека с описанием.`, { parse_mode: 'Markdown' });
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const session = userSessions.get(chatId);
  
  if (!session) return;
  
  // Обработка фото чека
  if (msg.photo && session.step === 'awaiting_project') {
    const photoId = msg.photo[msg.photo.length - 1].file_id;
    const caption = msg.caption || '';
    
    session.photo = photoId;
    session.description = caption;
    session.step = 'select_project';
    
    await showProjectSelection(chatId);
    return;
  }
  
  // Обработка текстового описания
  if (msg.text && session.step === 'awaiting_project' && !msg.text.startsWith('/')) {
    session.description = msg.text;
    session.step = 'select_project';
    await showProjectSelection(chatId);
    return;
  }
  
  // Обработка суммы
  if (msg.text && session.step === 'awaiting_amount' && !msg.text.startsWith('/')) {
    const amount = parseFloat(msg.text.replace(/[^\d.,]/g, '').replace(',', '.'));
    
    if (isNaN(amount) || amount <= 0) {
      bot.sendMessage(chatId, '❌ Неверная сумма. Введите число, например: 5000');
      return;
    }
    
    session.amount = amount;
    session.step = 'select_category';
    await showCategorySelection(chatId);
  }
});

async function showProjectSelection(chatId) {
  try {
    const response = await axios.get(`${API_URL}/projects`);
    const projects = response.data;
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          ...projects.map(project => [{
            text: `${project.name} (${formatMoney(project.remaining)} осталось)`,
            callback_data: `project_${project.id}`
          }]),
          [{ text: '📦 Общие расходы', callback_data: 'project_general' }],
          [{ text: '❌ Отмена', callback_data: 'expense_cancel' }]
        ]
      }
    };
    
    bot.sendMessage(chatId, '📊 Выберите проект:', keyboard);
  } catch (error) {
    console.error('Error fetching projects:', error.message);
    bot.sendMessage(chatId, '❌ Ошибка получения проектов');
    userSessions.delete(chatId);
  }
}

async function showCategorySelection(chatId) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        ...Object.entries(CATEGORIES).map(([key, cat]) => [{
          text: cat.ru,
          callback_data: `category_${cat.name}`
        }]),
        [{ text: '❌ Отмена', callback_data: 'expense_cancel' }]
      ]
    }
  };
  
  bot.sendMessage(chatId, '🏷️ Выберите категорию расхода:', keyboard);
}

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const session = userSessions.get(chatId);
  
  // Главное меню
  if (data === 'menu_crm') {
    showCRMMenu(chatId);
    bot.answerCallbackQuery(query.id);
    return;
  } else if (data === 'menu_erp') {
    showERPMenu(chatId);
    bot.answerCallbackQuery(query.id);
    return;
  } else if (data === 'menu_stats') {
    showStats(chatId);
    bot.answerCallbackQuery(query.id);
    return;
  } else if (data === 'menu_settings') {
    showSettings(chatId);
    bot.answerCallbackQuery(query.id);
    return;
  }
  
  // Выбор проекта
  if (data.startsWith('project_')) {
    if (!session) {
      bot.answerCallbackQuery(query.id, { text: 'Сессия истекла. Используйте /expense' });
      return;
    }
    
    if (data === 'project_general') {
      session.project_id = null;
      session.is_general = true;
    } else {
      const projectId = parseInt(data.replace('project_', ''));
      session.project_id = projectId;
      session.is_general = false;
    }
    
    session.step = 'awaiting_amount';
    bot.sendMessage(chatId, '💵 Введите сумму расхода (в гривнах):');
    bot.answerCallbackQuery(query.id);
    return;
  }
  
  // Выбор категории
  if (data.startsWith('category_')) {
    if (!session) {
      bot.answerCallbackQuery(query.id, { text: 'Сессия истекла. Используйте /expense' });
      return;
    }
    
    const category = data.replace('category_', '');
    session.category = category;
    
    await finalizeExpense(chatId, session);
    userSessions.delete(chatId);
    bot.answerCallbackQuery(query.id);
    return;
  }
  
  // Отмена
  if (data === 'expense_cancel') {
    userSessions.delete(chatId);
    bot.sendMessage(chatId, '❌ Добавление расхода отменено');
    bot.answerCallbackQuery(query.id);
    return;
  }
  
  // Обработка звонков
  if (data.startsWith('call_lead_')) {
    const leadId = parseInt(data.replace('call_lead_', ''));
    await createCall(chatId, leadId);
    bot.answerCallbackQuery(query.id);
    return;
  }
  
  // ERP меню
  if (data === 'erp_expense') {
    bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId, 'Используйте команду /expense');
  } else if (data === 'erp_projects') {
    bot.answerCallbackQuery(query.id);
    showProjects(chatId);
  } else if (data === 'erp_stats') {
    bot.answerCallbackQuery(query.id);
    showERPStats(chatId);
  } else if (data === 'erp_monthly') {
    bot.answerCallbackQuery(query.id);
    showMonthly(chatId);
  }
  
  // CRM меню
  if (data === 'crm_call') {
    bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId, 'Используйте команду /call');
  } else if (data === 'crm_leads') {
    bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId, 'Используйте команду /leads');
  } else if (data === 'crm_history') {
    bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId, 'Используйте команду /history');
  }
  
  // Главное меню
  if (data === 'menu_main') {
    bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId, 'Используйте команду /start');
  }
});

async function finalizeExpense(chatId, session) {
  try {
    const expenseData = {
      project_id: session.project_id,
      category: session.category,
      amount: session.amount,
      description: session.description,
      is_general: session.is_general || false,
      date: new Date().toISOString().split('T')[0]
    };
    
    const response = await axios.post(`${API_URL}/expenses`, expenseData);
    const expense = response.data;
    
    let message = `✅ *Расход добавлен*\n\n`;
    message += `💰 Сумма: ${formatMoney(expense.amount)}\n`;
    message += `🏷️ Категория: ${CATEGORIES[expense.category]?.ru || expense.category}\n`;
    message += `📝 Описание: ${expense.description}\n\n`;
    
    // Получить сводку
    if (session.project_id) {
      const budgetResponse = await axios.get(`${API_URL}/projects/${session.project_id}/budget`);
      const budget = budgetResponse.data;
      
      message += `📊 *Сводка по проекту:*\n`;
      message += `💼 Бюджет: ${formatMoney(budget.budget)}\n`;
      message += `💸 Потрачено: ${formatMoney(budget.total_spent)} (${budget.spent_percentage}%)\n`;
      message += `💵 Осталось: ${formatMoney(budget.remaining)}\n`;
      
      if (budget.spent_percentage >= 100) {
        message += `\n⚠️ *ВНИМАНИЕ: Бюджет превышен!*`;
      } else if (budget.spent_percentage >= 80) {
        message += `\n⚠️ Осталось только ${100 - budget.spent_percentage}% бюджета`;
      }
    } else {
      const statsResponse = await axios.get(`${API_URL}/expenses/stats/summary`);
      const stats = statsResponse.data;
      
      message += `📊 *Общие расходы за месяц:*\n`;
      message += `💸 Итого: ${formatMoney(stats.total_expenses)}\n`;
    }
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error adding expense:', error.message);
    bot.sendMessage(chatId, '❌ Ошибка добавления расхода');
  }
}

async function createCall(chatId, leadId) {
  try {
    const callData = {
      lead_id: leadId,
      status: 'pending',
      scheduled_at: new Date().toISOString()
    };
    
    const response = await axios.post(`${API_URL}/calls`, callData);
    const call = response.data;
    
    bot.sendMessage(chatId, `✅ Звонок создан!\n\nID: ${call.id}\nСтатус: ${call.status}\n\nОжидайте подтверждения.`);
  } catch (error) {
    console.error('Error creating call:', error.message);
    bot.sendMessage(chatId, '❌ Ошибка создания звонка');
  }
}

// ============================================
// ERP - ПРОЕКТЫ И СТАТИСТИКА
// ============================================

bot.onText(/\/projects/, async (msg) => {
  const chatId = msg.chat.id;
  await showProjects(chatId);
});

async function showProjects(chatId) {
  try {
    const response = await axios.get(`${API_URL}/projects`);
    const projects = response.data;
    
    if (projects.length === 0) {
      bot.sendMessage(chatId, '📊 Нет активных проектов');
      return;
    }
    
    let message = '📊 *Активные проекты:*\n\n';
    projects.forEach((project, index) => {
      const percentage = parseFloat(project.spent_percentage) || 0;
      const remaining = parseFloat(project.remaining) || 0;
      
      let emoji = '🟢';
      if (percentage >= 100) emoji = '🔴';
      else if (percentage >= 80) emoji = '🟡';
      
      message += `${emoji} *${project.name}*\n`;
      message += `💼 Бюджет: ${formatMoney(project.budget)}\n`;
      message += `💸 Потрачено: ${formatMoney(project.total_spent)} (${percentage.toFixed(1)}%)\n`;
      message += `💵 Осталось: ${formatMoney(remaining)}\n\n`;
    });
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error fetching projects:', error.message);
    bot.sendMessage(chatId, '❌ Ошибка получения проектов');
  }
}

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  await showERPStats(chatId);
});

async function showERPStats(chatId) {
  try {
    const [summaryRes, categoryRes] = await Promise.all([
      axios.get(`${API_URL}/expenses/stats/summary`),
      axios.get(`${API_URL}/expenses/stats/by-category`)
    ]);
    
    const summary = summaryRes.data;
    const byCategory = categoryRes.data;
    
    let message = `📊 *Статистика расходов*\n\n`;
    message += `💰 *Общие показатели:*\n`;
    message += `💸 Всего расходов: ${formatMoney(summary.total_expenses)}\n`;
    message += `📊 Проектов: ${summary.active_projects || 0}\n`;
    message += `📦 Записей: ${summary.total_count || 0}\n\n`;
    
    message += `📈 *По категориям:*\n`;
    byCategory.forEach(cat => {
      const category = CATEGORIES[cat.category];
      if (category) {
        message += `${category.icon} ${category.ru}: ${formatMoney(cat.total)}\n`;
      }
    });
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error fetching stats:', error.message);
    bot.sendMessage(chatId, '❌ Ошибка получения статистики');
  }
}

bot.onText(/\/monthly/, async (msg) => {
  const chatId = msg.chat.id;
  await showMonthly(chatId);
});

async function showMonthly(chatId) {
  try {
    const response = await axios.get(`${API_URL}/expenses/stats/monthly`);
    const monthly = response.data;
    
    if (monthly.length === 0) {
      bot.sendMessage(chatId, '📅 Нет данных за последние месяцы');
      return;
    }
    
    let message = `📅 *Месячные расходы:*\n\n`;
    monthly.forEach(month => {
      const date = new Date(month.month);
      const monthName = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
      
      message += `📆 ${monthName}\n`;
      message += `💸 Сумма: ${formatMoney(month.total)}\n`;
      message += `📦 Расходов: ${month.count}\n\n`;
    });
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error fetching monthly stats:', error.message);
    bot.sendMessage(chatId, '❌ Ошибка получения месячной статистики');
  }
}

// ============================================
// УТИЛИТЫ
// ============================================

function formatMoney(amount) {
  if (!amount) return '0 грн';
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, `🆘 *Помощь*

*📞 CRM команды:*
/call - Создать звонок
/leads - Список лидов
/history - История звонков
/status - Статус звонка

*💰 ERP команды:*
/expense - Добавить расход
/projects - Список проектов
/stats - Статистика расходов
/monthly - Месячный отчет

*⚙️ Общее:*
/start - Главное меню
/help - Эта справка

🌐 Web интерфейс: http://localhost:3008`, { parse_mode: 'Markdown' });
});

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Бот остановлен');
  process.exit(0);
});

console.log('✅ Unified Bot готов к работе!');
