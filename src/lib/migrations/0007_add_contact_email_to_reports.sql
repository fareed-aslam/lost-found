-- Add contact_email column to reports
ALTER TABLE reports
  ADD COLUMN contact_email VARCHAR(255) DEFAULT NULL;

-- If your MySQL version doesn't support DROP/ADD with IF NOT EXISTS, and this errors
-- check if the column already exists with:
-- SELECT COLUMN_NAME FROM information_schema.COLUMNS
-- WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reports' AND COLUMN_NAME = 'contact_email';
