package com.routine.service;

import com.routine.dto.CustomerDtos;
import com.routine.entity.Customer;
import com.routine.exception.BadRequestException;
import com.routine.exception.ResourceNotFoundException;
import com.routine.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public Page<CustomerDtos.CustomerResponse> search(String q, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Customer> customers = (q == null || q.isBlank())
                ? customerRepository.findAll(pageable)
                : customerRepository.search(q, pageable);
        return customers.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CustomerDtos.CustomerResponse getById(Long id) {
        return toResponse(getCustomer(id));
    }

    /** Nhân viên thêm khách tại quầy (không có tài khoản đăng nhập). */
    @Transactional
    public CustomerDtos.CustomerResponse create(CustomerDtos.CustomerRequest request) {
        if (request.getEmail() != null && !request.getEmail().isBlank()
                && customerRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng");
        }

        Customer customer = Customer.builder()
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .district(request.getDistrict())
                .city(request.getCity())
                .tier(request.getTier() != null ? request.getTier() : "REGULAR")
                .totalOrders(0)
                .totalSpent(BigDecimal.ZERO)
                .build();
        return toResponse(customerRepository.save(customer));
    }

    @Transactional
    public CustomerDtos.CustomerResponse update(Long id, CustomerDtos.CustomerRequest request) {
        Customer customer = getCustomer(id);
        customer.setFullName(request.getFullName());
        customer.setPhone(request.getPhone());
        if (request.getEmail() != null) customer.setEmail(request.getEmail());
        customer.setAddress(request.getAddress());
        customer.setDistrict(request.getDistrict());
        customer.setCity(request.getCity());
        if (request.getTier() != null) customer.setTier(request.getTier());
        return toResponse(customerRepository.save(customer));
    }

    /** Khách tự cập nhật hồ sơ của mình. */
    @Transactional
    public CustomerDtos.CustomerResponse updateProfile(Long customerId, CustomerDtos.ProfileRequest request) {
        Customer customer = getCustomer(customerId);
        customer.setFullName(request.getFullName());
        if (request.getPhone() != null) customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());
        customer.setDistrict(request.getDistrict());
        customer.setCity(request.getCity());
        return toResponse(customerRepository.save(customer));
    }

    /**
     * Cập nhật thống kê mua hàng sau khi đơn COMPLETED:
     * tổng đơn, tổng chi, hạng khách theo mức chi tiêu.
     */
    @Transactional
    public void recordPurchase(Long customerId, BigDecimal orderTotal) {
        Customer customer = getCustomer(customerId);
        customer.setTotalOrders((customer.getTotalOrders() != null ? customer.getTotalOrders() : 0) + 1);
        customer.setTotalSpent((customer.getTotalSpent() != null ? customer.getTotalSpent() : BigDecimal.ZERO)
                .add(orderTotal));
        customer.setLastOrderAt(LocalDateTime.now());
        customer.setTier(tierFor(customer.getTotalSpent()));
        customerRepository.save(customer);
    }

    private String tierFor(BigDecimal totalSpent) {
        if (totalSpent.compareTo(new BigDecimal("50000000")) >= 0) return "VIP";
        if (totalSpent.compareTo(new BigDecimal("20000000")) >= 0) return "GOLD";
        if (totalSpent.compareTo(new BigDecimal("5000000")) >= 0) return "SILVER";
        return "REGULAR";
    }

    private Customer getCustomer(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng #" + id));
    }

    public CustomerDtos.CustomerResponse toResponse(Customer c) {
        return CustomerDtos.CustomerResponse.builder()
                .id(c.getId()).fullName(c.getFullName()).phone(c.getPhone())
                .email(c.getEmail()).address(c.getAddress())
                .district(c.getDistrict()).city(c.getCity()).tier(c.getTier())
                .totalOrders(c.getTotalOrders()).totalSpent(c.getTotalSpent())
                .lastOrderAt(c.getLastOrderAt()).createdAt(c.getCreatedAt())
                .build();
    }
}
