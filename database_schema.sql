-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: 10.216.1.218    Database: routine_db
-- ------------------------------------------------------
-- Server version	11.8.6-MariaDB-0+deb13u1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bang_luong`
--

DROP TABLE IF EXISTS `bang_luong`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bang_luong` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL COMMENT 'Nhân viên',
  `thang` int(11) NOT NULL COMMENT 'Tháng 1-12',
  `nam` int(11) NOT NULL COMMENT 'Năm',
  `luong_co_ban` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Lương cơ bản',
  `he_so` decimal(5,2) NOT NULL DEFAULT 1.00 COMMENT 'Hệ số lương',
  `phu_cap` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Phụ cấp',
  `thuong` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Thưởng',
  `khau_tru` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Khấu trừ',
  `ghi_chu` varchar(500) DEFAULT NULL,
  `trang_thai` varchar(20) NOT NULL DEFAULT 'NHAP' COMMENT 'NHAP | DA_DUYET',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bang_luong_user_thang` (`user_id`,`thang`,`nam`),
  KEY `idx_bang_luong_thang` (`nam`,`thang`),
  CONSTRAINT `fk_bang_luong_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `customer_id` bigint(20) NOT NULL,
  `product_id` bigint(20) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `size` varchar(20) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cart_item` (`customer_id`,`product_id`,`size`,`color`),
  KEY `fk_cart_items_product` (`product_id`),
  KEY `idx_cart_item_customer` (`customer_id`),
  CONSTRAINT `fk_cart_items_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chi_tiet_kiem_ke`
--

DROP TABLE IF EXISTS `chi_tiet_kiem_ke`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chi_tiet_kiem_ke` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `kiem_ke_id` bigint(20) NOT NULL,
  `product_id` bigint(20) NOT NULL,
  `so_luong_he_thong` int(11) NOT NULL,
  `so_luong_thuc_te` int(11) DEFAULT NULL,
  `chenh_lech` int(11) DEFAULT NULL,
  `ghi_chu` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_kiem_ke_product` (`kiem_ke_id`,`product_id`),
  KEY `idx_ct_kiem_ke` (`kiem_ke_id`),
  KEY `idx_ct_kiem_ke_product` (`product_id`),
  CONSTRAINT `fk_ct_kiem_ke_kiem_ke` FOREIGN KEY (`kiem_ke_id`) REFERENCES `kiem_ke` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ct_kiem_ke_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chi_tiet_phieu_nhap`
--

DROP TABLE IF EXISTS `chi_tiet_phieu_nhap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chi_tiet_phieu_nhap` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `phieu_nhap_id` bigint(20) NOT NULL,
  `product_id` bigint(20) NOT NULL,
  `so_luong_nhap` int(11) NOT NULL,
  `gia_nhap` decimal(15,2) NOT NULL,
  `thanh_tien` decimal(15,2) DEFAULT NULL,
  `so_luong_ton_truoc_nhap` int(11) NOT NULL DEFAULT 0,
  `ghi_chu` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ct_phieu_nhap` (`phieu_nhap_id`),
  KEY `idx_ct_product` (`product_id`),
  CONSTRAINT `fk_ct_phieu_nhap_phieu` FOREIGN KEY (`phieu_nhap_id`) REFERENCES `phieu_nhap_kho` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ct_phieu_nhap_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chi_tiet_phieu_xuat`
--

