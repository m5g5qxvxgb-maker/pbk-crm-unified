const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const proposalsAIService = require('../services/ai/proposals-ai-service');
const logger = require('../utils/logger');

/**
 * GET /api/proposals
 * Get all proposals
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, client_id } = req.query;
    
    let query = `
      SELECT p.id, p.title, p.status, p.created_at, p.sent_at, p.sent_via,
             c.company_name as client_name, c.id as client_id
      FROM ai_proposals p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE 1=1`;
    
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND p.status = $${paramIndex++}`;
      params.push(status);
    }

    if (client_id) {
      query += ` AND p.client_id = $${paramIndex++}`;
      params.push(client_id);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/proposals/:id
 * Get proposal by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, c.company_name as client_name, c.contact_person, c.email
       FROM ai_proposals p
       LEFT JOIN clients c ON p.client_id = c.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/proposals
 * Create new proposal
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { client_id, lead_id, title, input_data, template_used } = req.body;

    const result = await db.query(
      `INSERT INTO ai_proposals (client_id, lead_id, title, input_data, template_used, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [client_id, lead_id, title, JSON.stringify(input_data || {}), template_used || 'default', 'draft', req.user.id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/proposals/:id
 * Update proposal
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, status, generated_content, sent_via } = req.body;

    const result = await db.query(
      `UPDATE ai_proposals 
       SET title = COALESCE($1, title),
           status = COALESCE($2, status),
           generated_content = COALESCE($3, generated_content),
           sent_via = COALESCE($4, sent_via),
           sent_at = CASE WHEN $2 = 'sent' THEN NOW() ELSE sent_at END
       WHERE id = $5
       RETURNING *`,
      [title, status, generated_content, sent_via, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/proposals/:id
 * Delete proposal
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM ai_proposals WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    res.json({ success: true, message: 'Proposal deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/proposals/generate
 * Generate new proposal using AI
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const {
      client_id,
      lead_id,
      clientName,
      clientAddress,
      apartmentInfo,
      servicesNeeded,
      budget,
      additionalNotes,
    } = req.body;

    // Walidacja wymaganych pól
    if (!clientName) {
      return res.status(400).json({
        success: false,
        error: 'Client name is required',
      });
    }

    // Przygotowanie danych do AI
    const proposalData = {
      clientName,
      clientAddress,
      apartmentInfo,
      servicesNeeded,
      budget,
      additionalNotes,
    };

    // Jeśli podano lead_id, pobierz dodatkowe dane z leadu
    if (lead_id) {
      const leadResult = await db.query(
        'SELECT title, description, value, custom_fields FROM leads WHERE id = $1',
        [lead_id]
      );

      if (leadResult.rows.length > 0) {
        const lead = leadResult.rows[0];
        proposalData.leadDescription = lead.description;
        if (!budget && lead.value) {
          proposalData.budget = lead.value;
        }
      }
    }

    logger.info('Generating AI proposal', {
      userId: req.user.id,
      clientName,
      leadId: lead_id,
    });

    // Generowanie oferty przez AI
    const aiResult = await proposalsAIService.generateProposal(proposalData);

    if (!aiResult.success) {
      return res.status(500).json({
        success: false,
        error: aiResult.error,
        message: aiResult.fallbackMessage,
      });
    }

    // Zapisanie wygenerowanej oferty w bazie
    const title = `Oferta dla ${clientName} - ${new Date().toLocaleDateString('pl-PL')}`;
    
    const insertResult = await db.query(
      `INSERT INTO ai_proposals (
        client_id, lead_id, title, input_data, generated_content,
        template_used, openai_model, tokens_used, status, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        client_id || null,
        lead_id || null,
        title,
        JSON.stringify(proposalData),
        aiResult.content,
        'ai-generated',
        aiResult.usage.model,
        aiResult.usage.tokens,
        'draft',
        req.user.id,
      ]
    );

    logger.info('AI proposal created successfully', {
      proposalId: insertResult.rows[0].id,
      tokensUsed: aiResult.usage.tokens,
    });

    res.json({
      success: true,
      data: insertResult.rows[0],
      usage: aiResult.usage,
    });
  } catch (error) {
    logger.error('Error generating proposal', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/proposals/:id/regenerate
 * Regenerate proposal with user feedback
 */
router.post('/:id/regenerate', authenticateToken, async (req, res) => {
  try {
    const { feedback } = req.body;

    if (!feedback) {
      return res.status(400).json({
        success: false,
        error: 'Feedback is required for regeneration',
      });
    }

    // Pobranie oryginalnej oferty
    const proposalResult = await db.query(
      'SELECT * FROM ai_proposals WHERE id = $1',
      [req.params.id]
    );

    if (proposalResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    const proposal = proposalResult.rows[0];

    logger.info('Regenerating AI proposal', {
      proposalId: req.params.id,
      userId: req.user.id,
    });

    // Regeneracja przez AI
    const aiResult = await proposalsAIService.regenerateProposal(
      proposal.generated_content,
      feedback
    );

    if (!aiResult.success) {
      return res.status(500).json({
        success: false,
        error: aiResult.error,
      });
    }

    // Aktualizacja oferty
    const updateResult = await db.query(
      `UPDATE ai_proposals 
       SET generated_content = $1,
           tokens_used = tokens_used + $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [aiResult.content, aiResult.usage.tokens, req.params.id]
    );

    logger.info('AI proposal regenerated successfully', {
      proposalId: req.params.id,
      tokensUsed: aiResult.usage.tokens,
    });

    res.json({
      success: true,
      data: updateResult.rows[0],
      usage: aiResult.usage,
    });
  } catch (error) {
    logger.error('Error regenerating proposal', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/proposals/services/available
 * Get available services for proposal generation
 */
router.get('/services/available', authenticateToken, async (req, res) => {
  try {
    const services = proposalsAIService.getAvailableServices();
    
    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
