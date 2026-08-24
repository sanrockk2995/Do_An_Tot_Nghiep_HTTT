package com.routine.repository;

import com.routine.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    List<ProductVariant> findByProductId(Long productId);

    /** Tìm biến thể cụ thể theo size + màu (kiểm tồn khi đặt hàng). */
    Optional<ProductVariant> findByProductIdAndSizeAndColor(Long productId, String size, String color);
}
