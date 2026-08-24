package com.routine.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mã hoá đơn hiển thị, ví dụ HD20250801001 */
    @Column(name = "order_number", nullable = false, unique = true, length = 50)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    @ToString.Exclude
    private Customer customer;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotal;

    @Column(precision = 15, scale = 2)
    private BigDecimal discount;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal total;

    /** CASH | BANK_TRANSFER | CARD | COD */
    @Column(name = "payment_method", nullable = false, length = 50)
    private String paymentMethod;

    /** PENDING | PAID | COMPLETED | CANCELLED */
    @Column(nullable = false, length = 50)
    private String status;

    /** OFFLINE (tại quầy) | ONLINE */
    @Column(nullable = false, length = 50)
    private String channel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    @ToString.Exclude
    private User createdBy;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDateTime deliveredAt;

    /** Đã trừ tồn kho chưa — chống trừ 2 lần */
    @Column(name = "stock_deducted", nullable = false)
    private Boolean stockDeducted;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();
}
