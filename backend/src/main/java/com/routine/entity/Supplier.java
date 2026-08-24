package com.routine.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "suppliers")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_ncc", nullable = false, unique = true, length = 50)
    private String maNcc;

    @Column(name = "ten_ncc", nullable = false, length = 200)
    private String tenNcc;

    @Column(name = "dia_chi", columnDefinition = "TEXT")
    private String diaChi;

    @Column(name = "so_dien_thoai", length = 20)
    private String soDienThoai;

    @Column(length = 100)
    private String email;

    @Column(name = "nguoi_lien_he", length = 100)
    private String nguoiLienHe;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    /** ACTIVE | INACTIVE */
    @Column(name = "trang_thai", nullable = false, length = 20)
    private String trangThai;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
