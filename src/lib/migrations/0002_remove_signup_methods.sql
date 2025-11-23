-- Remove foreign key constraint
ALTER TABLE users DROP FOREIGN KEY users_signup_method_id_signup_methods_id_fk;

-- Remove signup_method_id column
ALTER TABLE users DROP COLUMN signup_method_id;

-- (Optional) Drop signup_methods table if no longer needed
DROP TABLE IF EXISTS signup_methods;
