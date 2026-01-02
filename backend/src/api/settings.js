const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const retellService = require('../services/retell/service');
const openaiService = require('../services/openai/service');
const logger = require('../utils/logger');

/**
 * GET /api/settings
 * Get all system settings (admin only)
 */
router.get('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT key, value, description, updated_at FROM system_settings ORDER BY key'
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/settings/:key
 * Get specific setting
 */
router.get('/:key', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT key, value, description FROM system_settings WHERE key = $1',
      [req.params.key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Setting not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/settings/retell
 * Update Retell AI settings
 */
router.put('/retell', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { api_key, agent_id, from_number, system_prompt, knowledge_base } = req.body;

    const settings = {
      api_key,
      agent_id,
      from_number,
      system_prompt,
      knowledge_base
    };

    await db.query(
      `INSERT INTO system_settings (key, value, description, updated_by)
       VALUES ('retell', $1, 'Retell AI configuration', $2)
       ON CONFLICT (key) DO UPDATE 
       SET value = $1, updated_by = $2, updated_at = NOW()`,
      [JSON.stringify(settings), req.user.id]
    );

    logger.info(`Retell settings updated by user ${req.user.email}`);

    res.json({ success: true, message: 'Retell settings updated' });
  } catch (error) {
    logger.error('Update Retell settings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/settings/openai
 * Update OpenAI settings
 */
router.put('/openai', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { api_key, organization_id, model, proposal_template } = req.body;

    const settings = {
      api_key,
      organization_id,
      model: model || 'gpt-4-turbo-preview',
      proposal_template
    };

    await db.query(
      `INSERT INTO system_settings (key, value, description, updated_by, is_encrypted)
       VALUES ('openai', $1, 'OpenAI configuration', $2, true)
       ON CONFLICT (key) DO UPDATE 
       SET value = $1, updated_by = $2, updated_at = NOW()`,
      [JSON.stringify(settings), req.user.id]
    );

    logger.info(`OpenAI settings updated by user ${req.user.email}`);

    res.json({ success: true, message: 'OpenAI settings updated' });
  } catch (error) {
    logger.error('Update OpenAI settings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/settings/email
 * Update Email settings
 */
router.put('/email', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { 
      smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password,
      imap_host, imap_port, imap_user, imap_password,
      email_signature 
    } = req.body;

    const settings = {
      smtp: {
        host: smtp_host,
        port: smtp_port,
        secure: smtp_secure,
        user: smtp_user,
        password: smtp_password
      },
      imap: {
        host: imap_host,
        port: imap_port,
        user: imap_user,
        password: imap_password
      },
      signature: email_signature
    };

    await db.query(
      `INSERT INTO system_settings (key, value, description, updated_by, is_encrypted)
       VALUES ('email', $1, 'Email configuration', $2, true)
       ON CONFLICT (key) DO UPDATE 
       SET value = $1, updated_by = $2, updated_at = NOW()`,
      [JSON.stringify(settings), req.user.id]
    );

    logger.info(`Email settings updated by user ${req.user.email}`);

    res.json({ success: true, message: 'Email settings updated' });
  } catch (error) {
    logger.error('Update Email settings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/settings/telegram
 * Update Telegram settings
 */
router.put('/telegram', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { 
      main_bot_token, admin_chat_ids,
      copilot_bot_token, copilot_allowed_users 
    } = req.body;

    const settings = {
      main_bot: {
        token: main_bot_token,
        admin_chat_ids: admin_chat_ids ? admin_chat_ids.split(',').map(id => id.trim()) : []
      },
      copilot: {
        token: copilot_bot_token,
        allowed_users: copilot_allowed_users ? copilot_allowed_users.split(',').map(id => id.trim()) : []
      }
    };

    await db.query(
      `INSERT INTO system_settings (key, value, description, updated_by, is_encrypted)
       VALUES ('telegram', $1, 'Telegram bots configuration', $2, true)
       ON CONFLICT (key) DO UPDATE 
       SET value = $1, updated_by = $2, updated_at = NOW()`,
      [JSON.stringify(settings), req.user.id]
    );

    logger.info(`Telegram settings updated by user ${req.user.email}`);

    res.json({ success: true, message: 'Telegram settings updated' });
  } catch (error) {
    logger.error('Update Telegram settings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/settings/test/retell
 * Test Retell AI connection
 */
router.post('/test/retell', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    // Test getting calls list
    const result = await retellService.listCalls({ limit: 1 });

    if (result.success) {
      res.json({ success: true, message: 'Retell AI connection successful' });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/settings/test/openai
 * Test OpenAI connection
 */
router.post('/test/openai', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    // Test simple translation
    const result = await openaiService.translate('Hello', 'ru');

    if (result.success) {
      res.json({ success: true, message: 'OpenAI connection successful', data: result.data });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/settings/test/email
 * Test Email connection
 */
router.post('/test/email', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { test_email } = req.body;

    if (!test_email) {
      return res.status(400).json({ success: false, error: 'Test email is required' });
    }

    // TODO: Implement email test when email service is ready
    
    res.json({ success: true, message: 'Email test coming soon' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
