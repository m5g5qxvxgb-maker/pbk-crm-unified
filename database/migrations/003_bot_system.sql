-- Migration: Bot System Tables
-- Created: 2024-12-21

CREATE TABLE IF NOT EXISTS bot_conversations (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(20) NOT NULL,
  platform_user_id VARCHAR(255) NOT NULL,
  platform_username VARCHAR(255),
  lead_id INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(platform, platform_user_id)
);

CREATE TABLE IF NOT EXISTS bot_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL,
  direction VARCHAR(10) NOT NULL,
  message_text TEXT,
  ai_response TEXT,
  ai_intent VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bot_settings (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(20) UNIQUE NOT NULL,
  api_token TEXT,
  is_active BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_platform ON bot_conversations(platform);
CREATE INDEX idx_messages_conversation ON bot_messages(conversation_id);

INSERT INTO bot_settings (platform, is_active) 
VALUES ('telegram', false), ('whatsapp', false), ('instagram', false)
ON CONFLICT DO NOTHING;
