package com.routine.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

public class ProductDtos {

    /** Biến thể size/màu khi tạo/cập nhật sản phẩm. */
    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    public static class VariantInput {
        private Long id;
        @NotBlank(message = "Size không được để trống")
        private String size;
        @NotBlank(message = "Màu không được để trống")
        private String color;
        @Min(value = 0, message = "Tồn kho không âm")
        private Integer stock;
        private String sku;
    }

    @Getter @Setter
    @NoArgsConstructor
    public static class ProductRequest {
        @NotBlank(message = "Mã sản phẩm không được để trống")
        private String code;

        @NotBlank(message = "Tên sản phẩm không được để trống")
        private String name;

        @NotNull(message = "Danh mục không được để trống")
        private Long categoryId;

        private String description;

        @NotNull(message = "Giá bán không được để trống")
        @DecimalMin(value = "0.0", inclusive = false, message = "Giá bán phải lớn hơn 0")
        private BigDecimal price;

        private BigDecimal costPrice;
        private BigDecimal oldPrice;

        @Min(value = 0, message = "Tồn kho không âm")
        private Integer stock;

        private Integer minStock;
        private String imageUrl;
        private String sku;
        private String material;
        private String fit;
        private String season;
        private String careInstructions;
        private String badge;
        private String targetGender;
        private List<VariantInput> variants;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class VariantResponse {
        private Long id;
        private String size;
        private String color;
        private Integer stock;
        private String sku;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ProductResponse {
        private Long id;
        private String code;
        private String name;
        private Long categoryId;
        private String categoryName;
        private String description;
        private BigDecimal price;
        private BigDecimal costPrice;
        private BigDecimal oldPrice;
        private Integer stock;
        private Integer minStock;
        private Boolean lowStock;      // stock <= min_stock → cảnh báo
        private String status;
        private String imageUrl;
        private String sku;
        private String material;
        private String fit;
        private String season;
        private String careInstructions;
        private BigDecimal rating;
        private Integer reviewCount;
        private String badge;
        private String targetGender;
        private List<VariantResponse> variants;
    }

    /** Kết quả áp mã giảm giá. */
    public record PromotionApplyResult(
            boolean valid,
            String message,
            String promotionCode,
            BigDecimal discountAmount) {
    }
}
