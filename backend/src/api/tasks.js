const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * Tasks API - To-dos for leads, clients, projects
 */

// Get all tasks with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      status, priority, assigned_to, created_by,
      lead_id, client_id, project_id,
      overdue, limit = 50, offset = 0 
    } = req.query;
    
    let query = `
      SELECT 
        t.*,
        u_assigned.first_name || ' ' || u_assigned.last_name AS assigned_to_name,
        u_created.first_name || ' ' || u_created.last_name AS created_by_name,
        l.title AS lead_title,
        c.company_name AS client_name
      FROM tasks t
      LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
      LEFT JOIN users u_created ON t.created_by = u_created.id
      LEFT JOIN leads l ON t.lead_id = l.id
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND t.status = $${paramIndex++}`;
      params.push(status);
    }
    
    if (priority) {
      query += ` AND t.priority = $${paramIndex++}`;
      params.push(priority);
    }
    
    if (assigned_to) {
      query += ` AND t.assigned_to = $${paramIndex++}`;
      params.push(assigned_to);
    }
    
    if (created_by) {
      query += ` AND t.created_by = $${paramIndex++}`;
      params.push(created_by);
    }
    
    if (lead_id) {
      query += ` AND t.lead_id = $${paramIndex++}`;
      params.push(lead_id);
    }
    
    if (client_id) {
      query += ` AND t.client_id = $${paramIndex++}`;
      params.push(client_id);
    }
    
    if (project_id) {
      query += ` AND t.project_id = $${paramIndex++}`;
      params.push(project_id);
    }
    
    if (overdue === 'true') {
      query += ` AND t.status NOT IN ('completed', 'cancelled') AND t.due_date < NOW()`;
    }
    
    query += ` ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC`;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    res.json({ 
      success: true, 
      tasks: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: result.rows.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get task by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        t.*,
        u_assigned.first_name || ' ' || u_assigned.last_name AS assigned_to_name,
        u_created.first_name || ' ' || u_created.last_name AS created_by_name,
        l.title AS lead_title,
        c.company_name AS client_name
      FROM tasks t
      LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
      LEFT JOIN users u_created ON t.created_by = u_created.id
      LEFT JOIN leads l ON t.lead_id = l.id
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title, description, status, priority, due_date,
      lead_id, client_id, project_id, assigned_to, tags, metadata
    } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    
    const result = await db.query(
      `INSERT INTO tasks 
       (title, description, status, priority, due_date, lead_id, client_id, project_id, 
        assigned_to, created_by, tags, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        title, description, status || 'pending', priority || 'medium', due_date,
        lead_id, client_id, project_id, assigned_to, req.user.id,
        tags, metadata ? JSON.stringify(metadata) : null
      ]
    );
    
    // Log activity
    const entity_type = lead_id ? 'lead' : client_id ? 'client' : 'task';
    const entity_id = lead_id || client_id || result.rows[0].id;
    
    await db.query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, description, user_id)
       VALUES ($1, $2, 'task_created', $3, $4)`,
      [entity_type, entity_id, `Task created: ${title}`, req.user.id]
    );
    
    // Fetch full data
    const fullResult = await db.query(`
      SELECT 
        t.*,
        u_assigned.first_name || ' ' || u_assigned.last_name AS assigned_to_name,
        u_created.first_name || ' ' || u_created.last_name AS created_by_name
      FROM tasks t
      LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
      LEFT JOIN users u_created ON t.created_by = u_created.id
      WHERE t.id = $1
    `, [result.rows[0].id]);
    
    res.json({ success: true, data: fullResult.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      title, description, status, priority, due_date,
      lead_id, client_id, project_id, assigned_to, tags, metadata
    } = req.body;
    
    // Auto-set completed_at when marking as completed
    let completed_at = undefined;
    if (status === 'completed') {
      completed_at = new Date();
    } else if (status && status !== 'completed') {
      completed_at = null;
    }
    
    const result = await db.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           due_date = COALESCE($5, due_date),
           lead_id = COALESCE($6, lead_id),
           client_id = COALESCE($7, client_id),
           project_id = COALESCE($8, project_id),
           assigned_to = COALESCE($9, assigned_to),
           tags = COALESCE($10, tags),
           metadata = COALESCE($11, metadata),
           completed_at = COALESCE($12, completed_at),
           updated_at = NOW()
       WHERE id = $13
       RETURNING *`,
      [
        title, description, status, priority, due_date,
        lead_id, client_id, project_id, assigned_to, tags,
        metadata ? JSON.stringify(metadata) : undefined,
        completed_at,
        req.params.id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    
    // Log activity
    await db.query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, description, user_id)
       VALUES ('task', $1, 'task_updated', 'Task updated', $2)`,
      [req.params.id, req.user.id]
    );
    
    // Fetch full data
    const fullResult = await db.query(`
      SELECT 
        t.*,
        u_assigned.first_name || ' ' || u_assigned.last_name AS assigned_to_name,
        u_created.first_name || ' ' || u_created.last_name AS created_by_name
      FROM tasks t
      LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
      LEFT JOIN users u_created ON t.created_by = u_created.id
      WHERE t.id = $1
    `, [req.params.id]);
    
    res.json({ success: true, data: fullResult.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk update status
router.post('/bulk/status', authenticateToken, async (req, res) => {
  try {
    const { task_ids, status } = req.body;
    
    if (!task_ids || !Array.isArray(task_ids) || task_ids.length === 0) {
      return res.status(400).json({ success: false, error: 'task_ids array is required' });
    }
    
    if (!status) {
      return res.status(400).json({ success: false, error: 'status is required' });
    }
    
    const completed_at = status === 'completed' ? new Date() : null;
    
    const result = await db.query(
      `UPDATE tasks 
       SET status = $1, completed_at = $2, updated_at = NOW()
       WHERE id = ANY($3::uuid[])
       RETURNING *`,
      [status, completed_at, task_ids]
    );
    
    res.json({ 
      success: true, 
      data: result.rows,
      updated_count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
