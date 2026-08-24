package com.routine.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "chi_tiet_phieu_nhap")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ChiTietPhieuNhap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phieu_nhap_id", nullable = false)
    @ToString.Exclude
    private PhieuNhapKho phieuNhap;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @ToString.Exclude
    private Product product;

    @Column(name = "so_luong_nhap", nullable = false)
    private Integer soLuongNhap;

    @Column(name = "gia_nhap", nullable = false, precision = 15, scale = 2)
    private BigDecimal giaNhap;

    @Column(name = "thanh_tien", precision = 15, scale = 2)
    private BigDecimal thanhTien;

    /** Tồn kho của sản phẩm ngay trước khi nhập */
    @Column(name = "so_luong_ton_truoc_nhap", nullable = false)
    private Integer soLuongTonTruocNhap;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
