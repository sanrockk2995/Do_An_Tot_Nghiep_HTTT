package com.routine.repository;

import com.routine.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    /** Khoá pessimistic bản ghi SP khi tạo đơn/trừ tồn — chống bán vượt kho khi nhiều đơn đồng thời. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findWithLockingById(@Param("id") Long id);

    /** Tìm kiếm theo tên/mã/mô tả, chỉ trả sản phẩm ACTIVE. */
    @Query("""
            SELECT p FROM Product p
            WHERE p.status = 'ACTIVE'
              AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(p.code) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(p.description, '')) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<Product> search(@Param("q") String q, Pageable pageable);

    Page<Product> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    Page<Product> findByCategoryIdIn(Collection<Long> categoryIds, Pageable pageable);

    Page<Product> findByTargetGender(String targetGender, Pageable pageable);

    /** Đếm phục vụ lọc kết hợp danh mục + giới tính (chỉ ACTIVE). */
    @Query("""
            SELECT COUNT(p) FROM Product p
            WHERE p.status = 'ACTIVE'
              AND (:categoryIds IS NULL OR p.categoryId IN :categoryIds)
              AND (:gender IS NULL OR p.targetGender = :gender)
            """)
    long countActiveFiltered(@Param("categoryIds") Collection<Long> categoryIds,
                             @Param("gender") String gender);

    /** Danh sách có lọc kết hợp danh mục + giới tính ngay trong SQL (đúng tổng phân trang), chỉ ACTIVE. */
    @Query("""
            SELECT p FROM Product p
            WHERE p.status = 'ACTIVE'
              AND (:categoryIds IS NULL OR p.categoryId IN :categoryIds)
              AND (:gender IS NULL OR p.targetGender = :gender)
            """)
    Page<Product> findActiveFiltered(@Param("categoryIds") Collection<Long> categoryIds,
                                     @Param("gender") String gender,
                                     Pageable pageable);

    /** Quản trị: lọc kết hợp danh mục + trạng thái (status null = tất cả) — tổng phân trang đúng. */
    @Query("""
            SELECT p FROM Product p
            WHERE (:categoryId IS NULL OR p.categoryId = :categoryId)
              AND (:status IS NULL OR p.status = :status)
            """)
    Page<Product> findByCategoryAndStatus(@Param("categoryId") Long categoryId,
                                          @Param("status") String status,
                                          Pageable pageable);

    List<Product> findByStockLessThanEqualAndStatus(Integer minStock, String status);

    /** Sản phẩm bán chạy — join order_items đã COMPLETED. */
    @Query(value = """
            SELECT p.*, COALESCE(SUM(oi.quantity), 0) AS sold
            FROM products p
            JOIN order_items oi ON oi.product_id = p.id
            JOIN orders o ON o.id = oi.order_id AND o.status <> 'CANCELLED'
            WHERE p.status = 'ACTIVE'
            GROUP BY p.id
            ORDER BY sold DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findBestSelling(@Param("limit") int limit);

    @Query("""
            SELECT DISTINCT p.categoryId FROM Product p
            WHERE p.status = 'ACTIVE' AND p.id IN :productIds
            """)
    List<Long> findCategoryIdsByProductIds(@Param("productIds") Collection<Long> productIds);

    /** Nổi bật: có badge (HOT/SALE/MỚI...) hoặc điểm đánh giá cao — dùng trộn thêm vào banner. */
    @Query("""
            SELECT p FROM Product p
            WHERE p.status = 'ACTIVE'
              AND (p.badge IS NOT NULL OR p.rating >= 4.5)
            """)
    List<Product> findFeatured(Pageable pageable);
}
