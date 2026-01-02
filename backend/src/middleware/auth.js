const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Verify JWT token and attach user to request
 */
const authenticateToken = async (req, res, next) => {
  // Skip authentication for OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        logger.warn(`Invalid token attempt: ${err.message}`);
        return res.status(403).json({ 
          success: false, 
          error: 'Invalid or expired token' 
        });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Check if user has required role
 */
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.id} with role ${req.user.role}`);
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }

    next();
  };
};

/**
 * Check specific permission
 */
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Check if user has the specific permission
    if (!req.user[permission]) {
      logger.warn(`Permission denied: ${permission} for user ${req.user.id}`);
      return res.status(403).json({ 
        success: false, 
        error: `Permission denied: ${permission}` 
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
  checkPermission
};
