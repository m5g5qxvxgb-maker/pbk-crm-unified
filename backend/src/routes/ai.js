const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// AI Command Parser - determines user intent
async function parseCommand(message) {
  const lowerMessage = message.toLowerCase();
  
  // Command patterns
  const patterns = {
    createTask: /создать задачу|создай задачу|новая задача|добавить задачу|create task/i,
    showLeads: /покажи лиды|показать лиды|список лидов|лиды со статусом|show leads|list leads/i,
    showTasks: /покажи задачи|показать задачи|список задач|мои задачи|show tasks/i,
    showClients: /покажи клиентов|показать клиентов|список клиентов|show clients/i,
    updateLead: /обновить лид|обнови лид|переместить лид|измени лид|update lead/i,
    searchLead: /найди лид|найти лид|поиск лид|search lead/i,
    generateResponse: /напиши ответ|сгенерируй ответ|составь ответ|write response|generate response/i
  };
  
  for (const [command, pattern] of Object.entries(patterns)) {
    if (pattern.test(lowerMessage)) {
      return { command, message: lowerMessage };
    }
  }
  
  return { command: 'chat', message: lowerMessage };
}

// Execute CRM actions
async function executeCRMAction(command, message, userId) {
  try {
    switch (command) {
      case 'showLeads': {
        // Extract filters from message
        let query = 'SELECT l.id, l.title, l.value, ps.name as stage_name FROM leads l LEFT JOIN pipeline_stages ps ON l.stage_id = ps.id';
        const params = [];
        
        // Check for stage filter
        if (message.includes('переговоры') || message.includes('negotiations')) {
          query += ' WHERE ps.name ILIKE $1';
          params.push('%переговор%');
        } else if (message.includes('новый') || message.includes('new')) {
          query += ' WHERE ps.name ILIKE $1';
          params.push('%нов%');
        }
        
        query += ' ORDER BY l.created_at DESC LIMIT 10';
        
        const result = await db.query(query, params);
        return {
          action: 'showLeads',
          data: result.rows,
          response: `Найдено лидов: ${result.rows.length}`
        };
      }
      
      case 'showTasks': {
        const result = await db.query(
          `SELECT t.id, t.title, t.status, t.priority, t.due_date 
           FROM tasks t 
           WHERE t.assigned_to = $1 OR t.created_by = $1
           ORDER BY t.due_date ASC NULLS LAST
           LIMIT 10`,
          [userId]
        );
        return {
          action: 'showTasks',
          data: result.rows,
          response: `Найдено задач: ${result.rows.length}`
        };
      }
      
      case 'createTask': {
        // Extract task details from message
        // Simple extraction - can be improved with NLP
        const titleMatch = message.match(/задачу?\s+["«]?([^"»]+)["»]?/i);
        const title = titleMatch ? titleMatch[1] : 'Новая задача';
        
        const result = await db.query(
          `INSERT INTO tasks (title, status, priority, assigned_to, created_by)
           VALUES ($1, 'pending', 'medium', $2, $2)
           RETURNING *`,
          [title, userId]
        );
        
        return {
          action: 'createTask',
          data: result.rows[0],
          response: `Задача "${title}" создана успешно!`
        };
      }
      
      case 'showClients': {
        const result = await db.query(
          `SELECT id, company_name, contact_person, email, phone 
           FROM clients 
           ORDER BY created_at DESC 
           LIMIT 10`
        );
        return {
          action: 'showClients',
          data: result.rows,
          response: `Найдено клиентов: ${result.rows.length}`
        };
      }
      
      default:
        return null;
    }
  } catch (error) {
    console.error('CRM action error:', error);
    throw error;
  }
}

// Enhanced AI Copilot with CRM context and actions
router.post('/copilot', authenticateToken, async (req, res) => {
  try {
    const { message, context, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Parse command to detect user intent
    const { command } = await parseCommand(message);
    
    // Execute CRM action if command detected
    let actionResult = null;
    if (command !== 'chat') {
      actionResult = await executeCRMAction(command, message, req.user.id);
    }

    // Try OpenRouter first (free Gemini model)
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    let useOpenRouter = false;
    let apiKey = null;
    let apiUrl = null;
    let model = null;

    // Prefer OpenRouter if available
    if (openrouterKey && openrouterKey !== 'sk-placeholder') {
      useOpenRouter = true;
      apiKey = openrouterKey;
      apiUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
      model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001:free';
    } else if (openaiKey && openaiKey !== 'sk-placeholder') {
      useOpenRouter = false;
      apiKey = openaiKey;
      apiUrl = 'https://api.openai.com/v1';
      model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    } else {
      return res.status(503).json({ 
        error: 'AI service not configured',
        message: 'Neither OpenRouter nor OpenAI API key is configured. Please set OPENROUTER_API_KEY or OPENAI_API_KEY in environment variables.'
      });
    }

    // Build enhanced system prompt with CRM context
    let systemPrompt = `You are an intelligent AI assistant for a CRM system used by PBK Construction company. 
Help users with their questions about leads, clients, tasks, sales pipelines, and business insights.
Be concise, helpful, and professional.

Available commands:
- "Покажи лиды со статусом X" - Show leads with specific status
- "Создать задачу [название]" - Create a new task
- "Покажи мои задачи" - Show user's tasks
- "Покажи клиентов" - Show clients list

${context || ''}`;

    // Add action result to context if available
    if (actionResult) {
      systemPrompt += `\n\nAction executed: ${actionResult.action}
Result: ${actionResult.response}
Data: ${JSON.stringify(actionResult.data, null, 2)}`;
    }

    // Build messages array with history
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Add conversation history if provided
    if (history && Array.isArray(history)) {
      messages.push(...history);
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    // Call AI API
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    // OpenRouter requires additional headers
    if (useOpenRouter) {
      headers['HTTP-Referer'] = 'https://crm.pbkconstruction.net';
      headers['X-Title'] = 'PBK CRM AI Copilot';
    }

    const response = await axios.post(
      `${apiUrl}/chat/completions`,
      {
        model: model,
        messages: messages,
        max_tokens: 800,
        temperature: 0.7
      },
      { headers }
    );

    const aiMessage = response.data.choices[0].message.content;
    
    res.json({
      success: true,
      message: aiMessage,
      provider: useOpenRouter ? 'openrouter' : 'openai',
      model: model,
      usage: response.data.usage,
      action: actionResult ? {
        type: actionResult.action,
        data: actionResult.data
      } : null
    });

  } catch (error) {
    console.error('AI copilot error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid API key',
        message: 'AI API key is invalid. Please check your configuration.'
      });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again in a moment.'
      });
    }
    
    res.status(500).json({ 
      error: 'AI service error',
      message: error.message 
    });
  }
});

