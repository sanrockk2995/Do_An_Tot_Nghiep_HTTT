-- ============================================================
-- Routine — Seed dữ liệu mẫu
-- Mật khẩu tất cả tài khoản: 123456 (BCrypt)
-- ============================================================

-- Nhân viên nội bộ: 1 tài khoản mỗi role
INSERT INTO users (email, password_hash, full_name, phone, branch, role, is_active) VALUES
('admin@routine.vn',    '$2a$10$lBl6.XkvnUuuf/VYj3Gn3eVRTG8OxkQleVxce8335y41nR/59h89a', 'Nguyễn Văn Quản',  '0901000001', 'Hà Nội', 'ADMIN',           TRUE),
('sales@routine.vn',    '$2a$10$lBl6.XkvnUuuf/VYj3Gn3eVRTG8OxkQleVxce8335y41nR/59h89a', 'Trần Thị Bán',     '0901000002', 'Hà Nội', 'SALES_STAFF',     TRUE),
('kho@routine.vn',      '$2a$10$lBl6.XkvnUuuf/VYj3Gn3eVRTG8OxkQleVxce8335y41nR/59h89a', 'Lê Văn Kho',       '0901000003', 'Hà Nội', 'WAREHOUSE_STAFF', TRUE),
('keToan@routine.vn',   '$2a$10$lBl6.XkvnUuuf/VYj3Gn3eVRTG8OxkQleVxce8335y41nR/59h89a', 'Phạm Thị Toán',    '0901000004', 'Hà Nội', 'ACCOUNTANT',      TRUE);

-- Danh mục (theo UI tài liệu: Tất cả, áo sơ mi, áo khoác, quần jean...)
INSERT INTO categories (name, slug, description, icon, display_order) VALUES
('Áo sơ mi',     'ao-so-mi',   'Áo sơ mi nam/nữ công sở và thời trang', 'shirt',        1),
('Áo thun',      'ao-thun',    'Áo thun cổ tròn, polo chất cotton',     'tshirt',       2),
('Áo khoác',     'ao-khoac',   'Áo khoác jacket, blazer, hoodie',       'coat',         3),
('Quần jean',    'quan-jean',  'Quần jean nam/nữ các kiểu dáng',        'jeans',        4),
('Quần kaki',    'quan-kaki',  'Quần kaki công sở, casual',             'trousers',     5),
('Váy/Đầm',      ' vay-dam',   'Váy đầm nữ thời trang',                 'dress',        6);

UPDATE categories SET slug = 'vay-dam' WHERE slug = ' vay-dam';

-- Sản phẩm mẫu
INSERT INTO products (code, name, category_id, description, price, cost_price, old_price, stock, min_stock, status, sku, material, fit, season, target_gender, badge) VALUES
('ASM001', 'Áo sơ mi trắng cơ bản',      1, 'Áo sơ mi trắng dài tay chất cotton mềm', 350000.00, 180000.00, NULL,      120, 20, 'ACTIVE', 'ASM001', 'Cotton 100%', 'Regular', 'All Season', 'UNISEX',  NULL),
('ASM002', 'Áo sơ mi xanh dương kẻ sọc', 1, 'Áo sơ mi kẻ sọc thanh lịch',           420000.00, 220000.00, 480000.00, 80,  15, 'ACTIVE', 'ASM002', 'Cotton pha',  'Slim',    'All Season', 'MALE',    'SALE'),
('ATH001', 'Áo thun đen cổ tròn',        2, 'Áo thun cotton co giãn thoáng mát',     190000.00, 90000.00,  NULL,      200, 30, 'ACTIVE', 'ATH001', 'Cotton spandex','Regular','Summer',    'UNISEX',  'BESTSELLER'),
('AKC001', 'Áo khoác jean xanh',         3, 'Áo khoác jean dáng rộng phong cách',    650000.00, 350000.00, NULL,      45,  10, 'ACTIVE', 'AKC001', 'Denim',       'Oversize','Fall',       'UNISEX',  'NEW'),
('QJE001', 'Quần jean xanh basic',       4, 'Quần jean dáng thẳng basic',            480000.00, 250000.00, NULL,      95,  20, 'ACTIVE', 'QJE001', 'Denim cotton','Straight','All Season', 'MALE',    NULL),
('QJE002', 'Quần jean nữ ống loe',       4, 'Quần jean ống loe thời trang nữ',       520000.00, 270000.00, 590000.00, 60,  15, 'ACTIVE', 'QJE002', 'Denim stretch','Flare',  'All Season', 'FEMALE',  'SALE'),
('VAY001', 'Váy hoa nhí hè',             6, 'Váy hoa nhí dáng xòe dễ thương',        450000.00, 230000.00, NULL,      40,  10, 'ACTIVE', 'VAY001', 'Chiffon',     'A-line',  'Summer',     'FEMALE',  'NEW'),
('QKA001', 'Quần kaki nam vải bạt',      5, 'Quần kaki bạt bền đẹp',                 380000.00, 190000.00, NULL,      8,   10, 'ACTIVE', 'QKA001', 'Canvas',      'Regular', 'All Season', 'MALE',    NULL),
('ATH002', 'Áo thun trắng in hình',      2, 'Áo thun trắng in hoạ tiết độc quyền',   210000.00, 100000.00, NULL,      150, 25, 'ACTIVE', 'ATH002', 'Cotton 100%', 'Regular', 'Summer',     'UNISEX',  NULL);

