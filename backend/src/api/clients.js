const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');
const { paginatedQuery } = require('../utils/queryHelpers');

/**
 * GET /api/clients
 * Get all clients
 */
router.get('/', authenticateToken, cacheMiddleware(180), async (req, res) => {
  try {
    const { page = 1, limit = 50, search, assigned_to } = req.query;
    
    let query = `SELECT id, company_name, contact_person, email, phone, 
                        website, city, country, tags, assigned_to, created_at
                 FROM clients WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (company_name ILIKE $${paramIndex} OR contact_person ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (assigned_to) {
      query += ` AND assigned_to = $${paramIndex++}`;
      params.push(assigned_to);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await paginatedQuery(query, params, parseInt(page), parseInt(limit));
    
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/clients/:id
 * Get client by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM clients WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/clients
 * Create new client
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      company_name, contact_person, email, phone, website,
      address, city, country, notes, tags, custom_fields, assigned_to
    } = req.body;

    const result = await db.query(
      `INSERT INTO clients 
       (company_name, contact_person, email, phone, website, address, city, country,
        notes, tags, custom_fields, assigned_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [company_name, contact_person, email, phone, website, address, city, country,
       notes, tags, custom_fields ? JSON.stringify(custom_fields) : null, assigned_to, req.user.id]
    );

    // Log activity
    await db.query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, description, user_id)
       VALUES ('client', $1, 'created', 'Client created', $2)`,
      [result.rows[0].id, req.user.id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/clients/:id
 * Update client
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      company_name, contact_person, email, phone, website,
      address, city, country, notes, tags, custom_fields, assigned_to
    } = req.body;

    const result = await db.query(
      `UPDATE clients 
       SET company_name = COALESCE($1, company_name),
           contact_person = COALESCE($2, contact_person),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           website = COALESCE($5, website),
           address = COALESCE($6, address),
           city = COALESCE($7, city),
           country = COALESCE($8, country),
           notes = COALESCE($9, notes),
           tags = COALESCE($10, tags),
           custom_fields = COALESCE($11, custom_fields),
           assigned_to = COALESCE($12, assigned_to)
       WHERE id = $13
       RETURNING *`,
      [company_name, contact_person, email, phone, website, address, city, country,
       notes, tags, custom_fields ? JSON.stringify(custom_fields) : null, assigned_to, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    // Log activity
    await db.query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, description, user_id)
       VALUES ('client', $1, 'updated', 'Client updated', $2)`,
      [req.params.id, req.user.id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/clients/:id
 * Delete client
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM clients WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    res.json({ success: true, message: 'Client deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/clients/:id/calls
 * Get all calls for a client
 */
router.get('/:id/calls', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, phone_number, status, direction, duration, started_at, ended_at,
              recording_url, summary, created_at
       FROM calls 
       WHERE client_id = $1
       ORDER BY created_at DESC`,
      [req.params.id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/clients/:id/emails
 * Get all emails for a client
 */
router.get('/:id/emails', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, direction, from_email, subject, sent_at, received_at, is_read
       FROM email_messages 
       WHERE client_id = $1
       ORDER BY COALESCE(sent_at, received_at) DESC`,
      [req.params.id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/clients/:id/leads
 * Get all leads for a client
 */
router.get('/:id/leads', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l.id, l.title, l.value, l.currency, l.probability,
              p.name as pipeline_name, ps.name as stage_name,
              l.created_at
       FROM leads l
       LEFT JOIN pipelines p ON l.pipeline_id = p.id
       LEFT JOIN pipeline_stages ps ON l.stage_id = ps.id
       WHERE l.client_id = $1
       ORDER BY l.created_at DESC`,
      [req.params.id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
