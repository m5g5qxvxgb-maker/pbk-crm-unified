const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const fs = require('fs');
const { pool } = require('./db');

async function migrate() {
  try {
    console.log('🔄 Running database migrations...');
    
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    
    console.log('✅ Database migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
