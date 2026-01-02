const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/pipelines - Get all pipelines with stages
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pipelinesResult = await db.query(
      `SELECT id, name, description, color, is_active, sort_order, created_at
       FROM pipelines WHERE is_active = true ORDER BY sort_order`
    );
    
    // Get stages for each pipeline
    const pipelines = await Promise.all(
      pipelinesResult.rows.map(async (pipeline) => {
        const stagesResult = await db.query(
          `SELECT id, name, description, color, sort_order, is_final
           FROM pipeline_stages 
           WHERE pipeline_id = $1 
           ORDER BY sort_order`,
          [pipeline.id]
        );
        return { ...pipeline, stages: stagesResult.rows };
      })
    );
    
    res.json({ success: true, data: pipelines });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/pipelines/:id/stages - Get stages for pipeline
router.get('/:id/stages', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, description, color, sort_order, is_final
       FROM pipeline_stages 
       WHERE pipeline_id = $1 
       ORDER BY sort_order`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
