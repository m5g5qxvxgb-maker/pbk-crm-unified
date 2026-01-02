const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const bcrypt = require('bcrypt');
const { pool } = require('./db');

async function seed() {
  try {
    console.log('🌱 Seeding database...');
    
    // Create default admin user
    const password_hash = await bcrypt.hash('admin123', 10);
    
    await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, can_create_calls, can_approve_calls)
       VALUES ($1, $2, $3, $4, $5, true, true, true)
       ON CONFLICT (email) DO NOTHING`,
      ['admin@pbkconstruction.net', password_hash, 'Admin', 'User', 'admin']
    );
    
    console.log('✅ Default admin user created: admin@pbkconstruction.net / admin123');
    
    // Create default pipelines if they don't exist
    const pipelineResult = await pool.query(
      `INSERT INTO pipelines (name, description, color)
       VALUES ('Sales Pipeline', 'Основная воронка продаж', '#3B82F6')
       ON CONFLICT DO NOTHING
       RETURNING id`
    );
    
    if (pipelineResult.rows.length > 0) {
      const pipelineId = pipelineResult.rows[0].id;
      
      // Create stages
      const stages = [
        ['New Lead', 0, false],
        ['Contacted', 1, false],
        ['Qualified', 2, false],
        ['Proposal Sent', 3, false],
        ['Negotiation', 4, false],
        ['Won', 5, true],
        ['Lost', 6, true]
      ];
      
      for (const [name, sort_order, is_final] of stages) {
        await pool.query(
          `INSERT INTO pipeline_stages (pipeline_id, name, sort_order, is_final)
           VALUES ($1, $2, $3, $4)`,
          [pipelineId, name, sort_order, is_final]
        );
      }
      
      console.log('✅ Default pipeline created with stages');
    }
    
    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
