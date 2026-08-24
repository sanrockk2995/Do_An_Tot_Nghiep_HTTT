package com.routine.repository;

import com.routine.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    @Query("""
            SELECT w FROM WishlistItem w
            JOIN FETCH w.product p
            WHERE w.customer.id = :customerId
            ORDER BY w.createdAt DESC
            """)
    List<WishlistItem> findByCustomerWithProduct(@Param("customerId") Long customerId);

    Optional<WishlistItem> findByCustomerIdAndProductId(Long customerId, Long productId);

    boolean existsByCustomerIdAndProductId(Long customerId, Long productId);
}
