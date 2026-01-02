const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER || 'pbk_admin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'pbk_crm',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function runMigrations() {
  console.log('🚀 Running database migrations...\n');
  
  const migrationsDir = path.join(__dirname, 'database/migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('❌ Migrations directory not found');
    return;
  }
  
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  
  for (const file of files) {
    try {
      console.log(`📝 Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      console.log(`✅ ${file} completed\n`);
    } catch (error) {
      console.error(`❌ Error in ${file}:`, error.message);
    }
  }
  
  await pool.end();
  console.log('🎉 All migrations completed!');
}

runMigrations().catch(console.error);
