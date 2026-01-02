require('dotenv').config({ path: '../.env' });
const db = require('./src/database/db');

async function addTestData() {
  try {
    console.log('🌱 Adding test data...');

    // Check if we already have data
    const existingClients = await db.query('SELECT COUNT(*) FROM clients');
    if (parseInt(existingClients.rows[0].count) > 0) {
      console.log('✅ Test data already exists!');
      return;
    }

    // Get first user
    const userResult = await db.query('SELECT id FROM users LIMIT 1');
    const userId = userResult.rows[0]?.id;

    if (!userId) {
      console.error('❌ No users found. Please run seed first.');
      return;
    }

    // Add clients
    console.log('Adding clients...');
    const client1 = await db.query(
      `INSERT INTO clients (company_name, contact_person, email, phone, city, country, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      ['ABC Construction Ltd', 'John Smith', 'john@abcconstruction.com', '+1-555-0101', 'New York', 'USA', userId]
    );

    const client2 = await db.query(
      `INSERT INTO clients (company_name, contact_person, email, phone, city, country, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      ['XYZ Development Corp', 'Jane Doe', 'jane@xyzdev.com', '+1-555-0102', 'Los Angeles', 'USA', userId]
    );

    const client3 = await db.query(
      `INSERT INTO clients (company_name, contact_person, email, phone, city, country, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      ['Premium Builders Inc', 'Mike Johnson', 'mike@premiumbuilders.com', '+1-555-0103', 'Chicago', 'USA', userId]
    );

    // Get pipeline and stages
    const pipelineResult = await db.query('SELECT id FROM pipelines LIMIT 1');
    const pipelineId = pipelineResult.rows[0]?.id;

    const stagesResult = await db.query(
      'SELECT id, name FROM pipeline_stages WHERE pipeline_id = $1 ORDER BY sort_order',
      [pipelineId]
    );

    if (stagesResult.rows.length < 3) {
      console.error('❌ Not enough pipeline stages found');
      return;
    }

    // Add leads
    console.log('Adding leads...');
    await db.query(
      `INSERT INTO leads (pipeline_id, stage_id, client_id, title, description, value, currency, probability, source, created_by, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [pipelineId, stagesResult.rows[0].id, client1.rows[0].id, 
       'Office Renovation Project', 'Complete office renovation including interior design', 
       50000, 'USD', 60, 'Website', userId, userId]
    );

    await db.query(
      `INSERT INTO leads (pipeline_id, stage_id, client_id, title, description, value, currency, probability, source, created_by, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [pipelineId, stagesResult.rows[1].id, client2.rows[0].id, 
       'New Construction - Residential', 'Build 5 luxury apartments', 
       250000, 'USD', 75, 'Referral', userId, userId]
    );

    await db.query(
      `INSERT INTO leads (pipeline_id, stage_id, client_id, title, description, value, currency, probability, source, created_by, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [pipelineId, stagesResult.rows[2].id, client3.rows[0].id, 
       'Commercial Building Extension', 'Expand warehouse facility', 
       150000, 'USD', 80, 'Cold Call', userId, userId]
    );

    await db.query(
      `INSERT INTO leads (pipeline_id, stage_id, client_id, title, description, value, currency, probability, source, created_by, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [pipelineId, stagesResult.rows[0].id, client1.rows[0].id, 
       'Kitchen Remodeling', 'Modern kitchen upgrade for corporate cafeteria', 
       35000, 'USD', 50, 'Email', userId, userId]
    );

    // Add proposals
    console.log('Adding proposals...');
    await db.query(
      `INSERT INTO ai_proposals (client_id, lead_id, title, description, amount, currency, status, valid_until, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [client1.rows[0].id, null, 'Office Renovation Proposal', 
       'Detailed proposal for office renovation project', 52000, 'USD', 
       'sent', new Date(Date.now() + 30*24*60*60*1000), userId]
    );

    await db.query(
      `INSERT INTO ai_proposals (client_id, lead_id, title, description, amount, currency, status, valid_until, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [client2.rows[0].id, null, 'Residential Construction Proposal', 
       'Proposal for luxury apartment construction', 260000, 'USD', 
       'draft', new Date(Date.now() + 45*24*60*60*1000), userId]
    );

    // Add calls
    console.log('Adding calls...');
    await db.query(
      `INSERT INTO calls (client_id, phone_number, direction, status, duration, started_at, ended_at, summary, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [client1.rows[0].id, '+1-555-0101', 'outbound', 'completed', 420,
       new Date(Date.now() - 2*24*60*60*1000), new Date(Date.now() - 2*24*60*60*1000 + 420000),
       'Discussed project timeline and budget. Client is interested.', userId]
    );

    await db.query(
      `INSERT INTO calls (client_id, phone_number, direction, status, duration, started_at, ended_at, summary, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [client2.rows[0].id, '+1-555-0102', 'outbound', 'completed', 315,
       new Date(Date.now() - 1*24*60*60*1000), new Date(Date.now() - 1*24*60*60*1000 + 315000),
       'Follow-up call. Sent additional materials via email.', userId]
    );

    // Add emails
    console.log('Adding emails...');
    await db.query(
      `INSERT INTO email_messages (client_id, direction, from_email, to_email, subject, body_text, is_read, received_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [client1.rows[0].id, 'inbound', 'john@abcconstruction.com', 'admin@pbkconstruction.net',
       'Re: Office Renovation Inquiry', 'Thank you for the quick response. Looking forward to working together.',
       false, new Date(Date.now() - 6*60*60*1000)]
    );

    await db.query(
      `INSERT INTO email_messages (client_id, direction, from_email, to_email, subject, body_text, is_read, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [client2.rows[0].id, 'outbound', 'admin@pbkconstruction.net', 'jane@xyzdev.com',
       'Project Proposal - Residential Construction', 'Please find attached our detailed proposal for your review.',
       true, new Date(Date.now() - 12*60*60*1000)]
    );

    console.log('✅ Test data added successfully!');
    console.log('\nSummary:');
    console.log('- 3 clients');
    console.log('- 4 leads');
    console.log('- 2 proposals');
    console.log('- 2 calls');
    console.log('- 2 emails');

  } catch (error) {
    console.error('❌ Error adding test data:', error);
  } finally {
    process.exit();
  }
}

addTestData();
