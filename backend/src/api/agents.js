/**
 * TWM Agent System Integration API
 * Интеграция с Agent Manager для AI агентов
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

const AGENT_MANAGER_URL = process.env.AGENT_MANAGER_URL || 'http://localhost:8892';

/**
 * GET /api/agents/list
 * Получить список доступных агентов
 */
router.get('/list', async (req, res) => {
  try {
    const response = await axios.get(`${AGENT_MANAGER_URL}/agents/list`);
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Agent Manager error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents',
      details: error.message
    });
  }
});

/**
 * GET /api/agents/active
 * Получить текущего активного агента
 */
router.get('/active', async (req, res) => {
  try {
    const response = await axios.get(`${AGENT_MANAGER_URL}/agents/active`);
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Agent Manager error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active agent'
    });
  }
});

/**
 * POST /api/agents/activate
 * Активировать агента
 * Body: { agent_id }
 */
router.post('/activate', async (req, res) => {
  const { agent_id } = req.body;

  if (!agent_id) {
    return res.status(400).json({
      success: false,
      error: 'agent_id is required'
    });
  }

  try {
    const response = await axios.post(
      `${AGENT_MANAGER_URL}/agents/activate`,
      { agent_id },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Agent activation error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to activate agent'
    });
  }
});

/**
 * POST /api/agents/message
 * Отправить сообщение агенту
 * Body: { agent_id, message }
 */
router.post('/message', async (req, res) => {
  const { agent_id, message } = req.body;

  if (!agent_id || !message) {
    return res.status(400).json({
      success: false,
      error: 'agent_id and message are required'
    });
  }

  try {
    const response = await axios.post(
      `${AGENT_MANAGER_URL}/agents/message`,
      {
        agent_id,
        message,
        source: 'crm',
        user: req.user?.email || 'system'
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Send message error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

/**
 * GET /api/agents/history/:agent_id
 * Получить историю сообщений агента
 */
router.get('/history/:agent_id', async (req, res) => {
  const { agent_id } = req.params;

  try {
    const response = await axios.get(
      `${AGENT_MANAGER_URL}/agents/history/${agent_id}`
    );
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Get history error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch history'
    });
  }
});

module.exports = router;
