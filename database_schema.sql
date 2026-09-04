-- =============================================================================
-- ROUTINE - HỆ THỐNG QUẢN LÝ CỬA HÀNG THỜI TRANG (ĐỒ ÁN TỐT NGHIỆP HTTT)
-- CƠ SỞ DỮ LIỆU: MySQL 8.0+ / MariaDB 10.6+
-- BẢNG MÃ KÝ TỰ: UTF-8 (utf8mb4 / utf8mb4_unicode_ci)
-- TỔNG SỐ BẢNG: 20 bảng
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `routine_db`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `routine_db`;

-- =============================================================================
-- 1. XÓA BẢNG CŨ THEO THỨ TỰ RÀNG BUỘC KHÓA NGOẠI (NẾU ĐÃ TỒN TẠI)
-- =============================================================================
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `bang_luong`;
DROP TABLE IF EXISTS `chi_tiet_kiem_ke`;
DROP TABLE IF EXISTS `kiem_ke`;
DROP TABLE IF EXISTS `chi_tiet_phieu_xuat`;
DROP TABLE IF EXISTS `chi_tiet_phieu_nhap`;
DROP TABLE IF EXISTS `phieu_xuat_kho`;
DROP TABLE IF EXISTS `phieu_nhap_kho`;
DROP TABLE IF EXISTS `suppliers`;
DROP TABLE IF EXISTS `promotion_products`;
DROP TABLE IF EXISTS `promotions`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `product_reviews`;
DROP TABLE IF EXISTS `wishlist_items`;
DROP TABLE IF EXISTS `cart_items`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `product_variants`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 2. TẠO CÁC BẢNG TRONG CƠ SỞ DỮ LIỆU
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Bảng 1: users - Người dùng nội bộ & Nhân sự (Admin, Bán hàng, Kho, Kế toán)
-- -----------------------------------------------------------------------------
CREATE TABLE `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Email đăng nhập hệ thống',
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Mật khẩu đã băm (BCrypt)',
    `full_name` VARCHAR(255) NOT NULL COMMENT 'Họ và tên nhân viên',
    `phone` VARCHAR(20) UNIQUE COMMENT 'Số điện thoại',
    `branch` VARCHAR(100) COMMENT 'Chi nhánh làm việc',
    `role` VARCHAR(50) NOT NULL COMMENT 'Vai trò: ADMIN, SALES_STAFF, WAREHOUSE_STAFF, ACCOUNTANT',
    `avatar_url` VARCHAR(500) COMMENT 'Ảnh đại diện',
    `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Trạng thái hoạt động (true: kích hoạt, false: bị khóa)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user_email` (`email`),
    INDEX `idx_user_phone` (`phone`),
    INDEX `idx_user_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng người dùng nội bộ và phân quyền';

