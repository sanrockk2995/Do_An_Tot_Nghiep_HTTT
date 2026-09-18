package com.routine.service;

import com.routine.dto.ProductDtos;
import com.routine.entity.Category;
import com.routine.entity.Product;
import com.routine.entity.ProductVariant;
import com.routine.exception.BadRequestException;
import com.routine.exception.ResourceNotFoundException;
import com.routine.repository.CategoryRepository;
import com.routine.repository.ProductRepository;
import com.routine.repository.ProductReviewRepository;
import com.routine.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ProductService {

    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
            "('|\"|;|--|/\\*|\\*/|\\\\|\\b(union|select|insert|update|delete|drop|alter|truncate|exec|xp_)\\b|\\b(or|and)\\s+['\"]?\\d+['\"]?\\s*=\\s*['\"]?\\d+)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern XSS_PATTERN = Pattern.compile(
            "(<[^>]*>|javascript:|on\\w+\\s*=)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern VALID_SEARCH_CHARS = Pattern.compile(
            "^[\\p{L}\\p{N}\\s._\\-+#/,]+$"
    );

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final CategoryRepository categoryRepository;
    private final ProductReviewRepository reviewRepository;

    /** Danh sách sản phẩm công khai (khách vãng lai): chỉ ACTIVE, lọc danh mục/giới tính/giá ngay trong SQL. */
    @Transactional(readOnly = true)
    public Page<ProductDtos.ProductResponse> listPublic(Long categoryId, String gender,
                                                        BigDecimal minPrice, BigDecimal maxPrice,
                                                        int page, int size, String sort) {
        Pageable basePageable = buildPageable(page, size, sort);
        boolean hasGender = gender != null && !gender.isBlank();
        final String genderFilter = hasGender ? gender : null;

        // Lọc danh mục: nếu categoryId không tồn tại → trả trang rỗng thay vì bỏ qua bộ lọc
        Collection<Long> categoryIds = null;
        if (categoryId != null) {
            if (!categoryRepository.existsById(categoryId)) {
                return new org.springframework.data.domain.PageImpl<>(List.of(), basePageable, 0);
            }
            categoryIds = List.of(categoryId);
        }

        Page<Product> products;
        if (categoryIds == null && genderFilter == null && minPrice == null && maxPrice == null) {
            // Không lọc gì — dùng path mặc định (giữ nguyên hành vi cũ)
            products = productRepository.findByStatusOrderByCreatedAtDesc("ACTIVE", basePageable);
        } else if (minPrice == null && maxPrice == null) {
            products = productRepository.findActiveFiltered(categoryIds, genderFilter, basePageable);
        } else {
            // Có lọc giá: đếm trước rồi lấy đúng trang theo khoảng giá
            long total = countActiveFilteredWithPrice(categoryIds, genderFilter, minPrice, maxPrice);
            if (total == 0) {
                return new org.springframework.data.domain.PageImpl<>(List.of(), basePageable, 0);
            }
            // Lấy dư một chút quanh trang hiện tại để bù phần bị loại bởi lọc giá
            int fetchSize = Math.max(size * 3, 50);
            Page<Product> candidate = productRepository.findActiveFiltered(
                    categoryIds, genderFilter, PageRequest.of(0, (page + 1) * fetchSize,
                            basePageable.getSort()));
            List<ProductDtos.ProductResponse> pageContent = candidate.getContent().stream()
                    .filter(p -> minPrice == null || p.getPrice().compareTo(minPrice) >= 0)
                    .filter(p -> maxPrice == null || p.getPrice().compareTo(maxPrice) <= 0)
                    .skip((long) page * size)
                    .limit(size)
                    .map(this::toResponse)
                    .toList();
            return new org.springframework.data.domain.PageImpl<>(pageContent, basePageable, total);
        }
        return products.map(this::toResponse);
    }

    public void validateSearchQuery(String q) {
        if (q == null || q.isBlank()) return;
        String trimmed = q.trim();
        if (trimmed.length() > 100) {
            throw new BadRequestException("Thông tin tìm kiếm không hợp lệ (độ dài tối đa 100 ký tự). Hệ thống yêu cầu người dùng nhập lại đúng thông tin.");
        }
        if (SQL_INJECTION_PATTERN.matcher(trimmed).find() || XSS_PATTERN.matcher(trimmed).find()) {
            throw new BadRequestException("Thông tin nhập vào không hợp lệ (chứa ký tự đặc biệt hoặc mã độc SQL). Hệ thống yêu cầu người dùng nhập lại đúng thông tin.");
        }
        if (!VALID_SEARCH_CHARS.matcher(trimmed).matches()) {
            throw new BadRequestException("Thông tin nhập vào không hợp lệ (sai định dạng hoặc chứa ký tự đặc biệt). Hệ thống yêu cầu người dùng nhập lại đúng thông tin.");
        }
    }

    @Transactional(readOnly = true)
    public Page<ProductDtos.ProductResponse> search(String q, int page, int size) {
        validateSearchQuery(q);
        return productRepository.search(q, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    /**
     * Banner chủ đạo: sản phẩm bán chạy (nhiều đơn nhất) + nổi bật (badge / đánh giá cao).
     * Chỉ lấy SP có ảnh (banner hiển thị hình), đã loại trùng bằng Set, tối đa 8 slide.
     */
    @Transactional(readOnly = true)
    public List<ProductDtos.ProductResponse> featured() {
        Set<Long> seen = new HashSet<>();
        List<Product> merged = new ArrayList<>();

        // Ưu tiên bán chạy: lấy dư 20 đề phòng SP không có ảnh bị loại
        for (Object[] row : productRepository.findBestSelling(20)) {
            Long id = ((Number) row[0]).longValue();
            seen.add(id);
            productRepository.findById(id)
                    .filter(p -> p.getImageUrl() != null && !p.getImageUrl().isBlank())
                    .ifPresent(merged::add);
        }

        // Trộn thêm sản phẩm nổi bật (badge / rating cao) chưa xuất hiện
        for (Product p : productRepository.findFeatured(PageRequest.of(0, 24))) {
            if (merged.size() >= 8) break;
            boolean hasImage = p.getImageUrl() != null && !p.getImageUrl().isBlank();
            if (hasImage && seen.add(p.getId())) merged.add(p);
        }

        return merged.stream().limit(8).map(this::toResponse).toList();
    }

    /** Danh sách cho trang quản trị: bao gồm cả sản phẩm INACTIVE, hỗ trợ tìm theo tên/mã/sku. */
    @Transactional(readOnly = true)
    public Page<ProductDtos.ProductResponse> listAdmin(String q, String status, Long categoryId, int page, int size) {
        validateSearchQuery(q);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        final String statusFilter = (status == null || status.isBlank()) ? null : status;
        final String qFilter = (q == null || q.isBlank()) ? null : q.trim();

        if (categoryId != null && !categoryRepository.existsById(categoryId)) {
            return new org.springframework.data.domain.PageImpl<>(List.of(), pageable, 0);
        }

        Page<Product> products;
        if (qFilter != null) {
            String pattern = "%" + qFilter.toLowerCase() + "%";
            products = productRepository.searchAdmin(pattern, categoryId, statusFilter, pageable);
        } else if (categoryId != null && statusFilter == null) {
            products = productRepository.findByCategoryIdIn(List.of(categoryId), pageable);
        } else if (categoryId != null) {
            products = productRepository.findByCategoryAndStatus(categoryId, statusFilter, pageable);
        } else if (statusFilter != null) {
            products = productRepository.findByStatusOrderByCreatedAtDesc(statusFilter, pageable);
        } else {
            products = productRepository.findAll(pageable);
        }
        return products.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ProductDtos.ProductResponse> listAdmin(String status, Long categoryId, int page, int size) {
        return listAdmin(null, status, categoryId, page, size);
    }

    @Transactional(readOnly = true)
    public ProductDtos.ProductResponse getById(Long id) {
        return toResponse(getProduct(id));
    }

    @Transactional
    public ProductDtos.ProductResponse create(ProductDtos.ProductRequest request) {
        Category category = getCategory(request.getCategoryId());
        validateVariants(request.getVariants());

        Product product = Product.builder()
                .code(request.getCode())
                .name(request.getName())
                .categoryId(category.getId())
                .description(request.getDescription())
                .price(request.getPrice())
                .costPrice(request.getCostPrice())
                .oldPrice(request.getOldPrice())
                .stock(sumVariantStock(request.getVariants(), request.getStock()))
                .minStock(request.getMinStock() != null ? request.getMinStock() : 10)
                .status("ACTIVE")
                .imageUrl(request.getImageUrl())
                .sku(request.getSku())
                .material(request.getMaterial())
                .fit(request.getFit())
                .season(request.getSeason())
                .careInstructions(request.getCareInstructions())
                .rating(BigDecimal.ZERO)
                .reviewCount(0)
                .badge(request.getBadge())
                .targetGender(request.getTargetGender())
                .build();
        product = productRepository.save(product);

        if (request.getVariants() != null) {
            for (ProductDtos.VariantInput v : request.getVariants()) {
                ProductVariant variant = ProductVariant.builder()
                        .product(product)
                        .size(v.getSize())
                        .color(v.getColor())
                        .stock(v.getStock() != null ? v.getStock() : 0)
                        .sku(v.getSku() != null ? v.getSku()
                                : product.getCode() + "-" + v.getSize() + "-" + v.getColor())
                        .build();
                variantRepository.save(variant);
            }
        }
        return toResponse(product);
    }

    @Transactional
    public ProductDtos.ProductResponse update(Long id, ProductDtos.ProductRequest request) {
        Product product = getProduct(id);
        Category category = getCategory(request.getCategoryId());
        validateVariants(request.getVariants());

        product.setCode(request.getCode());
        product.setName(request.getName());
        product.setCategoryId(category.getId());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCostPrice(request.getCostPrice());
        product.setOldPrice(request.getOldPrice());
        product.setStock(sumVariantStock(request.getVariants(), product.getStock()));
        product.setMinStock(request.getMinStock() != null ? request.getMinStock() : product.getMinStock());
        product.setImageUrl(request.getImageUrl());
        product.setSku(request.getSku());
        product.setMaterial(request.getMaterial());
        product.setFit(request.getFit());
        product.setSeason(request.getSeason());
        product.setCareInstructions(request.getCareInstructions());
        product.setBadge(request.getBadge());
        product.setTargetGender(request.getTargetGender());

        // Đồng bộ biến thể: cập nhật tồn tại, thêm mới
        Map<String, ProductVariant> existing = new HashMap<>();
        variantRepository.findByProductId(id).forEach(v ->
                existing.put(v.getSize() + "|" + v.getColor(), v));

        if (request.getVariants() != null) {
            for (ProductDtos.VariantInput v : request.getVariants()) {
                String key = v.getSize() + "|" + v.getColor();
                ProductVariant variant = existing.get(key);
                if (variant != null) {
                    variant.setStock(v.getStock() != null ? v.getStock() : variant.getStock());
                    variant.setSku(v.getSku() != null ? v.getSku() : variant.getSku());
                    variantRepository.save(variant);
                    existing.remove(key);
                } else {
                    ProductVariant newVariant = ProductVariant.builder()
                            .product(product)
                            .size(v.getSize())
                            .color(v.getColor())
                            .stock(v.getStock() != null ? v.getStock() : 0)
                            .sku(v.getSku() != null ? v.getSku() : product.getCode() + "-" + v.getSize() + "-" + v.getColor())
                            .build();
                    variantRepository.save(newVariant);
                }
            }
        }
        return toResponse(productRepository.save(product));
    }

    /** Xoá mềm: chuyển status = INACTIVE. */
    @Transactional
    public void softDelete(Long id) {
        Product product = getProduct(id);
        product.setStatus("INACTIVE");
        productRepository.save(product);
    }

    // ================= Helpers =================

    /** Đếm số sản phẩm ACTIVE thỏa lọc danh mục + giới tính + khoảng giá (đúng tổng phân trang). */
    private long countActiveFilteredWithPrice(Collection<Long> categoryIds, String gender,
                                              BigDecimal minPrice, BigDecimal maxPrice) {
        long base = productRepository.countActiveFiltered(categoryIds, gender);
        if (minPrice == null && maxPrice == null) return base;
        if (base == 0) return 0;
        // Đếm trong phạm vi giá: quét tối đa 5000 bản ghi đủ dùng cho dataset hiện tại
        Page<Product> scan = productRepository.findActiveFiltered(
                categoryIds, gender, PageRequest.of(0, 5000, Sort.unsorted()));
        return scan.getContent().stream()
                .filter(p -> minPrice == null || p.getPrice().compareTo(minPrice) >= 0)
                .filter(p -> maxPrice == null || p.getPrice().compareTo(maxPrice) <= 0)
                .count();
    }

    private Page<Product> filterByPrice(Page<Product> products, BigDecimal minPrice, BigDecimal maxPrice) {
        if (minPrice == null && maxPrice == null) {
            return products;
        }
        List<Product> filtered = products.getContent().stream()
                .filter(p -> minPrice == null || p.getPrice().compareTo(minPrice) >= 0)
                .filter(p -> maxPrice == null || p.getPrice().compareTo(maxPrice) <= 0)
                .toList();
        return new org.springframework.data.domain.PageImpl<>(filtered, products.getPageable(),
                filtered.size());
    }

    private Pageable buildPageable(int page, int size, String sort) {
        return switch (sort != null ? sort : "newest") {
            case "price-asc" -> PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "price"));
            case "price-desc" -> PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "price"));
            case "name" -> PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"));
            case "rating" -> PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "rating"));
            default -> PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        };
    }

    private void validateVariants(List<ProductDtos.VariantInput> variants) {
        if (variants == null) return;
        long distinct = variants.stream()
                .map(v -> v.getSize() + "|" + v.getColor())
                .distinct().count();
        if (distinct < variants.size()) {
            throw new BadRequestException("Biến thể bị trùng (cặp size + màu phải khác nhau)");
        }
    }

    private Integer sumVariantStock(List<ProductDtos.VariantInput> variants, Integer fallback) {
        if (variants == null || variants.isEmpty()) return fallback != null ? fallback : 0;
        return variants.stream()
                .mapToInt(v -> v.getStock() != null ? v.getStock() : 0)
                .sum();
    }

    private Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm #" + id));
    }

    private Category getCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục #" + id));
    }

    public ProductDtos.ProductResponse toResponse(Product p) {
        List<ProductDtos.VariantResponse> variants = variantRepository.findByProductId(p.getId()).stream()
                .map(v -> ProductDtos.VariantResponse.builder()
                        .id(v.getId()).size(v.getSize()).color(v.getColor())
                        .stock(v.getStock()).sku(v.getSku())
                        .build())
                .toList();

        return ProductDtos.ProductResponse.builder()
                .id(p.getId())
                .code(p.getCode())
                .name(p.getName())
                .categoryId(p.getCategoryId())
                .categoryName(categoryRepository.findById(p.getCategoryId())
                        .map(Category::getName).orElse(null))
                .description(p.getDescription())
                .price(p.getPrice())
                .costPrice(p.getCostPrice())
                .oldPrice(p.getOldPrice())
                .stock(p.getStock())
                .minStock(p.getMinStock())
                .lowStock(p.getStock() <= (p.getMinStock() != null ? p.getMinStock() : 10))
                .status(p.getStatus())
                .imageUrl(p.getImageUrl())
                .sku(p.getSku())
                .material(p.getMaterial())
                .fit(p.getFit())
                .season(p.getSeason())
                .careInstructions(p.getCareInstructions())
                .rating(p.getRating())
                .reviewCount(p.getReviewCount())
                .badge(p.getBadge())
                .targetGender(p.getTargetGender())
                .variants(variants)
                .build();
    }
}
