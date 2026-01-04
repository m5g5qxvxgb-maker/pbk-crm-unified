const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for receipt uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/receipts/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images and PDFs are allowed'));
  }
});

// Get all expenses with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      project_id, 
      client_id, 
      category, 
      start_date, 
      end_date,
      created_via,
      limit = 50,
      offset = 0 
    } = req.query;
    
    let query = `
      SELECT e.*, 
             ec.icon, 
             ec.color,
             ec.name_ru as category_ru,
             p.name as project_name,
             c.company_name as client_name,
             CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category = ec.name
      LEFT JOIN projects p ON e.project_id = p.id
      LEFT JOIN clients c ON e.client_id = c.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (project_id) {
      params.push(project_id);
      query += ` AND e.project_id = $${params.length}`;
    }
    
    if (client_id) {
      params.push(client_id);
      query += ` AND e.client_id = $${params.length}`;
    }
    
    if (category) {
      params.push(category);
      query += ` AND e.category = $${params.length}`;
    }
    
    if (start_date) {
      params.push(start_date);
      query += ` AND e.expense_date >= $${params.length}`;
    }
    
    if (end_date) {
      params.push(end_date);
      query += ` AND e.expense_date <= $${params.length}`;
    }
    
    if (created_via) {
      params.push(created_via);
      query += ` AND e.created_via = $${params.length}`;
    }
    
    query += ' ORDER BY e.expense_date DESC, e.created_at DESC';
    
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
    
    const result = await db.query(query, params);
    
    // Get total count
    const countResult = await db.query('SELECT COUNT(*) FROM expenses WHERE 1=1');
    
    res.json({
      expenses: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get expense by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT e.*, 
             ec.icon, 
             ec.color,
             ec.name_ru as category_ru,
             p.name as project_name,
             c.company_name as client_name,
             CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category = ec.name
      LEFT JOIN projects p ON e.project_id = p.id
      LEFT JOIN clients c ON e.client_id = c.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// Create expense
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      project_id,
      client_id,
      amount,
      currency = 'PLN',
      category,
      subcategory,
      description,
      notes,
      receipt_url,
      receipt_number,
      expense_date,
      created_via = 'web',
      telegram_message_id,
      telegram_user_id
    } = req.body;
    
    if (!amount || !category || !description || !expense_date) {
      return res.status(400).json({ 
        error: 'Amount, category, description, and expense_date are required' 
      });
    }
    
    const result = await db.query(`
      INSERT INTO expenses (
        project_id, client_id, amount, currency,
        category, subcategory, description, notes,
        receipt_url, receipt_number, expense_date,
        created_by, created_via, telegram_message_id, telegram_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      project_id, client_id, amount, currency,
      category, subcategory, description, notes,
      receipt_url, receipt_number, expense_date,
      req.user.id, created_via, telegram_message_id, telegram_user_id
    ]);
    
    // Check budget alerts if expense is for a project
    if (project_id) {
      await checkBudgetAlerts(project_id);
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update expense
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amount,
      currency,
      category,
      subcategory,
      description,
      notes,
      receipt_url,
      receipt_number,
      expense_date
    } = req.body;
    
    const result = await db.query(`
      UPDATE expenses SET
        amount = COALESCE($1, amount),
        currency = COALESCE($2, currency),
        category = COALESCE($3, category),
        subcategory = COALESCE($4, subcategory),
        description = COALESCE($5, description),
        notes = COALESCE($6, notes),
        receipt_url = COALESCE($7, receipt_url),
        receipt_number = COALESCE($8, receipt_number),
        expense_date = COALESCE($9, expense_date)
      WHERE id = $10
      RETURNING *
    `, [amount, currency, category, subcategory, description, notes, receipt_url, receipt_number, expense_date, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM expenses WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Upload receipt
router.post('/upload-receipt', authenticateToken, upload.single('receipt'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/receipts/${req.file.filename}`;
    res.json({ 
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Error uploading receipt:', error);
    res.status(500).json({ error: 'Failed to upload receipt' });
  }
});

// Get expenses statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, project_id } = req.query;
    
    let query = `
      SELECT 
        COUNT(*) as total_count,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount,
        MIN(amount) as min_amount,
        MAX(amount) as max_amount
      FROM expenses
      WHERE 1=1
    `;
    const params = [];
    
    if (start_date) {
      params.push(start_date);
      query += ` AND expense_date >= $${params.length}`;
    }
    
    if (end_date) {
      params.push(end_date);
      query += ` AND expense_date <= $${params.length}`;
    }
    
    if (project_id) {
      params.push(project_id);
      query += ` AND project_id = $${params.length}`;
    }
    
    const result = await db.query(query, params);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get expenses by category
router.get('/stats/by-category', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, project_id } = req.query;
    
    let query = `
      SELECT 
        e.category,
        ec.icon,
        ec.color,
        ec.name_ru,
        COUNT(e.id) as count,
        SUM(e.amount) as total
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category = ec.name
      WHERE 1=1
    `;
    const params = [];
    
    if (start_date) {
      params.push(start_date);
      query += ` AND e.expense_date >= $${params.length}`;
    }
    
    if (end_date) {
      params.push(end_date);
      query += ` AND e.expense_date <= $${params.length}`;
    }
    
    if (project_id) {
      params.push(project_id);
      query += ` AND e.project_id = $${params.length}`;
    }
    
    query += ' GROUP BY e.category, ec.icon, ec.color, ec.name_ru ORDER BY total DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({ error: 'Failed to fetch category statistics' });
  }
});

// Get monthly expenses
router.get('/stats/monthly', authenticateToken, async (req, res) => {
  try {
    const { year, project_id } = req.query;
    const currentYear = year || new Date().getFullYear();
    
    let query = `
      SELECT 
        EXTRACT(MONTH FROM expense_date) as month,
        COUNT(*) as count,
        SUM(amount) as total
      FROM expenses
      WHERE EXTRACT(YEAR FROM expense_date) = $1
    `;
    const params = [currentYear];
    
    if (project_id) {
      params.push(project_id);
      query += ` AND project_id = $${params.length}`;
    }
    
    query += ' GROUP BY month ORDER BY month';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    res.status(500).json({ error: 'Failed to fetch monthly statistics' });
  }
});

// Helper function to check budget alerts
async function checkBudgetAlerts(projectId) {
  try {
    const result = await db.query(`
      SELECT * FROM project_stats WHERE id = $1
    `, [projectId]);
    
    if (result.rows.length === 0) return;
    
    const stats = result.rows[0];
    const percentage = parseFloat(stats.spent_percentage);
    
    // Alert at 80% and 100%
    const thresholds = [80, 100];
    
    for (const threshold of thresholds) {
      if (percentage >= threshold) {
        const existingAlert = await db.query(`
          SELECT id FROM budget_alerts 
          WHERE project_id = $1 
            AND threshold_percentage = $2 
            AND is_sent = false
        `, [projectId, threshold]);
        
        if (existingAlert.rows.length === 0) {
          const alertType = threshold >= 100 ? 'budget_exceeded' : 'threshold_reached';
          const message = threshold >= 100 
            ? `Budget exceeded! Spent ${percentage}% of budget`
            : `Warning: ${percentage}% of budget spent`;
          
          await db.query(`
            INSERT INTO budget_alerts (project_id, alert_type, threshold_percentage, message)
            VALUES ($1, $2, $3, $4)
          `, [projectId, alertType, threshold, message]);
        }
      }
    }
  } catch (error) {
    console.error('Error checking budget alerts:', error);
  }
}

module.exports = router;
