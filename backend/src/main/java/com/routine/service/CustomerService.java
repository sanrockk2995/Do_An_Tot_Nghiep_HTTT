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
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
            "('|\"|;|--|/\\*|\\*/|\\\\|\\b(union|select|insert|update|delete|drop|alter|truncate|exec|xp_)\\b|\\b(or|and)\\s+['\"]?\\d+['\"]?\\s*=\\s*['\"]?\\d+)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern XSS_PATTERN = Pattern.compile(
            "(<[^>]*>|javascript:|on\\w+\\s*=)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern VALID_SEARCH_CHARS = Pattern.compile(
            "^[\\p{L}\\p{N}\\s@._\\-+/,]+$"
    );

    private final CustomerRepository customerRepository;

    public void validateSearchQuery(String q) {
        if (q == null || q.isBlank()) return;
        String trimmed = q.trim();
        if (trimmed.length() > 100) {
            throw new BadRequestException("Thông tin tìm kiếm không hợp lệ (độ dài tối đa 100 ký tự). Hệ thống yêu cầu người dùng nhập lại đúng thông tin.");
        }
        if (SQL_INJECTION_PATTERN.matcher(trimmed).find() || XSS_PATTERN.matcher(trimmed).find()) {
            throw new BadRequestException("Thông tin nhập vào không hợp lệ (chứa ký tự đặc biệt hoặc mã độc SQL). Hệ thống yêu cầu người dùng nhập lại đúng thông tin.");
        }
        if (!VALID_SEARCH_CHARS.matcher(trimmed).matches()) {
            throw new BadRequestException("Thông tin nhập vào không hợp lệ (sai định dạng hoặc chứa ký tự đặc biệt). Hệ thống yêu cầu người dùng nhập lại đúng thông tin.");
        }
        if (trimmed.contains("@")) {
            long atCount = trimmed.chars().filter(ch -> ch == '@').count();
            if (atCount > 1 || trimmed.startsWith("@") || trimmed.contains(" ")) {
                throw new BadRequestException("Thông tin nhập vào không hợp lệ (sai định dạng email). Hệ thống yêu cầu người dùng nhập lại đúng thông tin.");
            }
        }
    }

    @Transactional(readOnly = true)
    public Page<CustomerDtos.CustomerResponse> search(String q, int page, int size) {
        validateSearchQuery(q);
        Pageable pageable = PageRequest.of(page, size);
        Page<Customer> customers = (q == null || q.isBlank())
                ? customerRepository.findAll(pageable)
                : customerRepository.search(q.trim(), pageable);
        return customers.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CustomerDtos.CustomerResponse getById(Long id) {
        return toResponse(getCustomer(id));
    }

    /** Nhân viên thêm khách tại quầy (không có tài khoản đăng nhập). */
    @Transactional
    public CustomerDtos.CustomerResponse create(CustomerDtos.CustomerRequest request) {
        String fullName = request.getFullName() != null ? request.getFullName().trim() : "";
        if (fullName.isBlank()) {
            throw new BadRequestException("Họ tên không được để trống");
        }

        String phone = request.getPhone() != null ? request.getPhone().trim() : "";
        if (phone.isBlank()) {
            throw new BadRequestException("Số điện thoại không được để trống");
        }

        String cleanPhone = phone.replaceAll("[\\s.-]", "");
        if (!cleanPhone.matches("^(0|\\+84)[0-9]{9}$")) {
            throw new BadRequestException("Số điện thoại không đúng định dạng (yêu cầu 10 chữ số, ví dụ 0912345678)");
        }

        String email = (request.getEmail() != null && !request.getEmail().trim().isBlank())
                ? request.getEmail().trim() : null;
        if (email != null && !email.matches("^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$")) {
            throw new BadRequestException("Định dạng email không hợp lệ");
        }

        // Kiểm tra khách hàng đã tồn tại (trùng SĐT hoặc Email)
        if (customerRepository.existsByPhone(cleanPhone)) {
            throw new BadRequestException("Khách hàng đã tồn tại. Số điện thoại này đã có trong hệ thống.");
        }
        if (email != null && customerRepository.existsByEmailIgnoreCase(email)) {
            throw new BadRequestException("Khách hàng đã tồn tại. Email này đã có trong hệ thống.");
        }

        Customer customer = Customer.builder()
                .fullName(fullName)
                .phone(cleanPhone)
                .email(email)
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .district(request.getDistrict() != null ? request.getDistrict().trim() : null)
                .city(request.getCity() != null ? request.getCity().trim() : null)
                .tier(request.getTier() != null ? request.getTier() : "REGULAR")
                .totalOrders(0)
                .totalSpent(BigDecimal.ZERO)
                .build();
        return toResponse(customerRepository.save(customer));
    }

    @Transactional
    public CustomerDtos.CustomerResponse update(Long id, CustomerDtos.CustomerRequest request) {
        Customer customer = getCustomer(id);

        String fullName = request.getFullName() != null ? request.getFullName().trim() : "";
        if (fullName.isBlank()) {
            throw new BadRequestException("Họ tên không được để trống");
        }

        String phone = request.getPhone() != null ? request.getPhone().trim() : "";
        if (phone.isBlank()) {
            throw new BadRequestException("Số điện thoại không được để trống");
        }

        String cleanPhone = phone.replaceAll("[\\s.-]", "");
        if (!cleanPhone.matches("^(0|\\+84)[0-9]{9}$")) {
            throw new BadRequestException("Số điện thoại không đúng định dạng (yêu cầu 10 chữ số)");
        }

        if (!cleanPhone.equals(customer.getPhone()) && customerRepository.existsByPhone(cleanPhone)) {
            throw new BadRequestException("Khách hàng đã tồn tại. Số điện thoại này đã có trong hệ thống.");
        }

        String email = (request.getEmail() != null && !request.getEmail().trim().isBlank())
                ? request.getEmail().trim() : null;
        if (email != null && !email.matches("^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$")) {
            throw new BadRequestException("Định dạng email không hợp lệ");
        }

        if (email != null && !email.equalsIgnoreCase(customer.getEmail()) && customerRepository.existsByEmailIgnoreCase(email)) {
            throw new BadRequestException("Khách hàng đã tồn tại. Email này đã có trong hệ thống.");
        }

        customer.setFullName(fullName);
        customer.setPhone(cleanPhone);
        customer.setEmail(email);
        customer.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        customer.setDistrict(request.getDistrict() != null ? request.getDistrict().trim() : null);
        customer.setCity(request.getCity() != null ? request.getCity().trim() : null);
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
