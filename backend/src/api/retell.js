/**
 * Retell AI Integration API
 * Управление голосовыми звонками через Retell AI
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../database/db');

// Конфигурация Retell AI
const RETELL_CONFIG = {
  apiKey: process.env.RETELL_API_KEY,
  baseUrl: 'https://api.retellai.com',
  agentId: process.env.RETELL_AGENT_ID,
  phoneNumber: process.env.RETELL_PHONE_NUMBER
};

/**
 * GET /api/retell/agents
 * Получить список доступных AI агентов
 */
router.get('/agents', async (req, res) => {
  try {
    const response = await axios.get(`${RETELL_CONFIG.baseUrl}/list-agents`, {
      headers: {
        'Authorization': `Bearer ${RETELL_CONFIG.apiKey}`
      }
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Retell API error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || 'Failed to fetch agents'
    });
  }
});

/**
 * POST /api/retell/call
 * Создать исходящий звонок
 * Body: { lead_id, phone_number, ai_instructions }
 */
router.post('/call', async (req, res) => {
  const { lead_id, phone_number, ai_instructions } = req.body;

  if (!phone_number) {
    return res.status(400).json({
      success: false,
      error: 'Phone number is required'
    });
  }

  try {
    // Получить данные лида из БД
    let leadData = {};
    if (lead_id) {
      const leadResult = await pool.query(
        'SELECT * FROM leads WHERE id = $1',
        [lead_id]
      );
      leadData = leadResult.rows[0] || {};
    }

    // Создать звонок в Retell AI
    const callPayload = {
      from_number: RETELL_CONFIG.phoneNumber,
      to_number: phone_number,
      agent_id: RETELL_CONFIG.agentId,
      retell_llm_dynamic_variables: {
        customer_name: leadData.name || 'Customer',
        customer_phone: phone_number,
        lead_source: leadData.source || 'CRM',
        service_type: leadData.service_type || '',
        property_type: leadData.property_type || '',
        square_meters: leadData.square_meters || '',
        location: leadData.location || '',
        budget: leadData.budget || '',
        timeline: leadData.timeline || '',
        ai_instructions: ai_instructions || 'Collect information about the project'
      },
      metadata: {
        lead_id: lead_id,
        created_by: req.user?.id,
        source: 'crm'
      }
    };

    const response = await axios.post(
      `${RETELL_CONFIG.baseUrl}/v2/create-phone-call`,
      callPayload,
      {
        headers: {
          'Authorization': `Bearer ${RETELL_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const callId = response.data.call_id;

    // Сохранить звонок в БД
    const insertResult = await pool.query(
      `INSERT INTO calls (
        lead_id, phone_number, direction, status, 
        retell_call_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *`,
      [lead_id, phone_number, 'outbound', 'initiated', callId]
    );

    // Обновить лида
    if (lead_id) {
      await pool.query(
        'UPDATE leads SET last_call_id = $1, updated_at = NOW() WHERE id = $2',
        [callId, lead_id]
      );
    }

    res.json({
      success: true,
      data: {
        call: insertResult.rows[0],
        retell_data: response.data
      }
    });

  } catch (error) {
    console.error('Create call error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || 'Failed to create call'
    });
  }
});

/**
 * GET /api/retell/call/:call_id
 * Получить статус звонка
 */
router.get('/call/:call_id', async (req, res) => {
  const { call_id } = req.params;

  try {
    const response = await axios.get(
      `${RETELL_CONFIG.baseUrl}/get-call/${call_id}`,
      {
        headers: {
          'Authorization': `Bearer ${RETELL_CONFIG.apiKey}`
        }
      }
    );

    // Обновить БД
    await pool.query(
      `UPDATE calls SET 
        status = $1, 
        duration = $2,
        recording_url = $3,
        transcript = $4,
        updated_at = NOW()
      WHERE retell_call_id = $5`,
      [
        response.data.call_status,
        response.data.end_timestamp - response.data.start_timestamp,
        response.data.recording_url || null,
        response.data.transcript || null,
        call_id
      ]
    );

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Get call error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || 'Failed to fetch call'
    });
  }
});

/**
 * GET /api/retell/calls
 * Получить список звонков из БД
 */
router.get('/calls', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, l.name as lead_name, l.company 
       FROM calls c
       LEFT JOIN leads l ON c.lead_id = l.id
       WHERE c.retell_call_id IS NOT NULL
       ORDER BY c.created_at DESC
       LIMIT 50`
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get calls error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch calls'
    });
  }
});

module.exports = router;
