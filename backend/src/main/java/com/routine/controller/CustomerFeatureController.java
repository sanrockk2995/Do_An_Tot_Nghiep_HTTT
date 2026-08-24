package com.routine.controller;

import com.routine.dto.OtherDtos;
import com.routine.security.SecurityUtils;
import com.routine.service.CartService;
import com.routine.service.ReviewService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Giỏ hàng / yêu thích / đánh giá — theo customer đang đăng nhập.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Cart & Reviews", description = "Giỏ hàng, danh sách yêu thích, đánh giá sản phẩm")
public class CustomerFeatureController {

    private final CartService cartService;
    private final ReviewService reviewService;

    // ==================== GIỎ HÀNG ====================

    @GetMapping("/cart-items")
    public ResponseEntity<List<Map<String, Object>>> cart() {
        return ResponseEntity.ok(cartService.getCart(SecurityUtils.currentCustomerId()));
    }

    @PostMapping("/cart-items")
    public ResponseEntity<List<Map<String, Object>>> addToCart(
            @RequestBody Map<String, Object> body) {
        Long productId = ((Number) body.get("productId")).longValue();
        Integer quantity = body.get("quantity") != null ? ((Number) body.get("quantity")).intValue() : 1;
        String size = (String) body.get("size");
        String color = (String) body.get("color");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cartService.addToCart(SecurityUtils.currentCustomerId(), productId, size, color, quantity));
    }

    @PutMapping("/cart-items/{itemId}")
    public ResponseEntity<List<Map<String, Object>>> updateCartItem(
            @PathVariable Long itemId, @RequestBody Map<String, Object> body) {
        Integer quantity = ((Number) body.get("quantity")).intValue();
        return ResponseEntity.ok(cartService.updateQuantity(
                SecurityUtils.currentCustomerId(), itemId, quantity));
    }

    @DeleteMapping("/cart-items/{itemId}")
    public ResponseEntity<Map<String, String>> removeCartItem(@PathVariable Long itemId) {
        cartService.removeItem(SecurityUtils.currentCustomerId(), itemId);
        return ResponseEntity.ok(Map.of("message", "Đã xoá khỏi giỏ hàng"));
    }

    // ==================== YÊU THÍCH ====================

    @GetMapping("/wishlist-items")
    public ResponseEntity<List<Map<String, Object>>> wishlist() {
        return ResponseEntity.ok(cartService.getWishlist(SecurityUtils.currentCustomerId()));
    }

    @PostMapping("/wishlist-items")
    public ResponseEntity<List<Map<String, Object>>> addToWishlist(
            @RequestBody Map<String, Object> body) {
        Long productId = ((Number) body.get("productId")).longValue();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cartService.addToWishlist(SecurityUtils.currentCustomerId(), productId));
    }

    @DeleteMapping("/wishlist-items/{productId}")
    public ResponseEntity<Map<String, String>> removeFromWishlist(@PathVariable Long productId) {
        cartService.removeFromWishlist(SecurityUtils.currentCustomerId(), productId);
        return ResponseEntity.ok(Map.of("message", "Đã bỏ yêu thích"));
    }

    // ==================== ĐÁNH GIÁ ====================

    /** Đánh giá công khai cho khách vãng lai xem. */
    @GetMapping("/products/{id}/reviews")
    public ResponseEntity<Map<String, Object>> reviews(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        var result = reviewService.listByProduct(id, page, size);
        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalElements", result.getTotalElements(),
                "page", page));
    }

    /** Khách đăng nhập mới được đánh giá. */
    @PostMapping("/products/{id}/reviews")
    public ResponseEntity<OtherDtos.ReviewResponse> createReview(
            @PathVariable Long id,
            @Valid @RequestBody OtherDtos.ReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.create(
                id, SecurityUtils.currentCustomerId(), request.getRating(), request.getComment()));
    }
}
