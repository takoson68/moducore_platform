-- Optional: run after main import succeeds
SET FOREIGN_KEY_CHECKS=0;

ALTER TABLE `dinecore_business_closing_history` ADD CONSTRAINT `fk_dinecore_business_closing_history_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `dinecore_business_closings` ADD CONSTRAINT `fk_dinecore_business_closings_closed_by` FOREIGN KEY (`closed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `dinecore_business_closings` ADD CONSTRAINT `fk_dinecore_business_closings_unlocked_by` FOREIGN KEY (`unlocked_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `dinecore_cart_items` ADD CONSTRAINT `fk_dinecore_cart_items_batch` FOREIGN KEY (`batch_id`) REFERENCES `dinecore_order_batches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `dinecore_cart_items` ADD CONSTRAINT `fk_dinecore_cart_items_menu_item` FOREIGN KEY (`menu_item_id`) REFERENCES `dinecore_menu_items` (`id`) ON UPDATE CASCADE;
ALTER TABLE `dinecore_cart_items` ADD CONSTRAINT `fk_dinecore_cart_items_order` FOREIGN KEY (`order_id`) REFERENCES `dinecore_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `dinecore_cart_items` ADD CONSTRAINT `fk_dinecore_cart_items_table` FOREIGN KEY (`table_code`) REFERENCES `dinecore_tables` (`code`) ON UPDATE CASCADE;
ALTER TABLE `dinecore_guest_sessions` ADD CONSTRAINT `fk_dinecore_guest_sessions_order` FOREIGN KEY (`order_id`) REFERENCES `dinecore_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `dinecore_guest_sessions` ADD CONSTRAINT `fk_dinecore_guest_sessions_table` FOREIGN KEY (`table_code`) REFERENCES `dinecore_tables` (`code`) ON UPDATE CASCADE;
ALTER TABLE `dinecore_menu_items` ADD CONSTRAINT `fk_dinecore_menu_items_category` FOREIGN KEY (`category_id`) REFERENCES `dinecore_menu_categories` (`id`) ON UPDATE CASCADE;
ALTER TABLE `dinecore_order_batches` ADD CONSTRAINT `fk_dinecore_order_batches_order` FOREIGN KEY (`order_id`) REFERENCES `dinecore_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `dinecore_order_timeline` ADD CONSTRAINT `fk_dinecore_order_timeline_order` FOREIGN KEY (`order_id`) REFERENCES `dinecore_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `dinecore_orders` ADD CONSTRAINT `fk_dinecore_orders_table` FOREIGN KEY (`table_code`) REFERENCES `dinecore_tables` (`code`) ON UPDATE CASCADE;
ALTER TABLE `dinecore_staff_profiles` ADD CONSTRAINT `fk_dinecore_staff_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS=1;
