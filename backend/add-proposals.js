require('dotenv').config({ path: '../.env' });
const db = require('./src/database/db');

async function addProposals() {
  try {
    const result = await db.query(`
      INSERT INTO ai_proposals (client_id, lead_id, title, input_data, status, created_by) 
      SELECT c.id, l.id, 'Proposal for ' || l.title, '{"type": "construction"}', 'draft', 
             (SELECT id FROM users LIMIT 1) 
      FROM clients c 
      LEFT JOIN leads l ON l.client_id = c.id 
      WHERE l.id IS NOT NULL 
      LIMIT 2
    `);
    console.log('✅ Proposals added:', result.rowCount);
  } catch (error) {
    console.log('Note:', error.message);
  }
  process.exit();
}

addProposals();
