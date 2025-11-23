-- Drop the user_id foreign key and column from reports
-- Note: some MySQL versions don't support IF EXISTS for DROP FOREIGN KEY.
-- If this migration errors, run the manual steps shown in comments.

-- Attempt to drop a common FK name (may fail if name differs)
ALTER TABLE reports DROP FOREIGN KEY IF EXISTS reports_ibfk_2;

-- Drop the column if present
ALTER TABLE reports DROP COLUMN IF EXISTS user_id;

-- Manual fallback (run if above statements error):
-- 1) Find the FK name:
-- SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
-- WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reports' AND COLUMN_NAME = 'user_id';
-- 2) Use the returned name in:
-- ALTER TABLE reports DROP FOREIGN KEY `the_constraint_name`;
-- ALTER TABLE reports DROP COLUMN user_id;
