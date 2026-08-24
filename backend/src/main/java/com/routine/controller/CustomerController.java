package com.routine.controller;

import com.routine.dto.CustomerDtos;
import com.routine.dto.OrderDtos;
import com.routine.dto.PageResponse;
import com.routine.entity.Customer;
import com.routine.exception.ResourceNotFoundException;
import com.routine.repository.CustomerRepository;
import com.routine.security.CustomerPrincipal;
import com.routine.security.SecurityUtils;
import com.routine.service.CustomerService;
import com.routine.service.OrderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Quản lý khách hàng + hồ sơ khách đang đăng nhập.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Customers", description = "Quản lý khách hàng và hồ sơ cá nhân")
public class CustomerController {

    private final CustomerService customerService;
    private final OrderService orderService;
    private final CustomerRepository customerRepository;

    /** Danh sách/tìm kiếm khách — nhân viên bán hàng & quản lý. */
    @GetMapping("/customers")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<PageResponse<CustomerDtos.CustomerResponse>> list(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                PageResponse.from(customerService.search(q, page, size)));
    }

    @GetMapping("/customers/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<CustomerDtos.CustomerResponse> detail(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getById(id));
    }

    /** Lịch sử mua hàng của khách. */
    @GetMapping("/customers/{id}/orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<PageResponse<OrderDtos.OrderResponse>> customerOrders(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(PageResponse.from(
                orderService.listByCustomer(id, page, size)));
    }

    @PostMapping("/customers")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
    public ResponseEntity<CustomerDtos.CustomerResponse> create(
            @Valid @RequestBody CustomerDtos.CustomerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerService.create(request));
    }

    @PutMapping("/customers/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
    public ResponseEntity<CustomerDtos.CustomerResponse> update(
            @PathVariable Long id, @Valid @RequestBody CustomerDtos.CustomerRequest request) {
        return ResponseEntity.ok(customerService.update(id, request));
    }

    // ==================== HỒ SƠ KHÁCH ĐANG ĐĂNG NHẬP ====================

    @GetMapping("/me")
    public ResponseEntity<CustomerDtos.CustomerResponse> me() {
        if (SecurityUtils.isCustomer()) {
            Long customerId = SecurityUtils.currentCustomerId();
            return ResponseEntity.ok(customerService.getById(customerId));
        }
        throw new ResourceNotFoundException("Chỉ dành cho tài khoản khách hàng");
    }

    @PutMapping("/me/profile")
    public ResponseEntity<CustomerDtos.CustomerResponse> updateProfile(
            @Valid @RequestBody CustomerDtos.ProfileRequest request) {
        Long customerId = SecurityUtils.currentCustomerId();
        return ResponseEntity.ok(customerService.updateProfile(customerId, request));
    }
}
