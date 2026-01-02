const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/proposals
 * Get all proposals
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, client_id } = req.query;
    
    let query = `
      SELECT p.id, p.title, p.status, p.created_at, p.sent_at, p.sent_via,
             c.company_name as client_name, c.id as client_id
      FROM ai_proposals p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE 1=1`;
    
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND p.status = $${paramIndex++}`;
      params.push(status);
    }

    if (client_id) {
      query += ` AND p.client_id = $${paramIndex++}`;
      params.push(client_id);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/proposals/:id
 * Get proposal by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, c.company_name as client_name, c.contact_person, c.email
       FROM ai_proposals p
       LEFT JOIN clients c ON p.client_id = c.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/proposals
 * Create new proposal
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { client_id, lead_id, title, input_data, template_used } = req.body;

    const result = await db.query(
      `INSERT INTO ai_proposals (client_id, lead_id, title, input_data, template_used, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [client_id, lead_id, title, JSON.stringify(input_data || {}), template_used || 'default', 'draft', req.user.id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/proposals/:id
 * Update proposal
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, status, generated_content, sent_via } = req.body;

    const result = await db.query(
      `UPDATE ai_proposals 
       SET title = COALESCE($1, title),
           status = COALESCE($2, status),
           generated_content = COALESCE($3, generated_content),
           sent_via = COALESCE($4, sent_via),
           sent_at = CASE WHEN $2 = 'sent' THEN NOW() ELSE sent_at END
       WHERE id = $5
       RETURNING *`,
      [title, status, generated_content, sent_via, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/proposals/:id
 * Delete proposal
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM ai_proposals WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    res.json({ success: true, message: 'Proposal deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
