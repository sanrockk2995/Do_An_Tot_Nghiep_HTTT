package com.routine.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "kiem_ke")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class KiemKe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_kiem_ke", nullable = false, unique = true, length = 50)
    private String maKiemKe;

    @Column(name = "ngay_kiem_ke", nullable = false)
    private LocalDate ngayKiemKe;

    /** DANG_KIEM | HOAN_THANH | HUY */
    @Column(name = "trang_thai", nullable = false, length = 20)
    private String trangThai;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoi_kiem_id", nullable = false)
    @ToString.Exclude
    private User nguoiKiem;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "ngay_hoan_thanh")
    private LocalDateTime ngayHoanThanh;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "kiemKe", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    @Builder.Default
    private List<ChiTietKiemKe> chiTiet = new ArrayList<>();
}
