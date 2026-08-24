package com.routine.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(name = "cost_price", precision = 15, scale = 2)
    private BigDecimal costPrice;

    @Column(name = "old_price", precision = 15, scale = 2)
    private BigDecimal oldPrice;

    @Column(nullable = false)
    private Integer stock;

    @Column(name = "min_stock")
    private Integer minStock;

    /** ACTIVE | INACTIVE — soft delete dùng status này */
    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;

    @Column(length = 100)
    private String sku;

    @Column(length = 255)
    private String material;

    @Column(length = 100)
    private String fit;

    @Column(length = 100)
    private String season;

    @Column(name = "care_instructions", columnDefinition = "TEXT")
    private String careInstructions;

    @Column(precision = 3, scale = 2)
    private BigDecimal rating;

    @Column(name = "review_count")
    private Integer reviewCount;

    @Column(length = 50)
    private String badge;

    @Column(name = "target_gender", length = 20)
    private String targetGender;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductVariant> variants = new ArrayList<>();
}
