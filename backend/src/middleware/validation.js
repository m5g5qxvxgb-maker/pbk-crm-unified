const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Validation schemas for API routes
 */
const schemas = {
  // Auth schemas
  register: Joi.object({
    email: Joi.string().email().required().max(255),
    password: Joi.string().min(8).max(100).required(),
    first_name: Joi.string().max(100).optional(),
    last_name: Joi.string().max(100).optional(),
    role: Joi.string().valid('admin', 'manager', 'viewer').optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required().max(255),
    password: Joi.string().required().max(100)
  }),

  // User schemas
  createUser: Joi.object({
    email: Joi.string().email().required().max(255),
    password: Joi.string().min(8).max(100).optional(),
    first_name: Joi.string().max(100).optional(),
    last_name: Joi.string().max(100).optional(),
    role: Joi.string().valid('admin', 'manager', 'viewer').optional(),
    phone: Joi.string().max(20).optional(),
    avatar_url: Joi.string().uri().max(500).optional()
  }),

  updateUser: Joi.object({
    email: Joi.string().email().max(255).optional(),
    first_name: Joi.string().max(100).optional(),
    last_name: Joi.string().max(100).optional(),
    role: Joi.string().valid('admin', 'manager', 'viewer').optional(),
    phone: Joi.string().max(20).optional(),
    avatar_url: Joi.string().uri().max(500).optional(),
    password: Joi.string().min(8).max(100).optional()
  }),

  // Client schemas
  createClient: Joi.object({
    name: Joi.string().max(255).required(),
    email: Joi.string().email().max(255).optional().allow(null, ''),
    phone: Joi.string().max(20).optional().allow(null, ''),
    company: Joi.string().max(255).optional().allow(null, ''),
    address: Joi.string().max(500).optional().allow(null, ''),
    notes: Joi.string().max(2000).optional().allow(null, ''),
    status: Joi.string().valid('active', 'inactive', 'prospect').optional()
  }),

  updateClient: Joi.object({
    name: Joi.string().max(255).optional(),
    email: Joi.string().email().max(255).optional().allow(null, ''),
    phone: Joi.string().max(20).optional().allow(null, ''),
    company: Joi.string().max(255).optional().allow(null, ''),
    address: Joi.string().max(500).optional().allow(null, ''),
    notes: Joi.string().max(2000).optional().allow(null, ''),
    status: Joi.string().valid('active', 'inactive', 'prospect').optional()
  }),

  // Lead schemas
  createLead: Joi.object({
    title: Joi.string().max(255).required(),
    description: Joi.string().max(2000).optional().allow(null, ''),
    value: Joi.number().min(0).max(999999999).optional().allow(null),
    client_id: Joi.number().integer().optional().allow(null),
    pipeline_id: Joi.number().integer().required(),
    stage_id: Joi.number().integer().required(),
    assigned_to: Joi.number().integer().optional().allow(null),
    status: Joi.string().valid('open', 'won', 'lost').optional(),
    source: Joi.string().max(100).optional().allow(null, ''),
    priority: Joi.string().valid('low', 'medium', 'high').optional()
  }),

  updateLead: Joi.object({
    title: Joi.string().max(255).optional(),
    description: Joi.string().max(2000).optional().allow(null, ''),
    value: Joi.number().min(0).max(999999999).optional().allow(null),
    client_id: Joi.number().integer().optional().allow(null),
    pipeline_id: Joi.number().integer().optional(),
    stage_id: Joi.number().integer().optional(),
    assigned_to: Joi.number().integer().optional().allow(null),
    status: Joi.string().valid('open', 'won', 'lost').optional(),
    source: Joi.string().max(100).optional().allow(null, ''),
    priority: Joi.string().valid('low', 'medium', 'high').optional()
  }),

  // Task schemas
  createTask: Joi.object({
    title: Joi.string().max(255).required(),
    description: Joi.string().max(2000).optional().allow(null, ''),
    due_date: Joi.date().iso().optional().allow(null),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').optional(),
    assigned_to: Joi.number().integer().optional().allow(null),
    lead_id: Joi.number().integer().optional().allow(null),
    client_id: Joi.number().integer().optional().allow(null)
  }),

  updateTask: Joi.object({
    title: Joi.string().max(255).optional(),
    description: Joi.string().max(2000).optional().allow(null, ''),
    due_date: Joi.date().iso().optional().allow(null),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').optional(),
    assigned_to: Joi.number().integer().optional().allow(null),
    lead_id: Joi.number().integer().optional().allow(null),
    client_id: Joi.number().integer().optional().allow(null)
  }),

  // Project schemas
  createProject: Joi.object({
    name: Joi.string().max(255).required(),
    description: Joi.string().max(2000).optional().allow(null, ''),
    client_id: Joi.number().integer().optional().allow(null),
    status: Joi.string().valid('planning', 'active', 'on_hold', 'completed', 'cancelled').optional(),
    start_date: Joi.date().iso().optional().allow(null),
    end_date: Joi.date().iso().optional().allow(null),
    budget: Joi.number().min(0).max(999999999).optional().allow(null),
    assigned_to: Joi.number().integer().optional().allow(null)
  }),

  updateProject: Joi.object({
    name: Joi.string().max(255).optional(),
    description: Joi.string().max(2000).optional().allow(null, ''),
    client_id: Joi.number().integer().optional().allow(null),
    status: Joi.string().valid('planning', 'active', 'on_hold', 'completed', 'cancelled').optional(),
    start_date: Joi.date().iso().optional().allow(null),
    end_date: Joi.date().iso().optional().allow(null),
    budget: Joi.number().min(0).max(999999999).optional().allow(null),
    assigned_to: Joi.number().integer().optional().allow(null)
  }),

  // Call schemas
  createCall: Joi.object({
    client_id: Joi.number().integer().optional().allow(null),
    lead_id: Joi.number().integer().optional().allow(null),
    agent_id: Joi.string().max(255).optional().allow(null, ''),
    call_id: Joi.string().max(255).optional().allow(null, ''),
    phone_number: Joi.string().max(20).optional().allow(null, ''),
    status: Joi.string().valid('completed', 'no_answer', 'busy', 'failed', 'scheduled').optional(),
    duration: Joi.number().integer().min(0).optional().allow(null),
    recording_url: Joi.string().uri().max(500).optional().allow(null, ''),
    transcript: Joi.string().max(10000).optional().allow(null, ''),
    summary: Joi.string().max(2000).optional().allow(null, ''),
    sentiment: Joi.string().valid('positive', 'neutral', 'negative').optional().allow(null, ''),
    notes: Joi.string().max(2000).optional().allow(null, '')
  }),

  // ID parameter validation
  idParam: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};

/**
 * Middleware factory for validating request data
 * @param {string} schemaName - Name of the schema to use
 * @param {string} property - Request property to validate ('body', 'params', 'query')
 */
const validate = (schemaName, property = 'body') => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      logger.error(`Validation schema '${schemaName}' not found`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }

    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn(`Validation failed for ${schemaName}:`, errors);

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    // Replace request property with validated/sanitized value
    req[property] = value;
    next();
  };
};

module.exports = {
  validate,
  schemas
};
