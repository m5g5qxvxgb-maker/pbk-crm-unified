-- Performance Optimization Indexes for PBK CRM
-- Created: 2026-01-05
-- Purpose: Add indexes for frequently queried columns

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Clients table indexes
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(company_name);

-- Leads table indexes
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_id ON leads(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_expected_close_date ON leads(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_leads_value ON leads(value);

-- Tasks table indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- Calls table indexes
CREATE INDEX IF NOT EXISTS idx_calls_client_id ON calls(client_id);
CREATE INDEX IF NOT EXISTS idx_calls_lead_id ON calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_agent_id ON calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at);
CREATE INDEX IF NOT EXISTS idx_calls_scheduled_at ON calls(scheduled_at);

-- Call requests table indexes
CREATE INDEX IF NOT EXISTS idx_call_requests_lead_id ON call_requests(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_requests_requested_by ON call_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_call_requests_approved_by ON call_requests(approved_by);
CREATE INDEX IF NOT EXISTS idx_call_requests_status ON call_requests(status);
CREATE INDEX IF NOT EXISTS idx_call_requests_created_at ON call_requests(created_at);

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_to ON projects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- Proposals table indexes
CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_created_by ON proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at);

-- Activities/Logs table indexes
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_entity_type ON activities(entity_type);
CREATE INDEX IF NOT EXISTS idx_activities_entity_id ON activities(entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);

-- Emails table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_emails_client_id ON emails(client_id);
CREATE INDEX IF NOT EXISTS idx_emails_lead_id ON emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at);

-- Pipelines table indexes
CREATE INDEX IF NOT EXISTS idx_pipelines_is_active ON pipelines(is_active);
CREATE INDEX IF NOT EXISTS idx_pipelines_created_by ON pipelines(created_by);

-- Pipeline stages indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_id ON pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_sort_order ON pipeline_stages(sort_order);

-- Full-text search indexes for common search fields
CREATE INDEX IF NOT EXISTS idx_clients_company_name_trgm ON clients USING gin(company_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_contact_person_trgm ON clients USING gin(contact_person gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_title_trgm ON leads USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tasks_title_trgm ON tasks USING gin(title gin_trgm_ops);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage ON leads(pipeline_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_created ON leads(assigned_to, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status ON tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_status ON tasks(due_date, status);
CREATE INDEX IF NOT EXISTS idx_calls_client_status ON calls(client_id, status);

-- Partial indexes for active/pending items
CREATE INDEX IF NOT EXISTS idx_users_active ON users(id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tasks_pending ON tasks(id, due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_tasks_in_progress ON tasks(id, assigned_to) WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_pipelines_active ON pipelines(id) WHERE is_active = true;

-- JSONB indexes for custom fields (if queries use them)
CREATE INDEX IF NOT EXISTS idx_clients_custom_fields ON clients USING gin(custom_fields);
CREATE INDEX IF NOT EXISTS idx_leads_custom_fields ON leads USING gin(custom_fields);

-- Optimize query performance log
COMMENT ON INDEX idx_leads_pipeline_stage IS 'Optimizes lead filtering by pipeline and stage';
COMMENT ON INDEX idx_tasks_assigned_status IS 'Optimizes task lists filtered by assignee and status';
COMMENT ON INDEX idx_clients_company_name_trgm IS 'Enables fast full-text search on company names';
