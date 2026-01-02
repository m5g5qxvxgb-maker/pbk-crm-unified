-- ============================================
-- ERP MODULE MIGRATION
-- Date: 2024-12-10
-- ============================================

-- 1. Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  
  -- Budget
  budget_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'PLN',
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  
  -- Dates
  start_date DATE,
  end_date DATE,
  
  -- Metadata
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- 2. Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  
  -- Relations
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Amount
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PLN',
  
  -- Category
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  
  -- Description
  description TEXT NOT NULL,
  notes TEXT,
  
  -- Receipt
  receipt_url VARCHAR(500),
  receipt_number VARCHAR(100),
  
  -- Date
  expense_date DATE NOT NULL,
  
  -- Creator
  created_by UUID REFERENCES users(id),
  created_via VARCHAR(50) DEFAULT 'web',
  
  -- Telegram
  telegram_message_id BIGINT,
  telegram_user_id BIGINT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_client ON expenses(client_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);

-- 3. Expense categories table
CREATE TABLE IF NOT EXISTS expense_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  name_ru VARCHAR(100),
  name_pl VARCHAR(100),
  parent_category VARCHAR(100),
  icon VARCHAR(20),
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Budget alerts table
CREATE TABLE IF NOT EXISTS budget_alerts (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  threshold_percentage INTEGER,
  message TEXT,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed expense categories
INSERT INTO expense_categories (name, name_ru, name_pl, icon, color) VALUES
  ('materials', 'Материалы', 'Materiały', '🛠️', '#FF9800'),
  ('labor', 'Работа', 'Praca', '👷', '#2196F3'),
  ('equipment', 'Оборудование', 'Sprzęt', '🔧', '#9C27B0'),
  ('transport', 'Транспорт', 'Transport', '🚚', '#4CAF50'),
  ('subcontractors', 'Субподрядчики', 'Podwykonawcy', '🤝', '#FF5722'),
  ('general', 'Общие расходы', 'Wydatki ogólne', '💰', '#607D8B'),
  ('office', 'Офис', 'Biuro', '🏢', '#795548'),
  ('marketing', 'Маркетинг', 'Marketing', '📢', '#E91E63'),
  ('utilities', 'Коммунальные', 'Usługi komunalne', '💡', '#00BCD4'),
  ('other', 'Прочее', 'Inne', '📋', '#9E9E9E')
ON CONFLICT (name) DO NOTHING;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for statistics
CREATE OR REPLACE VIEW project_stats AS
SELECT 
  p.id,
  p.name,
  p.client_id,
  p.budget_amount,
  COALESCE(SUM(e.amount), 0) as total_spent,
  p.budget_amount - COALESCE(SUM(e.amount), 0) as remaining,
  CASE 
    WHEN p.budget_amount > 0 THEN ROUND((COALESCE(SUM(e.amount), 0) / p.budget_amount * 100)::numeric, 2)
    ELSE 0 
  END as spent_percentage,
  COUNT(e.id) as expense_count
FROM projects p
LEFT JOIN expenses e ON e.project_id = p.id
GROUP BY p.id, p.name, p.client_id, p.budget_amount;

COMMENT ON VIEW project_stats IS 'Project budget statistics with spending';
