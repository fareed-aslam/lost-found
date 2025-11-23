-- 0005_backfill_report_type.sql
-- Backfill missing report_type values
-- 1) If item_status explicitly says 'found' or 'lost', copy that value into report_type
-- 2) If item_status exists but isn't literally 'found' or 'lost' (e.g. 'pending','available','claimed'), assume it's a found-item lifecycle and set report_type='found'
-- 3) For any remaining rows (both fields empty/null), set a safe default 'found'

START TRANSACTION;

-- 1) copy when item_status is explicitly 'found' or 'lost'
UPDATE reports
SET report_type = item_status
WHERE (report_type IS NULL OR report_type = '')
  AND item_status IN ('found','lost');

-- 2) copy when item_status exists but isn't 'found'/'lost' — treat as 'found'
UPDATE reports
SET report_type = 'found'
WHERE (report_type IS NULL OR report_type = '')
  AND item_status IS NOT NULL
  AND item_status <> ''
  AND item_status NOT IN ('found','lost');

-- 3) final default for any remaining rows
UPDATE reports
SET report_type = 'found'
WHERE report_type IS NULL OR report_type = '';

COMMIT;