-- Biến thể sản phẩm (size/màu)
INSERT INTO product_variants (product_id, size, color, stock, sku) VALUES
(1, 'S',    'Trắng',        30, 'ASM001-S-TRANG'),
(1, 'M',    'Trắng',        40, 'ASM001-M-TRANG'),
(1, 'L',    'Trắng',        35, 'ASM001-L-TRANG'),
(1, 'XL',   'Trắng',        15, 'ASM001-XL-TRANG'),
(2, 'M',    'Xanh dương',   30, 'ASM002-M-XANHDUONG'),
(2, 'L',    'Xanh dương',   30, 'ASM002-L-XANHDUONG'),
(3, 'M',    'Đen',          60, 'ATH001-M-DEN'),
(3, 'L',    'Đen',          70, 'ATH001-L-DEN'),
(3, 'XL',   'Đen',          50, 'ATH001-XL-DEN'),
(3, 'M',    'Trắng',        20, 'ATH001-M-TRANG'),
(4, 'M',    'Xanh jean',    15, 'AKC001-M-XANHJEAN'),
(4, 'L',    'Xanh jean',    18, 'AKC001-L-XANHJEAN'),
(5, '30',   'Xanh denim',   25, 'QJE001-30-XANHDENIM'),
(5, '31',   'Xanh denim',   25, 'QJE001-31-XANHDENIM'),
(5, '32',   'Xanh denim',   30, 'QJE001-32-XANHDENIM'),
(6, 'S',    'Xanh nhạt',    20, 'QJE002-S-XANHNHAT'),
(6, 'M',    'Xanh nhạt',    22, 'QJE002-M-XANHNHAT'),
(7, 'S',    'Hoa vàng',     12, 'VAY001-S-HOAVANG'),
(7, 'M',    'Hoa vàng',     16, 'VAY001-M-HOAVANG'),
(7, 'L',    'Hoa vàng',     12, 'VAY001-L-HOAVANG'),
(8, '31',   'Be',           4,  'QKA001-31-BE'),
(8, '32',   'Be',           4,  'QKA001-32-BE'),
(9, 'M',    'Trắng',        50, 'ATH002-M-TRANG'),
(9, 'L',    'Trắng',        55, 'ATH002-L-TRANG');

-- Khách hàng mẫu (mật khẩu 123456)
INSERT INTO customers (email, password_hash, full_name, phone, address, district, city, tier, total_orders, total_spent) VALUES
('khach@routine.vn', '$2a$10$lBl6.XkvnUuuf/VYj3Gn3eVRTG8OxkQleVxce8335y41nR/59h89a', 'Ngô Thị Khách',  '0933000001', '123 Nguyễn Trãi', 'Thanh Xuân',  'Hà Nội',     'GOLD',    8, 12500000.00),
('minh@example.com', '$2a$10$lBl6.XkvnUuuf/VYj3Gn3eVRTG8OxkQleVxce8335y41nR/59h89a', 'Hoàng Văn Minh', '0933000002', '45 Lê Lợi',       'Hải Châu',    'Đà Nẵng',    'REGULAR', 1, 480000.00),
('lan@example.com',  '$2a$10$lBl6.XkvnUuuf/VYj3Gn3eVRTG8OxkQleVxce8335y41nR/59h89a', 'Đỗ Thu Lan',     '0933000003', '67 Trần Phú',     'District 1',  'TP.HCM',     'SILVER',  4, 3200000.00);

-- Nhà cung cấp
INSERT INTO suppliers (ma_ncc, ten_ncc, dia_chi, so_dien_thoai, email, nguoi_lien_he, ghi_chu, trang_thai) VALUES
('NCC001', 'Công ty Dệt may An Phước',    'Bình Dương',              '0918000001', 'anphuoc@textile.vn',   'Anh Hùng',  'NCC chính về áo thun',      'ACTIVE'),
('NCC002', 'Xưởng Denim Việt',            'TP. Thủ Đức, TP.HCM',     '0918000002', 'denimviet@gmail.com',  'Chị Mai',   'Chuyên jean, denim',        'ACTIVE'),
('NCC003', 'May mặc Hoa Sen',             'Hà Đông, Hà Nội',         '0918000003', 'hoasen@maymac.vn',     'Anh Tú',    'Áo sơ mi, kaki công sở',    'ACTIVE');

