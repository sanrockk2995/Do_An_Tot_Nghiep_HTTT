package com.routine.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderDtos {

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    public static class OrderItemInput {
        @NotNull(message = "Sản phẩm không được để trống")
        private Long productId;

        @NotBlank(message = "Size không được để trống")
        private String size;

        @NotBlank(message = "Màu không được để trống")
        private String color;

        @NotNull(message = "Số lượng không được để trống")
        @Min(value = 1, message = "Số lượng tối thiểu 1")
        private Integer quantity;
    }

    /** Tạo hóa đơn (POS hoặc đơn online). */
    @Getter @Setter
    @NoArgsConstructor
    public static class OrderRequest {
        private Long customerId;                 // null = khách lẻ

        @NotEmpty(message = "Đơn hàng phải có ít nhất 1 sản phẩm")
        private List<OrderItemInput> items;

        @NotBlank(message = "Phương thức thanh toán không được để trống")
        private String paymentMethod;            // CASH | BANK_TRANSFER | CARD | COD

        private String channel;                  // OFFLINE | ONLINE (mặc định OFFLINE)

        private String promotionCode;            // mã giảm giá (tuỳ chọn)

        private String notes;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    public static class StatusRequest {
        /** PENDING | PAID | COMPLETED | CANCELLED */
        @NotBlank(message = "Trạng thái không được để trống")
        private String status;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class OrderItemResponse {
        private Long id;
        private Long productId;
        private String productCode;
        private String productName;
        private BigDecimal price;
        private Integer quantity;
        private BigDecimal subtotal;
        private String size;
        private String color;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class OrderResponse {
        private Long id;
        private String orderNumber;
        private Long customerId;
        private String customerName;
        private String customerPhone;
        private BigDecimal subtotal;
        private BigDecimal discount;
        private BigDecimal total;
        private String paymentMethod;
        private String status;
        private String channel;
        private String notes;
        private String createdBy;
        private LocalDateTime deliveredAt;
        private LocalDateTime createdAt;
        private List<OrderItemResponse> items;
    }
}
