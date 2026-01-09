const logger = require('../utils/logger');

// Simple in-memory cache as fallback if Redis is not available
class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.ttls = new Map();
  }

  async get(key) {
    // Check if key exists and not expired
    const ttl = this.ttls.get(key);
    if (ttl && ttl < Date.now()) {
      this.cache.delete(key);
      this.ttls.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  async set(key, value, ttlSeconds = 300) {
    this.cache.set(key, value);
    this.ttls.set(key, Date.now() + (ttlSeconds * 1000));
    
    // Auto-cleanup expired entries
    if (this.cache.size > 1000) {
      this.cleanup();
    }
  }

  async del(key) {
    this.cache.delete(key);
    this.ttls.delete(key);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, ttl] of this.ttls.entries()) {
      if (ttl < now) {
        this.cache.delete(key);
        this.ttls.delete(key);
      }
    }
  }
}

// Initialize cache
const cache = new SimpleCache();

/**
 * Cache middleware factory
 * @param {number} ttl - Time to live in seconds (default: 5 minutes)
 * @param {function} keyGenerator - Function to generate cache key from request
 */
const cacheMiddleware = (ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const key = keyGenerator 
        ? keyGenerator(req) 
        : `cache:${req.originalUrl || req.url}:${req.user?.id || 'anonymous'}`;

      // Try to get cached response
      const cachedResponse = await cache.get(key);
      
      if (cachedResponse) {
        logger.info(`Cache hit: ${key}`);
        return res.json(JSON.parse(cachedResponse));
      }

      // Store original json function
      const originalJson = res.json.bind(res);

      // Override json function to cache response
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(key, JSON.stringify(data), ttl)
            .catch(err => logger.error('Cache set error:', err));
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Pattern to match cache keys
 */
const invalidateCache = async (pattern) => {
  try {
    logger.info(`Cache invalidation requested for pattern: ${pattern}`);
    
    // Delete all keys matching the pattern
    const keysToDelete = [];
    for (const key of cache.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      cache.cache.delete(key);
      cache.ttls.delete(key);
    }
    
    logger.info(`Invalidated ${keysToDelete.length} cache entries for pattern: ${pattern}`);
  } catch (error) {
    logger.error('Cache invalidation error:', error);
  }
};

/**
 * Clear all cache
 */
const clearCache = async () => {
  try {
    cache.cache.clear();
    cache.ttls.clear();
    logger.info('All cache cleared');
  } catch (error) {
    logger.error('Cache clear error:', error);
  }
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  clearCache,
  cache
};
