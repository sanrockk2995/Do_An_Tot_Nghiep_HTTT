package com.routine.controller;

import com.routine.dto.OtherDtos;
import com.routine.dto.ProductDtos;
import com.routine.service.PromotionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Khuyến mại: CRUD mã giảm giá + áp mã vào đơn.
 */
@RestController
@RequestMapping("/api/v1/promotions")
@RequiredArgsConstructor
@Tag(name = "Promotions", description = "Quản lý và áp dụng khuyến mại")
public class PromotionController {

    private final PromotionService promotionService;

    /** Danh sách mã — nhân viên bán hàng xem để tra mã tại quầy. */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<List<OtherDtos.PromotionResponse>> list() {
        return ResponseEntity.ok(promotionService.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
    public ResponseEntity<OtherDtos.PromotionResponse> detail(@PathVariable Long id) {
        return ResponseEntity.ok(promotionService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<OtherDtos.PromotionResponse> create(
            @Valid @RequestBody OtherDtos.PromotionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(promotionService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<OtherDtos.PromotionResponse> update(
            @PathVariable Long id, @Valid @RequestBody OtherDtos.PromotionRequest request) {
        return ResponseEntity.ok(promotionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        promotionService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Đã xoá chương trình khuyến mại"));
    }

    /** Kiểm tra & tính tiền giảm cho một mã (dùng ở giỏ hàng / POS). */
    @PostMapping("/apply")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProductDtos.PromotionApplyResult> apply(
            @Valid @RequestBody OtherDtos.ApplyPromotionRequest request) {
        BigDecimal amount = request.getOrderAmount() != null ? request.getOrderAmount() : BigDecimal.ZERO;
        return ResponseEntity.ok(promotionService.apply(
                request.getCode(), amount, request.getProductIds()));
    }
}
