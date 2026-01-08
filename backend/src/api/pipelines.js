const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { cacheMiddleware, clearCache, invalidateCache } = require('../middleware/cache');

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

    // Invalidate pipeline caches for this user and global
    await clearCache();
    
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

// PUT /api/pipeline-stages/:id - Update pipeline stage
router.put('/stages/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, color, default_probability, is_final, position } = req.body;

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name);
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(description);
    }
    
    if (color !== undefined) {
      updateFields.push(`color = $${paramIndex++}`);
      updateValues.push(color);
    }
    
    if (default_probability !== undefined) {
      updateFields.push(`default_probability = $${paramIndex++}`);
      updateValues.push(default_probability);
    }
    
    if (is_final !== undefined) {
      updateFields.push(`is_final = $${paramIndex++}`);
      updateValues.push(is_final);
    }
    
    if (position !== undefined) {
      updateFields.push(`sort_order = $${paramIndex++}`);
      updateValues.push(position);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    updateValues.push(req.params.id);

    const result = await db.query(
      `UPDATE pipeline_stages 
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
       updateValues
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Stage not found' });
    }

    // Invalidate cache after stage update
    await invalidateCache('/api/pipelines');

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating stage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/pipelines/:id/stages - Create new stage in pipeline
router.post('/:id/stages', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    const pipeline_id = req.params.id;
    const { name, description, color, default_probability } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    
    // Verify pipeline exists
    const pipelineCheck = await client.query(
      'SELECT id FROM pipelines WHERE id = $1',
      [pipeline_id]
    );
    
    if (pipelineCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Pipeline not found' });
    }
    
    // Get max sort_order for this pipeline
    const sortResult = await client.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM pipeline_stages WHERE pipeline_id = $1',
      [pipeline_id]
    );
    const sort_order = sortResult.rows[0].next_order;
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    // Create stage
    const result = await client.query(
      `INSERT INTO pipeline_stages (
        pipeline_id, name, description, color, sort_order, is_final, 
        slug, default_probability
      )
      VALUES ($1, $2, $3, $4, $5, false, $6, $7)
      RETURNING *`,
      [
        pipeline_id,
        name,
        description || null,
        color || '#3B82F6',
        sort_order,
        slug,
        default_probability || 50
      ]
    );
    
    await client.query('COMMIT');
    
    // Invalidate cache after stage creation
    await clearCache();
    
    res.status(201).json({ 
      success: true, 
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating stage:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

// DELETE /api/pipelines/:id - Delete pipeline
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if there are leads in this pipeline
    const leadsCheck = await db.query(
      'SELECT COUNT(*) as count FROM leads WHERE pipeline_id = $1',
      [req.params.id]
    );

    if (parseInt(leadsCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Cannot delete pipeline with ${leadsCheck.rows[0].count} leads. Move or delete leads first.` 
      });
    }

    // Delete pipeline (stages will be cascade deleted if foreign key is set)
    const result = await db.query(
      'DELETE FROM pipelines WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Pipeline not found' });
    }

    await invalidateCache('/api/pipelines');
    
    res.json({ success: true, message: 'Pipeline deleted' });
  } catch (error) {
    console.error('Error deleting pipeline:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/pipeline-stages/:id - Delete pipeline stage
router.delete('/stages/:id', authenticateToken, async (req, res) => {
  try {
    // Check if there are leads in this stage
    const leadsCheck = await db.query(
      'SELECT COUNT(*) as count FROM leads WHERE stage_id = $1',
      [req.params.id]
    );

    if (parseInt(leadsCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Cannot delete stage with ${leadsCheck.rows[0].count} leads. Move leads to another stage first.` 
      });
    }

    const result = await db.query(
      'DELETE FROM pipeline_stages WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Stage not found' });
    }

    // Invalidate cache after stage deletion
    await clearCache();

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting stage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/stages/:id/position', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    const stageId = req.params.id;
    const { new_position } = req.body;
    
    if (new_position === undefined || new_position < 0) {
      return res.status(400).json({ success: false, error: 'Valid position required' });
    }
    
    const stageResult = await client.query(
      'SELECT pipeline_id, sort_order FROM pipeline_stages WHERE id = $1',
      [stageId]
    );
    
    if (stageResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Stage not found' });
    }
    
    const { pipeline_id, sort_order: old_position } = stageResult.rows[0];
    
    if (old_position === new_position) {
      await client.query('COMMIT');
      return res.json({ success: true, message: 'Position unchanged' });
    }
    
    if (old_position < new_position) {
      await client.query(
        `UPDATE pipeline_stages 
         SET sort_order = sort_order - 1
         WHERE pipeline_id = $1 
         AND sort_order > $2 
         AND sort_order <= $3`,
        [pipeline_id, old_position, new_position]
      );
    } else {
      await client.query(
        `UPDATE pipeline_stages 
         SET sort_order = sort_order + 1
         WHERE pipeline_id = $1 
         AND sort_order >= $2 
         AND sort_order < $3`,
        [pipeline_id, new_position, old_position]
      );
    }
    
    await client.query(
      'UPDATE pipeline_stages SET sort_order = $1 WHERE id = $2',
      [new_position, stageId]
    );
    
    await client.query('COMMIT');
    
    await invalidateCache('/api/pipelines');
    
    res.json({ success: true, message: 'Position updated' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating position:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
