package com.routine.service;

import com.routine.dto.OtherDtos;
import com.routine.entity.Product;
import com.routine.entity.ProductReview;
import com.routine.exception.BadRequestException;
import com.routine.repository.OrderItemRepository;
import com.routine.repository.ProductRepository;
import com.routine.repository.ProductReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Đánh giá sản phẩm: rating 1–5, cờ is_verified khi khách đã mua.
 */
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;

    @Transactional(readOnly = true)
    public Page<OtherDtos.ReviewResponse> listByProduct(Long productId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return reviewRepository.findByProductId(productId, pageable)
                .map(this::toResponse);
    }

    /** Khách đánh giá sản phẩm; mỗi khách chỉ đánh giá 1 lần/sản phẩm. */
    @Transactional
    public OtherDtos.ReviewResponse create(Long productId, Long customerId,
                                           Integer rating, String comment) {
        if (reviewRepository.existsByProductIdAndCustomerId(productId, customerId)) {
            throw new BadRequestException("Bạn đã đánh giá sản phẩm này rồi");
        }
        boolean purchased = orderItemRepository.existsPurchasedByCustomer(productId, customerId);

        ProductReview review = ProductReview.builder()
                .product(Product.builder().id(productId).build())
                .customer(com.routine.entity.Customer.builder().id(customerId).build())
                .rating(rating)
                .comment(comment)
                .isVerified(purchased)     // gắn cờ đã mua hàng
                .build();
        review = reviewRepository.save(review);
        recalcProductRating(productId);
        return toResponse(review);
    }

    /** Tính lại điểm trung bình và số lượt đánh giá của sản phẩm. */
    private void recalcProductRating(Long productId) {
        productRepository.findById(productId).ifPresent(product -> {
            var reviews = reviewRepository.findByProductId(productId,
                    PageRequest.of(0, Integer.MAX_VALUE));
            double avg = reviews.getContent().stream()
                    .mapToInt(ProductReview::getRating).average().orElse(0.0);
            product.setRating(BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP));
            product.setReviewCount((int) reviews.getTotalElements());
            productRepository.save(product);
        });
    }

    private OtherDtos.ReviewResponse toResponse(ProductReview r) {
        return OtherDtos.ReviewResponse.builder()
                .id(r.getId())
                .productId(r.getProduct() != null ? r.getProduct().getId() : null)
                .customerId(r.getCustomer() != null ? r.getCustomer().getId() : null)
                .customerName(r.getCustomer() != null ? r.getCustomer().getFullName() : null)
                .rating(r.getRating()).comment(r.getComment())
                .isVerified(r.getIsVerified()).createdAt(r.getCreatedAt())
                .build();
    }
}
