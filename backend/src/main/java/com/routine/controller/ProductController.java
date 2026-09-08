package com.routine.controller;

import com.routine.dto.OtherDtos;
import com.routine.dto.ProductDtos;
import com.routine.service.CategoryService;
import com.routine.service.ProductService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Sản phẩm & danh mục.
 * GET công khai (khách vãng lai xem được); ghi yêu cầu ADMIN.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Sản phẩm, biến thể, danh mục")
public class ProductController {

    private final ProductService productService;
    private final CategoryService categoryService;

    // ==================== DANH MỤC ====================

    @GetMapping("/categories")
    public ResponseEntity<List<OtherDtos.CategoryResponse>> categories() {
        return ResponseEntity.ok(categoryService.getAll());
    }

    @PostMapping("/categories")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OtherDtos.CategoryResponse> createCategory(
            @Valid @RequestBody OtherDtos.CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(request));
    }

    @PutMapping("/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OtherDtos.CategoryResponse> updateCategory(
            @PathVariable Long id, @Valid @RequestBody OtherDtos.CategoryRequest request) {
        return ResponseEntity.ok(categoryService.update(id, request));
    }

    @DeleteMapping("/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteCategory(@PathVariable Long id) {
        categoryService.softDelete(id);
        return ResponseEntity.ok(Map.of("message", "Đã xoá mềm danh mục"));
    }

    // ==================== SẢN PHẨM (công khai) ====================

    /** Danh sách sản phẩm bán: lọc danh mục/giới tính/khoảng giá, sắp xếp, phân trang. */
    @GetMapping("/products")
    public ResponseEntity<Page<ProductDtos.ProductResponse>> products(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "newest") String sort) {
        return ResponseEntity.ok(productService.listPublic(
                categoryId, gender, minPrice, maxPrice, page, size, sort));
    }

    @GetMapping("/products/search")
    public ResponseEntity<Page<ProductDtos.ProductResponse>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(productService.search(q, page, size));
    }

    /** Banner chủ đạo: sản phẩm bán chạy + nổi bật (công khai cho carousel trang chủ). */
    @GetMapping("/products/featured")
    public ResponseEntity<List<ProductDtos.ProductResponse>> featured() {
        return ResponseEntity.ok(productService.featured());
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ProductDtos.ProductResponse> productDetail(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    // ==================== SẢN PHẨM (quản trị) ====================

    @PostMapping("/products")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductDtos.ProductResponse> createProduct(
            @Valid @RequestBody ProductDtos.ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(request));
    }

    @PutMapping("/products/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductDtos.ProductResponse> updateProduct(
            @PathVariable Long id, @Valid @RequestBody ProductDtos.ProductRequest request) {
        return ResponseEntity.ok(productService.update(id, request));
    }

    /** Xoá mềm (status → INACTIVE). */
    @DeleteMapping("/products/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteProduct(@PathVariable Long id) {
        productService.softDelete(id);
        return ResponseEntity.ok(Map.of("message", "Đã xoá mềm sản phẩm"));
    }

    /** Danh sách quản trị: gồm cả INACTIVE; ADMIN/kho xem-full, bán hàng đọc để bán tại quầy; hỗ trợ tìm theo tên/mã/sku. */
    @GetMapping("/admin/products")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF', 'SALES_STAFF')")
    public ResponseEntity<Page<ProductDtos.ProductResponse>> adminProducts(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(productService.listAdmin(q, status, categoryId, page, size));
    }

    // ==================== BIẾN THỂ ====================

    /** Quản lý biến thể của một sản phẩm. */
    @PostMapping("/products/{productId}/variants")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductDtos.ProductResponse> addVariants(
            @PathVariable Long productId,
            @RequestBody List<ProductDtos.VariantInput> variants) {
        ProductDtos.ProductResponse current = productService.getById(productId);
        var merged = new java.util.ArrayList<>(current.getVariants() != null
                ? current.getVariants().stream()
                        .map(v -> new ProductDtos.VariantInput(v.getId(), v.getSize(), v.getColor(), v.getStock(), v.getSku()))
                        .toList() : List.<ProductDtos.VariantInput>of());
        merged.addAll(variants);

        ProductDtos.ProductRequest req = new ProductDtos.ProductRequest();
        req.setCode(current.getCode());
        req.setName(current.getName());
        req.setCategoryId(current.getCategoryId());
        req.setDescription(current.getDescription());
        req.setPrice(current.getPrice());
        req.setCostPrice(current.getCostPrice());
        req.setOldPrice(current.getOldPrice());
        req.setStock(current.getStock());
        req.setMinStock(current.getMinStock());
        req.setImageUrl(current.getImageUrl());
        req.setSku(current.getSku());
        req.setMaterial(current.getMaterial());
        req.setFit(current.getFit());
        req.setSeason(current.getSeason());
        req.setCareInstructions(current.getCareInstructions());
        req.setBadge(current.getBadge());
        req.setTargetGender(current.getTargetGender());
        req.setVariants(merged);
        return ResponseEntity.ok(productService.update(productId, req));
    }

    @DeleteMapping("/products/{productId}/variants/{variantId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteVariant(
            @PathVariable Long productId, @PathVariable Long variantId) {
        // Biến thể xoá bằng cách cập nhật lại danh sách qua PUT products/{id}
        return ResponseEntity.ok(Map.of("message",
                "Xoá biến thể qua PUT /api/v1/products/{id} với danh sách variants còn lại"));
    }
}
