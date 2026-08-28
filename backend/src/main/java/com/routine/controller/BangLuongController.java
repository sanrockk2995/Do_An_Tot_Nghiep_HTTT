package com.routine.controller;

import com.routine.dto.BangLuongDtos;
import com.routine.service.BangLuongService;
import com.routine.service.ExcelExportService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Bảng lương nhân viên — kế toán & quản lý (UC SRS "Bảng lương nhân viên").
 */
@RestController
@RequestMapping({"/api/v1/payrolls", "/api/v1/bang-luong"})
@RequiredArgsConstructor
@Tag(name = "Payroll", description = "Bảng lương nhân viên theo tháng")
public class BangLuongController {

    private final BangLuongService bangLuongService;
    private final ExcelExportService excelExportService;

    /** Bảng lương tháng/năm (mặc định tháng hiện tại), gồm mọi nhân viên active. */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<List<BangLuongDtos.BangLuongResponse>> list(
            @RequestParam(required = false) Integer thang,
            @RequestParam(required = false) Integer nam) {
        return ResponseEntity.ok(bangLuongService.list(thang, nam));
    }

    /** Cập nhật hệ số/phụ cấp/thưởng/khấu trừ cho một nhân viên trong tháng. */
    @PutMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<BangLuongDtos.BangLuongResponse> update(
            @PathVariable Long userId,
            @RequestParam Integer thang,
            @RequestParam Integer nam,
            @RequestBody BangLuongDtos.BangLuongUpdateRequest request) {
        return ResponseEntity.ok(bangLuongService.update(userId, thang, nam, request));
    }

    /** Duyệt (khoá) một dòng lương. */
    @PutMapping({"/{id}/approve", "/{id}/duyet"})
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<BangLuongDtos.BangLuongResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(bangLuongService.approve(id));
    }

    /** Tổng quỹ lương kỳ (dùng cho báo cáo tài chính). */
    @GetMapping({"/total-fund", "/tong-quy"})
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<Map<String, BigDecimal>> tongQuy(
            @RequestParam Integer thang,
            @RequestParam Integer nam) {
        return ResponseEntity.ok(Map.of("tongQuyLuong",
                bangLuongService.tongQuy(thang, nam)));
    }

    /** Xuất Excel bảng lương tháng (in/lưu trữ). */
    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<byte[]> export(
            @RequestParam(required = false) Integer thang,
            @RequestParam(required = false) Integer nam) {
        int t = (thang == null) ? java.time.LocalDate.now().getMonthValue() : thang;
        int n = (nam == null) ? java.time.LocalDate.now().getYear() : nam;
        List<BangLuongDtos.BangLuongResponse> rows = bangLuongService.list(t, n);
        byte[] xlsx = excelExportService.exportBangLuong(rows, t, n);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"bang-luong-" + t + "-" + n + ".xlsx\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(xlsx);
    }
}