-- -----------------------------------------------------------------------------
-- Bảng 2: categories - Danh mục sản phẩm thời trang
-- -----------------------------------------------------------------------------
CREATE TABLE `categories` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Tên danh mục (Áo sơ mi, Quần Jean...)',
    `slug` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Slug đường dẫn (ao-so-mi, quan-jean...)',
    `description` TEXT COMMENT 'Mô tả danh mục',
    `icon` VARCHAR(100) COMMENT 'Tên icon hiển thị',
    `display_order` INT DEFAULT 0 COMMENT 'Thứ tự hiển thị',
    `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Trạng thái kích hoạt',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng danh mục sản phẩm';

-- -----------------------------------------------------------------------------
-- Bảng 3: products - Sản phẩm thời trang Routine
-- -----------------------------------------------------------------------------
CREATE TABLE `products` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã sản phẩm (VD: AT-001, SM-002)',
    `name` VARCHAR(255) NOT NULL COMMENT 'Tên sản phẩm',
    `category_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ categories(id)',
    `description` TEXT COMMENT 'Mô tả chi tiết',
    `price` DECIMAL(15,2) NOT NULL COMMENT 'Giá bán niêm yết (VNĐ)',
    `cost_price` DECIMAL(15,2) COMMENT 'Giá vốn bình quân (VNĐ)',
    `old_price` DECIMAL(15,2) COMMENT 'Giá gốc trước giảm giá (nếu có)',
    `stock` INT NOT NULL DEFAULT 0 COMMENT 'Tổng số lượng tồn kho (tổng các biến thể)',
    `min_stock` INT DEFAULT 10 COMMENT 'Mức tồn kho tối thiểu cảnh báo hết hàng',
    `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái: ACTIVE, INACTIVE, OUT_OF_STOCK',
    `image_url` LONGTEXT COMMENT 'Đường dẫn ảnh đại diện',
    `sku` VARCHAR(100) COMMENT 'Mã quản lý kho SKU chính',
    `material` VARCHAR(255) COMMENT 'Chất liệu (Cotton, Kaki, Linen...)',
    `fit` VARCHAR(100) COMMENT 'Form dáng (Slim-fit, Regular, Oversize...)',
    `season` VARCHAR(100) COMMENT 'Mùa (Xuân Hè, Thu Đông...)',
    `care_instructions` TEXT COMMENT 'Hướng dẫn giặt là và bảo quản',
    `rating` DECIMAL(3,2) DEFAULT 0 COMMENT 'Điểm đánh giá trung bình (1-5)',
    `review_count` INT DEFAULT 0 COMMENT 'Tổng số lượt đánh giá',
    `badge` VARCHAR(50) COMMENT 'Huy hiệu sản phẩm: NEW, HOT, SALE...',
    `target_gender` VARCHAR(20) COMMENT 'Đối tượng: MEN, WOMEN, UNISEX',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`),
    INDEX `idx_product_code` (`code`),
    INDEX `idx_product_category` (`category_id`),
    INDEX `idx_product_status` (`status`),
    INDEX `idx_product_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng thông tin sản phẩm';

-- -----------------------------------------------------------------------------
-- Bảng 4: product_variants - Biến thể kích cỡ (Size) và màu sắc (Color) của sản phẩm
-- -----------------------------------------------------------------------------
CREATE TABLE `product_variants` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `product_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ products(id)',
    `size` VARCHAR(20) COMMENT 'Kích cỡ: S, M, L, XL, XXL, 29, 30, 31...',
    `color` VARCHAR(50) COMMENT 'Màu sắc: Trắng, Đen, Xanh Navy, Be...',
    `stock` INT NOT NULL DEFAULT 0 COMMENT 'Số lượng tồn kho theo từng biến thể',
    `sku` VARCHAR(100) COMMENT 'Mã SKU chi tiết theo biến thể',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_product_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_product_variant` (`product_id`, `size`, `color`),
    INDEX `idx_product_variant_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng chi tiết biến thể kích cỡ, màu sắc của sản phẩm';

-- -----------------------------------------------------------------------------
-- Bảng 5: customers - Khách hàng thành viên và phân hạng
-- -----------------------------------------------------------------------------
CREATE TABLE `customers` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) UNIQUE COMMENT 'Email khách hàng',
    `password_hash` VARCHAR(255) COMMENT 'Mật khẩu tài khoản (nếu đăng ký online)',
    `full_name` VARCHAR(255) NOT NULL COMMENT 'Họ tên khách hàng',
    `phone` VARCHAR(20) NOT NULL COMMENT 'Số điện thoại liên hệ/tích điểm',
    `address` VARCHAR(500) COMMENT 'Địa chỉ nhận hàng',
    `district` VARCHAR(100) COMMENT 'Quận/Huyện',
    `city` VARCHAR(100) COMMENT 'Tỉnh/Thành phố',
    `tier` VARCHAR(50) NOT NULL DEFAULT 'REGULAR' COMMENT 'Hạng thành viên: REGULAR, SILVER (>=5tr), GOLD (>=20tr), VIP (>=50tr)',
    `total_orders` INT DEFAULT 0 COMMENT 'Tổng số đơn hàng đã mua',
    `total_spent` DECIMAL(15,2) DEFAULT 0 COMMENT 'Tổng chi tiêu tích lũy (VNĐ)',
    `last_order_at` DATETIME COMMENT 'Thời gian đơn hàng gần nhất',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_email` (`email`),
    INDEX `idx_phone` (`phone`),
    INDEX `idx_tier` (`tier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng khách hàng và hạng thành viên';

