CREATE TABLE `buyer_history` (
	`id` text PRIMARY KEY NOT NULL,
	`buyer_id` text NOT NULL,
	`changed_by` text NOT NULL,
	`changed_at` integer DEFAULT (unixepoch()) NOT NULL,
	`diff` text NOT NULL,
	FOREIGN KEY (`buyer_id`) REFERENCES `buyers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `buyers` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`email` text,
	`phone` text NOT NULL,
	`city` text NOT NULL,
	`property_type` text NOT NULL,
	`bhk` text,
	`purpose` text NOT NULL,
	`budget_min` integer,
	`budget_max` integer,
	`timeline` text NOT NULL,
	`source` text NOT NULL,
	`status` text DEFAULT 'New' NOT NULL,
	`notes` text,
	`tags` text,
	`owner_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);