package com.routine.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String email;

    /** BCrypt hash — khách có thể không có tài khoản (mua tại quầy). */
    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 500)
    private String address;

    @Column(length = 100)
    private String district;

    @Column(length = 100)
    private String city;

    /** REGULAR | SILVER | GOLD | VIP */
    @Column(nullable = false, length = 50)
    private String tier;

    @Column(name = "total_orders")
    private Integer totalOrders;

    @Column(name = "total_spent", precision = 15, scale = 2)
    private BigDecimal totalSpent;

    @Column(name = "last_order_at")
    private LocalDateTime lastOrderAt;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
