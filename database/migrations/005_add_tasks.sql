-- Migration: Add Tasks table
-- Created: 2026-01-02
-- Description: Add tasks as a first-class entity for CRM operations

-- Task statuses
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'overdue');

-- Task priorities  
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'pending',
    priority task_priority DEFAULT 'medium',
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Associations (all optional - task can be standalone or linked)
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID,  -- Will reference projects when ERP is aligned
    
    -- Assignment
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id) NOT NULL,
    
    -- Metadata
    tags TEXT[],
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_lead ON tasks(lead_id);
CREATE INDEX idx_tasks_client ON tasks(client_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);

-- Trigger for updated_at
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for overdue tasks (computed)
CREATE OR REPLACE VIEW overdue_tasks AS
SELECT 
    t.*,
    u.first_name || ' ' || u.last_name AS assigned_to_name,
    uc.first_name || ' ' || uc.last_name AS created_by_name
FROM tasks t
LEFT JOIN users u ON t.assigned_to = u.id
LEFT JOIN users uc ON t.created_by = uc.id
WHERE t.status NOT IN ('completed', 'cancelled')
  AND t.due_date < NOW();

-- Add stage slug/code to pipeline_stages for deals compatibility
ALTER TABLE pipeline_stages 
ADD COLUMN IF NOT EXISTS slug VARCHAR(50);

-- Create unique index on slug per pipeline
CREATE UNIQUE INDEX IF NOT EXISTS idx_pipeline_stages_slug 
ON pipeline_stages(pipeline_id, slug) 
WHERE slug IS NOT NULL;

-- Add default probability to stages (for forecasting)
ALTER TABLE pipeline_stages 
ADD COLUMN IF NOT EXISTS default_probability INTEGER DEFAULT 50;

-- Update existing stages with default slugs (safe: only if slug is null)
UPDATE pipeline_stages 
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '_', 'g'))
WHERE slug IS NULL;

COMMENT ON TABLE tasks IS 'Tasks/to-dos for leads, clients, projects';
COMMENT ON COLUMN pipeline_stages.slug IS 'Stable identifier for stage mapping (e.g., "new", "qualified", "won")';
COMMENT ON COLUMN pipeline_stages.default_probability IS 'Default win probability % for leads in this stage';
