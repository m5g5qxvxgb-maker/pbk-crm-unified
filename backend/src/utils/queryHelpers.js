const db = require('../database/db');
const logger = require('../utils/logger');

/**
 * Query optimization helper functions
 */

/**
 * Execute query with pagination
 * @param {string} baseQuery - Base SQL query
 * @param {Array} params - Query parameters
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @returns {Promise<{data: Array, total: number, page: number, totalPages: number}>}
 */
async function paginatedQuery(baseQuery, params = [], page = 1, limit = 20) {
  try {
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) AS count_query`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated data
    const paginatedQuery = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const result = await db.query(paginatedQuery, [...params, limit, offset]);
    
    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    logger.error('Paginated query error:', error);
    throw error;
  }
}

/**
 * Execute query with cursor-based pagination (more efficient for large datasets)
 * @param {string} baseQuery - Base SQL query
 * @param {Array} params - Query parameters  
 * @param {string} cursorColumn - Column to use for cursor
 * @param {any} cursor - Cursor value (last seen value)
 * @param {number} limit - Items per page
 * @returns {Promise<{data: Array, nextCursor: any, hasMore: boolean}>}
 */
async function cursorPaginatedQuery(baseQuery, params = [], cursorColumn = 'id', cursor = null, limit = 20) {
  try {
    let query = baseQuery;
    let queryParams = [...params];
    
    // Add cursor condition if provided
    if (cursor) {
      query += ` AND ${cursorColumn} > $${queryParams.length + 1}`;
      queryParams.push(cursor);
    }
    
    // Add ordering and limit
    query += ` ORDER BY ${cursorColumn} ASC LIMIT $${queryParams.length + 1}`;
    queryParams.push(limit + 1); // Fetch one extra to check if there are more
    
    const result = await db.query(query, queryParams);
    const hasMore = result.rows.length > limit;
    const data = hasMore ? result.rows.slice(0, -1) : result.rows;
    const nextCursor = hasMore ? data[data.length - 1][cursorColumn] : null;
    
    return {
      data,
      nextCursor,
      hasMore
    };
  } catch (error) {
    logger.error('Cursor paginated query error:', error);
    throw error;
  }
}

/**
 * Execute query with selected fields only (reduce data transfer)
 * @param {string} table - Table name
 * @param {Array<string>} fields - Fields to select
 * @param {string} whereClause - WHERE clause (without WHERE keyword)
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>}
 */
async function selectFields(table, fields = ['*'], whereClause = '', params = []) {
  try {
    const fieldList = fields.join(', ');
    let query = `SELECT ${fieldList} FROM ${table}`;
    
    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }
    
    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Select fields query error:', error);
    throw error;
  }
}

/**
 * Bulk insert with transaction
 * @param {string} table - Table name
 * @param {Array<Object>} records - Array of records to insert
 * @param {Array<string>} fields - Field names
 * @returns {Promise<Array>}
 */
async function bulkInsert(table, records, fields) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    const results = [];
    const valuesPlaceholder = fields.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${valuesPlaceholder}) RETURNING *`;
    
    for (const record of records) {
      const values = fields.map(field => record[field]);
      const result = await client.query(query, values);
      results.push(result.rows[0]);
    }
    
    await client.query('COMMIT');
    logger.info(`Bulk inserted ${results.length} records into ${table}`);
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Bulk insert error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Execute query with automatic retry on deadlock
 * @param {Function} queryFn - Function that executes the query
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<any>}
 */
async function queryWithRetry(queryFn, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error;
      
      // Check if it's a deadlock error
      if (error.code === '40P01' && attempt < maxRetries) {
        logger.warn(`Deadlock detected, retrying (${attempt}/${maxRetries})...`);
        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Batch process large result sets
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @param {number} batchSize - Batch size
 * @param {Function} processFn - Function to process each batch
 */
async function batchProcess(query, params, batchSize, processFn) {
  try {
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const batchQuery = `${query} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      const result = await db.query(batchQuery, [...params, batchSize, offset]);
      
      if (result.rows.length === 0) {
        hasMore = false;
        break;
      }
      
      await processFn(result.rows);
      offset += batchSize;
      
      if (result.rows.length < batchSize) {
        hasMore = false;
      }
    }
  } catch (error) {
    logger.error('Batch process error:', error);
    throw error;
  }
}

module.exports = {
  paginatedQuery,
  cursorPaginatedQuery,
  selectFields,
  bulkInsert,
  queryWithRetry,
  batchProcess
};
