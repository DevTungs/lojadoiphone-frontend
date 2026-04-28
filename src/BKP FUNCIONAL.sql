-- --------------------------------------------------------
-- Servidor:                     127.0.0.1
-- Versão do servidor:           8.4.7 - MySQL Community Server - GPL
-- OS do Servidor:               Win64
-- HeidiSQL Versão:              12.16.0.7229
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Copiando estrutura do banco de dados para loja_iphone
CREATE DATABASE IF NOT EXISTS `loja_iphone` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `loja_iphone`;

-- Copiando estrutura para tabela loja_iphone.customers
CREATE TABLE IF NOT EXISTS `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `is_vip` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela loja_iphone.customers: ~1 rows (aproximadamente)
INSERT IGNORE INTO `customers` (`id`, `name`, `phone`, `email`, `notes`, `password_hash`, `is_vip`, `created_at`) VALUES
	(2, 'Tungs', '24993210516', 'jairnetex@yahoo.com', '', '$2b$10$B.6wI7A3J8NVXqVAHV89neCDMGphiRU1hWWpUKOOeYJAXPN105l86', 0, '2026-04-08 00:16:00');

-- Copiando estrutura para tabela loja_iphone.order_items
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_items_order` (`order_id`),
  KEY `fk_items_product` (`product_id`),
  CONSTRAINT `fk_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela loja_iphone.order_items: ~1 rows (aproximadamente)

-- Copiando estrutura para tabela loja_iphone.order_status_history
CREATE TABLE IF NOT EXISTS `order_status_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `old_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `new_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `admin_id` int NOT NULL,
  `admin_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_history_order` (`order_id`),
  CONSTRAINT `fk_history_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela loja_iphone.order_status_history: ~2 rows (aproximadamente)

-- Copiando estrutura para tabela loja_iphone.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `seller_id` int DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '1',
  `total_price` decimal(10,2) NOT NULL,
  `created_at` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_orders_seller` (`seller_id`),
  CONSTRAINT `fk_orders_seller` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=152 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela loja_iphone.orders: ~0 rows (aproximadamente)

