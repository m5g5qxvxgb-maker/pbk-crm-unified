-- Migration: Add unique human-readable identifiers to leads and clients
-- Format: L-YYYYMMDD-XXXX for leads, C-YYYYMMDD-XXXX for clients
-- Created: 2026-01-10

-- Add unique_id column to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS unique_id VARCHAR(20) UNIQUE;

-- Add unique_id column to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS unique_id VARCHAR(20) UNIQUE;

-- Create sequence for leads daily counter
CREATE SEQUENCE IF NOT EXISTS leads_daily_seq;

-- Create sequence for clients daily counter
CREATE SEQUENCE IF NOT EXISTS clients_daily_seq;

-- Function to generate unique lead ID
CREATE OR REPLACE FUNCTION generate_lead_unique_id()
RETURNS VARCHAR(20) AS $$
DECLARE
    today_date VARCHAR(8);
    counter INTEGER;
    new_id VARCHAR(20);
    max_today INTEGER;
BEGIN
    -- Get today's date in YYYYMMDD format
    today_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    -- Get the maximum counter for today
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(unique_id FROM 13 FOR 4) AS INTEGER)
    ), 0) INTO max_today
    FROM leads
    WHERE unique_id LIKE 'L-' || today_date || '-%';
    
    -- Increment counter
    counter := max_today + 1;
    
    -- Format: L-YYYYMMDD-XXXX
    new_id := 'L-' || today_date || '-' || LPAD(counter::TEXT, 4, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique client ID
CREATE OR REPLACE FUNCTION generate_client_unique_id()
RETURNS VARCHAR(20) AS $$
DECLARE
    today_date VARCHAR(8);
    counter INTEGER;
    new_id VARCHAR(20);
    max_today INTEGER;
BEGIN
    -- Get today's date in YYYYMMDD format
    today_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    -- Get the maximum counter for today
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(unique_id FROM 13 FOR 4) AS INTEGER)
    ), 0) INTO max_today
    FROM clients
    WHERE unique_id LIKE 'C-' || today_date || '-%';
    
    -- Increment counter
    counter := max_today + 1;
    
    -- Format: C-YYYYMMDD-XXXX
    new_id := 'C-' || today_date || '-' || LPAD(counter::TEXT, 4, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate unique_id for new leads
CREATE OR REPLACE FUNCTION auto_generate_lead_unique_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.unique_id IS NULL THEN
        NEW.unique_id := generate_lead_unique_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate unique_id for new clients
CREATE OR REPLACE FUNCTION auto_generate_client_unique_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.unique_id IS NULL THEN
        NEW.unique_id := generate_client_unique_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS trigger_generate_lead_unique_id ON leads;
DROP TRIGGER IF EXISTS trigger_generate_client_unique_id ON clients;

-- Create triggers
CREATE TRIGGER trigger_generate_lead_unique_id
    BEFORE INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_lead_unique_id();

CREATE TRIGGER trigger_generate_client_unique_id
    BEFORE INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_client_unique_id();

-- Create indexes for efficient searching
CREATE INDEX IF NOT EXISTS idx_leads_unique_id ON leads(unique_id);
CREATE INDEX IF NOT EXISTS idx_clients_unique_id ON clients(unique_id);

-- Generate unique_id for existing leads (backfill)
DO $$
DECLARE
    lead_record RECORD;
    counter INTEGER := 0;
    batch_date VARCHAR(8);
BEGIN
    batch_date := TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'YYYYMMDD');
    
    FOR lead_record IN 
        SELECT id FROM leads WHERE unique_id IS NULL ORDER BY created_at
    LOOP
        counter := counter + 1;
        UPDATE leads 
        SET unique_id = 'L-' || batch_date || '-' || LPAD(counter::TEXT, 4, '0')
        WHERE id = lead_record.id;
    END LOOP;
    
    RAISE NOTICE 'Generated % unique IDs for existing leads', counter;
END $$;

-- Generate unique_id for existing clients (backfill)
DO $$
DECLARE
    client_record RECORD;
    counter INTEGER := 0;
    batch_date VARCHAR(8);
BEGIN
    batch_date := TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'YYYYMMDD');
    
    FOR client_record IN 
        SELECT id FROM clients WHERE unique_id IS NULL ORDER BY created_at
    LOOP
        counter := counter + 1;
        UPDATE clients 
        SET unique_id = 'C-' || batch_date || '-' || LPAD(counter::TEXT, 4, '0')
        WHERE id = client_record.id;
    END LOOP;
    
    RAISE NOTICE 'Generated % unique IDs for existing clients', counter;
END $$;

-- Add comment to columns
COMMENT ON COLUMN leads.unique_id IS 'Human-readable unique identifier in format L-YYYYMMDD-XXXX';
COMMENT ON COLUMN clients.unique_id IS 'Human-readable unique identifier in format C-YYYYMMDD-XXXX';
