const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');
const { paginatedQuery } = require('../utils/queryHelpers');

/**
 * GET /api/leads
 * Get all leads with filters
 */
router.get('/', authenticateToken, cacheMiddleware(180), async (req, res) => {
  try {
    const { 
      page = 1, limit = 50,
      pipeline_id, stage_id, assigned_to, search 
    } = req.query;
    
    let query = `
      SELECT l.id, l.title, l.description, l.value, l.currency, l.probability,
             l.expected_close_date, l.source, l.tags,
             l.pipeline_id, l.stage_id, l.client_id, l.assigned_to,
             l.contact_name, l.contact_email, l.contact_phone, l.contact_position,
             p.name as pipeline_name, ps.name as stage_name, ps.color as stage_color,
             c.company_name, c.contact_person,
             u.first_name || ' ' || u.last_name as assigned_to_name,
             l.created_at, l.updated_at
      FROM leads l
      LEFT JOIN pipelines p ON l.pipeline_id = p.id
      LEFT JOIN pipeline_stages ps ON l.stage_id = ps.id
      LEFT JOIN clients c ON l.client_id = c.id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE 1=1`;
    
    const params = [];
    let paramIndex = 1;

    if (pipeline_id) {
      query += ` AND l.pipeline_id = $${paramIndex++}`;
      params.push(pipeline_id);
    }

    if (stage_id) {
      query += ` AND l.stage_id = $${paramIndex++}`;
      params.push(stage_id);
    }

    if (assigned_to) {
      query += ` AND l.assigned_to = $${paramIndex++}`;
      params.push(assigned_to);
    }

    if (search) {
      query += ` AND (l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex} OR c.company_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY l.created_at DESC`;

    const result = await paginatedQuery(query, params, parseInt(page), parseInt(limit));
    
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/leads/:id
 * Get lead by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l.*,
              p.name as pipeline_name,
              ps.name as stage_name, ps.color as stage_color,
              c.company_name, c.contact_person, c.email, c.phone,
              u.first_name || ' ' || u.last_name as assigned_to_name
       FROM leads l
       LEFT JOIN pipelines p ON l.pipeline_id = p.id
       LEFT JOIN pipeline_stages ps ON l.stage_id = ps.id
       LEFT JOIN clients c ON l.client_id = c.id
       LEFT JOIN users u ON l.assigned_to = u.id
       WHERE l.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/leads
 * Create new lead
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      pipeline_id, stage_id, client_id, title, description,
      value, currency, probability, expected_close_date,
      source, tags, custom_fields, assigned_to,
      contact_name, contact_email, contact_phone, contact_position,
      company_name, object_address
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const toNullIfEmpty = (val) => (val === '' || val === undefined) ? null : val;

    let finalPipelineId = toNullIfEmpty(pipeline_id);
    let finalStageId = toNullIfEmpty(stage_id);
    
    if (finalPipelineId && !finalStageId) {
      const stageResult = await db.query(
        'SELECT id FROM pipeline_stages WHERE pipeline_id = $1 ORDER BY sort_order LIMIT 1',
        [finalPipelineId]
      );
      if (stageResult.rows.length > 0) {
        finalStageId = stageResult.rows[0].id;
      }
    }

    const result = await db.query(
      `INSERT INTO leads 
       (pipeline_id, stage_id, client_id, title, description, value, currency,
        probability, expected_close_date, source, tags, custom_fields, assigned_to, created_by,
        contact_name, contact_email, contact_phone, contact_position, company_name, object_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING *`,
      [
        finalPipelineId, 
        finalStageId, 
        toNullIfEmpty(client_id), 
        title, 
        description || null, 
        value || null, 
        currency || 'PLN',
        probability || 50, 
        expected_close_date || null, 
        source || null, 
        tags || null, 
        custom_fields ? JSON.stringify(custom_fields) : null, 
        toNullIfEmpty(assigned_to), 
        req.user.id,
        contact_name || null, 
        contact_email || null, 
        contact_phone || null, 
        contact_position || null,
        company_name || null,
        object_address || null
      ]
    );

    // Log activity
    await db.query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, description, user_id)
       VALUES ('lead', $1, 'created', $2, $3)`,
      [result.rows[0].id, `Lead created: ${title}`, req.user.id]
    );

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('lead_created', result.rows[0]);
    }

    await invalidateCache('/api/leads');

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/leads/:id
 * Update lead
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      title, description, value, currency, probability,
      expected_close_date, source, tags, custom_fields, assigned_to,
      pipeline_id, stage_id, client_id,
      contact_name, contact_email, contact_phone, contact_position,
      company_name, object_address
    } = req.body;

    const toNullIfEmpty = (val) => (val === '' || val === undefined) ? null : val;

    const result = await db.query(
      `UPDATE leads 
       SET title = CASE WHEN $1::text IS NOT NULL THEN $1 ELSE title END,
           description = CASE WHEN $2::text IS NOT NULL THEN $2 ELSE description END,
           value = CASE WHEN $3::numeric IS NOT NULL THEN $3 ELSE value END,
           currency = CASE WHEN $4::text IS NOT NULL THEN $4 ELSE currency END,
           probability = CASE WHEN $5::integer IS NOT NULL THEN $5 ELSE probability END,
           expected_close_date = CASE WHEN $6::timestamp IS NOT NULL THEN $6 ELSE expected_close_date END,
           source = CASE WHEN $7::text IS NOT NULL THEN $7 ELSE source END,
           tags = CASE WHEN $8::text[] IS NOT NULL THEN $8 ELSE tags END,
           custom_fields = CASE WHEN $9::jsonb IS NOT NULL THEN $9 ELSE custom_fields END,
           assigned_to = CASE WHEN $10::uuid IS NOT NULL THEN $10 ELSE assigned_to END,
           pipeline_id = CASE WHEN $11::uuid IS NOT NULL THEN $11 ELSE pipeline_id END,
           stage_id = CASE WHEN $12::uuid IS NOT NULL THEN $12 ELSE stage_id END,
           client_id = CASE WHEN $13::uuid IS NOT NULL THEN $13 ELSE client_id END,
           contact_name = $14,
           contact_email = $15,
           contact_phone = $16,
           contact_position = $17,
           company_name = $18,
           object_address = $19,
           updated_at = NOW()
       WHERE id = $20
       RETURNING *`,
      [
        title, 
        description, 
        value, 
        currency, 
        probability, 
        expected_close_date,
        source, 
        tags, 
        custom_fields ? JSON.stringify(custom_fields) : null, 
        toNullIfEmpty(assigned_to),
        toNullIfEmpty(pipeline_id), 
        toNullIfEmpty(stage_id), 
        toNullIfEmpty(client_id),
        contact_name || null, 
        contact_email || null, 
        contact_phone || null, 
        contact_position || null,
        company_name || null,
        object_address || null,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }
    await db.query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, description, user_id)
       VALUES ('lead', $1, 'updated', 'Lead updated', $2)`,
      [req.params.id, req.user.id]
    );

    await invalidateCache('/api/leads');

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/leads/:id/stage
 * Move lead to different stage
 */
router.put('/:id/stage', authenticateToken, async (req, res) => {
  try {
    const { stage_id } = req.body;

    if (!stage_id) {
      return res.status(400).json({ success: false, error: 'Stage ID is required' });
    }

    // Get stage name for activity log
    const stageResult = await db.query(
      'SELECT name, is_final FROM pipeline_stages WHERE id = $1',
      [stage_id]
    );

    if (stageResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Stage not found' });
    }

    const stage = stageResult.rows[0];

    // Update lead
    const result = await db.query(
      `UPDATE leads 
       SET stage_id = $1, 
           closed_at = CASE WHEN $2 THEN NOW() ELSE closed_at END
       WHERE id = $3
       RETURNING *`,
      [stage_id, stage.is_final, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Log activity
    await db.query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, description, user_id)
       VALUES ('lead', $1, 'stage_changed', $2, $3)`,
      [req.params.id, `Moved to stage: ${stage.name}`, req.user.id]
    );

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('lead_stage_changed', { lead_id: req.params.id, stage_id, stage_name: stage.name });
    }

    await invalidateCache('/api/leads');

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/leads/:id
 * Delete lead
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM leads WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    await invalidateCache('/api/leads');

    res.json({ success: true, message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/leads/:id/activities
 * Get all activities for a lead
 */
router.get('/:id/activities', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*, u.first_name || ' ' || u.last_name as user_name
       FROM activities a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.entity_type = 'lead' AND a.entity_id = $1
       ORDER BY a.created_at DESC`,
      [req.params.id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/leads/:id/calls
 * Get all calls for a lead
 */
router.get('/:id/calls', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, phone_number, status, direction, duration, started_at, ended_at,
              recording_url, summary, created_at
       FROM calls 
       WHERE lead_id = $1
       ORDER BY created_at DESC`,
      [req.params.id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/leads/:id/emails
 * Get all emails for a lead
 */
router.get('/:id/emails', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, direction, from_email, subject, sent_at, received_at, is_read
       FROM email_messages 
       WHERE lead_id = $1
       ORDER BY COALESCE(sent_at, received_at) DESC`,
      [req.params.id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/leads/:id/notes
 * Add a note to a lead
 */
router.post('/:id/notes', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Note content is required' });
    }

    // Update lead's description or notes field
    const result = await db.query(
      `UPDATE leads 
       SET description = CASE 
         WHEN description IS NULL OR description = '' THEN $1
         ELSE description || E'\n\n--- Note added ' || NOW()::text || E' ---\n' || $1
       END,
       updated_at = NOW()
       WHERE id = $2
       RETURNING id`,
      [content.trim(), req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.json({ 
      success: true, 
      message: 'Note added successfully',
      data: { id: result.rows[0].id }
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