-- Copiando estrutura para tabela loja_iphone.products
CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) NOT NULL,
  `storage` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stock` int DEFAULT '0',
  `active` tinyint(1) DEFAULT '1',
  `is_vip` tinyint(1) DEFAULT '0',
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'iPhones',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=93 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela loja_iphone.products: ~11 rows (aproximadamente)
INSERT IGNORE INTO `products` (`id`, `name`, `description`, `price`, `storage`, `color`, `image_url`, `stock`, `active`, `is_vip`, `category`, `created_at`) VALUES
	(50, 'Apple Watch', '', 299.00, '', 'Mix', '/uploads/apple-watch.png', 10, 1, 0, 'Apple Watch', '2026-03-30 14:54:50'),
	(51, 'iPhone 12 Pro', '', 599.00, '128GB', 'Mix', '/uploads/iphone-12-pro-128gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(52, 'iPhone 12 Pro', '', 699.00, '256GB', 'Mix', '/uploads/iphone-12-pro-256gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(53, 'iPhone 12 Pro Max', '', 699.00, '128GB', 'Mix', '/uploads/iphone-12-pro-max-128gb.png', 11, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(54, 'iPhone 12 Pro Max', '', 799.00, '256GB', 'Mix', '/uploads/iphone-12-pro-max-256gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(55, 'iPhone 13', '', 499.00, '128GB', 'Mix', '/uploads/iphone-13-128gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(56, 'iPhone 13', '', 599.00, '256GB', 'Mix', '/uploads/iphone-13-13-256gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(57, 'iPhone 13 Pro', '', 699.00, '128GB', 'Mix', '/uploads/iphone-13-pro-128gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(58, 'iPhone 13 Pro', '', 799.00, '256GB', 'Mix', '/uploads/iphone-13-pro-256gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(59, 'iPhone 13 Pro Max', '', 799.00, '128GB', 'Mix', '/uploads/iphone-13-pro-max-128gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(60, 'iPhone 13 Pro Max', '', 899.00, '256GB', 'Mix', '/uploads/iphone-13-pro-max-256gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(61, 'iPhone 14', '', 649.00, '128GB', 'Mix', '/uploads/iphone-14-128gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(62, 'iPhone 14', '', 749.00, '256GB', 'Mix', '/uploads/iphone-14-256gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(63, 'iPhone 14', '', 849.00, '512GB', 'Mix', '/uploads/iphone-14-512gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(64, 'iPhone 14 Plus', '', 749.00, '128GB', 'Mix', '/uploads/iphone-14-plus-128gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(65, 'iPhone 14 Pro', '', 849.00, '128GB', 'Mix', '/uploads/iphone-14-pro-128gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(66, 'iPhone 14 Pro', '', 949.00, '256GB', 'Mix', '/uploads/iphone-14-pro-256gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(67, 'iPhone 14 Pro', '', 1049.00, '512GB', 'Mix', '/uploads/iphone-14-pro-512gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(68, 'iPhone 14 Pro Max', '', 949.00, '128GB', 'Mix', '/uploads/iphone-14-pro-max-128gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(69, 'iPhone 14 Pro Max', '', 1049.00, '256GB', 'Mix', '/uploads/iphone-14-pro-max-256gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(70, 'iPhone 14 Pro Max', '', 1149.00, '512GB', 'Mix', '/uploads/iphone-14-pro-max-512gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(71, 'iPhone 14 Plus', '', 849.00, '256GB', 'Mix', '/uploads/iphone-14-plus-256gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(72, 'iPhone 14 Plus', '', 949.00, '512GB', 'Mix', '/uploads/iphone-14-plus-512gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(73, 'iPhone 15', '', 749.00, '128GB', 'Mix', '/uploads/iphone-15-128gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:50'),
	(74, 'iPhone 15', '', 849.00, '256GB', 'Mix', '/uploads/iphone-15-256gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:51'),
	(75, 'iPhone 15 Plus', '', 849.00, '128GB', 'Mix', '/uploads/iphone-15-plus-128gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:51'),
	(76, 'iPhone 15 Pro', '', 949.00, '128GB', 'Mix', '/uploads/iphone-15-pro-128gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:51'),
	(77, 'iPhone 15 Pro', '', 1049.00, '256GB', 'Mix', '/uploads/iphone-15-pro-256gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:51'),
	(78, 'iPhone 15 Pro Max', '', 1499.00, '1TB', 'Mix', '/uploads/iphone-15-pro-max-1tb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:51'),
	(79, 'iPhone 15 Pro Max', '', 1199.00, '256GB', 'Mix', '/uploads/iphone-15-pro-max-256gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:51'),
	(80, 'iPhone 15 Pro Max', '', 1299.00, '512GB', 'Mix', '/uploads/iphone-15-pro-max-512gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:51'),
	(81, 'iPhone 16', '', 849.00, '128GB', 'Mix', '/uploads/iphone-16-128gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:51'),
	(82, 'iPhone 16', '', 949.00, '256GB', 'Mix', '/uploads/iphone-16-256gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:51'),
	(83, 'iPhone 16 Plus', '', 949.00, '128GB', 'Mix', '/uploads/iphone-16-plus-128gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:51'),
	(84, 'iPhone 16 Plus', '', 1049.00, '256GB', 'Mix', '/uploads/iphone-16-plus-256gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:51'),
	(85, 'iPhone 16 Pro', '', 1049.00, '128GB', 'Mix', '/uploads/iphone-16-pro-128gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:51'),
	(86, 'iPhone 16 Pro', '', 1149.00, '256GB', 'Mix', '/uploads/iphone-16-pro-256gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:51'),
	(87, 'iPhone 16 Pro Max', '', 1599.00, '1TB', 'Mix', '/uploads/iphone-16-pro-max-1tb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:51'),
	(88, 'iPhone 17', '', 1049.00, '256GB', 'Mix', '/uploads/iphone-17-256gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:51'),
	(89, 'iPhone 17 Pro', '', 1199.00, '256GB', 'Mix', '/uploads/iphone-17-pro-256gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:51'),
	(90, 'iPhone 17 Pro Max', '', 1649.00, '1TB', 'Mix', '/uploads/iphone-17-pro-max-1tb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:51'),
	(91, 'iPhone 17 Pro Max', '', 1349.00, '256GB', 'Mix', '/uploads/iphone-17-pro-max-256gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:51'),
	(92, 'iPhone 17 Pro Max', '', 1449.00, '512GB', 'Mix', '/uploads/iphone-17-pro-max-512gb.png', 10, 1, 0, 'iPhones', '2026-03-30 14:54:51');

-- Copiando estrutura para tabela loja_iphone.promotions
CREATE TABLE IF NOT EXISTS `promotions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `sort_order` int DEFAULT '0',
  `link_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela loja_iphone.promotions: ~2 rows (aproximadamente)
INSERT IGNORE INTO `promotions` (`id`, `title`, `image_url`, `price`, `active`, `sort_order`, `link_url`, `created_at`) VALUES
	(1, 'Iphone 14 128GB', '/uploads/1775233158468-ou10p4cgsu.webp', 235.00, 1, 1, '', '2026-04-03 19:06:17'),
	(2, 'Apple watch se geracao 2 44m', '/uploads/1775237085505-mv94su246e.png', 210.00, 1, 0, '', '2026-04-03 19:22:32');

-- Copiando estrutura para tabela loja_iphone.sellers
CREATE TABLE IF NOT EXISTS `sellers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sales_count` int DEFAULT '0',
  `photo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela loja_iphone.sellers: ~2 rows (aproximadamente)
INSERT IGNORE INTO `sellers` (`id`, `name`, `phone`, `sales_count`, `photo_url`, `slug`, `created_at`) VALUES
	(4, 'Paulo', '', 0, '', '', '2026-03-29 18:05:50'),
	(5, 'Rayza', '', 0, '', '', '2026-03-29 18:06:11');

-- Copiando estrutura para tabela loja_iphone.store_settings
CREATE TABLE IF NOT EXISTS `store_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `logo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `store_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Loja do iPhone',
  `whatsapp` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `favicon_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `enable_delivery_verification` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela loja_iphone.store_settings: ~1 rows (aproximadamente)
INSERT IGNORE INTO `store_settings` (`id`, `logo_url`, `store_name`, `whatsapp`, `favicon_url`, `enable_delivery_verification`) VALUES
	(1, '/uploads/1774880494880-cidpdnihxem.png', 'Loja do iPhone', '', '/uploads/1774880499870-1n9ruyr92ch.png', 1);

-- Copiando estrutura para tabela loja_iphone.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela loja_iphone.users: ~2 rows (aproximadamente)
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `phone`, `password_hash`, `role`, `created_at`) VALUES
	(1, 'Administrador', 'admin@store.com', '', '$2b$12$Qp8xCAOi4BAfmmL9xMXOAOMvMoIDcc8p.xSnqsietqrArBlOkSODq', 'admin', '2026-03-29 17:33:21'),
	(2, 'Geiciana', 'geicianarodrigues@gmail.com', NULL, '$2a$12$IRexr6kUvMBEqlTvLnzPhe5E914IoEOnvzJS4rmvRAp70xEaYi892', 'admin', '2026-04-08 00:20:05');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
