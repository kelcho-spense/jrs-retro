ALTER TABLE `user` ADD `status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `role` text DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `user` ADD `approved_at` integer;--> statement-breakpoint
ALTER TABLE `user` ADD `approved_by_id` text;