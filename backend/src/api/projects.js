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
             c.company_name as client_name,
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
             c.company_name as client_name,
             ps.total_spent,
             ps.remaining,
             ps.spent_percentage,
             ps.expense_count,
             CONCAT(u.first_name, ' ', u.last_name) as creator_name
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
      lead_id,
      name, 
      deal_amount,
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
        client_id, lead_id, name, deal_amount, budget_amount, currency, 
        status, start_date, end_date, description, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [client_id, lead_id, name, deal_amount, budget_amount, currency, status, start_date, end_date, description, req.user.id]);
    
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
      deal_amount,
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
        deal_amount = COALESCE($2, deal_amount),
        budget_amount = COALESCE($3, budget_amount),
        currency = COALESCE($4, currency),
        status = COALESCE($5, status),
        start_date = COALESCE($6, start_date),
        end_date = COALESCE($7, end_date),
        description = COALESCE($8, description)
      WHERE id = $9
      RETURNING *
    `, [name, deal_amount, budget_amount, currency, status, start_date, end_date, description, id]);
    
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
             CONCAT(u.first_name, ' ', u.last_name) as created_by_name
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
      SELECT e.*, ec.icon, CONCAT(u.first_name, ' ', u.last_name) as created_by_name
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

// Get advanced analytics with forecasts
router.get('/:id/analytics', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get project stats
    const projectResult = await db.query('SELECT * FROM project_stats WHERE id = $1', [id]);
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const stats = projectResult.rows[0];
    
    // Get project dates
    const projectInfo = await db.query(`
      SELECT start_date, end_date, status FROM projects WHERE id = $1
    `, [id]);
    
    const project = projectInfo.rows[0];
    
    // Calculate daily burn rate and forecast
    const expenseTimeline = await db.query(`
      SELECT 
        expense_date,
        SUM(amount) OVER (ORDER BY expense_date) as cumulative_spent,
        COUNT(*) OVER (ORDER BY expense_date) as cumulative_count
      FROM expenses 
      WHERE project_id = $1
      ORDER BY expense_date
    `, [id]);
    
    let forecast = null;
    let daily_burn_rate = 0;
    let estimated_completion_date = null;
    let projected_total_cost = null;
    
    if (expenseTimeline.rows.length > 1) {
      const firstExpense = new Date(expenseTimeline.rows[0].expense_date);
      const lastExpense = new Date(expenseTimeline.rows[expenseTimeline.rows.length - 1].expense_date);
      const daysPassed = Math.max(1, Math.ceil((lastExpense - firstExpense) / (1000 * 60 * 60 * 24)));
      
      daily_burn_rate = parseFloat(stats.total_spent) / daysPassed;
      
      // Forecast remaining days to budget exhaustion
      if (daily_burn_rate > 0 && stats.remaining > 0) {
        const days_until_budget_exhausted = Math.ceil(parseFloat(stats.remaining) / daily_burn_rate);
        estimated_completion_date = new Date();
        estimated_completion_date.setDate(estimated_completion_date.getDate() + days_until_budget_exhausted);
        
        // Project total cost if trend continues
        if (project.end_date) {
          const endDate = new Date(project.end_date);
          const today = new Date();
          const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
          projected_total_cost = parseFloat(stats.total_spent) + (daily_burn_rate * daysRemaining);
        }
      }
    }
    
    // Get expense trend by month
    const monthlyTrend = await db.query(`
      SELECT 
        DATE_TRUNC('month', expense_date) as month,
        SUM(amount) as total,
        COUNT(*) as count
      FROM expenses
      WHERE project_id = $1
      GROUP BY DATE_TRUNC('month', expense_date)
      ORDER BY month
    `, [id]);
    
    // Analyze variance
    const variance_amount = parseFloat(stats.budget_deviation || 0);
    const variance_percentage = parseFloat(stats.spent_percentage || 0) - 100;
    
    // Risk assessment
    let risk_level = 'low';
    let risk_message = 'Project is within budget';
    
    const spentPct = parseFloat(stats.spent_percentage || 0);
    if (spentPct >= 100) {
      risk_level = 'critical';
      risk_message = 'Budget exceeded! Immediate action required';
    } else if (spentPct >= 90) {
      risk_level = 'high';
      risk_message = 'Budget almost exhausted, monitor closely';
    } else if (spentPct >= 75) {
      risk_level = 'medium';
      risk_message = 'Approaching budget limit';
    }
    
    res.json({
      summary: {
        deal_amount: stats.deal_amount,
        budget_amount: stats.budget_amount,
        total_spent: stats.total_spent,
        remaining_budget: stats.remaining,
        spent_percentage: stats.spent_percentage,
        profit: stats.profit,
        profit_margin: stats.profit_margin,
      },
      variance: {
        amount: variance_amount,
        percentage: variance_percentage,
      },
      forecast: {
        daily_burn_rate: Math.round(daily_burn_rate * 100) / 100,
        estimated_completion_date,
        projected_total_cost: projected_total_cost ? Math.round(projected_total_cost * 100) / 100 : null,
        days_of_budget_remaining: daily_burn_rate > 0 ? Math.ceil(parseFloat(stats.remaining) / daily_burn_rate) : null,
      },
      risk: {
        level: risk_level,
        message: risk_message,
      },
      trends: {
        monthly: monthlyTrend.rows,
        timeline: expenseTimeline.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
