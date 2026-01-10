const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// Function definitions for OpenAI Function Calling
const crmFunctions = [
  {
    name: 'createLead',
    description: 'Create a new lead in the CRM system',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Lead title/name' },
        value: { type: 'number', description: 'Lead value/amount in currency' }
      },
      required: ['title']
    }
  },
  {
    name: 'addContact',
    description: 'Add or update contact information (phone, email) for an existing lead. Can search by UUID or by title.',
    parameters: {
      type: 'object',
      properties: {
        leadIdentifier: { type: 'string', description: 'Lead UUID (like 8100a9b0-bbb4-4169-aead-dea91fddb029) OR lead title/name' },
        phone: { type: 'string', description: 'Phone number to add' },
        email: { type: 'string', description: 'Email address to add' }
      },
      required: ['leadIdentifier']
    }
  },
  {
    name: 'showLeads',
    description: 'Show list of leads, optionally filtered by status/stage',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by stage name (optional)' }
      }
    }
  },
  {
    name: 'findLead',
    description: 'Find a specific lead by UUID or by title. Returns full lead details.',
    parameters: {
      type: 'object',
      properties: {
        identifier: { type: 'string', description: 'Lead UUID (like 8100a9b0-bbb4-4169-aead-dea91fddb029) OR lead title' }
      },
      required: ['identifier']
    }
  },
  {
    name: 'createTask',
    description: 'Create a new task',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' }
      },
      required: ['title']
    }
  },
  {
    name: 'showTasks',
    description: 'Show user tasks',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'showClients',
    description: 'Show clients list',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'getDashboard',
    description: 'Get dashboard metrics and statistics (leads count, clients count, calls count, recent activities)',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'scheduleCall',
    description: 'Schedule a phone call with a lead or client',
    parameters: {
      type: 'object',
      properties: {
        leadIdentifier: { type: 'string', description: 'Lead UUID or title to call' },
        phoneNumber: { type: 'string', description: 'Phone number to call (optional if lead has phone)' },
        scheduledTime: { type: 'string', description: 'When to call (e.g., "сейчас", "завтра", "2024-01-10T15:00")' },
        notes: { type: 'string', description: 'Call notes or purpose' }
      },
      required: ['leadIdentifier']
    }
  },
  {
    name: 'updateLead',
    description: 'Update lead information (title, value, stage, etc.)',
    parameters: {
      type: 'object',
      properties: {
        leadIdentifier: { type: 'string', description: 'Lead UUID or title' },
        title: { type: 'string', description: 'New title' },
        value: { type: 'number', description: 'New value/amount' },
        stage: { type: 'string', description: 'New stage name' }
      },
      required: ['leadIdentifier']
    }
  },
  {
    name: 'createClient',
    description: 'Create a new client in the system',
    parameters: {
      type: 'object',
      properties: {
        companyName: { type: 'string', description: 'Company name' },
        contactPerson: { type: 'string', description: 'Contact person name' },
        email: { type: 'string', description: 'Email address' },
        phone: { type: 'string', description: 'Phone number' }
      },
      required: ['companyName']
    }
  }
];

