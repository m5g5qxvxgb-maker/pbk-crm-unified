const express = require('express');
const router = express.Router();
const axios = require('axios');

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

module.exports = router;
