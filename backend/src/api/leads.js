const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/leads
 * Get all leads with filters
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      limit = 50, offset = 0, 
      pipeline_id, stage_id, assigned_to, search 
    } = req.query;
    
    let query = `
      SELECT l.id, l.title, l.description, l.value, l.currency, l.probability,
             l.expected_close_date, l.source, l.tags,
             l.pipeline_id, l.stage_id, l.client_id, l.assigned_to,
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

    query += ` ORDER BY l.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    
    res.json({ success: true, data: result.rows });
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
      source, tags, custom_fields, assigned_to
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    // If no stage specified, get first stage of pipeline
    let finalStageId = stage_id;
    if (pipeline_id && !stage_id) {
      const stageResult = await db.query(
        'SELECT id FROM pipeline_stages WHERE pipeline_id = $1 ORDER BY sort_order LIMIT 1',
        [pipeline_id]
      );
      if (stageResult.rows.length > 0) {
        finalStageId = stageResult.rows[0].id;
      }
    }

    const result = await db.query(
      `INSERT INTO leads 
       (pipeline_id, stage_id, client_id, title, description, value, currency,
        probability, expected_close_date, source, tags, custom_fields, assigned_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [pipeline_id, finalStageId, client_id, title, description, value, currency || 'USD',
       probability || 50, expected_close_date, source, tags, 
       custom_fields ? JSON.stringify(custom_fields) : null, assigned_to, req.user.id]
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
      expected_close_date, source, tags, custom_fields, assigned_to
    } = req.body;

    const result = await db.query(
      `UPDATE leads 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           value = COALESCE($3, value),
           currency = COALESCE($4, currency),
           probability = COALESCE($5, probability),
           expected_close_date = COALESCE($6, expected_close_date),
           source = COALESCE($7, source),
           tags = COALESCE($8, tags),
           custom_fields = COALESCE($9, custom_fields),
           assigned_to = COALESCE($10, assigned_to)
       WHERE id = $11
       RETURNING *`,
      [title, description, value, currency, probability, expected_close_date,
       source, tags, custom_fields ? JSON.stringify(custom_fields) : null, assigned_to, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Log activity
    await db.query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, description, user_id)
       VALUES ('lead', $1, 'updated', 'Lead updated', $2)`,
      [req.params.id, req.user.id]
    );

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

module.exports = router;
