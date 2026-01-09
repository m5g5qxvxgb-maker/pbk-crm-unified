-- ============================================
-- Migration: Create lead_attachments table
-- Purpose: Store file attachments for leads (projects, TZ, contracts, documents)
-- Date: 2026-01-07
-- Author: AI Assistant
-- ============================================

BEGIN;

-- 1. Создать таблицу для хранения файлов
CREATE TABLE IF NOT EXISTS lead_attachments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign key к таблице leads
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Метаданные файла
  filename VARCHAR(255) NOT NULL,              -- Уникальное имя файла на сервере
  original_filename VARCHAR(255) NOT NULL,     -- Оригинальное имя файла от пользователя
  file_path TEXT NOT NULL,                     -- Относительный путь (/uploads/...)
  file_size INTEGER,                           -- Размер в байтах
  mime_type VARCHAR(100),                      -- MIME type (application/pdf, image/jpeg, etc)
  
  -- Категория файла для фильтрации
  file_type VARCHAR(50) DEFAULT 'other',       -- 'project', 'tz', 'contract', 'invoice', 'document', 'image', 'other'
  
  -- Дополнительная информация
  description TEXT,                            -- Описание/комментарий к файлу
  uploaded_by UUID REFERENCES users(id),       -- Кто загрузил файл
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints для валидации
  CONSTRAINT check_file_size CHECK (file_size > 0 AND file_size <= 52428800), -- Max 50MB
  CONSTRAINT check_file_type CHECK (file_type IN ('project', 'tz', 'contract', 'invoice', 'document', 'image', 'other'))
);

-- 2. Создать индексы для быстрого поиска
CREATE INDEX idx_lead_attachments_lead_id ON lead_attachments(lead_id);
CREATE INDEX idx_lead_attachments_uploaded_by ON lead_attachments(uploaded_by);
CREATE INDEX idx_lead_attachments_file_type ON lead_attachments(file_type);
CREATE INDEX idx_lead_attachments_created_at ON lead_attachments(created_at DESC);

-- 3. Trigger для auto-update updated_at
CREATE TRIGGER update_lead_attachments_updated_at 
BEFORE UPDATE ON lead_attachments 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- 4. Добавить комментарии для документации
COMMENT ON TABLE lead_attachments IS 'Файлы прикрепленные к лидам (проекты, ТЗ, договоры, счета, документы, изображения)';
COMMENT ON COLUMN lead_attachments.filename IS 'Уникальное имя файла на сервере (timestamp-randomid-name.ext)';
COMMENT ON COLUMN lead_attachments.original_filename IS 'Оригинальное имя файла загруженное пользователем';
COMMENT ON COLUMN lead_attachments.file_path IS 'Относительный путь к файлу для скачивания (/uploads/filename)';
COMMENT ON COLUMN lead_attachments.file_type IS 'Категория файла: project (проект), tz (техзадание), contract (договор), invoice (счёт), document (документ), image (изображение), other (другое)';
COMMENT ON COLUMN lead_attachments.description IS 'Дополнительное описание файла от пользователя';

-- 5. Проверка успешности миграции
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'lead_attachments'
  ) THEN
    RAISE NOTICE '✅ Migration completed successfully: lead_attachments table created';
  ELSE
    RAISE EXCEPTION '❌ Migration failed: lead_attachments table not created';
  END IF;
END $$;

COMMIT;
