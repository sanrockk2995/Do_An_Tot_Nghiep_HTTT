package com.routine.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chi_tiet_phieu_xuat")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ChiTietPhieuXuat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phieu_xuat_id", nullable = false)
    @ToString.Exclude
    private PhieuXuatKho phieuXuat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @ToString.Exclude
    private Product product;

    @Column(name = "so_luong_xuat", nullable = false)
    private Integer soLuongXuat;

    @Column(name = "so_luong_ton_truoc_xuat", nullable = false)
    private Integer soLuongTonTruocXuat;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
