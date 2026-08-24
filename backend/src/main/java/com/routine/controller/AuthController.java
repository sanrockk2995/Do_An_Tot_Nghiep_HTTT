package com.routine.controller;

import com.routine.dto.AuthDtos;
import com.routine.security.IpWhitelistService;
import com.routine.service.AccountService;
import com.routine.service.AuthService;
import com.routine.config.JwtConfig;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

/**
 * Xác thực: đăng nhập nhân viên / khách hàng, đăng ký, refresh, logout.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Đăng nhập, đăng ký, refresh token")
public class AuthController {

    private final AuthService authService;
    private final AccountService accountService;
    private final JwtConfig jwtConfig;
    private final IpWhitelistService ipWhitelistService;

    /** Đăng nhập nhân viên (chọn vai trò ở form — role phải khớp DB; chỉ nhận IP trong whitelist). */
    @PostMapping("/login")
    public ResponseEntity<AuthDtos.AuthResponse> staffLogin(
            @Valid @RequestBody AuthDtos.StaffLoginRequest request,
            HttpServletRequest httpRequest) {
        // Chỉ cho phép đăng nhập nội bộ từ các IP trong danh sách cấu hình
        ipWhitelistService.checkStaffLoginAllowed(httpRequest);
        AuthDtos.AuthResponse response = authService.staffLogin(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(response.refreshToken()))
                .body(response);
    }

    /** Đăng nhập khách hàng. */
    @PostMapping("/customer-login")
    public ResponseEntity<AuthDtos.AuthResponse> customerLogin(
            @Valid @RequestBody AuthDtos.CustomerLoginRequest request) {
        AuthDtos.AuthResponse response = authService.customerLogin(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(response.refreshToken()))
                .body(response);
    }

    /** Khách hàng tự đăng ký. */
    @PostMapping("/register")
    public ResponseEntity<AuthDtos.AuthResponse> register(
            @Valid @RequestBody AuthDtos.RegisterRequest request) {
        AuthDtos.AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(response.refreshToken()))
                .body(response);
    }

    /** Đổi mật khẩu cho nhân viên / khách hàng đang đăng nhập. */
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody AuthDtos.ChangePasswordRequest request) {
        accountService.changePassword(request);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }

    /** Cấp lại access token từ refresh token (cookie hoặc body). */
    @PostMapping("/refresh-token")
    public ResponseEntity<AuthDtos.AuthResponse> refreshToken(
            @RequestBody(required = false) AuthDtos.RefreshTokenRequest request,
            @CookieValue(name = "routine_refresh_token", required = false) String cookieToken) {
        String token = request != null && request.refreshToken() != null ? request.refreshToken() : cookieToken;
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(authService.refresh(token));
    }

    /** Đăng xuất: xoá cookie refresh token. */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        ResponseCookie clearCookie = ResponseCookie.from(jwtConfig.getRefreshCookieName(), "")
                .httpOnly(true)
                .secure(false) // bật true khi chạy HTTPS production
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(Map.of("message", "Đăng xuất thành công"));
    }

    private String buildRefreshCookie(String refreshToken) {
        return ResponseCookie.from(jwtConfig.getRefreshCookieName(), refreshToken)
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(Duration.ofDays(jwtConfig.getRefreshTokenTtlDays()))
                .sameSite("Lax")
                .build()
                .toString();
    }
}