-- -----------------------------------------------------------------------------
-- Bảng 6: cart_items - Giỏ hàng online của khách hàng
-- -----------------------------------------------------------------------------
CREATE TABLE `cart_items` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ customers(id)',
    `product_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ products(id)',
    `quantity` INT NOT NULL DEFAULT 1 COMMENT 'Số lượng sản phẩm chọn mua',
    `size` VARCHAR(20) COMMENT 'Kích cỡ chọn',
    `color` VARCHAR(50) COMMENT 'Màu sắc chọn',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_cart_items_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cart_items_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
    UNIQUE KEY `uk_cart_item` (`customer_id`, `product_id`, `size`, `color`),
    INDEX `idx_cart_item_customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng giỏ hàng mua sắm online';

-- -----------------------------------------------------------------------------
-- Bảng 7: wishlist_items - Danh sách sản phẩm yêu thích của khách hàng
-- -----------------------------------------------------------------------------
CREATE TABLE `wishlist_items` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ customers(id)',
    `product_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ products(id)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_wishlist_items_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_wishlist_items_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
    UNIQUE KEY `uk_wishlist_item` (`customer_id`, `product_id`),
    INDEX `idx_wishlist_item_customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng danh sách sản phẩm yêu thích';

-- -----------------------------------------------------------------------------
-- Bảng 8: product_reviews - Đánh giá và nhận xét sản phẩm
-- -----------------------------------------------------------------------------
CREATE TABLE `product_reviews` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `product_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ products(id)',
    `customer_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ customers(id)',
    `rating` INT NOT NULL COMMENT 'Số sao đánh giá (1 đến 5 sao)',
    `comment` TEXT COMMENT 'Nội dung bình luận',
    `is_verified` BOOLEAN DEFAULT FALSE COMMENT 'Đã xác thực đã mua hàng hay chưa',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_product_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_product_reviews_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
    INDEX `idx_product_review_product` (`product_id`),
    INDEX `idx_product_review_customer` (`customer_id`),
    CONSTRAINT `chk_product_review_rating` CHECK (`rating` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng đánh giá sản phẩm từ khách hàng';

-- -----------------------------------------------------------------------------
-- Bảng 9: orders - Đơn hàng (Bán lẻ tại quầy POS & Đặt hàng Online)
-- -----------------------------------------------------------------------------
CREATE TABLE `orders` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `order_number` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã đơn hàng định danh (VD: ORD-20260904-0001)',
    `customer_id` BIGINT COMMENT 'Khóa ngoại trỏ customers(id) (NULL nếu khách vãng lai)',
    `subtotal` DECIMAL(15,2) NOT NULL COMMENT 'Tiền hàng trước giảm giá',
    `discount` DECIMAL(15,2) DEFAULT 0 COMMENT 'Số tiền được giảm giá',
    `total` DECIMAL(15,2) NOT NULL COMMENT 'Tổng tiền thanh toán cuối cùng',
    `payment_method` VARCHAR(50) NOT NULL COMMENT 'Phương thức thanh toán: CASH, TRANSFER, CARD, COD, VNPAY...',
    `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING' COMMENT 'Trạng thái: PENDING, CONFIRMED, SHIPPING, COMPLETED, CANCELLED',
    `channel` VARCHAR(50) NOT NULL DEFAULT 'OFFLINE' COMMENT 'Kênh bán: OFFLINE (quầy POS), ONLINE (website)',
    `created_by` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ users(id) (người tạo đơn/nhân viên)',
    `notes` TEXT COMMENT 'Ghi chú đơn hàng / Địa chỉ giao hàng',
    `delivered_at` DATETIME COMMENT 'Thời gian giao hàng thành công',
    `stock_deducted` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Đã trừ tồn kho hay chưa',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`),
    CONSTRAINT `fk_orders_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
    INDEX `idx_order_order_number` (`order_number`),
    INDEX `idx_order_customer` (`customer_id`),
    INDEX `idx_order_status` (`status`),
    INDEX `idx_order_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng đơn hàng bán hàng';

