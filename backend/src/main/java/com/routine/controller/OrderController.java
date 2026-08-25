package com.routine.controller;

import com.routine.dto.OrderDtos;
import com.routine.dto.PageResponse;
import com.routine.service.InventoryService;
import com.routine.service.InvoiceService;
import com.routine.service.OrderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Đơn hàng / hóa đơn: tạo (POS & online), tra cứu, đổi trạng thái, xuất PDF.
 */
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Hóa đơn bán hàng và đơn hàng online")
public class OrderController {

    private final OrderService orderService;
    private final InvoiceService invoiceService;

    /** Tạo hóa đơn — nhân viên (POS) hoặc khách online. */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OrderDtos.OrderResponse> create(
            @Valid @RequestBody OrderDtos.OrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.create(request));
    }

    /** Danh sách đơn — lọc theo trạng thái/kênh; cho mọi nhân viên đăng nhập. */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'ACCOUNTANT', 'WAREHOUSE_STAFF')")
    public ResponseEntity<PageResponse<OrderDtos.OrderResponse>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(PageResponse.from(
                orderService.list(status, channel, customerId, page, size)));
    }

    /** Khách hàng xem danh sách đơn hàng của chính mình. */
    @GetMapping("/my-orders")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PageResponse<OrderDtos.OrderResponse>> myOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (!com.routine.security.SecurityUtils.isCustomer()) {
            throw new com.routine.exception.ResourceNotFoundException("Chỉ dành cho tài khoản khách hàng");
        }
        Long customerId = com.routine.security.SecurityUtils.currentCustomerId();
        return ResponseEntity.ok(PageResponse.from(
                orderService.listByCustomer(customerId, page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'ACCOUNTANT', 'WAREHOUSE_STAFF')")
    public ResponseEntity<OrderDtos.OrderResponse> detail(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getById(id));
    }

    /** Huỷ / thanh toán / giao hàng — cập nhật trạng thái. */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<OrderDtos.OrderResponse> updateStatus(
            @PathVariable Long id, @Valid @RequestBody OrderDtos.StatusRequest request) {
        return ResponseEntity.ok(orderService.updateStatus(id, request.getStatus()));
    }

    /** Khách hàng tự huỷ đơn ONLINE đang chờ xác nhận của chính mình. */
    @PutMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OrderDtos.OrderResponse> cancelByCustomer(@PathVariable Long id) {
        if (!com.routine.security.SecurityUtils.isCustomer()) {
            throw new com.routine.exception.ForbiddenException("Chỉ dành cho tài khoản khách hàng");
        }
        return ResponseEntity.ok(orderService.cancelByCustomer(id,
                com.routine.security.SecurityUtils.currentCustomerId()));
    }

    /** Xuất hóa đơn PDF để in. */
    @GetMapping("/{id}/invoice")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'ACCOUNTANT')")
    public ResponseEntity<byte[]> invoice(@PathVariable Long id) {
        byte[] pdf = invoiceService.generateInvoicePdf(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "hoa-don-" + id + ".pdf");
        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }
}
