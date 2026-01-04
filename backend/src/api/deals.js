const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * Deals API - Compatibility Facade over Leads
 * Maps legacy "stage" string to pipeline_stages and uses leads table
 */

// Helper: Get default pipeline
async function getDefaultPipeline() {
  const result = await db.query(
    'SELECT id FROM pipelines WHERE is_active = true ORDER BY sort_order LIMIT 1'
  );
  return result.rows[0]?.id || null;
}

// Helper: Map stage string to stage_id
async function mapStageToId(stageString, pipelineId) {
  if (!pipelineId) return null;
  
  // Try exact slug match first
  let result = await db.query(
    'SELECT id FROM pipeline_stages WHERE pipeline_id = $1 AND slug = $2',
    [pipelineId, stageString]
  );
  
  if (result.rows.length > 0) return result.rows[0].id;
  
  // Fallback: case-insensitive name match
  result = await db.query(
    'SELECT id FROM pipeline_stages WHERE pipeline_id = $1 AND LOWER(name) = LOWER($2)',
    [pipelineId, stageString]
  );
  
  if (result.rows.length > 0) return result.rows[0].id;
  
  // Ultimate fallback: first stage
  result = await db.query(
    'SELECT id FROM pipeline_stages WHERE pipeline_id = $1 ORDER BY sort_order LIMIT 1',
    [pipelineId]
  );
  
  return result.rows[0]?.id || null;
}

// Helper: Map lead to deal format
function mapLeadToDeal(lead) {
  return {
    id: lead.id,
    title: lead.title,
    client_id: lead.client_id,
    client_name: lead.company_name || lead.client_name,
    value: lead.value,
    stage: lead.stage_slug || lead.stage_name || 'unknown',
    probability: lead.probability,
    expected_close_date: lead.expected_close_date,
    created_at: lead.created_at,
    updated_at: lead.updated_at,
    // Include extra fields for compatibility
    pipeline_id: lead.pipeline_id,
    stage_id: lead.stage_id,
    description: lead.description
  };
}

// Get all deals (→ leads)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        l.id, l.title, l.description, l.value, l.probability, l.expected_close_date,
        l.pipeline_id, l.stage_id, l.client_id, l.created_at, l.updated_at,
        c.company_name,
        ps.name as stage_name,
        ps.slug as stage_slug
      FROM leads l 
      LEFT JOIN clients c ON l.client_id = c.id
      LEFT JOIN pipeline_stages ps ON l.stage_id = ps.id
      ORDER BY l.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows.map(mapLeadToDeal)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get deal by ID (→ lead)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        l.id, l.title, l.description, l.value, l.probability, l.expected_close_date,
        l.pipeline_id, l.stage_id, l.client_id, l.created_at, l.updated_at,
        c.company_name,
        ps.name as stage_name,
        ps.slug as stage_slug
      FROM leads l
      LEFT JOIN clients c ON l.client_id = c.id
      LEFT JOIN pipeline_stages ps ON l.stage_id = ps.id
      WHERE l.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }
    
    res.json({
      success: true,
      data: mapLeadToDeal(result.rows[0])
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create deal (→ lead)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, client_id, value, stage, probability, expected_close_date, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    
    // Get default pipeline
    const pipelineId = await getDefaultPipeline();
    if (!pipelineId) {
      return res.status(500).json({ success: false, error: 'No active pipeline found' });
    }
    
    // Map stage string to stage_id
    const stageId = await mapStageToId(stage || 'new', pipelineId);
    
    const result = await db.query(
      `INSERT INTO leads 
       (title, client_id, value, pipeline_id, stage_id, probability, expected_close_date, description, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [title, client_id, value || 0, pipelineId, stageId, probability || 50, expected_close_date, description, req.user.id]
    );
    
    // Fetch full data with joins
    const fullResult = await db.query(`
      SELECT 
        l.*, c.company_name, ps.name as stage_name, ps.slug as stage_slug
      FROM leads l
      LEFT JOIN clients c ON l.client_id = c.id
      LEFT JOIN pipeline_stages ps ON l.stage_id = ps.id
      WHERE l.id = $1
    `, [result.rows[0].id]);
    
    // Log activity
    await db.query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, description, user_id)
       VALUES ('lead', $1, 'created', $2, $3)`,
      [result.rows[0].id, `Deal created: ${title}`, req.user.id]
    );
    
    res.json({
      success: true,
      data: mapLeadToDeal(fullResult.rows[0])
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update deal (→ lead)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, client_id, value, stage, probability, expected_close_date, description } = req.body;
    
    // If stage is being updated, map it
    let stageId = undefined;
    if (stage) {
      // Get lead's pipeline
      const leadResult = await db.query('SELECT pipeline_id FROM leads WHERE id = $1', [req.params.id]);
      if (leadResult.rows.length > 0) {
        stageId = await mapStageToId(stage, leadResult.rows[0].pipeline_id);
      }
    }
    
    const result = await db.query(
      `UPDATE leads 
       SET title = COALESCE($1, title),
           client_id = COALESCE($2, client_id),
           value = COALESCE($3, value),
           stage_id = COALESCE($4, stage_id),
           probability = COALESCE($5, probability),
           expected_close_date = COALESCE($6, expected_close_date),
           description = COALESCE($7, description),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [title, client_id, value, stageId, probability, expected_close_date, description, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }
    
    // Fetch full data
    const fullResult = await db.query(`
      SELECT 
        l.*, c.company_name, ps.name as stage_name, ps.slug as stage_slug
      FROM leads l
      LEFT JOIN clients c ON l.client_id = c.id
      LEFT JOIN pipeline_stages ps ON l.stage_id = ps.id
      WHERE l.id = $1
    `, [req.params.id]);
    
    // Log activity
    await db.query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, description, user_id)
       VALUES ('lead', $1, 'updated', 'Deal updated', $2)`,
      [req.params.id, req.user.id]
    );
    
    res.json({
      success: true,
      data: mapLeadToDeal(fullResult.rows[0])
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete deal (→ lead)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM leads WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }
    
    // Log activity
    await db.query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, description, user_id)
       VALUES ('lead', $1, 'deleted', 'Deal deleted', $2)`,
      [req.params.id, req.user.id]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