-- -----------------------------------------------------------------------------
-- Bảng 10: order_items - Chi tiết sản phẩm trong đơn hàng
-- -----------------------------------------------------------------------------
CREATE TABLE `order_items` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ orders(id)',
    `product_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ products(id)',
    `product_code` VARCHAR(50) NOT NULL COMMENT 'Mã sản phẩm lưu vết tại thời điểm mua',
    `product_name` VARCHAR(255) NOT NULL COMMENT 'Tên sản phẩm lưu vết tại thời điểm mua',
    `price` DECIMAL(15,2) NOT NULL COMMENT 'Đơn giá bán tại thời điểm mua',
    `quantity` INT NOT NULL COMMENT 'Số lượng mua',
    `subtotal` DECIMAL(15,2) NOT NULL COMMENT 'Thành tiền = price * quantity',
    `size` VARCHAR(20) COMMENT 'Kích cỡ chọn mua',
    `color` VARCHAR(50) COMMENT 'Màu sắc chọn mua',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
    INDEX `idx_order_item_order` (`order_id`),
    INDEX `idx_order_item_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng chi tiết các mặt hàng trong đơn hàng';

-- -----------------------------------------------------------------------------
-- Bảng 11: promotions - Chương trình khuyến mãi & Mã giảm giá
-- -----------------------------------------------------------------------------
CREATE TABLE `promotions` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã khuyến mãi (VD: SALE10, GIAM50K)',
    `name` VARCHAR(255) NOT NULL COMMENT 'Tên chương trình khuyến mãi',
    `description` TEXT COMMENT 'Mô tả thể lệ khuyến mãi',
    `type` VARCHAR(50) NOT NULL COMMENT 'Loại khuyến mãi: PERCENT (phần trăm), FIXED_AMOUNT (tiền cố định)',
    `discount_value` DECIMAL(15,2) NOT NULL COMMENT 'Giá trị giảm (% hoặc số tiền VNĐ)',
    `max_discount_amount` DECIMAL(15,2) COMMENT 'Số tiền giảm tối đa (khi áp dụng loại PERCENT)',
    `start_date` DATETIME NOT NULL COMMENT 'Ngày bắt đầu có hiệu lực',
    `end_date` DATETIME NOT NULL COMMENT 'Ngày kết thúc hiệu lực',
    `min_order_amount` DECIMAL(15,2) DEFAULT 0 COMMENT 'Giá trị đơn hàng tối thiểu để áp dụng',
    `apply_to_all_products` BOOLEAN DEFAULT TRUE COMMENT 'Áp dụng cho toàn bộ sản phẩm (true) hoặc theo danh sách (false)',
    `usage_limit` INT COMMENT 'Giới hạn tổng lượt sử dụng (NULL: không giới hạn)',
    `usage_count` INT DEFAULT 0 COMMENT 'Số lượt đã sử dụng thực tế',
    `status` VARCHAR(50) NOT NULL DEFAULT 'DRAFT' COMMENT 'Trạng thái: DRAFT, ACTIVE, INACTIVE, EXPIRED',
    `created_by` BIGINT COMMENT 'Khóa ngoại trỏ users(id) - người tạo',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_code` (`code`),
    INDEX `idx_status` (`status`),
    INDEX `idx_dates` (`start_date`, `end_date`),
    INDEX `idx_type` (`type`),
    CONSTRAINT `chk_promotion_dates` CHECK (`end_date` > `start_date`),
    CONSTRAINT `chk_promotion_discount_value` CHECK (`discount_value` >= 0),
    CONSTRAINT `chk_promotion_usage_count` CHECK (`usage_count` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng khuyến mãi và voucher giảm giá';

-- -----------------------------------------------------------------------------
-- Bảng 12: promotion_products - Liên kết sản phẩm áp dụng khuyến mãi
-- -----------------------------------------------------------------------------
CREATE TABLE `promotion_products` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `promotion_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ promotions(id)',
    `product_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ products(id)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_promotion_products_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_promotion_products_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_promotion_product` (`promotion_id`, `product_id`),
    INDEX `idx_promotion_id` (`promotion_id`),
    INDEX `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng liên kết sản phẩm được áp dụng mã giảm giá';

-- -----------------------------------------------------------------------------
-- Bảng 13: suppliers - Nhà cung cấp hàng hóa
-- -----------------------------------------------------------------------------
CREATE TABLE `suppliers` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `ma_ncc` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã nhà cung cấp (VD: NCC-001)',
    `ten_ncc` VARCHAR(200) NOT NULL COMMENT 'Tên nhà cung cấp / Công ty may mặc',
    `dia_chi` TEXT COMMENT 'Địa chỉ nhà cung cấp',
    `so_dien_thoai` VARCHAR(20) COMMENT 'Số điện thoại liên hệ',
    `email` VARCHAR(100) COMMENT 'Email giao dịch',
    `nguoi_lien_he` VARCHAR(100) COMMENT 'Tên đại diện liên hệ',
    `ghi_chu` TEXT COMMENT 'Ghi chú bổ sung',
    `trang_thai` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái: ACTIVE, INACTIVE',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_ma_ncc` (`ma_ncc`),
    INDEX `idx_ten_ncc` (`ten_ncc`),
    INDEX `idx_trang_thai` (`trang_thai`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng nhà cung cấp hàng hóa';

-- -----------------------------------------------------------------------------
-- Bảng 14: phieu_nhap_kho - Phiếu nhập kho hàng hóa từ nhà cung cấp
-- -----------------------------------------------------------------------------
CREATE TABLE `phieu_nhap_kho` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `ma_phieu_nhap` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã phiếu nhập (VD: PNK-20260904-001)',
    `ngay_nhap` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày lập phiếu nhập',
    `nha_cung_cap_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ suppliers(id)',
    `trang_thai` VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT 'Trạng thái: DRAFT (nháp), DA_DUYET (đã duyệt), TU_CHOI (từ chối)',
    `tong_so_luong` INT DEFAULT 0 COMMENT 'Tổng số lượng sản phẩm nhập',
    `tong_tien` DECIMAL(15,2) DEFAULT 0 COMMENT 'Tổng giá trị nhập kho (VNĐ)',
    `ghi_chu` TEXT COMMENT 'Ghi chú phiếu nhập',
    `nguoi_tao_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ users(id) - thủ kho tạo phiếu',
    `nguoi_duyet_id` BIGINT COMMENT 'Khóa ngoại trỏ users(id) - quản lý duyệt phiếu',
    `ngay_duyet` DATETIME COMMENT 'Thời gian duyệt phiếu',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_phieu_nhap_ncc` FOREIGN KEY (`nha_cung_cap_id`) REFERENCES `suppliers`(`id`),
    CONSTRAINT `fk_phieu_nhap_nguoi_tao` FOREIGN KEY (`nguoi_tao_id`) REFERENCES `users`(`id`),
    CONSTRAINT `fk_phieu_nhap_nguoi_duyet` FOREIGN KEY (`nguoi_duyet_id`) REFERENCES `users`(`id`),
    INDEX `idx_ma_phieu_nhap` (`ma_phieu_nhap`),
    INDEX `idx_ngay_nhap` (`ngay_nhap`),
    INDEX `idx_trang_thai` (`trang_thai`),
    INDEX `idx_nha_cung_cap` (`nha_cung_cap_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng phiếu nhập kho hàng hóa';

-- -----------------------------------------------------------------------------
-- Bảng 15: chi_tiet_phieu_nhap - Chi tiết các sản phẩm trong phiếu nhập kho
-- -----------------------------------------------------------------------------
CREATE TABLE `chi_tiet_phieu_nhap` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `phieu_nhap_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ phieu_nhap_kho(id)',
    `product_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ products(id)',
    `so_luong_nhap` INT NOT NULL COMMENT 'Số lượng nhập',
    `gia_nhap` DECIMAL(15,2) NOT NULL COMMENT 'Đơn giá nhập từ NCC (VNĐ)',
    `thanh_tien` DECIMAL(15,2) COMMENT 'Thành tiền = so_luong_nhap * gia_nhap',
    `so_luong_ton_truoc_nhap` INT NOT NULL DEFAULT 0 COMMENT 'Số lượng tồn hệ thống trước khi nhập',
    `ghi_chu` TEXT COMMENT 'Ghi chú',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_ct_phieu_nhap_phieu` FOREIGN KEY (`phieu_nhap_id`) REFERENCES `phieu_nhap_kho`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ct_phieu_nhap_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
    INDEX `idx_ct_phieu_nhap` (`phieu_nhap_id`),
    INDEX `idx_ct_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng chi tiết các mặt hàng trong phiếu nhập kho';

-- -----------------------------------------------------------------------------
-- Bảng 16: phieu_xuat_kho - Phiếu xuất kho hàng hóa
-- -----------------------------------------------------------------------------
CREATE TABLE `phieu_xuat_kho` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `ma_phieu_xuat` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã phiếu xuất (VD: PXK-20260904-001)',
    `ngay_xuat` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày lập phiếu xuất',
    `ly_do_xuat` VARCHAR(30) NOT NULL COMMENT 'Lý do xuất: BAN_HANG, TRA_HANG_NCC, HUY_HANG, CHUYEN_KHO',
    `trang_thai` VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT 'Trạng thái: DRAFT, DA_DUYET, TU_CHOI',
    `order_id` BIGINT COMMENT 'Khóa ngoại trỏ orders(id) nếu xuất cho đơn hàng',
    `tong_so_luong` INT DEFAULT 0 COMMENT 'Tổng số lượng xuất',
    `ghi_chu` TEXT COMMENT 'Ghi chú lý do chi tiết',
    `nguoi_tao_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ users(id) - người lập phiếu',
    `nguoi_duyet_id` BIGINT COMMENT 'Khóa ngoại trỏ users(id) - người duyệt xuất kho',
    `ngay_duyet` DATETIME COMMENT 'Thời gian duyệt phiếu xuất',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_phieu_xuat_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
    CONSTRAINT `fk_phieu_xuat_nguoi_tao` FOREIGN KEY (`nguoi_tao_id`) REFERENCES `users`(`id`),
    CONSTRAINT `fk_phieu_xuat_nguoi_duyet` FOREIGN KEY (`nguoi_duyet_id`) REFERENCES `users`(`id`),
    INDEX `idx_ma_phieu_xuat` (`ma_phieu_xuat`),
    INDEX `idx_ngay_xuat` (`ngay_xuat`),
    INDEX `idx_trang_thai_xuat` (`trang_thai`),
    INDEX `idx_order` (`order_id`),
    INDEX `idx_ly_do_xuat` (`ly_do_xuat`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng phiếu xuất kho hàng hóa';

-- -----------------------------------------------------------------------------
-- Bảng 17: chi_tiet_phieu_xuat - Chi tiết các sản phẩm trong phiếu xuất kho
-- -----------------------------------------------------------------------------
CREATE TABLE `chi_tiet_phieu_xuat` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `phieu_xuat_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ phieu_xuat_kho(id)',
    `product_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ products(id)',
    `so_luong_xuat` INT NOT NULL COMMENT 'Số lượng xuất kho',
    `so_luong_ton_truoc_xuat` INT NOT NULL DEFAULT 0 COMMENT 'Số lượng tồn hệ thống trước khi xuất',
    `ghi_chu` TEXT COMMENT 'Ghi chú',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_ct_phieu_xuat_phieu` FOREIGN KEY (`phieu_xuat_id`) REFERENCES `phieu_xuat_kho`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ct_phieu_xuat_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
    INDEX `idx_ct_phieu_xuat` (`phieu_xuat_id`),
    INDEX `idx_ct_xuat_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng chi tiết các mặt hàng trong phiếu xuất kho';

-- -----------------------------------------------------------------------------
-- Bảng 18: kiem_ke - Phiếu kiểm kê định kỳ kho hàng
-- -----------------------------------------------------------------------------
CREATE TABLE `kiem_ke` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `ma_kiem_ke` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã phiếu kiểm kê (VD: PKK-20260904-001)',
    `ngay_kiem_ke` DATE NOT NULL COMMENT 'Ngày tiến hành kiểm kê',
    `trang_thai` VARCHAR(20) NOT NULL DEFAULT 'DANG_KIEM' COMMENT 'Trạng thái: DANG_KIEM, HOAN_THANH, HUY',
    `nguoi_kiem_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ users(id) - người thực hiện kiểm kê',
    `ghi_chu` TEXT COMMENT 'Ghi chú đợt kiểm kê',
    `ngay_hoan_thanh` DATETIME COMMENT 'Thời điểm chốt kết quả và cân đối kho',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_kiem_ke_nguoi_kiem` FOREIGN KEY (`nguoi_kiem_id`) REFERENCES `users`(`id`),
    INDEX `idx_ma_kiem_ke` (`ma_kiem_ke`),
    INDEX `idx_ngay_kiem_ke` (`ngay_kiem_ke`),
    INDEX `idx_trang_thai_kiem_ke` (`trang_thai`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng đợt kiểm kê định kỳ kho hàng';

-- -----------------------------------------------------------------------------
-- Bảng 19: chi_tiet_kiem_ke - Chi tiết số lượng hệ thống và thực tế của từng sản phẩm
-- -----------------------------------------------------------------------------
CREATE TABLE `chi_tiet_kiem_ke` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `kiem_ke_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ kiem_ke(id)',
    `product_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ products(id)',
    `so_luong_he_thong` INT NOT NULL COMMENT 'Số lượng tồn trên phần mềm tại thời điểm chốt',
    `so_luong_thuc_te` INT COMMENT 'Số lượng đếm thực tế tại kệ kho',
    `chenh_lech` INT COMMENT 'Chênh lệch = so_luong_thuc_te - so_luong_he_thong',
    `ghi_chu` TEXT COMMENT 'Ghi chú lý do lệch (thất thoát, hỏng, nhập nhầm...)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_ct_kiem_ke_kiem_ke` FOREIGN KEY (`kiem_ke_id`) REFERENCES `kiem_ke`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ct_kiem_ke_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
    UNIQUE KEY `uk_kiem_ke_product` (`kiem_ke_id`, `product_id`),
    INDEX `idx_ct_kiem_ke` (`kiem_ke_id`),
    INDEX `idx_ct_kiem_ke_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng chi tiết kết quả kiểm đếm từng sản phẩm';

-- -----------------------------------------------------------------------------
-- Bảng 20: bang_luong - Bảng tính lương nhân viên hàng tháng
-- -----------------------------------------------------------------------------
CREATE TABLE `bang_luong` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL COMMENT 'Khóa ngoại trỏ users(id) - nhân viên',
    `thang` INT NOT NULL COMMENT 'Tháng tính lương (1 - 12)',
    `nam` INT NOT NULL COMMENT 'Năm tính lương (VD: 2026)',
    `luong_co_ban` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'Mức lương cơ bản (VNĐ)',
    `he_so` DECIMAL(5,2) NOT NULL DEFAULT 1.0 COMMENT 'Hệ số lương chức danh',
    `phu_cap` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'Tiền phụ cấp trách nhiệm, ăn trưa (VNĐ)',
    `thuong` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'Tiền thưởng hiệu quả công việc, doanh số (VNĐ)',
    `khau_tru` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'Các khoản khấu trừ BHXH, đi trễ, phạt (VNĐ)',
    `ghi_chu` VARCHAR(500) NULL COMMENT 'Ghi chú bảng lương',
    `trang_thai` VARCHAR(20) NOT NULL DEFAULT 'NHAP' COMMENT 'Trạng thái: NHAP (bản nháp), DA_DUYET (kế toán/quản lý đã duyệt)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_bang_luong_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
    CONSTRAINT `uq_bang_luong_user_thang` UNIQUE (`user_id`, `thang`, `nam`),
    INDEX `idx_bang_luong_thang` (`nam`, `thang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng tính lương nhân viên hàng tháng';

-- =============================================================================
-- KẾT THÚC LƯỢC ĐỒ CSDL ROUTINE (20 BẢNG)
-- =============================================================================
