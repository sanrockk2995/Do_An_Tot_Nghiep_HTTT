package com.routine.repository;

import com.routine.entity.ProductReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

    Page<ProductReview> findByProductId(Long productId, Pageable pageable);

    boolean existsByProductIdAndCustomerId(Long productId, Long customerId);

    List<ProductReview> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
