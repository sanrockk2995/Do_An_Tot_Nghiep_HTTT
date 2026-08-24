package com.routine.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "promotions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mã giảm giá khách nhập, ví dụ SALE10 */
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** PERCENT | FIXED_AMOUNT */
    @Column(nullable = false, length = 50)
    private String type;

    @Column(name = "discount_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal discountValue;

    /** Giảm tối đa (cho loại PERCENT) */
    @Column(name = "max_discount_amount", precision = 15, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Column(name = "min_order_amount", precision = 15, scale = 2)
    private BigDecimal minOrderAmount;

    @Column(name = "apply_to_all_products")
    private Boolean applyToAllProducts;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "usage_count")
    private Integer usageCount;

    /** DRAFT | ACTIVE | EXPIRED | DISABLED */
    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    /** Danh sách sản phẩm được áp dụng khi apply_to_all_products = FALSE */
    @OneToMany(mappedBy = "promotion", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PromotionProduct> promotionProducts = new ArrayList<>();
}
