CREATE TABLE `items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255),
	`location` varchar(255),
	`status` varchar(50),
	`date` date,
	`description` text,
	CONSTRAINT `items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`username` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`phone_number` varchar(255) NOT NULL,
	`user_type` varchar(255) NOT NULL,
	`signup_method_id` int NOT NULL,
	`deleted_at` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `signup_methods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`method` varchar(100) NOT NULL,
	CONSTRAINT `signup_methods_id` PRIMARY KEY(`id`),
	CONSTRAINT `signup_methods_method_unique` UNIQUE(`method`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_signup_method_id_signup_methods_id_fk` FOREIGN KEY (`signup_method_id`) REFERENCES `signup_methods`(`id`) ON DELETE no action ON UPDATE no action;