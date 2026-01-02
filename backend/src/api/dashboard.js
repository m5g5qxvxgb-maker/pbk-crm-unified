const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    // Count leads
    const leadsResult = await db.query('SELECT COUNT(*) as count FROM leads');
    const clientsResult = await db.query('SELECT COUNT(*) as count FROM clients');
    const callsResult = await db.query('SELECT COUNT(*) as count FROM calls');
    const projectsResult = await db.query('SELECT COUNT(*) as count FROM projects');
    
    res.json({
      success: true,
      data: {
        leads: parseInt(leadsResult.rows[0].count),
        clients: parseInt(clientsResult.rows[0].count),
        calls: parseInt(callsResult.rows[0].count),
        projects: parseInt(projectsResult.rows[0].count),
        revenue: 0 // TODO: Calculate from projects
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/activities', authenticateToken, async (req, res) => {
  try {
    // Get recent activities from calls, meetings, etc
    const activities = [];
    
    // Recent calls
    const calls = await db.query(
      'SELECT c.*, l.name as lead_name FROM calls c LEFT JOIN leads l ON c.lead_id = l.id ORDER BY c.created_at DESC LIMIT 5'
    );
    
    calls.rows.forEach(call => {
      activities.push({
        type: 'call',
        title: 'Call with ' + (call.lead_name || 'Unknown'),
        description: call.status,
        time: formatTimeAgo(call.created_at),
        metadata: call.duration ? call.duration + ' seconds' : null
      });
    });
    
    res.json({
      success: true,
      data: activities
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
