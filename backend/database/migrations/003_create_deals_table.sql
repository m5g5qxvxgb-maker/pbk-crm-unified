-- Create deals table for Pipeline
CREATE TABLE IF NOT EXISTS deals (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  client_id INTEGER,
  client VARCHAR(255),
  value DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  stage VARCHAR(50) DEFAULT 'lead',
  probability INTEGER DEFAULT 30,
  expected_close_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_client_id ON deals(client_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC);
