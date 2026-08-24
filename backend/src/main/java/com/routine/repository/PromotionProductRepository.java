package com.routine.repository;

import com.routine.entity.PromotionProduct;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PromotionProductRepository extends JpaRepository<PromotionProduct, Long> {

    List<PromotionProduct> findByPromotionId(Long promotionId);

    boolean existsByPromotionIdAndProductId(Long promotionId, Long productId);
}
