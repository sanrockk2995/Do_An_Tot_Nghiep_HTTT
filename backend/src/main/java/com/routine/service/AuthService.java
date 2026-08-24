package com.routine.service;

import com.routine.dto.AuthDtos;
import com.routine.entity.Customer;
import com.routine.entity.User;
import com.routine.exception.BadRequestException;
import com.routine.repository.CustomerRepository;
import com.routine.repository.UserRepository;
import com.routine.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    /** Các vai trò nội bộ hợp lệ khi đăng nhập. */
    private static final Set<String> STAFF_ROLES = Set.of("ADMIN", "SALES_STAFF", "WAREHOUSE_STAFF", "ACCOUNTANT");

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    /**
     * Đăng nhập nhân viên: email + password + role.
     * Role chọn ở form phải khớp role trong DB, không khớp → từ chối.
     */
    @Transactional(readOnly = true)
    public AuthDtos.AuthResponse staffLogin(AuthDtos.StaffLoginRequest request) {
        if (!STAFF_ROLES.contains(request.getRole())) {
            throw new BadRequestException("Vai trò không hợp lệ");
        }

        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Email hoặc mật khẩu hoặc vai trò không đúng"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new BadRequestException("Tài khoản đã bị vô hiệu hoá. Liên hệ quản lý để kích hoạt lại");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Email hoặc mật khẩu hoặc vai trò không đúng");
        }

        // Vai trò chọn ở form phải khớp vai trò trong DB
        if (!user.getRole().equals(request.getRole())) {
            throw new BadCredentialsException("Vai trò không khớp với tài khoản");
        }

        return new AuthDtos.AuthResponse(
                tokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole()),
                tokenProvider.generateRefreshToken(user.getId(), user.getEmail(), user.getRole()),
                user.getId(), user.getEmail(), user.getFullName(), user.getRole());
    }

    /** Đăng nhập khách hàng. */
    @Transactional(readOnly = true)
    public AuthDtos.AuthResponse customerLogin(AuthDtos.CustomerLoginRequest request) {
        Customer customer = customerRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Email hoặc mật khẩu không đúng"));

        if (customer.getPasswordHash() == null
                || !passwordEncoder.matches(request.getPassword(), customer.getPasswordHash())) {
            throw new BadCredentialsException("Email hoặc mật khẩu không đúng");
        }

        return new AuthDtos.AuthResponse(
                tokenProvider.generateCustomerAccessToken(customer.getId(), customer.getEmail()),
                tokenProvider.generateCustomerRefreshToken(customer.getId(), customer.getEmail()),
                customer.getId(), customer.getEmail(), customer.getFullName(), "CUSTOMER");
    }

    /** Khách hàng tự đăng ký. */
    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        if (customerRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng");
        }

        Customer customer = Customer.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .district(request.getDistrict())
                .city(request.getCity())
                .tier("REGULAR")
                .totalOrders(0)
                .totalSpent(java.math.BigDecimal.ZERO)
                .build();
        customer = customerRepository.save(customer);

        return new AuthDtos.AuthResponse(
                tokenProvider.generateCustomerAccessToken(customer.getId(), customer.getEmail()),
                tokenProvider.generateCustomerRefreshToken(customer.getId(), customer.getEmail()),
                customer.getId(), customer.getEmail(), customer.getFullName(), "CUSTOMER");
    }

    /** Cấp lại access token từ refresh token (cả nhân viên và khách hàng). */
    @Transactional(readOnly = true)
    public AuthDtos.AuthResponse refresh(String refreshToken) {
        io.jsonwebtoken.Claims claims = tokenProvider.parse(refreshToken);
        if (claims == null || !tokenProvider.isValidRefreshToken(claims)) {
            throw new BadCredentialsException("Refresh token không hợp lệ hoặc đã hết hạn");
        }

        Long id = tokenProvider.getUserId(claims);
        String accountType = tokenProvider.getAccountType(claims);

        if (JwtTokenProvider.ACCOUNT_CUSTOMER.equals(accountType)) {
            Customer customer = customerRepository.findById(id)
                    .orElseThrow(() -> new BadCredentialsException("Tài khoản không tồn tại"));
            return new AuthDtos.AuthResponse(
                    tokenProvider.generateCustomerAccessToken(customer.getId(), customer.getEmail()),
                    refreshToken,
                    customer.getId(), customer.getEmail(), customer.getFullName(), "CUSTOMER");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new BadCredentialsException("Tài khoản không tồn tại"));
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new BadRequestException("Tài khoản đã bị vô hiệu hoá");
        }
        return new AuthDtos.AuthResponse(
                tokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole()),
                refreshToken,
                user.getId(), user.getEmail(), user.getFullName(), user.getRole());
    }
}
