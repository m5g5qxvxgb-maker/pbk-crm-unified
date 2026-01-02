/**
 * Offerteo Integration API
 * Управление заявками с Offerteo
 */

const express = require('express');
const router = express.Router();
const pool = require('../database/db');

/**
 * POST /api/offerteo/webhook
 * Webhook для получения новых заявок от Offerteo бота
 */
router.post('/webhook', async (req, res) => {
  const { order_id, customer_name, phone, email, service_type, description, budget, location } = req.body;

  try {
    // Проверить, не обработана ли уже эта заявка
    const existing = await pool.query(
      'SELECT id FROM leads WHERE source_id = $1 AND source = $2',
      [order_id, 'offerteo']
    );

    if (existing.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Order already processed',
        lead_id: existing.rows[0].id
      });
    }

    // Создать нового лида
    const result = await pool.query(
      `INSERT INTO leads (
        name, company, email, phone, source, source_id,
        service_type, description, budget, location, 
        stage, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *`,
      [
        customer_name || 'Offerteo Lead',
        'Offerteo Customer',
        email,
        phone,
        'offerteo',
        order_id,
        service_type,
        description,
        budget,
        location,
        'new'
      ]
    );

    const lead = result.rows[0];

    // Создать заметку о том, что лид пришел с Offerteo
    await pool.query(
      `INSERT INTO notes (
        lead_id, content, created_by, created_at
      ) VALUES ($1, $2, $3, NOW())`,
      [
        lead.id,
        `Автоматически создан из заявки Offerteo #${order_id}`,
        1 // system user
      ]
    );

    res.json({
      success: true,
      data: lead
    });

  } catch (error) {
    console.error('Offerteo webhook error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process Offerteo order'
    });
  }
});

/**
 * GET /api/offerteo/leads
 * Получить все лиды из Offerteo
 */
router.get('/leads', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM leads 
       WHERE source = 'offerteo'
       ORDER BY created_at DESC
       LIMIT 100`
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get Offerteo leads error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leads'
    });
  }
});

/**
 * POST /api/offerteo/update-status
 * Обновить статус заявки Offerteo
 */
router.post('/update-status', async (req, res) => {
  const { order_id, status, notes } = req.body;

  try {
    // Найти лид
    const leadResult = await pool.query(
      'SELECT id FROM leads WHERE source_id = $1 AND source = $2',
      [order_id, 'offerteo']
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    const leadId = leadResult.rows[0].id;

    // Обновить статус
    await pool.query(
      'UPDATE leads SET stage = $1, updated_at = NOW() WHERE id = $2',
      [status, leadId]
    );

    // Добавить заметку
    if (notes) {
      await pool.query(
        `INSERT INTO notes (lead_id, content, created_by, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [leadId, notes, 1]
      );
    }

    res.json({
      success: true,
      message: 'Status updated'
    });

  } catch (error) {
    console.error('Update status error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update status'
    });
  }
});

module.exports = router;