// OpenAI Chat endpoint для AI Copilot
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey || openaiKey === 'sk-placeholder') {
      return res.status(503).json({ 
        error: 'AI service not configured',
        message: 'OpenAI API key not set. Please configure OPENAI_API_KEY in environment variables.'
      });
    }

    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant for a CRM system. Help users with their questions about leads, clients, tasks, and sales pipelines. ${context || ''}`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiMessage = response.data.choices[0].message.content;
    
    res.json({
      success: true,
      message: aiMessage,
      usage: response.data.usage
    });

  } catch (error) {
    console.error('AI chat error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid API key',
        message: 'OpenAI API key is invalid. Please check your configuration.'
      });
    }
    
    res.status(500).json({ 
      error: 'AI service error',
      message: error.message 
    });
  }
});

// Analyze lead/client data
router.post('/analyze', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({ error: 'Type and data are required' });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey || openaiKey === 'sk-placeholder') {
      return res.status(503).json({ 
        error: 'AI service not configured'
      });
    }

    let prompt = '';
    if (type === 'lead') {
      prompt = `Analyze this lead and provide insights and recommendations:\n${JSON.stringify(data, null, 2)}`;
    } else if (type === 'client') {
      prompt = `Analyze this client's data and provide insights:\n${JSON.stringify(data, null, 2)}`;
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a CRM data analyst. Provide concise, actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const analysis = response.data.choices[0].message.content;
    
    res.json({
      success: true,
      analysis,
      usage: response.data.usage
    });

  } catch (error) {
    console.error('AI analyze error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message 
    });
  }
});

// Generate client response - помогает менеджеру составить ответ клиенту
router.post('/generate-response', authenticateToken, async (req, res) => {
  try {
    const { clientMessage, context, tone = 'professional' } = req.body;
    
    if (!clientMessage) {
      return res.status(400).json({ error: 'Client message is required' });
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    let useOpenRouter = false;
    let apiKey = null;
    let apiUrl = null;
    let model = null;

    if (openrouterKey && openrouterKey !== 'sk-placeholder') {
      useOpenRouter = true;
      apiKey = openrouterKey;
      apiUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
      model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001:free';
    } else if (openaiKey && openaiKey !== 'sk-placeholder') {
      useOpenRouter = false;
      apiKey = openaiKey;
      apiUrl = 'https://api.openai.com/v1';
      model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    } else {
      return res.status(503).json({ 
        error: 'AI service not configured'
      });
    }

    const toneInstructions = {
      professional: 'деловым и профессиональным тоном',
      friendly: 'дружелюбным и теплым тоном',
      formal: 'формальным и официальным тоном'
    };

    const systemPrompt = `Вы помощник менеджера строительной компании PBK Construction.
Помогите составить ответ клиенту ${toneInstructions[tone] || toneInstructions.professional}.

Контекст: ${context || 'Общение с клиентом по поводу строительных услуг'}

Важно:
- Будьте вежливы и конструктивны
- Отвечайте по существу
- Используйте профессиональную лексику
- Упоминайте конкретные детали если они есть в контексте`;

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    if (useOpenRouter) {
      headers['HTTP-Referer'] = 'https://crm.pbkconstruction.net';
      headers['X-Title'] = 'PBK CRM AI Response Generator';
    }

    const response = await axios.post(
      `${apiUrl}/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Сообщение клиента: "${clientMessage}"\n\nСоставьте подходящий ответ.`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      { headers }
    );

    const generatedResponse = response.data.choices[0].message.content;
    
    res.json({
      success: true,
      response: generatedResponse,
      provider: useOpenRouter ? 'openrouter' : 'openai',
      model: model
    });

  } catch (error) {
    console.error('Generate response error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate response',
      message: error.message 
    });
  }
});

// Smart command executor - понимает сложные команды
router.post('/execute', authenticateToken, async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const { command: detectedCommand } = await parseCommand(command);
    
    if (detectedCommand === 'chat') {
      return res.json({
        success: true,
        message: 'Команда не распознана. Попробуйте: "Покажи лиды", "Создать задачу", "Мои задачи"'
      });
    }

    const result = await executeCRMAction(detectedCommand, command, req.user.id);
    
    res.json({
      success: true,
      action: result.action,
      data: result.data,
      message: result.response
    });

  } catch (error) {
    console.error('Execute command error:', error);
    res.status(500).json({ 
      error: 'Failed to execute command',
      message: error.message 
    });
  }
});

module.exports = router;
