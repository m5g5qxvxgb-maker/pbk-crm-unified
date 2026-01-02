-- PBK CRM Unified Database Schema
-- PostgreSQL Database

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enum Types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'sales', 'support', 'viewer');
CREATE TYPE call_status AS ENUM ('pending', 'approved', 'in_progress', 'completed', 'failed', 'cancelled');
CREATE TYPE call_request_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'completed');

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role DEFAULT 'viewer',
    phone VARCHAR(50),
    telegram_id BIGINT UNIQUE,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    can_create_calls BOOLEAN DEFAULT false,
    can_approve_calls BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pipelines (Воронки продаж)
CREATE TABLE pipelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pipeline Stages
CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7),
    sort_order INTEGER DEFAULT 0,
    automation_rules JSONB,
    is_final BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    notes TEXT,
    tags TEXT[],
    custom_fields JSONB,
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id UUID REFERENCES pipelines(id),
    stage_id UUID REFERENCES pipeline_stages(id),
    client_id UUID REFERENCES clients(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    value DECIMAL(12, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    probability INTEGER DEFAULT 50,
    expected_close_date DATE,
    source VARCHAR(100),
    tags TEXT[],
    custom_fields JSONB,
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

-- Call Requests
CREATE TABLE call_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id),
    client_id UUID REFERENCES clients(id),
    phone_number VARCHAR(50) NOT NULL,
    scheduled_time TIMESTAMP,
    purpose TEXT,
    additional_instructions TEXT,
    priority INTEGER DEFAULT 1,
    status call_request_status DEFAULT 'draft',
    created_by UUID REFERENCES users(id) NOT NULL,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calls
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_request_id UUID REFERENCES call_requests(id),
    lead_id UUID REFERENCES leads(id),
    client_id UUID REFERENCES clients(id),
    retell_call_id VARCHAR(255) UNIQUE,
    phone_number VARCHAR(50) NOT NULL,
    status call_status DEFAULT 'pending',
    direction VARCHAR(20) DEFAULT 'outbound',
    duration INTEGER,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    recording_url TEXT,
    transcript TEXT,
    transcript_language VARCHAR(10) DEFAULT 'en',
    translated_transcript JSONB,
    sentiment VARCHAR(20),
    summary TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Messages
CREATE TABLE email_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id VARCHAR(255) UNIQUE,
    thread_id VARCHAR(255),
    client_id UUID REFERENCES clients(id),
    lead_id UUID REFERENCES leads(id),
    direction VARCHAR(20) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),
    to_emails TEXT[] NOT NULL,
    cc_emails TEXT[],
    bcc_emails TEXT[],
    subject VARCHAR(500),
    body_text TEXT,
    body_html TEXT,
    attachments JSONB,
    is_read BOOLEAN DEFAULT false,
    sent_by UUID REFERENCES users(id),
    sent_at TIMESTAMP,
    received_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Proposals
CREATE TABLE ai_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id),
    client_id UUID REFERENCES clients(id),
    title VARCHAR(255),
    input_data JSONB,
    generated_content TEXT,
    template_used VARCHAR(100),
    openai_model VARCHAR(50),
    tokens_used INTEGER,
    status VARCHAR(50) DEFAULT 'draft',
    sent_via VARCHAR(50),
    sent_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Settings
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Retell Configurations
CREATE TABLE retell_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    agent_id VARCHAR(255),
    system_prompt TEXT,
    knowledge_base TEXT,
    voice_settings JSONB,
    is_active BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_leads_pipeline ON leads(pipeline_id);
CREATE INDEX idx_leads_stage ON leads(stage_id);
CREATE INDEX idx_leads_client ON leads(client_id);
CREATE INDEX idx_calls_lead ON calls(lead_id);
CREATE INDEX idx_calls_retell_id ON calls(retell_call_id);
CREATE INDEX idx_emails_client ON email_messages(client_id);
CREATE INDEX idx_activities_entity ON activities(entity_type, entity_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