// Execute function called by AI
async function executeFunction(functionName, args, userId) {
  console.log('[AI Function Call]', functionName, args);
  
  switch (functionName) {
    case 'createLead': {
      const { title, value } = args;
      const stagesResult = await db.query(
        `SELECT id, pipeline_id FROM pipeline_stages ORDER BY sort_order LIMIT 1`
      );
      const firstStage = stagesResult.rows[0];
      
      if (!firstStage) {
        return { error: 'No pipeline stages found' };
      }
      
      let validUserId = userId;
      const userCheck = await db.query(`SELECT id FROM users WHERE id = $1`, [userId]);
      if (userCheck.rows.length === 0) {
        const fallbackUser = await db.query(`SELECT id FROM users WHERE is_active = true ORDER BY created_at LIMIT 1`);
        validUserId = fallbackUser.rows[0]?.id;
      }
      
      const result = await db.query(
        `INSERT INTO leads (title, value, pipeline_id, stage_id, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [title, value || null, firstStage.pipeline_id, firstStage.id, validUserId]
      );
      
      return { success: true, lead: result.rows[0] };
    }
    
    case 'addContact': {
      const { leadIdentifier, phone, email } = args;
      
      let leadResult;
      
      // Search by UUID or title
      if (leadIdentifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // UUID format
        leadResult = await db.query(
          `SELECT id, title FROM leads WHERE id = $1`,
          [leadIdentifier]
        );
      } else {
        // Search by title
        leadResult = await db.query(
          `SELECT id, title FROM leads WHERE title ILIKE $1 ORDER BY created_at DESC LIMIT 1`,
          [`%${leadIdentifier}%`]
        );
      }
      
      if (leadResult.rows.length === 0) {
        return { error: `Lead "${leadIdentifier}" not found` };
      }
      
      const lead = leadResult.rows[0];
      const updates = [];
      const values = [];
      let paramCount = 1;
      
      if (phone) {
        const cleanPhone = phone.replace(/[\s\-()]/g, '');
        updates.push(`contact_phone = $${paramCount++}`);
        values.push(cleanPhone);
      }
      
      if (email) {
        updates.push(`contact_email = $${paramCount++}`);
        values.push(email);
      }
      
      if (updates.length === 0) {
        return { error: 'No contact information provided' };
      }
      
      values.push(lead.id);
      
      const updateResult = await db.query(
        `UPDATE leads SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${paramCount}
         RETURNING id, title, contact_phone, contact_email`,
        values
      );
      
      return { success: true, lead: updateResult.rows[0] };
    }
    
    case 'showLeads': {
      const { status } = args;
      let query = 'SELECT l.id, l.title, l.value, ps.name as stage_name FROM leads l LEFT JOIN pipeline_stages ps ON l.stage_id = ps.id';
      const params = [];
      
      if (status) {
        query += ' WHERE ps.name ILIKE $1';
        params.push(`%${status}%`);
      }
      
      query += ' ORDER BY l.created_at DESC LIMIT 10';
      const result = await db.query(query, params);
      
      return { success: true, leads: result.rows };
    }
    
    case 'findLead': {
      const { identifier } = args;
      let result;
      
      // Search by UUID or title
      if (identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // UUID format
        result = await db.query(
          `SELECT l.*, ps.name as stage_name, pip.name as pipeline_name,
                  c.company_name, c.contact_person as client_contact
           FROM leads l
           LEFT JOIN pipeline_stages ps ON l.stage_id = ps.id
           LEFT JOIN pipelines pip ON l.pipeline_id = pip.id
           LEFT JOIN clients c ON l.client_id = c.id
           WHERE l.id = $1`,
          [identifier]
        );
      } else {
        // Search by title
        result = await db.query(
          `SELECT l.*, ps.name as stage_name, pip.name as pipeline_name,
                  c.company_name, c.contact_person as client_contact
           FROM leads l
           LEFT JOIN pipeline_stages ps ON l.stage_id = ps.id
           LEFT JOIN pipelines pip ON l.pipeline_id = pip.id
           LEFT JOIN clients c ON l.client_id = c.id
           WHERE l.title ILIKE $1
           ORDER BY l.created_at DESC LIMIT 1`,
          [`%${identifier}%`]
        );
      }
      
      if (result.rows.length === 0) {
        return { error: `Lead "${identifier}" not found` };
      }
      
      return { success: true, lead: result.rows[0] };
    }
    
    case 'createTask': {
      const { title } = args;
      const result = await db.query(
        `INSERT INTO tasks (title, status, priority, assigned_to, created_by)
         VALUES ($1, 'pending', 'medium', $2, $2)
         RETURNING *`,
        [title, userId]
      );
      
      return { success: true, task: result.rows[0] };
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
      
      return { success: true, tasks: result.rows };
    }
    
    case 'showClients': {
      const result = await db.query(
        `SELECT id, company_name, contact_person, email, phone 
         FROM clients 
         ORDER BY created_at DESC 
         LIMIT 10`
      );
      
      return { success: true, clients: result.rows };
    }
    
    case 'getDashboard': {
      const leadsResult = await db.query('SELECT COUNT(*) as count FROM leads');
      const clientsResult = await db.query('SELECT COUNT(*) as count FROM clients');
      const callsResult = await db.query('SELECT COUNT(*) as count FROM calls');
      const tasksResult = await db.query('SELECT COUNT(*) as count, status FROM tasks GROUP BY status');
      
      // Get recent activities
      const recentLeads = await db.query(
        `SELECT l.title, l.value, ps.name as stage_name, l.created_at
         FROM leads l
         LEFT JOIN pipeline_stages ps ON l.stage_id = ps.id
         ORDER BY l.created_at DESC LIMIT 5`
      );
      
      return {
        success: true,
        metrics: {
          leads: parseInt(leadsResult.rows[0].count),
          clients: parseInt(clientsResult.rows[0].count),
          calls: parseInt(callsResult.rows[0].count),
          tasks: tasksResult.rows
        },
        recentActivities: recentLeads.rows
      };
    }
    
    case 'scheduleCall': {
      const { leadIdentifier, phoneNumber, scheduledTime, notes } = args;
      
      // Find the lead
      let leadResult;
      if (leadIdentifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        leadResult = await db.query(
          `SELECT id, title, contact_phone FROM leads WHERE id = $1`,
          [leadIdentifier]
        );
      } else {
        leadResult = await db.query(
          `SELECT id, title, contact_phone FROM leads WHERE title ILIKE $1 ORDER BY created_at DESC LIMIT 1`,
          [`%${leadIdentifier}%`]
        );
      }
      
      if (leadResult.rows.length === 0) {
        return { error: `Lead "${leadIdentifier}" not found` };
      }
      
      const lead = leadResult.rows[0];
      const phone = phoneNumber || lead.contact_phone;
      
      if (!phone) {
        return { error: `No phone number available for lead "${lead.title}". Please provide phone number.` };
      }
      
      // Parse scheduled time
      let finalScheduledAt = null;
      if (scheduledTime) {
        const now = new Date();
        const lowerTime = scheduledTime.toLowerCase();
        
        if (lowerTime.includes('сейчас') || lowerTime.includes('немедленно')) {
          finalScheduledAt = now;
        } else if (lowerTime.includes('завтра')) {
          finalScheduledAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        } else if (lowerTime.includes('час')) {
          const hours = parseInt(lowerTime.match(/\d+/)?.[0] || '1');
          finalScheduledAt = new Date(now.getTime() + hours * 60 * 60 * 1000);
        } else {
          // Try to parse as ISO date or natural date
          try {
            finalScheduledAt = new Date(scheduledTime);
          } catch (e) {
            finalScheduledAt = now;
          }
        }
      }
      
      const callResult = await db.query(
        `INSERT INTO calls (lead_id, phone_number, status, direction, scheduled_at, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [lead.id, phone, 'scheduled', 'outbound', finalScheduledAt, notes || `Call ${lead.title}`]
      );
      
      return { success: true, call: callResult.rows[0], leadTitle: lead.title };
    }
    
    case 'updateLead': {
      const { leadIdentifier, title, value, stage } = args;
      
      // Find the lead
      let leadResult;
      if (leadIdentifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        leadResult = await db.query(`SELECT id FROM leads WHERE id = $1`, [leadIdentifier]);
      } else {
        leadResult = await db.query(
          `SELECT id FROM leads WHERE title ILIKE $1 ORDER BY created_at DESC LIMIT 1`,
          [`%${leadIdentifier}%`]
        );
      }
      
      if (leadResult.rows.length === 0) {
        return { error: `Lead "${leadIdentifier}" not found` };
      }
      
      const leadId = leadResult.rows[0].id;
      const updates = [];
      const values = [];
      let paramCount = 1;
      
      if (title) {
        updates.push(`title = $${paramCount++}`);
        values.push(title);
      }
      
      if (value !== undefined) {
        updates.push(`value = $${paramCount++}`);
        values.push(value);
      }
      
      if (stage) {
        // Find stage by name
        const stageResult = await db.query(
          `SELECT id FROM pipeline_stages WHERE name ILIKE $1 LIMIT 1`,
          [`%${stage}%`]
        );
        
        if (stageResult.rows.length > 0) {
          updates.push(`stage_id = $${paramCount++}`);
          values.push(stageResult.rows[0].id);
        }
      }
      
      if (updates.length === 0) {
        return { error: 'No updates provided' };
      }
      
      values.push(leadId);
      
      const updateResult = await db.query(
        `UPDATE leads SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );
      
      return { success: true, lead: updateResult.rows[0] };
    }
    
    case 'createClient': {
      const { companyName, contactPerson, email, phone } = args;
      
      const result = await db.query(
        `INSERT INTO clients (company_name, contact_person, email, phone, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        [companyName, contactPerson || null, email || null, phone || null]
      );
      
      return { success: true, client: result.rows[0] };
    }
    
    default:
      return { error: 'Unknown function' };
  }
}

// Enhanced AI Copilot with CRM context and actions
router.post('/copilot', authenticateToken, async (req, res) => {
  try {
    console.log('[AI Copilot] RAW req.body:', JSON.stringify(req.body)); // DEBUG
    const { message, context, history } = req.body;
    
    console.log('[AI Copilot] Request:', { message, userId: req.user.id });
    
    if (!message) {
      console.log('[AI Copilot] ERROR: Message is missing! Full body:', req.body); // DEBUG
      return res.status(400).json({ error: 'Message is required' });
    }

    // AI Provider Selection - OpenAI first, then OpenRouter fallback
    const openaiKey = process.env.OPENAI_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    
    let useOpenAI = false;
    let apiKey = null;
    let apiUrl = null;
    let model = null;

    // Prefer OpenAI if available
    if (openaiKey && openaiKey !== 'sk-placeholder' && openaiKey !== '') {
      useOpenAI = true;
      apiKey = openaiKey;
      apiUrl = 'https://api.openai.com/v1';
      model = process.env.OPENAI_MODEL || 'gpt-4o';
    } else if (openrouterKey && openrouterKey !== 'sk-placeholder' && openrouterKey !== '') {
      useOpenAI = false;
      apiKey = openrouterKey;
      apiUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
      model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001:free';
    } else {
      return res.status(503).json({ 
        error: 'AI service not configured',
        message: 'Please configure OPENAI_API_KEY (recommended) or OPENROUTER_API_KEY in environment variables.'
      });
    }

    const systemPrompt = `You are an intelligent AI assistant integrated into PBK Construction CRM system.
You have FULL ACCESS to execute CRM operations in real-time through function calls.

IMPORTANT: You are NOT a demo or simulation. You CAN and DO execute real database operations.

🎯 YOUR CAPABILITIES:

**Leads Management:**
- createLead - Create new leads with title, value, probability
- findLead - Search leads by UUID or title
- showLeads - List all leads (can filter by status/stage)
- updateLead - Update lead information (title, value, stage)
- addContact - Add/update phone and email to existing leads

**Clients Management:**
- createClient - Create new clients (company, contact person, email, phone)
- showClients - List all clients

**Tasks Management:**
- createTask - Create new tasks
- showTasks - Show user's tasks

**Calls & Communication:**
- scheduleCall - Schedule phone calls with leads
  * Supports: "сейчас" (now), "завтра" (tomorrow), "через N часов" (in N hours)
  * Can find lead by UUID or title
  * Will use lead's contact_phone or accept custom phone number

**Analytics:**
- getDashboard - Get CRM metrics (leads count, clients count, calls, tasks breakdown, recent activities)

📝 RESPONSE GUIDELINES:
- Always respond in Russian
- Be concise and professional
- When executing actions, confirm what you did
- If information is missing, ask the user
- Use natural, conversational tone

${context || ''}`;

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    if (history && Array.isArray(history)) {
      messages.push(...history);
    }

    messages.push({
      role: 'user',
      content: message
    });

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    if (!useOpenAI) {
      headers['HTTP-Referer'] = 'https://crm.pbkconstruction.net';
      headers['X-Title'] = 'PBK CRM AI Copilot';
    }

    const requestBody = {
      model: model,
      messages: messages,
      max_tokens: 800,
      temperature: 0.7
    };

    if (useOpenAI) {
      requestBody.functions = crmFunctions;
      requestBody.function_call = 'auto';
    }

    let response = await axios.post(
      `${apiUrl}/chat/completions`,
      requestBody,
      { headers }
    );

    let aiMessage = response.data.choices[0].message;
    let functionResult = null;

    if (useOpenAI && aiMessage.function_call) {
      const functionName = aiMessage.function_call.name;
      const functionArgs = JSON.parse(aiMessage.function_call.arguments);
      
      console.log('[AI] Function call:', functionName, functionArgs);
      
      functionResult = await executeFunction(functionName, functionArgs, req.user.id);
      
      messages.push(aiMessage);
      messages.push({
        role: 'function',
        name: functionName,
        content: JSON.stringify(functionResult)
      });

      response = await axios.post(
        `${apiUrl}/chat/completions`,
        {
          model: model,
          messages: messages,
          max_tokens: 800,
          temperature: 0.7
        },
        { headers }
      );

      aiMessage = response.data.choices[0].message;
    }
    
    res.json({
      success: true,
      message: aiMessage.content,
      provider: useOpenAI ? 'openai' : 'openrouter',
      model: model,
      usage: response.data.usage,
      functionCalled: functionResult ? {
        success: !!functionResult.success,
        data: functionResult
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

    const openaiKey = process.env.OPENAI_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    
    let useOpenAI = false;
    let apiKey = null;
    let apiUrl = null;
    let model = null;

    // Prefer OpenAI if available
    if (openaiKey && openaiKey !== 'sk-placeholder' && openaiKey !== '') {
      useOpenAI = true;
      apiKey = openaiKey;
      apiUrl = 'https://api.openai.com/v1';
      model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    } else if (openrouterKey && openrouterKey !== 'sk-placeholder' && openrouterKey !== '') {
      useOpenAI = false;
      apiKey = openrouterKey;
      apiUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
      model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001:free';
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

    if (!useOpenAI) {
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
      provider: useOpenAI ? 'openai' : 'openrouter',
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
