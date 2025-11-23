-- Change report_date from DATE to DATETIME so it can store time
ALTER TABLE reports
  MODIFY COLUMN report_date DATETIME DEFAULT NULL;
