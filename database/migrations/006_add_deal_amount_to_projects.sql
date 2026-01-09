-- ============================================
-- Add deal_amount to projects table
-- Date: 2026-01-07
-- ============================================

-- Add deal_amount field to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS deal_amount DECIMAL(12, 2);

-- Add lead_id to link with CRM leads
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;

-- Create index for lead_id
CREATE INDEX IF NOT EXISTS idx_projects_lead ON projects(lead_id);

-- Update project_stats view to include deal_amount and profitability
DROP VIEW IF EXISTS project_stats;

CREATE OR REPLACE VIEW project_stats AS
SELECT 
  p.id,
  p.name,
  p.client_id,
  p.lead_id,
  p.deal_amount,
  p.budget_amount,
  COALESCE(SUM(e.amount), 0) as total_spent,
  p.budget_amount - COALESCE(SUM(e.amount), 0) as remaining,
  CASE 
    WHEN p.budget_amount > 0 THEN ROUND((COALESCE(SUM(e.amount), 0) / p.budget_amount * 100)::numeric, 2)
    ELSE 0 
  END as spent_percentage,
  -- Deviation from budget
  CASE 
    WHEN p.budget_amount > 0 THEN ROUND((p.budget_amount - COALESCE(SUM(e.amount), 0))::numeric, 2)
    ELSE 0 
  END as budget_deviation,
  -- Profitability (deal_amount - total_spent)
  CASE 
    WHEN p.deal_amount IS NOT NULL THEN ROUND((p.deal_amount - COALESCE(SUM(e.amount), 0))::numeric, 2)
    ELSE NULL
  END as profit,
  -- Profit margin percentage
  CASE 
    WHEN p.deal_amount > 0 THEN ROUND(((p.deal_amount - COALESCE(SUM(e.amount), 0)) / p.deal_amount * 100)::numeric, 2)
    ELSE NULL
  END as profit_margin,
  COUNT(e.id) as expense_count
FROM projects p
LEFT JOIN expenses e ON e.project_id = p.id
GROUP BY p.id, p.name, p.client_id, p.lead_id, p.deal_amount, p.budget_amount;

COMMENT ON VIEW project_stats IS 'Project budget statistics with spending, profitability and deviations';

COMMENT ON COLUMN projects.deal_amount IS 'Total deal/contract amount agreed with client';
COMMENT ON COLUMN projects.budget_amount IS 'Planned budget for project execution';
COMMENT ON COLUMN projects.lead_id IS 'Reference to CRM lead that initiated this project';