DROP TABLE IF EXISTS `chi_tiet_phieu_xuat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chi_tiet_phieu_xuat` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `phieu_xuat_id` bigint(20) NOT NULL,
  `product_id` bigint(20) NOT NULL,
  `so_luong_xuat` int(11) NOT NULL,
  `so_luong_ton_truoc_xuat` int(11) NOT NULL DEFAULT 0,
  `ghi_chu` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ct_phieu_xuat` (`phieu_xuat_id`),
  KEY `idx_ct_xuat_product` (`product_id`),
  CONSTRAINT `fk_ct_phieu_xuat_phieu` FOREIGN KEY (`phieu_xuat_id`) REFERENCES `phieu_xuat_kho` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ct_phieu_xuat_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` varchar(500) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `tier` varchar(50) NOT NULL DEFAULT 'REGULAR',
  `total_orders` int(11) DEFAULT 0,
  `total_spent` decimal(15,2) DEFAULT 0.00,
  `last_order_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_phone` (`phone`),
  KEY `idx_tier` (`tier`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kiem_ke`
--

DROP TABLE IF EXISTS `kiem_ke`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kiem_ke` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ma_kiem_ke` varchar(50) NOT NULL,
  `ngay_kiem_ke` date NOT NULL,
  `trang_thai` varchar(20) NOT NULL DEFAULT 'DANG_KIEM',
  `nguoi_kiem_id` bigint(20) NOT NULL,
  `ghi_chu` text DEFAULT NULL,
  `ngay_hoan_thanh` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_kiem_ke` (`ma_kiem_ke`),
  KEY `fk_kiem_ke_nguoi_kiem` (`nguoi_kiem_id`),
  KEY `idx_ma_kiem_ke` (`ma_kiem_ke`),
  KEY `idx_ngay_kiem_ke` (`ngay_kiem_ke`),
  KEY `idx_trang_thai_kiem_ke` (`trang_thai`),
  CONSTRAINT `fk_kiem_ke_nguoi_kiem` FOREIGN KEY (`nguoi_kiem_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) NOT NULL,
  `product_id` bigint(20) NOT NULL,
  `product_code` varchar(50) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `quantity` int(11) NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `size` varchar(20) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_order_item_order` (`order_id`),
  KEY `idx_order_item_product` (`product_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) NOT NULL,
  `customer_id` bigint(20) DEFAULT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `discount` decimal(15,2) DEFAULT 0.00,
  `total` decimal(15,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'PENDING',
  `channel` varchar(50) NOT NULL DEFAULT 'OFFLINE',
  `created_by` bigint(20) NOT NULL,
  `notes` text DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `stock_deducted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `fk_orders_created_by` (`created_by`),
  KEY `idx_order_order_number` (`order_number`),
  KEY `idx_order_customer` (`customer_id`),
  KEY `idx_order_status` (`status`),
  KEY `idx_order_created_at` (`created_at`),
  CONSTRAINT `fk_orders_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `phieu_nhap_kho`
--

DROP TABLE IF EXISTS `phieu_nhap_kho`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phieu_nhap_kho` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ma_phieu_nhap` varchar(50) NOT NULL,
  `ngay_nhap` datetime NOT NULL DEFAULT current_timestamp(),
  `nha_cung_cap_id` bigint(20) NOT NULL,
  `trang_thai` varchar(20) NOT NULL DEFAULT 'DRAFT',
  `tong_so_luong` int(11) DEFAULT 0,
  `tong_tien` decimal(15,2) DEFAULT 0.00,
  `ghi_chu` text DEFAULT NULL,
  `nguoi_tao_id` bigint(20) NOT NULL,
  `nguoi_duyet_id` bigint(20) DEFAULT NULL,
  `ngay_duyet` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_phieu_nhap` (`ma_phieu_nhap`),
  KEY `fk_phieu_nhap_nguoi_tao` (`nguoi_tao_id`),
  KEY `fk_phieu_nhap_nguoi_duyet` (`nguoi_duyet_id`),
  KEY `idx_ma_phieu_nhap` (`ma_phieu_nhap`),
  KEY `idx_ngay_nhap` (`ngay_nhap`),
  KEY `idx_trang_thai` (`trang_thai`),
  KEY `idx_nha_cung_cap` (`nha_cung_cap_id`),
  CONSTRAINT `fk_phieu_nhap_ncc` FOREIGN KEY (`nha_cung_cap_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `fk_phieu_nhap_nguoi_duyet` FOREIGN KEY (`nguoi_duyet_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_phieu_nhap_nguoi_tao` FOREIGN KEY (`nguoi_tao_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `phieu_xuat_kho`
--

DROP TABLE IF EXISTS `phieu_xuat_kho`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phieu_xuat_kho` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ma_phieu_xuat` varchar(50) NOT NULL,
  `ngay_xuat` datetime NOT NULL DEFAULT current_timestamp(),
  `ly_do_xuat` varchar(30) NOT NULL,
  `trang_thai` varchar(20) NOT NULL DEFAULT 'DRAFT',
  `order_id` bigint(20) DEFAULT NULL,
  `tong_so_luong` int(11) DEFAULT 0,
  `ghi_chu` text DEFAULT NULL,
  `nguoi_tao_id` bigint(20) NOT NULL,
  `nguoi_duyet_id` bigint(20) DEFAULT NULL,
  `ngay_duyet` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_phieu_xuat` (`ma_phieu_xuat`),
  KEY `fk_phieu_xuat_nguoi_tao` (`nguoi_tao_id`),
  KEY `fk_phieu_xuat_nguoi_duyet` (`nguoi_duyet_id`),
  KEY `idx_ma_phieu_xuat` (`ma_phieu_xuat`),
  KEY `idx_ngay_xuat` (`ngay_xuat`),
  KEY `idx_trang_thai_xuat` (`trang_thai`),
  KEY `idx_order` (`order_id`),
  KEY `idx_ly_do_xuat` (`ly_do_xuat`),
  CONSTRAINT `fk_phieu_xuat_nguoi_duyet` FOREIGN KEY (`nguoi_duyet_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_phieu_xuat_nguoi_tao` FOREIGN KEY (`nguoi_tao_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_phieu_xuat_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_reviews`
--

DROP TABLE IF EXISTS `product_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_reviews` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) NOT NULL,
  `customer_id` bigint(20) NOT NULL,
  `rating` int(11) NOT NULL,
  `comment` text DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_product_review_product` (`product_id`),
  KEY `idx_product_review_customer` (`customer_id`),
  CONSTRAINT `fk_product_reviews_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_product_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_product_review_rating` CHECK (`rating` between 1 and 5)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variants` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) NOT NULL,
  `size` varchar(20) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `sku` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_variant` (`product_id`,`size`,`color`),
  KEY `idx_product_variant_product` (`product_id`),
  CONSTRAINT `fk_product_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8675 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category_id` bigint(20) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(15,2) NOT NULL,
  `cost_price` decimal(15,2) DEFAULT NULL,
  `old_price` decimal(15,2) DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `min_stock` int(11) DEFAULT 10,
  `status` varchar(50) NOT NULL DEFAULT 'ACTIVE',
  `image_url` longtext DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `material` varchar(255) DEFAULT NULL,
  `fit` varchar(100) DEFAULT NULL,
  `season` varchar(100) DEFAULT NULL,
  `care_instructions` text DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT 0.00,
  `review_count` int(11) DEFAULT 0,
  `badge` varchar(50) DEFAULT NULL,
  `target_gender` varchar(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_product_code` (`code`),
  KEY `idx_product_category` (`category_id`),
  KEY `idx_product_status` (`status`),
  KEY `idx_product_name` (`name`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1032 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promotion_products`
--

DROP TABLE IF EXISTS `promotion_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotion_products` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `promotion_id` bigint(20) NOT NULL,
  `product_id` bigint(20) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_promotion_product` (`promotion_id`,`product_id`),
  KEY `idx_promotion_id` (`promotion_id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `fk_promotion_products_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_promotion_products_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promotions`
--

DROP TABLE IF EXISTS `promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `discount_value` decimal(15,2) NOT NULL,
  `max_discount_amount` decimal(15,2) DEFAULT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `min_order_amount` decimal(15,2) DEFAULT 0.00,
  `apply_to_all_products` tinyint(1) DEFAULT 1,
  `usage_limit` int(11) DEFAULT NULL,
  `usage_count` int(11) DEFAULT 0,
  `status` varchar(50) NOT NULL DEFAULT 'DRAFT',
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_status` (`status`),
  KEY `idx_dates` (`start_date`,`end_date`),
  KEY `idx_type` (`type`),
  CONSTRAINT `chk_promotion_dates` CHECK (`end_date` > `start_date`),
  CONSTRAINT `chk_promotion_discount_value` CHECK (`discount_value` >= 0),
  CONSTRAINT `chk_promotion_usage_count` CHECK (`usage_count` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ma_ncc` varchar(50) NOT NULL,
  `ten_ncc` varchar(200) NOT NULL,
  `dia_chi` text DEFAULT NULL,
  `so_dien_thoai` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `nguoi_lien_he` varchar(100) DEFAULT NULL,
  `ghi_chu` text DEFAULT NULL,
  `trang_thai` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_ncc` (`ma_ncc`),
  KEY `idx_ma_ncc` (`ma_ncc`),
  KEY `idx_ten_ncc` (`ten_ncc`),
  KEY `idx_trang_thai` (`trang_thai`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `branch` varchar(100) DEFAULT NULL,
  `role` varchar(50) NOT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`),
  KEY `idx_user_email` (`email`),
  KEY `idx_user_phone` (`phone`),
  KEY `idx_user_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wishlist_items`
--

DROP TABLE IF EXISTS `wishlist_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlist_items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `customer_id` bigint(20) NOT NULL,
  `product_id` bigint(20) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wishlist_item` (`customer_id`,`product_id`),
  KEY `fk_wishlist_items_product` (`product_id`),
  KEY `idx_wishlist_item_customer` (`customer_id`),
  CONSTRAINT `fk_wishlist_items_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wishlist_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-24 15:23:11