-- Khuyến mại mẫu
INSERT INTO promotions (code, name, description, type, discount_value, max_discount_amount, start_date, end_date, min_order_amount, apply_to_all_products, usage_limit, usage_count, status, created_by) VALUES
('SALE10',  'Giảm 10% toàn bộ đơn',  'Giảm 10% tối đa 100k cho mọi đơn hàng',  'PERCENT',    10.00,   100000.00, NOW() - INTERVAL 7 DAY, NOW() + INTERVAL 60 DAY, 0,        TRUE,  1000, 0, 'ACTIVE', 1),
('GIAM50K', 'Giảm trực tiếp 50.000đ','Giảm 50k cho đơn từ 500k',               'FIXED_AMOUNT', 50000.00, NULL,    NOW() - INTERVAL 3 DAY, NOW() + INTERVAL 30 DAY, 500000.00, TRUE,  200,  0, 'ACTIVE', 1);

-- Đơn hàng mẫu đã hoàn thành (để có dữ liệu báo cáo)
INSERT INTO orders (order_number, customer_id, subtotal, discount, total, payment_method, status, channel, created_by, notes, delivered_at, stock_deducted, created_at) VALUES
('HD20250801001', 1, 540000.00, 54000.00, 486000.00, 'CASH',       'COMPLETED', 'OFFLINE', 2, 'Khách mua tại quầy',          NOW() - INTERVAL 23 DAY, TRUE, NOW() - INTERVAL 23 DAY),
('HD20250805002', 2, 480000.00, 0.00,     480000.00, 'BANK_TRANSFER','COMPLETED','ONLINE',  2, 'Đơn online giao tận nhà',     NOW() - INTERVAL 19 DAY, TRUE, NOW() - INTERVAL 19 DAY),
('HD20250812003', 3, 970000.00, 100000.00, 870000.00, 'BANK_TRANSFER','COMPLETED','OFFLINE',2, NULL,                          NOW() - INTERVAL 12 DAY, TRUE, NOW() - INTERVAL 12 DAY),
('HD20250818004', 1, 210000.00, 0.00,     210000.00, 'CASH',        'COMPLETED','OFFLINE', 2, NULL,                          NOW() - INTERVAL 6 DAY,  TRUE, NOW() - INTERVAL 6 DAY),
('HD20250822005', 3, 1300000.00, 100000.00, 1200000.00,'CASH',       'COMPLETED', 'OFFLINE', 2, 'Mua số lượng lớn',           NOW() - INTERVAL 2 DAY,  TRUE, NOW() - INTERVAL 2 DAY);

INSERT INTO order_items (order_id, product_id, product_code, product_name, price, quantity, subtotal, size, color, created_at) VALUES
(1, 1, 'ASM001', 'Áo sơ mi trắng cơ bản', 350000.00, 1, 350000.00, 'M', 'Trắng',      NOW() - INTERVAL 23 DAY),
(1, 3, 'ATH001', 'Áo thun đen cổ tròn',   190000.00, 1, 190000.00, 'L', 'Đen',        NOW() - INTERVAL 23 DAY),
(2, 5, 'QJE001', 'Quần jean xanh basic',  480000.00, 1, 480000.00, '32','Xanh denim', NOW() - INTERVAL 19 DAY),
(3, 2, 'ASM002', 'Áo sơ mi xanh dương kẻ sọc', 420000.00, 1, 420000.00, 'L', 'Xanh dương', NOW() - INTERVAL 12 DAY),
(3, 6, 'QJE002', 'Quần jean nữ ống loe',  550000.00, 1, 550000.00, 'M', 'Xanh nhạt',  NOW() - INTERVAL 12 DAY),
(4, 9, 'ATH002', 'Áo thun trắng in hình', 210000.00, 1, 210000.00, 'M', 'Trắng',      NOW() - INTERVAL 6 DAY),
(5, 4, 'AKC001', 'Áo khoác jean xanh',    650000.00, 1, 650000.00, 'L', 'Xanh jean',  NOW() - INTERVAL 2 DAY),
(5, 7, 'VAY001', 'Váy hoa nhí hè',        450000.00, 1, 450000.00, 'M', 'Hoa vàng',   NOW() - INTERVAL 2 DAY),
(5, 9, 'ATH002', 'Áo thun trắng in hình', 210000.00, 1, 210000.00, 'L', 'Trắng',      NOW() - INTERVAL 2 DAY);

-- Đánh giá sản phẩm mẫu
INSERT INTO product_reviews (product_id, customer_id, rating, comment, is_verified) VALUES
(1, 1, 5, 'Áo đẹp, vải mát, mặc form chuẩn.', TRUE),
(3, 1, 4, 'Áo ổn trong tầm giá, màu lên như hình.', TRUE),
(5, 2, 5, 'Jean dày dặn, đóng gói cẩn thận.', TRUE),
(6, 3, 4, 'Dáng ống loe đẹp, nên chọn size lớn hơn 1 size.', TRUE),
(4, 3, 5, 'Khoác rất xịn, may chắc chắn.', TRUE);

UPDATE products p SET
  rating = (SELECT ROUND(AVG(r.rating), 2) FROM product_reviews r WHERE r.product_id = p.id),
  review_count = (SELECT COUNT(*) FROM product_reviews r WHERE r.product_id = p.id);
