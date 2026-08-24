package com.routine.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "phieu_nhap_kho")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PhieuNhapKho {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_phieu_nhap", nullable = false, unique = true, length = 50)
    private String maPhieuNhap;

    @Column(name = "ngay_nhap", nullable = false)
    private LocalDateTime ngayNhap;

    /** FK trỏ suppliers(id) — đã chuẩn hoá theo ghi chú đặc tả */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nha_cung_cap_id", nullable = false)
    @ToString.Exclude
    private Supplier nhaCungCap;

    /** DRAFT | APPROVED | CANCELLED */
    @Column(name = "trang_thai", nullable = false, length = 20)
    private String trangThai;

    @Column(name = "tong_so_luong")
    private Integer tongSoLuong;

    @Column(name = "tong_tien", precision = 15, scale = 2)
    private BigDecimal tongTien;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoi_tao_id", nullable = false)
    @ToString.Exclude
    private User nguoiTao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoi_duyet_id")
    @ToString.Exclude
    private User nguoiDuyet;

    @Column(name = "ngay_duyet")
    private LocalDateTime ngayDuyet;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "phieuNhap", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    @Builder.Default
    private List<ChiTietPhieuNhap> chiTiet = new ArrayList<>();
}
