package com.routine.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class OtherDtos {

    // ============ Danh mục ============

    @Getter @Setter
    @NoArgsConstructor
    public static class CategoryRequest {
        @NotBlank(message = "Tên danh mục không được để trống")
        private String name;

        private String slug;          // null → tự sinh từ name
        private String description;
        private String icon;
        private Integer displayOrder;
        private Boolean isActive;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class CategoryResponse {
        private Long id;
        private String name;
        private String slug;
        private String description;
        private String icon;
        private Integer displayOrder;
        private Boolean isActive;
    }

    // ============ Khuyến mại ============

    @Getter @Setter
    @NoArgsConstructor
    public static class PromotionRequest {
        @NotBlank(message = "Mã giảm giá không được để trống")
        private String code;

        @NotBlank(message = "Tên chương trình không được để trống")
        private String name;

        private String description;

        /** PERCENT | FIXED_AMOUNT */
        @NotBlank(message = "Loại giảm giá không được để trống")
        private String type;

        private BigDecimal discountValue;
        private BigDecimal maxDiscountAmount;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private BigDecimal minOrderAmount;
        private Boolean applyToAllProducts;
        private Integer usageLimit;
        private String status;

        /** Danh sách product_id khi applyToAllProducts = false */
        private List<Long> productIds;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class PromotionResponse {
        private Long id;
        private String code;
        private String name;
        private String description;
        private String type;
        private BigDecimal discountValue;
        private BigDecimal maxDiscountAmount;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private BigDecimal minOrderAmount;
        private Boolean applyToAllProducts;
        private Integer usageLimit;
        private Integer usageCount;
        private String status;
        private List<Long> productIds;
    }

    /** Body của POST /promotions/apply. */
    @Getter @Setter
    @NoArgsConstructor
    public static class ApplyPromotionRequest {
        @NotBlank(message = "Mã giảm giá không được để trống")
        private String code;

        private BigDecimal orderAmount;

        /** Tuỳ chọn: kiểm tra mã có áp dụng cho các sản phẩm này không */
        private List<Long> productIds;
    }

    // ============ Nhà cung cấp ============

    @Getter @Setter
    @NoArgsConstructor
    public static class SupplierRequest {
        @NotBlank(message = "Mã NCC không được để trống")
        private String maNcc;

        @NotBlank(message = "Tên NCC không được để trống")
        private String tenNcc;

        private String diaChi;
        private String soDienThoai;
        private String email;
        private String nguoiLienHe;
        private String ghiChu;
        private String trangThai;
    }

    // ============ Nhân viên ============

    @Getter @Setter
    @NoArgsConstructor
    public static class StaffRequest {
        @NotBlank(message = "Email không được để trống")
        private String email;

        /** Bỏ trống khi sửa = giữ nguyên mật khẩu cũ */
        private String password;

        @NotBlank(message = "Họ tên không được để trống")
        private String fullName;

        private String phone;
        private String branch;

        /** ADMIN | SALES_STAFF | WAREHOUSE_STAFF | ACCOUNTANT */
        @NotBlank(message = "Vai trò không được để trống")
        private String role;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class StaffResponse {
        private Long id;
        private String email;
        private String fullName;
        private String phone;
        private String branch;
        private String role;
        private String avatarUrl;
        private Boolean isActive;
        private LocalDateTime createdAt;
    }

    /** Nhân viên tự cập nhật hồ sơ cá nhân. */
    @Getter @Setter
    @NoArgsConstructor
    public static class MyProfileRequest {
        @NotBlank(message = "Họ tên không được để trống")
        private String fullName;

        private String phone;
        private String branch;
    }

    // ============ Đánh giá ============

    @Getter @Setter
    @NoArgsConstructor
    public static class ReviewRequest {
        @jakarta.validation.constraints.Min(value = 1, message = "Điểm đánh giá từ 1 đến 5")
        @jakarta.validation.constraints.Max(value = 5, message = "Điểm đánh giá từ 1 đến 5")
        private Integer rating;

        private String comment;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ReviewResponse {
        private Long id;
        private Long productId;
        private Long customerId;
        private String customerName;
        private Integer rating;
        private String comment;
        private Boolean isVerified;
        private LocalDateTime createdAt;
    }
}
