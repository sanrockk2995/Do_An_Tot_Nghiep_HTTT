package com.routine.repository;

import com.routine.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    @Query("""
            SELECT c FROM CartItem c
            JOIN FETCH c.product p
            WHERE c.customer.id = :customerId
            ORDER BY c.createdAt DESC
            """)
    List<CartItem> findByCustomerWithProduct(@Param("customerId") Long customerId);

    Optional<CartItem> findByCustomerIdAndProductIdAndSizeAndColor(
            Long customerId, Long productId, String size, String color);
}
