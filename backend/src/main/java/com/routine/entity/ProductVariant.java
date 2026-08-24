package com.routine.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_variants")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @ToString.Exclude
    private Product product;

    @Column(length = 20)
    private String size;

    @Column(length = 50)
    private String color;

    @Column(nullable = false)
    private Integer stock;

    @Column(length = 100)
    private String sku;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
