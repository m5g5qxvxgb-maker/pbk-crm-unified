const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/activities/:entityType/:entityId
 * Get activities for an entity with comments
 */
router.get('/:entityType/:entityId', authenticateToken, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    const query = `
      SELECT 
        a.id, a.entity_type, a.entity_id, a.activity_type, 
        a.description, a.metadata, a.created_at,
        u.first_name || ' ' || u.last_name as user_name,
        u.avatar_url as user_avatar,
        json_agg(
          json_build_object(
            'id', ac.id,
            'comment', ac.comment,
            'created_at', ac.created_at,
            'updated_at', ac.updated_at,
            'user_name', cu.first_name || ' ' || cu.last_name,
            'user_avatar', cu.avatar_url
          ) ORDER BY ac.created_at ASC
        ) FILTER (WHERE ac.id IS NOT NULL) as comments
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN activity_comments ac ON a.id = ac.activity_id
      LEFT JOIN users cu ON ac.user_id = cu.id
      WHERE a.entity_type = $1 AND a.entity_id = $2
      GROUP BY a.id, u.first_name, u.last_name, u.avatar_url
      ORDER BY a.created_at DESC
    `;
    
    const result = await db.query(query, [entityType, entityId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/activities/:activityId/comments
 * Add a comment to an activity
 */
router.post('/:activityId/comments', authenticateToken, async (req, res) => {
  try {
    const { activityId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;
    
    if (!comment || !comment.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Comment text is required' 
      });
    }
    
    const query = `
      INSERT INTO activity_comments (activity_id, user_id, comment)
      VALUES ($1, $2, $3)
      RETURNING 
        id, activity_id, comment, created_at, updated_at,
        (SELECT first_name || ' ' || last_name FROM users WHERE id = $2) as user_name,
        (SELECT avatar_url FROM users WHERE id = $2) as user_avatar
    `;
    
    const result = await db.query(query, [activityId, userId, comment.trim()]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * PUT /api/activities/comments/:commentId
 * Update a comment
 */
router.put('/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;
    
    if (!comment || !comment.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Comment text is required' 
      });
    }
    
    const query = `
      UPDATE activity_comments 
      SET comment = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
      RETURNING 
        id, activity_id, comment, created_at, updated_at,
        (SELECT first_name || ' ' || last_name FROM users WHERE id = $3) as user_name,
        (SELECT avatar_url FROM users WHERE id = $3) as user_avatar
    `;
    
    const result = await db.query(query, [comment.trim(), commentId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Comment not found or unauthorized' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * DELETE /api/activities/comments/:commentId
 * Delete a comment
 */
router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    
    const query = `
      DELETE FROM activity_comments 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    
    const result = await db.query(query, [commentId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Comment not found or unauthorized' 
      });
    }
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
