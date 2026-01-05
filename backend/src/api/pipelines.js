const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// GET /api/pipelines - Get all pipelines with stages
router.get('/', authenticateToken, cacheMiddleware(600), async (req, res) => {
  try {
    const pipelinesResult = await db.query(
      `SELECT id, name, description, color, is_active, sort_order, created_at
       FROM pipelines WHERE is_active = true ORDER BY sort_order`
    );
    
    // Get stages for each pipeline
    const pipelines = await Promise.all(
      pipelinesResult.rows.map(async (pipeline) => {
        const stagesResult = await db.query(
          `SELECT id, name, description, color, sort_order, is_final, slug, default_probability
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
      `SELECT id, name, description, color, sort_order, is_final, slug, default_probability
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

// POST /api/pipelines - Create new pipeline with stages
router.post('/', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    const { name, description, stages } = req.body;
    
    if (!name || !stages || !Array.isArray(stages) || stages.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and stages are required' 
      });
    }

    // Create pipeline
    const pipelineResult = await client.query(
      `INSERT INTO pipelines (name, description, is_active, sort_order)
       VALUES ($1, $2, true, 0)
       RETURNING id, name, description, color, is_active, sort_order, created_at`,
      [name, description || '']
    );
    
    const pipeline = pipelineResult.rows[0];
    
    // Create stages
    const createdStages = [];
    for (const stage of stages) {
      const stageResult = await client.query(
        `INSERT INTO pipeline_stages (
          pipeline_id, name, description, color, sort_order, is_final, 
          slug, default_probability
        )
        VALUES ($1, $2, $3, $4, $5, false, $6, $7)
        RETURNING id, name, description, color, sort_order, is_final, slug, default_probability`,
        [
          pipeline.id,
          stage.name,
          stage.description || null,
          stage.color || '#3B82F6',
          stage.sort_order,
          stage.name.toLowerCase().replace(/\s+/g, '_'),
          stage.default_probability || 50
        ]
      );
      createdStages.push(stageResult.rows[0]);
    }
    
    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      data: { ...pipeline, stages: createdStages }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating pipeline:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
