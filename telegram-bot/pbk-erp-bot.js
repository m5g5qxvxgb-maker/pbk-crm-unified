require('dotenv').config({ path: '../.env' });
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const userSessions = new Map();

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

console.log('🤖 PBK ERP Telegram Bot запущен!');

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `🏗️ *Добро пожаловать в PBK ERP Bot!*

Доступные команды:
/expense - Добавить расход
/projects - Список проектов  
/stats - Статистика расходов
/monthly - Месячные расходы
/help - Помощь`, { parse_mode: 'Markdown' });
});

bot.onText(/\/projects/, async (msg) => {
  const chatId = msg.chat.id;
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
      const emoji = percentage >= 100 ? '🔴' : percentage >= 80 ? '🟡' : '🟢';
      
      message += `${emoji} *${index + 1}. ${project.name}*\n`;
      message += `   Клиент: ${project.client_name || 'Не указан'}\n`;
      message += `   Бюджет: ${parseFloat(project.budget_amount).toLocaleString()} PLN\n`;
      message += `   Потрачено: ${parseFloat(project.total_spent || 0).toLocaleString()} PLN\n`;
      message += `   Осталось: ${remaining.toLocaleString()} PLN (${percentage.toFixed(1)}%)\n\n`;
    });
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error:', error);
    bot.sendMessage(chatId, '❌ Ошибка при загрузке проектов');
  }
});

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const response = await axios.get(`${API_URL}/expenses/stats/summary`);
    const stats = response.data;
    
    bot.sendMessage(chatId, `📊 *Общая статистика:*

💰 Всего: ${parseFloat(stats.total_amount || 0).toLocaleString()} PLN
📝 Расходов: ${stats.total_count || 0}
📈 Средний: ${parseFloat(stats.average_amount || 0).toLocaleString()} PLN`, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Ошибка при загрузке статистики');
  }
});

bot.onText(/\/expense/, (msg) => {
  const chatId = msg.chat.id;
  userSessions.set(chatId, { step: 'select_category', data: {} });
  
  const keyboard = {
    inline_keyboard: [
      [{ text: '🏗️ Материалы', callback_data: 'cat_materials' }, { text: '👷 Работа', callback_data: 'cat_labor' }],
      [{ text: '🔧 Оборудование', callback_data: 'cat_equipment' }, { text: '🚚 Транспорт', callback_data: 'cat_transport' }],
      [{ text: '🤝 Субподряд', callback_data: 'cat_subcontractor' }, { text: '📦 Общие', callback_data: 'cat_general' }]
    ]
  };
  
  bot.sendMessage(chatId, '📋 Выберите категорию:', { reply_markup: keyboard });
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  if (data.startsWith('cat_')) {
    const category = data.replace('cat_', '');
    const session = userSessions.get(chatId) || { data: {} };
    session.data.category = category;
    session.step = 'enter_amount';
    userSessions.set(chatId, session);
    bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId, `${CATEGORIES[category].ru}\n\nВведите сумму (PLN):`);
  } else if (data.startsWith('project_')) {
    const projectId = data.replace('project_', '');
    const session = userSessions.get(chatId);
    if (session) {
      session.data.project_id = projectId;
      await saveExpense(chatId, session.data);
      userSessions.delete(chatId);
    }
    bot.answerCallbackQuery(query.id);
  } else if (data === 'no_project') {
    const session = userSessions.get(chatId);
    if (session) {
      await saveExpense(chatId, session.data);
      userSessions.delete(chatId);
    }
    bot.answerCallbackQuery(query.id);
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text || text.startsWith('/')) return;
  
  const session = userSessions.get(chatId);
  if (!session) return;
  
  if (session.step === 'enter_amount') {
    const amount = parseFloat(text);
    if (isNaN(amount) || amount <= 0) {
      bot.sendMessage(chatId, '❌ Введите корректную сумму');
      return;
    }
    session.data.amount = amount;
    session.step = 'enter_description';
    userSessions.set(chatId, session);
    bot.sendMessage(chatId, '📝 Введите описание:');
  } else if (session.step === 'enter_description') {
    session.data.description = text;
    session.step = 'select_project';
    userSessions.set(chatId, session);
    await askForProject(chatId);
  }
});

async function askForProject(chatId) {
  try {
    const response = await axios.get(`${API_URL}/projects`);
    const projects = response.data.filter(p => p.status === 'active').slice(0, 5);
    
    if (projects.length === 0) {
      const session = userSessions.get(chatId);
      await saveExpense(chatId, session.data);
      userSessions.delete(chatId);
      return;
    }
    
    const keyboard = {
      inline_keyboard: [
        ...projects.map(p => [{ text: `${p.name} (${p.client_name || 'Без клиента'})`, callback_data: `project_${p.id}` }]),
        [{ text: '📦 Общие расходы', callback_data: 'no_project' }]
      ]
    };
    
    bot.sendMessage(chatId, '🏗️ К какому проекту?', { reply_markup: keyboard });
  } catch (error) {
    const session = userSessions.get(chatId);
    await saveExpense(chatId, session.data);
    userSessions.delete(chatId);
  }
}

async function saveExpense(chatId, expenseData) {
  try {
    const expense = {
      amount: expenseData.amount,
      currency: 'PLN',
      category: expenseData.category,
      description: expenseData.description,
      project_id: expenseData.project_id || null,
      telegram_user_id: chatId,
      expense_date: new Date().toISOString().split('T')[0],
      created_via: 'telegram'
    };
    
    await axios.post(`${API_URL}/expenses`, expense);
    
    let msg = `✅ *Расход добавлен!*\n\n💰 ${expenseData.amount} PLN\n📝 ${expenseData.description}\n🏷️ ${CATEGORIES[expenseData.category].ru}`;
    
    if (expenseData.project_id) {
      const projectResponse = await axios.get(`${API_URL}/projects/${expenseData.project_id}`);
      const project = projectResponse.data;
      msg += `\n\n🏗️ *${project.name}*\n📊 Бюджет: ${parseFloat(project.budget_amount).toLocaleString()} PLN\n💸 Потрачено: ${parseFloat(project.total_spent).toLocaleString()} PLN\n💰 Осталось: ${parseFloat(project.remaining).toLocaleString()} PLN`;
      
      if (parseFloat(project.spent_percentage) >= 100) {
        msg += '\n\n⚠️ *БЮДЖЕТ ПРЕВЫШЕН!*';
      }
    }
    
    bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error saving:', error);
    bot.sendMessage(chatId, '❌ Ошибка: ' + (error.response?.data?.error || error.message));
  }
}

bot.on('polling_error', (error) => console.error('Polling error:', error));
