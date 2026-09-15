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

    /**
     * Tìm kiếm và lọc hóa đơn đa tiêu chí cho nhân viên / kế toán:
     * - Pattern: mã đơn (orderNumber), tên/SĐT/email khách, "Khách lẻ",
     *   tên/email/SĐT nhân viên tạo đơn (createdBy), ghi chú (notes),
     *   tên hoặc mã sản phẩm trong đơn (OrderItem).
     * - Lọc kết hợp: trạng thái (status), kênh bán (channel), khách hàng cụ thể (customerId).
     */
    @Query(value = """
            SELECT o FROM Order o
            LEFT JOIN o.customer c
            LEFT JOIN o.createdBy u
            WHERE (:status IS NULL OR o.status = :status)
              AND (:channel IS NULL OR o.channel = :channel)
              AND (:customerId IS NULL OR (c IS NOT NULL AND c.id = :customerId))
              AND (:pattern IS NULL OR (
                    LOWER(o.orderNumber) LIKE :pattern
                    OR (c IS NOT NULL AND (
                            LOWER(c.fullName) LIKE :pattern
                            OR c.phone LIKE :pattern
                            OR LOWER(COALESCE(c.email, '')) LIKE :pattern
                    ))
                    OR (c IS NULL AND LOWER('Khách lẻ') LIKE :pattern)
                    OR (u IS NOT NULL AND (
                            LOWER(u.fullName) LIKE :pattern
                            OR LOWER(COALESCE(u.email, '')) LIKE :pattern
                            OR COALESCE(u.phone, '') LIKE :pattern
                    ))
                    OR (o.notes IS NOT NULL AND LOWER(o.notes) LIKE :pattern)
                    OR EXISTS (
                        SELECT 1 FROM OrderItem oi
                        WHERE oi.order = o
                          AND (
                            LOWER(oi.productName) LIKE :pattern
                            OR LOWER(oi.productCode) LIKE :pattern
                          )
                    )
              ))
            ORDER BY o.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(o) FROM Order o
            LEFT JOIN o.customer c
            LEFT JOIN o.createdBy u
            WHERE (:status IS NULL OR o.status = :status)
              AND (:channel IS NULL OR o.channel = :channel)
              AND (:customerId IS NULL OR (c IS NOT NULL AND c.id = :customerId))
              AND (:pattern IS NULL OR (
                    LOWER(o.orderNumber) LIKE :pattern
                    OR (c IS NOT NULL AND (
                            LOWER(c.fullName) LIKE :pattern
                            OR c.phone LIKE :pattern
                            OR LOWER(COALESCE(c.email, '')) LIKE :pattern
                    ))
                    OR (c IS NULL AND LOWER('Khách lẻ') LIKE :pattern)
                    OR (u IS NOT NULL AND (
                            LOWER(u.fullName) LIKE :pattern
                            OR LOWER(COALESCE(u.email, '')) LIKE :pattern
                            OR COALESCE(u.phone, '') LIKE :pattern
                    ))
                    OR (o.notes IS NOT NULL AND LOWER(o.notes) LIKE :pattern)
                    OR EXISTS (
                        SELECT 1 FROM OrderItem oi
                        WHERE oi.order = o
                          AND (
                            LOWER(oi.productName) LIKE :pattern
                            OR LOWER(oi.productCode) LIKE :pattern
                          )
                    )
              ))
            """)
    Page<Order> searchOrders(@Param("pattern") String pattern,
                             @Param("status") String status,
                             @Param("channel") String channel,
                             @Param("customerId") Long customerId,
                             Pageable pageable);

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
