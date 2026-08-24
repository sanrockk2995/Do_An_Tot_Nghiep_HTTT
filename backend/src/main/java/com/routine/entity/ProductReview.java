package com.routine.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_reviews")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ProductReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @ToString.Exclude
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    @ToString.Exclude
    private Customer customer;

    /** 1–5 (CHECK ở DB) */
    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    /** Gắn cờ khách đã mua sản phẩm này */
    @Column(name = "is_verified")
    private Boolean isVerified;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
