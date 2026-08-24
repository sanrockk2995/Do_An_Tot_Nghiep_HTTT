package com.routine.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @ToString.Exclude
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @ToString.Exclude
    private Product product;

    /** Snapshot thông tin sản phẩm tại thời điểm bán */
    @Column(name = "product_code", nullable = false, length = 50)
    private String productCode;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotal;

    @Column(length = 20)
    private String size;

    @Column(length = 50)
    private String color;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
