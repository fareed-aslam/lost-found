-- Fix incorrect foreign key on reports.category_id
-- Drops the existing FK (if present) and recreates it to reference categories(id)

-- Drop FK if exists (constraint name may vary; using known name reports_ibfk_1)
ALTER TABLE reports DROP FOREIGN KEY IF EXISTS reports_ibfk_1;

-- If MySQL version doesn't support IF EXISTS for DROP FOREIGN KEY, the above may fail.
-- In that case run instead (uncomment as needed):
-- SET @fkname := (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
--   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reports' AND COLUMN_NAME = 'category_id' LIMIT 1);
-- SET @s := CONCAT('ALTER TABLE reports DROP FOREIGN KEY ', @fkname);
-- PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Recreate the correct foreign key referencing categories(id)
ALTER TABLE reports
  ADD CONSTRAINT fk_reports_category
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
