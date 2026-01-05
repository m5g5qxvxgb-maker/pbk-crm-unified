const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

router.get('/metrics', authenticateToken, cacheMiddleware(300), async (req, res) => {
  try {
    // Count leads
    const leadsResult = await db.query('SELECT COUNT(*) as count FROM leads');
    const clientsResult = await db.query('SELECT COUNT(*) as count FROM clients');
    const callsResult = await db.query('SELECT COUNT(*) as count FROM calls');
    const pipelinesResult = await db.query('SELECT COUNT(*) as count FROM pipelines');
    
    res.json({
      success: true,
      data: {
        leads: parseInt(leadsResult.rows[0].count),
        clients: parseInt(clientsResult.rows[0].count),
        calls: parseInt(callsResult.rows[0].count),
        pipelines: parseInt(pipelinesResult.rows[0].count),
        revenue: 0 // TODO: Calculate from deals
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/activities', authenticateToken, cacheMiddleware(120), async (req, res) => {
  try {
    const activities = [];
    
    // Recent leads/deals
    const leads = await db.query(
      `SELECT l.id, l.title, l.value, l.created_at, 
              ps.name as stage_name, u.first_name, u.last_name
       FROM leads l 
       LEFT JOIN pipeline_stages ps ON l.stage_id = ps.id
       LEFT JOIN users u ON l.assigned_to = u.id
       ORDER BY l.created_at DESC LIMIT 5`
    );
    
    leads.rows.forEach(lead => {
      activities.push({
        type: 'lead',
        title: lead.title || 'New Lead',
        description: `${lead.stage_name || 'New'} • ${lead.value ? lead.value + ' PLN' : 'No value'}`,
        time: formatTimeAgo(lead.created_at),
        metadata: lead.first_name ? `Assigned to ${lead.first_name} ${lead.last_name}` : null
      });
    });

    // Recent tasks
    const tasks = await db.query(
      `SELECT t.id, t.title, t.status, t.priority, t.created_at,
              u.first_name, u.last_name
       FROM tasks t
       LEFT JOIN users u ON t.created_by = u.id
       ORDER BY t.created_at DESC LIMIT 3`
    );

    tasks.rows.forEach(task => {
      activities.push({
        type: 'task',
        title: task.title,
        description: `${task.status} • Priority: ${task.priority}`,
        time: formatTimeAgo(task.created_at),
        metadata: task.first_name ? `Created by ${task.first_name} ${task.last_name}` : null
      });
    });

    // Sort by time
    activities.sort((a, b) => {
      // Simple sort by parsing time ago strings (not perfect but works)
      return 0; // Keep creation order for now
    });
    
    res.json({
      success: true,
      data: activities.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  
  return Math.floor(seconds) + ' seconds ago';
}

module.exports = router;
