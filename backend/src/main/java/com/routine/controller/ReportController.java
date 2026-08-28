package com.routine.controller;

import com.routine.dto.ReportDtos;
import com.routine.security.SecurityUtils;
import com.routine.service.ExcelExportService;
import com.routine.service.ReportPdfService;
import com.routine.service.ReportService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Báo cáo thống kê: doanh thu, bán chạy, cảnh báo tồn.
 */
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Báo cáo doanh thu, sản phẩm bán chạy, tồn kho")
public class ReportController {

    private final ReportService reportService;
    private final ExcelExportService excelExportService;
    private final ReportPdfService reportPdfService;

    private LocalDateTime resolveFrom(LocalDateTime from) {
        return from != null ? from : ReportService.defaultFrom();
    }

    private LocalDateTime resolveTo(LocalDateTime to) {
        // to là ngày kết thúc (bao trọn ngày đó) → cộng 1 ngày
        if (to != null) {
            return LocalDate.from(to).plusDays(1).atStartOfDay();
        }
        return ReportService.defaultTo();
    }

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'SALES_STAFF', 'WAREHOUSE_STAFF')")
    public ResponseEntity<ReportDtos.OverviewResponse> overview(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(reportService.overview(resolveFrom(from), resolveTo(to)));
    }

    /** Doanh thu theo ngày/tháng/năm cho biểu đồ tăng trưởng. */
    @GetMapping("/revenue")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<List<ReportDtos.RevenuePoint>> revenue(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "day") String groupBy) {
        return ResponseEntity.ok(
                reportService.revenueByPeriod(resolveFrom(from), resolveTo(to), groupBy));
    }

    @GetMapping("/best-selling-products")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'SALES_STAFF')")
    public ResponseEntity<List<ReportDtos.BestSellingRow>> bestSelling(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(reportService.bestSelling(limit));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<List<ReportDtos.LowStockRow>> lowStock() {
        return ResponseEntity.ok(reportService.lowStock());
    }

    /** Xuất báo cáo tài chính (Excel) — kế toán & quản lý. */
    @GetMapping({"/financial/export", "/tai-chinh/export"})
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<byte[]> exportTaiChinh(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "day") String groupBy) {
        LocalDateTime f = resolveFrom(from);
        LocalDateTime t = resolveTo(to);
        ReportDtos.OverviewResponse overview = reportService.overview(f, t);
        List<ReportDtos.RevenuePoint> revenue = reportService.revenueByPeriod(f, t, groupBy);
        List<ReportDtos.BestSellingRow> bestSelling = reportService.bestSelling(10);

        String label = (from != null ? from.toLocalDate().toString() : "toàn hệ thống")
                + (from != null ? " → " + t.toLocalDate() : "");
        byte[] xlsx = excelExportService.exportBaoCaoTaiChinh(label, overview, revenue, bestSelling);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"bao-cao-tai-chinh.xlsx\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(xlsx);
    }

    /**
     * UC "In báo cáo" (Quản lý): xuất báo cáo ra PDF khổ A4 để in hoặc tải về.
     * type: doanh-thu | san-pham-ban-chay | ton-kho
     */
    @GetMapping({"/print", "/in"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> printReport(
            @RequestParam String type,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "day") String groupBy) {
        String reporterName;
        try {
            reporterName = SecurityUtils.currentFullName();
        } catch (Exception e) {
            reporterName = "Quản lý";
        }
        byte[] pdf = reportPdfService.generate(
                type, resolveFrom(from), resolveTo(to), groupBy, reporterName);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"bao-cao-" + type + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
