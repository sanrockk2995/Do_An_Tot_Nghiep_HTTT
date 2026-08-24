package com.routine.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "promotion_products")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PromotionProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    @ToString.Exclude
    private Promotion promotion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @ToString.Exclude
    private Product product;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
