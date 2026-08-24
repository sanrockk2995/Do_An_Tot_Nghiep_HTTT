package com.routine.repository;

import com.routine.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Page<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId, Pageable pageable);

    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Order> findByChannelOrderByCreatedAtDesc(String channel, Pageable pageable);

    Page<Order> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    boolean existsByOrderNumber(String orderNumber);

    /** Doanh thu theo khoảng thời gian (đơn không bị huỷ). */
    @Query("""
            SELECT COALESCE(SUM(o.total), 0) FROM Order o
            WHERE o.status <> 'CANCELLED'
              AND o.createdAt >= :from AND o.createdAt < :to
            """)
    BigDecimal sumRevenueBetween(@Param("from") LocalDateTime from,
                                 @Param("to") LocalDateTime to);

    @Query("""
            SELECT COUNT(o) FROM Order o
            WHERE o.status <> 'CANCELLED'
              AND o.createdAt >= :from AND o.createdAt < :to
            """)
    long countOrdersBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
            SELECT COALESCE(SUM(oi.quantity), 0) FROM OrderItem oi
            JOIN oi.order o
            WHERE o.status <> 'CANCELLED'
              AND o.createdAt >= :from AND o.createdAt < :to
            """)
    long countProductsSoldBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** Doanh thu nhóm theo ngày/tháng/năm cho biểu đồ. */
    @Query(value = """
            SELECT DATE_FORMAT(o.created_at, :pattern) AS period,
                   SUM(o.total) AS revenue,
                   COUNT(*) AS orderCount
            FROM orders o
            WHERE o.status <> 'CANCELLED'
              AND o.created_at >= :from AND o.created_at < :to
            GROUP BY period
            ORDER BY period
            """, nativeQuery = true)
    List<Object[]> sumRevenueGrouped(@Param("pattern") String pattern,
                                     @Param("from") LocalDateTime from,
                                     @Param("to") LocalDateTime to);
}
