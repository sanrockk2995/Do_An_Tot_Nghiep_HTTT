package com.routine.service;

import com.routine.dto.OtherDtos;
import com.routine.entity.User;
import com.routine.exception.BadRequestException;
import com.routine.exception.ResourceNotFoundException;
import com.routine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final Set<String> VALID_ROLES =
            Set.of("ADMIN", "SALES_STAFF", "WAREHOUSE_STAFF", "ACCOUNTANT");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String EMAIL_REGEX =
            "^[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\\.)+[A-Za-z]{2,}$";

    @Transactional(readOnly = true)
    public List<OtherDtos.StaffResponse> getAll() {
        return userRepository.findAll().stream()
                .map(this::toResponse).toList();
    }

    @Transactional
    public OtherDtos.StaffResponse create(OtherDtos.StaffRequest request) {
        validateRole(request.getRole());
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            throw new BadRequestException("Họ tên không được để trống");
        }
        if (request.getEmail() == null || !request.getEmail().matches(EMAIL_REGEX)) {
            throw new BadRequestException("Định dạng email không hợp lệ");
        }
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BadRequestException("Mật khẩu không được để trống");
        }
        if (request.getPassword().length() < 6) {
            throw new BadRequestException("Mật khẩu phải có độ dài tối thiểu 6 ký tự");
        }

        String validatedPhone = validatePhone(request.getPhone());

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phone(validatedPhone)
                .branch(request.getBranch())
                .role(request.getRole())
                .isActive(true)
                .build();
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public OtherDtos.StaffResponse update(Long id, OtherDtos.StaffRequest request) {
        validateRole(request.getRole());
        User user = getUser(id);
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(validatePhone(request.getPhone()));
        }
        user.setBranch(request.getBranch());
        // Không cho tự hạ vai trò của chính mình khỏi ADMIN duy nhất... đơn giản: cho phép đổi role
        user.setRole(request.getRole());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (request.getPassword().length() < 6) {
                throw new BadRequestException("Mật khẩu phải có độ dài tối thiểu 6 ký tự");
            }
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        return toResponse(userRepository.save(user));
    }

    /** Hồ sơ của chính nhân viên đang đăng nhập. */
    @Transactional(readOnly = true)
    public OtherDtos.StaffResponse getMyProfile() {
        return toResponse(getUser(com.routine.security.SecurityUtils.currentUserId()));
    }

    /** Nhân viên tự cập nhật hồ sơ (chỉ họ tên, SĐT, chi nhánh — không đụng role/email). */
    @Transactional
    public OtherDtos.StaffResponse updateMyProfile(OtherDtos.MyProfileRequest request) {
        User user = getUser(com.routine.security.SecurityUtils.currentUserId());
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(validatePhone(request.getPhone()));
        }
        if (request.getBranch() != null) user.setBranch(request.getBranch());
        return toResponse(userRepository.save(user));
    }

    /** Kích hoạt / vô hiệu hoá nhân viên. */
    @Transactional
    public OtherDtos.StaffResponse setActive(Long id, boolean active) {
        User user = getUser(id);
        Long currentUserId = com.routine.security.SecurityUtils.currentUserId();
        if (id.equals(currentUserId) && !active) {
            throw new BadRequestException("Không thể vô hiệu hoá chính tài khoản của bạn");
        }
        user.setIsActive(active);
        return toResponse(userRepository.save(user));
    }

    public String validatePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        String trimmed = phone.trim();
        if (!trimmed.matches("^[0-9]+$")) {
            throw new BadRequestException("Số điện thoại chỉ được chứa các chữ số");
        }
        if (trimmed.length() != 10) {
            throw new BadRequestException("Số điện thoại phải bao gồm đúng 10 chữ số");
        }
        if (!trimmed.startsWith("0")) {
            throw new BadRequestException("Số điện thoại phải bắt đầu bằng chữ số 0 (ví dụ: 0901234567)");
        }
        return trimmed;
    }

    private void validateRole(String role) {
        if (!VALID_ROLES.contains(role)) {
            throw new BadRequestException("Vai trò không hợp lệ: " + role);
        }
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên #" + id));
    }

    private OtherDtos.StaffResponse toResponse(User u) {
        return OtherDtos.StaffResponse.builder()
                .id(u.getId()).email(u.getEmail()).fullName(u.getFullName())
                .phone(u.getPhone()).branch(u.getBranch()).role(u.getRole())
                .avatarUrl(u.getAvatarUrl()).isActive(u.getIsActive())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
