package com.routine.controller;

import com.routine.dto.OtherDtos;
import com.routine.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Quản lý nhân viên — chỉ ADMIN.
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Quản lý nhân viên và phân quyền")
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<java.util.List<OtherDtos.StaffResponse>> list() {
        return ResponseEntity.ok(userService.getAll());
    }

    // ==================== HỒ SƠ NHÂN VIÊN ĐANG ĐĂNG NHẬP ====================

    @GetMapping("/me")
    public ResponseEntity<OtherDtos.StaffResponse> myProfile() {
        return ResponseEntity.ok(userService.getMyProfile());
    }

    /** Nhân viên tự cập nhật hồ sơ cá nhân. */
    @PutMapping("/me")
    public ResponseEntity<OtherDtos.StaffResponse> updateMyProfile(
            @Valid @RequestBody OtherDtos.MyProfileRequest request) {
        return ResponseEntity.ok(userService.updateMyProfile(request));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OtherDtos.StaffResponse> create(
            @Valid @RequestBody OtherDtos.StaffRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OtherDtos.StaffResponse> update(
            @PathVariable Long id, @Valid @RequestBody OtherDtos.StaffRequest request) {
        return ResponseEntity.ok(userService.update(id, request));
    }

    /** Kích hoạt / vô hiệu hoá tài khoản. */
    @PutMapping("/{id}/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OtherDtos.StaffResponse> setActive(
            @PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        boolean active = body.getOrDefault("isActive", true);
        return ResponseEntity.ok(userService.setActive(id, active));
    }
}
