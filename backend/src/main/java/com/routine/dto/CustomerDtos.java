package com.routine.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CustomerDtos {

    /** Tạo/sửa khách hàng (nhân viên hoặc khách tự đăng ký). */
    @Getter @Setter
    @NoArgsConstructor
    public static class CustomerRequest {
        @NotBlank(message = "Họ tên không được để trống")
        private String fullName;

        @NotBlank(message = "Số điện thoại không được để trống")
        private String phone;

        @Email(message = "Email không hợp lệ")
        private String email;

        private String address;
        private String district;
        private String city;
        private String tier;      // REGULAR | SILVER | GOLD | VIP
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class CustomerResponse {
        private Long id;
        private String fullName;
        private String phone;
        private String email;
        private String address;
        private String district;
        private String city;
        private String tier;
        private Integer totalOrders;
        private BigDecimal totalSpent;
        private LocalDateTime lastOrderAt;
        private LocalDateTime createdAt;
    }

    /** Cập nhật hồ sơ bởi chính khách hàng. */
    @Getter @Setter
    @NoArgsConstructor
    public static class ProfileRequest {
        @NotBlank(message = "Họ tên không được để trống")
        private String fullName;
        private String phone;
        private String address;
        private String district;
        private String city;
    }
}
