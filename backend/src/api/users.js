const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get('/', authenticateToken, authorizeRole('admin', 'manager'), async (req, res) => {
  try {
    const { limit = 50, offset = 0, role, is_active } = req.query;
    
    let query = `SELECT id, email, first_name, last_name, role, phone, 
                        is_active, can_create_calls, can_approve_calls,
                        last_login_at, created_at
                 FROM users WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND role = $${paramIndex++}`;
      params.push(role);
    }

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramIndex++}`;
      params.push(is_active === 'true');
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, first_name, last_name, role, phone, telegram_id,
              avatar_url, is_active, can_create_calls, can_approve_calls,
              last_login_at, created_at
       FROM users WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/users
 * Create new user (admin only)
 */
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { 
      email, first_name, last_name, role, phone, 
      can_create_calls, can_approve_calls 
    } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const result = await db.query(
      `INSERT INTO users 
       (email, password_hash, first_name, last_name, role, phone, can_create_calls, can_approve_calls)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, first_name, last_name, role, created_at`,
      [email, 'changeme', first_name, last_name, role || 'viewer', phone, can_create_calls || false, can_approve_calls || false]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Users can update themselves, admins can update anyone
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { first_name, last_name, phone, avatar_url } = req.body;

    const result = await db.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           avatar_url = COALESCE($4, avatar_url)
       WHERE id = $5
       RETURNING id, email, first_name, last_name, phone, avatar_url`,
      [first_name, last_name, phone, avatar_url, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/users/:id/permissions
 * Update user permissions (admin only)
 */
router.put('/:id/permissions', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { role, can_create_calls, can_approve_calls, is_active } = req.body;

    const result = await db.query(
      `UPDATE users 
       SET role = COALESCE($1, role),
           can_create_calls = COALESCE($2, can_create_calls),
           can_approve_calls = COALESCE($3, can_approve_calls),
           is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING id, email, role, can_create_calls, can_approve_calls, is_active`,
      [role, can_create_calls, can_approve_calls, is_active, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 */
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
