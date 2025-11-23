-- Create claims table (if not exists)
CREATE TABLE IF NOT EXISTS `claims` (
  `id` int AUTO_INCREMENT NOT NULL,
  `report_id` int NOT NULL,
  `claimant_name` varchar(255),
  `claimant_email` varchar(255),
  `claimant_phone` varchar(100),
  `item_description` text,
  `claim_status` varchar(50) NOT NULL DEFAULT 'pending',
  `claimant_user_id` int,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `claims_id` PRIMARY KEY(`id`)
);

-- Create claim evidence table
CREATE TABLE IF NOT EXISTS `claim_evidence` (
  `id` int AUTO_INCREMENT NOT NULL,
  `claim_id` int NOT NULL,
  `url` varchar(1024) NOT NULL,
  `kind` varchar(50) DEFAULT 'photo',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `claim_evidence_id` PRIMARY KEY(`id`)
);

-- Create claim audit table
CREATE TABLE IF NOT EXISTS `claim_audit` (
  `id` int AUTO_INCREMENT NOT NULL,
  `actor_user_id` int,
  `claim_id` int NOT NULL,
  `action` varchar(100) NOT NULL,
  `details` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `claim_audit_id` PRIMARY KEY(`id`)
);
