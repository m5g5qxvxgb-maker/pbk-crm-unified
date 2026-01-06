/**
 * Webhooks Integration Router
 * Маршрутизация webhooks от внешних сервисов в CRM
 */

const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const logger = require('../utils/logger');

// Импортируем уведомления для Telegram
const { notifyLeadToSalesGroup } = require('../utils/telegram-notifier');

/**
 * POST /api/webhooks/fixly
 * Webhook от Fixly bot - новая заявка
 */
router.post('/fixly', async (req, res) => {
  const leadData = req.body;
  
  logger.info('Received Fixly webhook:', leadData);

  try {
    // Check for duplicates using custom_fields JSON
    const existing = await pool.query(
      `SELECT id FROM leads WHERE custom_fields->>'fixlyId' = $1`,
      [leadData.fixlyId]
    );

    if (existing.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Lead already exists',
        leadId: existing.rows[0].id
      });
    }

    // Create client first if phone is provided
    let clientId = null;
    if (leadData.phone) {
      const clientCheck = await pool.query(
        'SELECT id FROM clients WHERE phone = $1 LIMIT 1',
        [leadData.phone]
      );

      if (clientCheck.rows.length > 0) {
        clientId = clientCheck.rows[0].id;
      } else {
        const newClient = await pool.query(
          `INSERT INTO clients (contact_person, phone, email, created_at)
           VALUES ($1, $2, $3, NOW()) RETURNING id`,
          [leadData.customerName || 'Клиент Fixly', leadData.phone, leadData.email || null]
        );
        clientId = newClient.rows[0].id;
      }
    }

    // Create lead in CRM with proper schema
    const result = await pool.query(
      `INSERT INTO leads (
        title, description, source, client_id, value,
        custom_fields, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *`,
      [
        leadData.title || 'Заявка Fixly',
        leadData.description || '',
        'fixly',
        clientId,
        leadData.budget ? parseFloat(leadData.budget.replace(/[^\d.]/g, '')) || null : null,
        JSON.stringify({
          fixlyId: leadData.fixlyId,
          customerName: leadData.customerName,
          phone: leadData.phone,
          email: leadData.email,
          district: leadData.district,
          budget: leadData.budget,
          url: leadData.url,
          crmDealId: leadData.crmDealId,
          crmClientId: leadData.crmClientId
        })
      ]
    );

    const lead = result.rows[0];

    // Send notification to Telegram Sales Group
    if (notifyLeadToSalesGroup) {
      try {
        await notifyLeadToSalesGroup({
          id: lead.id,
          crmLeadId: lead.id,
          title: leadData.title || 'Заявка Fixly',
          customerName: leadData.customerName || 'Не указано',
          phone: leadData.phone || 'Не указано',
          budget: leadData.budget || 'Не указано',
          source: 'fixly',
          description: leadData.description || '',
          url: leadData.url
        });
        logger.info(`✅ Telegram notification sent for Fixly lead ${lead.id}`);
      } catch (notifyError) {
        logger.error('Failed to send Telegram notification:', notifyError.message);
      }
    }

    res.json({
      success: true,
      data: lead
    });

  } catch (error) {
    logger.error('Fixly webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process Fixly lead',
      message: error.message
    });
  }
});

/**
 * POST /api/webhooks/offerteo
 * Webhook от Offerteo bot - новый тендер
 */
router.post('/offerteo', async (req, res) => {
  const leadData = req.body;
  
  logger.info('Received Offerteo webhook:', leadData);

  try {
    // Check for duplicates using custom_fields JSON
    const rfpId = leadData.rfpId || leadData.order_id;
    const existing = await pool.query(
      `SELECT id FROM leads WHERE custom_fields->>'rfpId' = $1`,
      [rfpId]
    );

    if (existing.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Lead already exists',
        leadId: existing.rows[0].id
      });
    }

    // Create lead in CRM with proper schema
    const result = await pool.query(
      `INSERT INTO leads (
        title, description, source, value,
        custom_fields, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *`,
      [
        leadData.title || 'Тендер Offerteo',
        leadData.description || '',
        'offerteo',
        leadData.budget ? parseFloat(leadData.budget.replace(/[^\d.]/g, '')) || null : null,
        JSON.stringify({
          rfpId: rfpId,
          categoryName: leadData.categoryName,
          locationName: leadData.locationName,
          budget: leadData.budget,
          deadline: leadData.deadline,
          url: leadData.url,
          order_id: leadData.order_id
        })
      ]
    );

    const lead = result.rows[0];

    // Send notification to Telegram Sales Group
    if (notifyLeadToSalesGroup) {
      try {
        await notifyLeadToSalesGroup({
          id: lead.id,
          crmLeadId: lead.id,
          title: leadData.title || 'Тендер Offerteo',
          customerName: leadData.categoryName || 'Не указано',
          phone: 'Не указано',
          budget: leadData.budget || 'Не указано',
          source: 'offerteo',
          description: leadData.description || '',
          location: leadData.locationName,
          url: leadData.url
        });
        logger.info(`✅ Telegram notification sent for Offerteo lead ${lead.id}`);
      } catch (notifyError) {
        logger.error('Failed to send Telegram notification:', notifyError.message);
      }
    }

    res.json({
      success: true,
      data: lead
    });

  } catch (error) {
    logger.error('Offerteo webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process Offerteo lead',
      message: error.message
    });
  }
});

/**
 * POST /api/webhooks/retell
 * Webhook от Retell AI - событие звонка
 */
router.post('/retell', async (req, res) => {
  const { event, call } = req.body;
  
  logger.info(`Received Retell webhook: ${event}`, { callId: call?.call_id });

  try {
    if (event === 'call_ended' && call) {
      // Обновить звонок в БД
      await pool.query(
        `UPDATE calls SET 
          status = $1, 
          duration = $2,
          recording_url = $3,
          transcript = $4,
          ai_summary = $5,
          metadata = $6,
          updated_at = NOW()
        WHERE retell_call_id = $7`,
        [
          call.call_status || 'ended',
          call.end_timestamp - call.start_timestamp,
          call.recording_url || null,
          call.transcript || null,
          call.call_analysis || null,
          JSON.stringify(call),
          call.call_id
        ]
      );

      logger.info(`Retell call updated: ${call.call_id}`);
    }

    res.json({ success: true });

  } catch (error) {
    logger.error('Retell webhook error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process Retell webhook'
    });
  }
});

/**
 * GET /api/webhooks/test
 * Тестовый endpoint для проверки
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhooks endpoint working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
