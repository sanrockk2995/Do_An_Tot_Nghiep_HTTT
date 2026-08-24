package com.routine.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    /** Mật khẩu mã hoá BCrypt — không bao giờ trả ra client qua DTO. */
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(unique = true, length = 20)
    private String phone;

    @Column(length = 100)
    private String branch;

    /** ADMIN | SALES_STAFF | WAREHOUSE_STAFF | ACCOUNTANT */
    @Column(nullable = false, length = 50)
    private String role;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
