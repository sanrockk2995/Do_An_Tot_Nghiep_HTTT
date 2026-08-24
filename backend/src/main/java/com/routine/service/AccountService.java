package com.routine.service;

import com.routine.dto.AuthDtos;
import com.routine.entity.Customer;
import com.routine.entity.User;
import com.routine.exception.BadRequestException;
import com.routine.repository.CustomerRepository;
import com.routine.repository.UserRepository;
import com.routine.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Bảo mật tài khoản: đổi mật khẩu cho cả nhân viên nội bộ và khách hàng
 * (UC "Bảo mật tài khoản" — SRS mục 2.1.2.2).
 */
@Service
@RequiredArgsConstructor
public class AccountService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void changePassword(AuthDtos.ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu xác nhận không khớp.");
        }

        if (SecurityUtils.isCustomer()) {
            Customer customer = customerRepository.findById(SecurityUtils.currentCustomerId())
                    .orElseThrow(() -> new BadRequestException("Không tìm thấy tài khoản khách hàng"));
            if (!passwordEncoder.matches(request.getCurrentPassword(), customer.getPasswordHash())) {
                throw new BadRequestException("Mật khẩu hiện tại không chính xác.");
            }
            customer.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
            customerRepository.save(customer);
            return;
        }

        User user = userRepository.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy tài khoản nhân viên"));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu hiện tại không chính xác.");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
