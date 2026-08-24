package com.routine.repository;

import com.routine.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderId(Long orderId);

    /** Kiểm tra khách đã mua sản phẩm (đơn không huỷ) — cho cờ is_verified. */
    @Query("""
            SELECT COUNT(oi) > 0 FROM OrderItem oi
            JOIN oi.order o
            WHERE oi.product.id = :productId
              AND o.customer.id = :customerId
              AND o.status <> 'CANCELLED'
            """)
    boolean existsPurchasedByCustomer(Long productId, Long customerId);
}
