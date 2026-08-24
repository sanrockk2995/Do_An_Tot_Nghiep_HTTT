package com.routine.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Bảng lương nhân viên theo tháng (UC "Bảng lương nhân viên" — SRS).
 */
@Entity
@Table(name = "bang_luong")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class BangLuong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Tháng 1-12 */
    @Column(nullable = false)
    private Integer thang;

    @Column(nullable = false)
    private Integer nam;

    @Column(name = "luong_co_ban", nullable = false, precision = 12, scale = 2)
    private BigDecimal luongCoBan;

    /** Hệ số lương */
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal heSo;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal phuCap;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal thuong;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal khauTru;

    @Column(length = 500)
    private String ghiChu;

    /** NHAP | DA_DUYET */
    @Column(name = "trang_thai", nullable = false, length = 20)
    private String trangThai;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    /** Tổng lương thực nhận = (lương cơ bản × hệ số) + phụ cấp + thưởng − khấu trừ. */
    public BigDecimal tongLuong() {
        BigDecimal base = luongCoBan == null ? BigDecimal.ZERO : luongCoBan
                .multiply(heSo == null ? BigDecimal.ONE : heSo);
        BigDecimal phuCapVal = phuCap == null ? BigDecimal.ZERO : phuCap;
        BigDecimal thuongVal = thuong == null ? BigDecimal.ZERO : thuong;
        BigDecimal khauTruVal = khauTru == null ? BigDecimal.ZERO : khauTru;
        return base.add(phuCapVal).add(thuongVal).subtract(khauTruVal);
    }
}
