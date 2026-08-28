package com.routine.controller;

import com.routine.dto.InventoryDtos;
import com.routine.service.ExcelExportService;
import com.routine.service.InventoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Nhà cung cấp, phiếu nhập/xuất kho, kiểm kê, báo cáo tồn.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Kho hàng: nhập, xuất, kiểm kê, báo cáo tồn")
public class InventoryController {

    private final InventoryService inventoryService;
    private final ExcelExportService excelExportService;

    // ==================== NHÀ CUNG CẤP ====================

    @GetMapping("/suppliers")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<List<com.routine.entity.Supplier>> suppliers(
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(inventoryService.listSuppliers(q));
    }

    @PostMapping("/suppliers")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<com.routine.entity.Supplier> createSupplier(
            @Valid @RequestBody com.routine.entity.Supplier supplier) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inventoryService.createSupplier(supplier));
    }

    @PutMapping("/suppliers/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<com.routine.entity.Supplier> updateSupplier(
            @PathVariable Long id, @Valid @RequestBody com.routine.entity.Supplier supplier) {
        return ResponseEntity.ok(inventoryService.updateSupplier(id, supplier));
    }

    @DeleteMapping("/suppliers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteSupplier(@PathVariable Long id) {
        inventoryService.softDeleteSupplier(id);
        return ResponseEntity.ok(Map.of("message", "Đã vô hiệu hoá nhà cung cấp"));
    }

    // ==================== PHIẾU NHẬP KHO (GOODS RECEIPTS) ====================

    @GetMapping({"/goods-receipts", "/phieu-nhap-kho"})
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<List<InventoryDtos.PhieuNhapResponse>> listNhap() {
        return ResponseEntity.ok(inventoryService.listPhieuNhap());
    }

    @PostMapping({"/goods-receipts", "/phieu-nhap-kho"})
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<InventoryDtos.PhieuNhapResponse> createNhap(
            @Valid @RequestBody InventoryDtos.PhieuNhapRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inventoryService.createPhieuNhap(request));
    }

    /** Duyệt phiếu: cộng tồn kho. */
    @PutMapping({"/goods-receipts/{id}/approve", "/phieu-nhap-kho/{id}/duyet"})
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<InventoryDtos.PhieuNhapResponse> duyetNhap(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.duyetPhieuNhap(id));
    }

    /** In / xuất Excel phiếu nhập kho. */
    @GetMapping({"/goods-receipts/{id}/export", "/phieu-nhap-kho/{id}/export"})
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<byte[]> exportNhap(@PathVariable Long id) {
        InventoryDtos.PhieuNhapResponse phieu = inventoryService.getPhieuNhap(id);
        String filename = "phieu-nhap-" + phieu.getMaPhieuNhap() + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelExportService.exportPhieuNhap(phieu));
    }

    // ==================== PHIẾU XUẤT KHO (GOODS ISSUES) ====================

    @GetMapping({"/goods-issues", "/phieu-xuat-kho"})
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<List<InventoryDtos.PhieuXuatResponse>> listXuat() {
        return ResponseEntity.ok(inventoryService.listPhieuXuat());
    }

    @PostMapping({"/goods-issues", "/phieu-xuat-kho"})
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<InventoryDtos.PhieuXuatResponse> createXuat(
            @Valid @RequestBody InventoryDtos.PhieuXuatRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inventoryService.createPhieuXuat(request));
    }

    @PutMapping({"/goods-issues/{id}/approve", "/phieu-xuat-kho/{id}/duyet"})
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<InventoryDtos.PhieuXuatResponse> duyetXuat(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.duyetPhieuXuat(id));
    }

    /** In / xuất Excel phiếu xuất kho. */
    @GetMapping({"/goods-issues/{id}/export", "/phieu-xuat-kho/{id}/export"})
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<byte[]> exportXuat(@PathVariable Long id) {
        InventoryDtos.PhieuXuatResponse phieu = inventoryService.getPhieuXuat(id);
        String filename = "phieu-xuat-" + phieu.getMaPhieuXuat() + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelExportService.exportPhieuXuat(phieu));
    }

    // ==================== KIỂM KÊ (STOCKTAKES) ====================

    @GetMapping({"/stocktakes", "/kiem-ke"})
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<List<InventoryDtos.KiemKeResponse>> listKiemKe() {
        return ResponseEntity.ok(inventoryService.listKiemKe());
    }

    /** Chi tiết kỳ kiểm kê (kèm chi tiết sản phẩm, tồn hệ thống đã chốt). */
    @GetMapping({"/stocktakes/{id}", "/kiem-ke/{id}"})
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<InventoryDtos.KiemKeResponse> getKiemKe(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getKiemKe(id));
    }

    @PostMapping({"/stocktakes", "/kiem-ke"})
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<InventoryDtos.KiemKeResponse> createKiemKe(
            @Valid @RequestBody InventoryDtos.KiemKeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inventoryService.createKiemKe(request));
    }

    /** Hoàn thành kiểm kê: chốt chênh lệch và cập nhật tồn kho. */
    @PutMapping({"/stocktakes/{id}/complete", "/kiem-ke/{id}/hoan-thanh"})
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<InventoryDtos.KiemKeResponse> hoanThanhKiemKe(
            @PathVariable Long id,
            @Valid @RequestBody InventoryDtos.KiemKeCompleteRequest request) {
        return ResponseEntity.ok(inventoryService.hoanThanhKiemKe(id, request));
    }

    // ==================== BÁO CÁO TỒN ====================

    @GetMapping("/reports/inventory")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<List<InventoryDtos.InventoryReportRow>> inventoryReport(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "false") boolean onlyLowStock) {
        return ResponseEntity.ok(inventoryService.inventoryReport(q, onlyLowStock));
    }
}
