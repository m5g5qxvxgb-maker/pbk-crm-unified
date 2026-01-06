/**
 * Internal API for Telegram Bot (no auth required - localhost only)
 */
const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const logger = require('../utils/logger');

// Middleware: Only allow from localhost/docker network
router.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('172.') || ip.startsWith('::ffff:172.')) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied' });
  }
});

// Get leads
router.get('/leads', async (req, res) => {
  try {
    const { limit = 10, stage } = req.query;
    
    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];
    
    if (stage) {
      query += ' AND stage_id IN (SELECT id FROM pipeline_stages WHERE name ILIKE $1)';
      params.push(`%${stage}%`);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Bot API - Error fetching leads:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get dashboard metrics
router.get('/dashboard/metrics', async (req, res) => {
  try {
    const leads = await pool.query('SELECT COUNT(*) FROM leads');
    const clients = await pool.query('SELECT COUNT(*) FROM clients');
    const calls = await pool.query('SELECT COUNT(*) FROM calls');
    
    res.json({
      success: true,
      data: {
        leads: parseInt(leads.rows[0].count),
        clients: parseInt(clients.rows[0].count),
        calls: parseInt(calls.rows[0].count),
        tasks: 0,
        deals: 0,
        dealsValue: 0
      }
    });
  } catch (error) {
    logger.error('Bot API - Error fetching metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
