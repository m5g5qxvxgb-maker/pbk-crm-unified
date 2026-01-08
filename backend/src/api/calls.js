const express = require('express');
const router = express.Router();
const db = require('../database/db');
const retellService = require('../services/retell/service');
const { authenticateToken } = require('../middleware/auth');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');
const { paginatedQuery } = require('../utils/queryHelpers');

/**
 * GET /api/calls
 * Get all calls with filters
 */
router.get('/', authenticateToken, cacheMiddleware(120), async (req, res) => {
  try {
    const { lead_id, client_id, status, date_from, date_to, page = 1, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM calls WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (lead_id) {
      query += ` AND lead_id = $${paramIndex++}`;
      params.push(lead_id);
    }
    if (client_id) {
      query += ` AND client_id = $${paramIndex++}`;
      params.push(client_id);
    }
    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    if (date_from) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(date_from);
    }
    if (date_to) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(date_to);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await paginatedQuery(query, params, parseInt(page), parseInt(limit));
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/calls/:id
 * Get call by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM calls WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Call not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/calls
 * Create a new call
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      lead_id,
      client_id,
      date,
      time,
      duration,
      status = 'pending',
      notes,
      phone_number,
      direction = 'outbound',
      scheduled_at
    } = req.body;

    // Helper function to convert empty strings to null for UUID fields
    const toNullIfEmpty = (val) => (val === '' || val === undefined) ? null : val;

    // Handle scheduled_at: either from direct field or combine date+time
    let finalScheduledAt = scheduled_at;
    if (!finalScheduledAt && date && time) {
      finalScheduledAt = new Date(`${date}T${time}`);
    }

    const result = await db.query(
      `INSERT INTO calls 
      (lead_id, client_id, phone_number, status, direction, duration, scheduled_at, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *`,
      [
        toNullIfEmpty(lead_id), 
        toNullIfEmpty(client_id), 
        phone_number || '', 
        status, 
        direction, 
        duration, 
        finalScheduledAt || null, 
        notes || ''
      ]
    );

    await invalidateCache('/api/calls');

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/calls/request
 * Create call request (requires approval)
 */
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const {
      lead_id,
      client_id,
      phone_number,
      scheduled_time,
      purpose,
      additional_instructions,
      priority = 1
    } = req.body;

    if (!phone_number) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    const result = await db.query(
      `INSERT INTO call_requests 
      (lead_id, client_id, phone_number, scheduled_time, purpose, additional_instructions, priority, created_by, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [lead_id, client_id, phone_number, scheduled_time, purpose, additional_instructions, priority, req.user.id, 'pending_approval']
    );

    // Notify approvers via Telegram
    const io = req.app.get('io');
    io.emit('call_request_created', result.rows[0]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/calls/request/:id/approve
 * Approve call request
 */
router.post('/request/:id/approve', authenticateToken, async (req, res) => {
  try {
    if (!req.user.can_approve_calls) {
      return res.status(403).json({ success: false, error: 'No permission to approve calls' });
    }

    const requestResult = await db.query(
      'SELECT * FROM call_requests WHERE id = $1',
      [req.params.id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Call request not found' });
    }

    const callRequest = requestResult.rows[0];

    // Update request status
    await db.query(
      'UPDATE call_requests SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3',
      ['approved', req.user.id, req.params.id]
    );

    // Create actual call via Retell
    const retellResult = await retellService.createCall({
      toNumber: callRequest.phone_number,
      variables: {
        purpose: callRequest.purpose,
        instructions: callRequest.additional_instructions
      }
    });

    if (!retellResult.success) {
      return res.status(500).json({ success: false, error: 'Failed to create call in Retell' });
    }

    // Save call to database
    const callResult = await db.query(
      `INSERT INTO calls 
      (call_request_id, lead_id, client_id, retell_call_id, phone_number, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        callRequest.id,
        callRequest.lead_id,
        callRequest.client_id,
        retellResult.data.call_id,
        callRequest.phone_number,
        'in_progress'
      ]
    );

    const io = req.app.get('io');
    io.emit('call_started', callResult.rows[0]);

    res.json({ success: true, data: callResult.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/calls/request/:id/reject
 * Reject call request
 */
router.post('/request/:id/reject', authenticateToken, async (req, res) => {
  try {
    if (!req.user.can_approve_calls) {
      return res.status(403).json({ success: false, error: 'No permission to reject calls' });
    }

    const { rejection_reason } = req.body;

    await db.query(
      'UPDATE call_requests SET status = $1, approved_by = $2, approved_at = NOW(), rejection_reason = $3 WHERE id = $4',
      ['rejected', req.user.id, rejection_reason, req.params.id]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/calls/:id/transcript
 * Get call transcript with translations
 */
router.get('/:id/transcript', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT transcript, transcript_language, translated_transcript FROM calls WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Call not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/calls/:id/translate
 * Translate call transcript
 */
router.post('/:id/translate', authenticateToken, async (req, res) => {
  try {
    const { target_language } = req.body;
    
    const callResult = await db.query('SELECT * FROM calls WHERE id = $1', [req.params.id]);
    if (callResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Call not found' });
    }

    const call = callResult.rows[0];
    if (!call.transcript) {
      return res.status(400).json({ success: false, error: 'No transcript available' });
    }

    const openaiService = require('../services/openai/service');
    const translationResult = await openaiService.translate(call.transcript, target_language);

    if (!translationResult.success) {
      return res.status(500).json({ success: false, error: 'Translation failed' });
    }

    // Update translated_transcript JSONB field
    const existingTranslations = call.translated_transcript || {};
    existingTranslations[target_language] = translationResult.data.translatedText;

    await db.query(
      'UPDATE calls SET translated_transcript = $1 WHERE id = $2',
      [JSON.stringify(existingTranslations), req.params.id]
    );

    res.json({ success: true, data: translationResult.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
