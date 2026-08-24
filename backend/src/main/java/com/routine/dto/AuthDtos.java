package com.routine.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class AuthDtos {

    /** Đăng nhập nhân viên nội bộ (có chọn vai trò). */
    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    public static class StaffLoginRequest {
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không hợp lệ")
        private String email;

        @NotBlank(message = "Mật khẩu không được để trống")
        private String password;

        /** Vai trò người dùng chọn ở form: ADMIN | SALES_STAFF | WAREHOUSE_STAFF | ACCOUNTANT */
        @NotBlank(message = "Vui lòng chọn vai trò")
        private String role;
    }

    /** Đăng nhập khách hàng. */
    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    public static class CustomerLoginRequest {
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không hợp lệ")
        private String email;

        @NotBlank(message = "Mật khẩu không được để trống")
        private String password;
    }

    /** Khách hàng tự đăng ký. */
    @Getter @Setter
    @NoArgsConstructor
    public static class RegisterRequest {
        @NotBlank(message = "Họ tên không được để trống")
        private String fullName;

        @NotBlank(message = "Số điện thoại không được để trống")
        private String phone;

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không hợp lệ")
        private String email;

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 8, message = "Mật khẩu phải từ 8 ký tự trở lên")
        private String password;

        private String address;
        private String district;
        private String city;
    }

    /** Đáp ứng đăng nhập: access token + refresh token + thông tin cơ bản. */
    public record AuthResponse(
            String accessToken,
            String refreshToken,
            Long id,
            String email,
            String fullName,
            String role) {
    }

    /** Yêu cầu cấp lại access token từ refresh token. */
    public record RefreshTokenRequest(String refreshToken) {
    }

    /** Đổi mật khẩu (dành cho cả nhân viên và khách hàng đã đăng nhập). */
    @Getter @Setter
    @NoArgsConstructor
    public static class ChangePasswordRequest {
        @NotBlank(message = "Mật khẩu hiện tại không được để trống")
        private String currentPassword;

        @NotBlank(message = "Mật khẩu mới không được để trống")
        @Size(min = 8, message = "Mật khẩu phải từ 8 ký tự trở lên")
        private String newPassword;

        @NotBlank(message = "Xác nhận mật khẩu không được để trống")
        private String confirmPassword;
    }
}
