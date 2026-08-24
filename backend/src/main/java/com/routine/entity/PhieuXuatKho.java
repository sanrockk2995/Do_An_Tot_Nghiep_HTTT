package com.routine.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "phieu_xuat_kho")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PhieuXuatKho {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_phieu_xuat", nullable = false, unique = true, length = 50)
    private String maPhieuXuat;

    @Column(name = "ngay_xuat", nullable = false)
    private LocalDateTime ngayXuat;

    /** HANG_HONG | TRA_NCC | SUA_CHUA | DIEU_CHINH ... (≤30 ký tự) */
    @Column(name = "ly_do_xuat", nullable = false, length = 30)
    private String lyDoXuat;

    /** DRAFT | APPROVED | CANCELLED */
    @Column(name = "trang_thai", nullable = false, length = 20)
    private String trangThai;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    @ToString.Exclude
    private Order order;

    @Column(name = "tong_so_luong")
    private Integer tongSoLuong;

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

    @OneToMany(mappedBy = "phieuXuat", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    @Builder.Default
    private List<ChiTietPhieuXuat> chiTiet = new ArrayList<>();
}
