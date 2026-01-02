const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// Get all projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { client_id, status } = req.query;
    
    let query = `
      SELECT p.*, 
             c.name as client_name,
             ps.total_spent,
             ps.remaining,
             ps.spent_percentage,
             ps.expense_count
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN project_stats ps ON p.id = ps.id
      WHERE 1=1
    `;
    const params = [];
    
    if (client_id) {
      params.push(client_id);
      query += ` AND p.client_id = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND p.status = $${params.length}`;
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT p.*, 
             c.name as client_name,
             ps.total_spent,
             ps.remaining,
             ps.spent_percentage,
             ps.expense_count,
             u.name as creator_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN project_stats ps ON p.id = ps.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      client_id, 
      name, 
      budget_amount, 
      currency = 'PLN',
      status = 'active',
      start_date,
      end_date,
      description 
    } = req.body;
    
    if (!name || !budget_amount) {
      return res.status(400).json({ error: 'Name and budget_amount are required' });
    }
    
    const result = await db.query(`
      INSERT INTO projects (
        client_id, name, budget_amount, currency, 
        status, start_date, end_date, description, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [client_id, name, budget_amount, currency, status, start_date, end_date, description, req.user.id]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      budget_amount, 
      currency,
      status,
      start_date,
      end_date,
      description 
    } = req.body;
    
    const result = await db.query(`
      UPDATE projects SET
        name = COALESCE($1, name),
        budget_amount = COALESCE($2, budget_amount),
        currency = COALESCE($3, currency),
        status = COALESCE($4, status),
        start_date = COALESCE($5, start_date),
        end_date = COALESCE($6, end_date),
        description = COALESCE($7, description)
      WHERE id = $8
      RETURNING *
    `, [name, budget_amount, currency, status, start_date, end_date, description, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Get project budget stats
router.get('/:id/budget', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT * FROM project_stats WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// Get project expenses
router.get('/:id/expenses', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT e.*, 
             ec.icon, 
             ec.color,
             u.name as created_by_name
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category = ec.name
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.project_id = $1
      ORDER BY e.expense_date DESC, e.created_at DESC
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get project summary
router.get('/:id/summary', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get project stats
    const projectResult = await db.query('SELECT * FROM project_stats WHERE id = $1', [id]);
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projectResult.rows[0];
    
    // Get expenses by category
    const categoriesResult = await db.query(`
      SELECT 
        e.category,
        ec.icon,
        ec.color,
        ec.name_ru,
        SUM(e.amount) as total,
        COUNT(e.id) as count
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category = ec.name
      WHERE e.project_id = $1
      GROUP BY e.category, ec.icon, ec.color, ec.name_ru
      ORDER BY total DESC
    `, [id]);
    
    // Get recent expenses
    const recentResult = await db.query(`
      SELECT e.*, ec.icon, u.name as created_by_name
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category = ec.name
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.project_id = $1
      ORDER BY e.expense_date DESC, e.created_at DESC
      LIMIT 5
    `, [id]);
    
    res.json({
      project,
      categories: categoriesResult.rows,
      recent_expenses: recentResult.rows
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;
