package com.routine.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chi_tiet_kiem_ke")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ChiTietKiemKe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kiem_ke_id", nullable = false)
    @ToString.Exclude
    private KiemKe kiemKe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @ToString.Exclude
    private Product product;

    @Column(name = "so_luong_he_thong", nullable = false)
    private Integer soLuongHeThong;

    @Column(name = "so_luong_thuc_te")
    private Integer soLuongThucTe;

    /** thuc_te - he_thong; âm là thiếu hàng */
    @Column(name = "chenh_lech")
    private Integer chenhLech;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
