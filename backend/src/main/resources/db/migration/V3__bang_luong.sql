-- V3: Bảng lương nhân viên (UC "Bảng lương nhân viên" — SRS)
-- Kế toán/quản lý xem bảng lương theo tháng, cập nhật hệ số, phụ cấp, thưởng, khấu trừ.

CREATE TABLE bang_luong (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT       NOT NULL COMMENT 'Nhân viên',
    thang           INT          NOT NULL COMMENT 'Tháng 1-12',
    nam             INT          NOT NULL COMMENT 'Năm',
    luong_co_ban    DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'Lương cơ bản',
    he_so           DECIMAL(5,2) NOT NULL DEFAULT 1.0 COMMENT 'Hệ số lương',
    phu_cap         DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'Phụ cấp',
    thuong          DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'Thưởng',
    khau_tru        DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'Khấu trừ',
    ghi_chu         VARCHAR(500) NULL,
    trang_thai      VARCHAR(20)  NOT NULL DEFAULT 'NHAP' COMMENT 'NHAP | DA_DUYET',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bang_luong_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uq_bang_luong_user_thang UNIQUE (user_id, thang, nam),
    INDEX idx_bang_luong_thang (nam, thang)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
