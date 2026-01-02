const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// Get all deals
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.*, c.name as client_name 
      FROM deals d 
      LEFT JOIN clients c ON d.client_id = c.id 
      ORDER BY d.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get deal by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT d.*, c.name as client_name FROM deals d LEFT JOIN clients c ON d.client_id = c.id WHERE d.id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create deal
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, client_id, value, stage, probability, expected_close_date } = req.body;
    
    const result = await db.query(
      `INSERT INTO deals (title, client_id, value, stage, probability, expected_close_date, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
       RETURNING *`,
      [title, client_id, value || 0, stage || 'lead', probability || 30, expected_close_date]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update deal
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, client_id, value, stage, probability, expected_close_date } = req.body;
    
    const result = await db.query(
      `UPDATE deals 
       SET title = COALESCE($1, title),
           client_id = COALESCE($2, client_id),
           value = COALESCE($3, value),
           stage = COALESCE($4, stage),
           probability = COALESCE($5, probability),
           expected_close_date = COALESCE($6, expected_close_date),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [title, client_id, value, stage, probability, expected_close_date, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete deal
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM deals WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
