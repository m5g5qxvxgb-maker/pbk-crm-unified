-- Migration: Add Retell AI and Agent System tables
-- Date: 2025-12-30

-- Add retell_call_id to calls table
ALTER TABLE calls ADD COLUMN IF NOT EXISTS retell_call_id VARCHAR(255);
ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create index for retell_call_id
CREATE INDEX IF NOT EXISTS idx_calls_retell_call_id ON calls(retell_call_id);

-- Add source tracking to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_id VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_call_id VARCHAR(255);

-- Create notes table if not exists
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_lead_id ON notes(lead_id);

-- Create agent_interactions table
CREATE TABLE IF NOT EXISTS agent_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id VARCHAR(50) NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  response TEXT,
  source VARCHAR(50) DEFAULT 'crm',
  user_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_interactions_agent_id ON agent_interactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_lead_id ON agent_interactions(lead_id);

-- Create offerteo_orders table
CREATE TABLE IF NOT EXISTS offerteo_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(255) UNIQUE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  service_type VARCHAR(255),
  description TEXT,
  budget VARCHAR(100),
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  proposal_sent BOOLEAN DEFAULT FALSE,
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offerteo_orders_order_id ON offerteo_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_offerteo_orders_status ON offerteo_orders(status);

-- Add retell integration settings
INSERT INTO system_settings (key, value, description, updated_at)
VALUES 
  ('retell_api_key', '""'::jsonb, 'Retell AI API Key', NOW()),
  ('retell_agent_id', '""'::jsonb, 'Retell AI Agent ID', NOW()),
  ('retell_phone_number', '""'::jsonb, 'Retell AI Phone Number', NOW()),
  ('agent_manager_url', '"http://localhost:8892"'::jsonb, 'TWM Agent Manager URL', NOW()),
  ('offerteo_api_key', '""'::jsonb, 'Offerteo API Key', NOW()),
  ('offerteo_email', '""'::jsonb, 'Offerteo Email', NOW())
ON CONFLICT (key) DO NOTHING;

-- Update leads table to support more sources
ALTER TABLE leads ALTER COLUMN source TYPE VARCHAR(50);

COMMENT ON COLUMN calls.retell_call_id IS 'Retell AI call ID for voice calls';
COMMENT ON COLUMN leads.source_id IS 'External ID from source platform (Offerteo, etc)';
COMMENT ON TABLE agent_interactions IS 'Interactions with TWM AI agents';
COMMENT ON TABLE offerteo_orders IS 'Orders from Offerteo platform';
