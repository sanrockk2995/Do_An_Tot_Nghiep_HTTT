package com.routine.service;

import com.routine.dto.OrderDtos;
import com.routine.entity.*;
import com.routine.exception.BadRequestException;
import com.routine.exception.ResourceNotFoundException;
import com.routine.repository.CustomerRepository;
import com.routine.repository.OrderItemRepository;
import com.routine.repository.OrderRepository;
import com.routine.repository.ProductRepository;
import com.routine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final DateTimeFormatter ORDER_NUMBER_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final com.routine.repository.ProductVariantRepository variantRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final PromotionService promotionService;
    private final CustomerService customerService;

    /**
     * Tạo hóa đơn: tự tính subtotal / discount / total,
     * trừ tồn kho theo biến thể, sinh mã hóa đơn tự động.
     * Chống bán vượt tồn: khoá pessimistic bản ghi SP khi tính tiền,
     * kiểm tra số lượng theo TỔNG sản phẩm và THEO BIẾN THỂ (size/màu).
     */
    @Transactional
    public OrderDtos.OrderResponse create(OrderDtos.OrderRequest request) {
        validatePaymentMethod(request.getPaymentMethod());
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Đơn hàng phải có ít nhất 1 sản phẩm");
        }
        String channel = request.getChannel() != null ? request.getChannel() : "OFFLINE";

        // Gộp dòng trùng productId+size+color để không cộng dồn vượt kiểm tra
        java.util.Map<String, OrderDtos.OrderItemInput> merged = new java.util.LinkedHashMap<>();
        for (OrderDtos.OrderItemInput input : request.getItems()) {
            if (input.getProductId() == null) {
                throw new BadRequestException("Thiếu mã sản phẩm trong đơn hàng");
            }
            Integer qty = input.getQuantity();
            if (qty == null || qty < 1) {
                throw new BadRequestException("Số lượng phải tối thiểu là 1");
            }
            if (qty > 9999) {
                throw new BadRequestException("Số lượng quá lớn (tối đa 9999)");
            }
            String size = (input.getSize() != null && !input.getSize().isBlank()) ? input.getSize().trim() : "Freesize";
            String color = (input.getColor() != null && !input.getColor().isBlank()) ? input.getColor().trim() : "Tiêu chuẩn";
            input.setSize(size);
            input.setColor(color);
            String key = input.getProductId() + "|" + size + "|" + color;
            OrderDtos.OrderItemInput prev = merged.get(key);
            if (prev == null) {
                merged.put(key, input);
            } else {
                prev.setQuantity(prev.getQuantity() + qty);
            }
        }

        // Khoá pessimistic các bản ghi SP trước khi đọc tồn → 2 đơn đồng thời không vượt kho
        List<Long> ids = merged.values().stream()
                .map(OrderDtos.OrderItemInput::getProductId).distinct().toList();
        java.util.Map<Long, Product> locked = new java.util.HashMap<>();
        for (Long id : ids) {
            Product p = productRepository.findWithLockingById(id)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Không tìm thấy sản phẩm #" + id));
            if (!"ACTIVE".equals(p.getStatus())) {
                throw new BadRequestException("Sản phẩm '" + p.getName() + "' đã ngừng bán");
            }
            locked.put(id, p);
        }

        // Tính tiền và chuẩn bị dòng sản phẩm (snapshot giá), kiểm tồn tổng + biến thể
        BigDecimal subtotal = BigDecimal.ZERO;
        // Tổng yêu cầu theo từng sản phẩm (một SP có thể mua nhiều size khác nhau)
        java.util.Map<Long, Integer> totalQtyByProduct = new java.util.HashMap<>();
        for (OrderDtos.OrderItemInput input : merged.values()) {
            totalQtyByProduct.merge(input.getProductId(), input.getQuantity(), Integer::sum);
        }

        List<OrderItem> itemEntities = new ArrayList<>();
        for (OrderDtos.OrderItemInput input : merged.values()) {
            Product product = locked.get(input.getProductId());

            // Kiểm tra tồn kho TỔNG của sản phẩm
            if (product.getStock() < input.getQuantity()) {
                throw new BadRequestException("Sản phẩm '" + product.getName()
                        + "' chỉ còn " + product.getStock() + " sản phẩm");
            }

            // Kiểm tra tồn kho BIẾN THỂ (size/màu) nếu sản phẩm có biến thể trong hệ thống
            if (input.getSize() != null && !input.getSize().isBlank()
                    && input.getColor() != null && !input.getColor().isBlank()) {
                variantRepository
                        .findByProductIdAndSizeAndColor(product.getId(), input.getSize(), input.getColor())
                        .ifPresent(variant -> {
                            if (variant.getStock() < input.getQuantity()) {
                                throw new BadRequestException("Sản phẩm '" + product.getName() + "' (size "
                                        + input.getSize() + ", màu " + input.getColor()
                                        + ") chỉ còn " + variant.getStock() + " sản phẩm");
                            }
                        });
            }

            BigDecimal lineTotal = product.getPrice()
                    .multiply(BigDecimal.valueOf(input.getQuantity()));
            subtotal = subtotal.add(lineTotal);

            itemEntities.add(OrderItem.builder()
                    .product(product)
                    .productCode(product.getCode())
                    .productName(product.getName())
                    .price(product.getPrice())
                    .quantity(input.getQuantity())
                    .subtotal(lineTotal)
                    .size(input.getSize())
                    .color(input.getColor())
                    .build());
        }

        // Áp mã giảm giá
        BigDecimal discount = BigDecimal.ZERO;
        String promotionCode = null;
        if (request.getPromotionCode() != null && !request.getPromotionCode().isBlank()) {
            List<Long> productIds = itemEntities.stream().map(i -> i.getProduct().getId()).toList();
            var result = promotionService.apply(request.getPromotionCode(), subtotal, productIds);
            if (!result.valid()) {
                throw new BadRequestException(result.message());
            }
            discount = result.discountAmount();
            promotionCode = result.promotionCode();
        }

        BigDecimal total = subtotal.subtract(discount).max(BigDecimal.ZERO);

        // created_by là NOT NULL: đơn do khách tự đặt online ghi nhận nhân viên phụ trách
        // mặc định (user đầu tiên - tài khoản quản trị); đơn tại quầy ghi nhận nv thao tác.
        Customer customer = null;
        User createdBy;
        if (com.routine.security.SecurityUtils.isCustomer()) {
            createdBy = userRepository.findFirstByOrderByIdAsc()
                    .orElseThrow(() -> new ResourceNotFoundException("Chưa có tài khoản nhân viên trong hệ thống"));
        } else {
            createdBy = userRepository.findById(com.routine.security.SecurityUtils.currentUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên tạo hóa đơn"));
        }

        // Trạng thái ban đầu:
        // - Tiền mặt tại quầy (POS) → thu tiền ngay → COMPLETED
        // - Đơn online (COD/chuyển khoản/thẻ) → CHƯA thu tiền → PENDING,
        //   chuyển "Đã thanh toán"/"Hoàn tất" khi nhân viên xác nhận/thu tiền.
        String initialStatus = "CASH".equals(request.getPaymentMethod()) && "OFFLINE".equals(channel)
                ? "COMPLETED"
                : "PENDING";

        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .customer(resolveCustomer(request, channel))
                .subtotal(subtotal)
                .discount(discount)
                .total(total)
                .paymentMethod(request.getPaymentMethod())
                .status(initialStatus)
                .channel(channel)
                .createdBy(createdBy)
                .notes(request.getNotes())
                .stockDeducted(false)
                .build();

        for (OrderItem item : itemEntities) {
            item.setOrder(order);
        }
        order.setItems(itemEntities);
        order = orderRepository.save(order);

        deductStock(order);
        order.setStockDeducted(true);
        order = orderRepository.save(order);

        if (promotionCode != null) {
            promotionService.recordUsage(promotionCode);
        }

        return toResponse(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderDtos.OrderResponse> list(String status, String channel, Long customerId,
                                              int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Order> orders;
        if (customerId != null) {
            orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId, pageable);
        } else if (status != null) {
            orders = orderRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else if (channel != null) {
            orders = orderRepository.findByChannelOrderByCreatedAtDesc(channel, pageable);
        } else {
            orders = orderRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return orders.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public OrderDtos.OrderResponse getById(Long id) {
        return toResponse(getOrder(id));
    }

    /** Lấy entity cho các service khác (ví dụ xuất PDF). */
    @Transactional(readOnly = true)
    public Order toResponseEntity(Long id) {
        return getOrder(id);
    }

    /**
     * Cập nhật trạng thái theo luồng chuẩn, chặn nhảy cóc vô lý:
     * PENDING → CONFIRMED → SHIPPING → PAID → COMPLETED; huỷ được ở hầu hết bước (trừ COMPLETED).
     */
    @Transactional
    public OrderDtos.OrderResponse updateStatus(Long id, String status) {
        Order order = getOrder(id);
        String current = order.getStatus();

        switch (status) {
            case "CANCELLED" -> {
                if ("COMPLETED".equals(current)) {
                    throw new BadRequestException("Đơn đã hoàn tất không thể huỷ");
                }
                // Hoàn lại tồn kho cho mọi đơn đã trừ hàng và chưa từng bị huỷ
                if (!"CANCELLED".equals(current) && Boolean.TRUE.equals(order.getStockDeducted())) {
                    restoreStock(order);
                }
                order.setStatus("CANCELLED");
            }
            case "PENDING", "CONFIRMED", "SHIPPING", "PAID" -> {
                if ("CANCELLED".equals(current)) {
                    throw new BadRequestException("Đơn đã bị huỷ không thể chuyển sang trạng thái khác");
                }
                if ("COMPLETED".equals(current) && !"COMPLETED".equals(status)) {
                    throw new BadRequestException("Đơn đã hoàn tất không thể chuyển ngược lại");
                }
                order.setStatus(status);
            }
            case "COMPLETED" -> {
                if ("CANCELLED".equals(current)) {
                    throw new BadRequestException("Đơn đã bị huỷ không thể hoàn tất");
                }
                order.setStatus("COMPLETED");
                order.setDeliveredAt(LocalDateTime.now());
                if (order.getCustomer() != null && !"COMPLETED".equals(current)) {
                    customerService.recordPurchase(order.getCustomer().getId(), order.getTotal());
                }
            }
            default -> throw new BadRequestException("Trạng thái không hợp lệ: " + status);
        }
        return toResponse(orderRepository.save(order));
    }

    /**
     * Khách tự huỷ đơn của mình: chỉ cho huỷ đơn ONLINE đang PENDING,
     * hoàn lại tồn kho qua luồng updateStatus chuẩn.
     */
    @Transactional
    public OrderDtos.OrderResponse cancelByCustomer(Long id, Long customerId) {
        Order order = getOrder(id);
        if (order.getCustomer() == null || !customerId.equals(order.getCustomer().getId())) {
            throw new com.routine.exception.ForbiddenException("Bạn không có quyền huỷ đơn hàng này");
        }
        if (!"ONLINE".equals(order.getChannel())) {
            throw new BadRequestException("Chỉ có thể huỷ đơn đặt online");
        }
        if (!"PENDING".equals(order.getStatus())) {
            throw new BadRequestException("Chỉ có thể huỷ đơn khi đang chờ xác nhận. "
                    + "Vui lòng liên hệ nhân viên để được hỗ trợ.");
        }
        return updateStatus(id, "CANCELLED");
    }

    /** Lịch sử mua hàng của một khách. */
    @Transactional(readOnly = true)
    public Page<OrderDtos.OrderResponse> listByCustomer(Long customerId, int page, int size) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    /** Lịch sử của chính khách đang đăng nhập. */
    @Transactional(readOnly = true)
    public Page<OrderDtos.OrderResponse> myOrders(int page, int size) {
        Long customerId = com.routine.security.SecurityUtils.currentCustomerId();
        return listByCustomer(customerId, page, size);
    }

    // ================= Helpers =================

    private Customer resolveCustomer(OrderDtos.OrderRequest request, String channel) {
        if (request.getCustomerId() != null) {
            return customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Không tìm thấy khách hàng #" + request.getCustomerId()));
        }
        if ("ONLINE".equals(channel)) {
            // Đơn online phải gắn với khách đăng nhập
            Long customerId = com.routine.security.SecurityUtils.currentCustomerId();
            return customerRepository.findById(customerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản khách hàng"));
        }
        return null; // khách lẻ tại quầy
    }

    private void deductStock(Order order) {
        for (OrderItem item : order.getItems()) {
            // Khoá bản ghi để trừ tồn an toàn khi nhiều đơn đồng thời
            Product product = productRepository.findWithLockingById(item.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại"));
            if (product.getStock() < item.getQuantity()) {
                throw new BadRequestException("Sản phẩm '" + product.getName()
                        + "' không đủ hàng (còn " + product.getStock() + ")");
            }
            product.setStock(product.getStock() - item.getQuantity());
            productRepository.save(product);

            // Trừ cả tồn của ĐÚNG biến thể (size/màu) trong đơn nếu sản phẩm có biến thể
            if (item.getSize() != null && !item.getSize().isBlank()
                    && item.getColor() != null && !item.getColor().isBlank()) {
                variantRepository
                        .findByProductIdAndSizeAndColor(product.getId(), item.getSize(), item.getColor())
                        .ifPresent(variant -> {
                            if (variant.getStock() < item.getQuantity()) {
                                throw new BadRequestException("Sản phẩm '" + product.getName() + "' (size "
                                        + item.getSize() + ", màu " + item.getColor()
                                        + ") không đủ hàng (còn " + variant.getStock() + ")");
                            }
                            variant.setStock(variant.getStock() - item.getQuantity());
                            variantRepository.save(variant);
                        });
            }
        }
    }

    private void restoreStock(Order order) {
        for (OrderItem item : order.getItems()) {
            productRepository.findById(item.getProduct().getId()).ifPresent(product -> {
                product.setStock(product.getStock() + item.getQuantity());
                productRepository.save(product);
            });
            // Hoàn lại tồn cho đúng biến thể (size/màu) đã trừ trước đó
            if (item.getSize() != null && !item.getSize().isBlank()
                    && item.getColor() != null && !item.getColor().isBlank()) {
                variantRepository
                        .findByProductIdAndSizeAndColor(item.getProduct().getId(), item.getSize(), item.getColor())
                        .ifPresent(variant -> {
                            variant.setStock(variant.getStock() + item.getQuantity());
                            variantRepository.save(variant);
                        });
            }
        }
        order.setStockDeducted(false);
    }

    private String generateOrderNumber() {
        String prefix = "HD" + LocalDateTime.now().format(ORDER_NUMBER_FORMAT);
        String candidate;
        do {
            candidate = prefix + String.format("%04d", ThreadLocalRandom.current().nextInt(1, 10000));
        } while (orderRepository.existsByOrderNumber(candidate));
        return candidate;
    }

    private void validatePaymentMethod(String method) {
        if (!List.of("CASH", "BANK_TRANSFER", "CARD", "COD").contains(method)) {
            throw new BadRequestException("Phương thức thanh toán không hợp lệ: " + method);
        }
    }

    private Order getOrder(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng #" + id));
    }

    public OrderDtos.OrderResponse toResponse(Order o) {
        return OrderDtos.OrderResponse.builder()
                .id(o.getId())
                .orderNumber(o.getOrderNumber())
                .customerId(o.getCustomer() != null ? o.getCustomer().getId() : null)
                .customerName(o.getCustomer() != null ? o.getCustomer().getFullName() : "Khách lẻ")
                .customerPhone(o.getCustomer() != null ? o.getCustomer().getPhone() : null)
                .subtotal(o.getSubtotal())
                .discount(o.getDiscount())
                .total(o.getTotal())
                .paymentMethod(o.getPaymentMethod())
                .status(o.getStatus())
                .channel(o.getChannel())
                .notes(o.getNotes())
                .createdBy(o.getCreatedBy() != null ? o.getCreatedBy().getFullName() : null)
                .deliveredAt(o.getDeliveredAt())
                .createdAt(o.getCreatedAt())
                .items(o.getItems().stream()
                        .map(i -> OrderDtos.OrderItemResponse.builder()
                                .id(i.getId())
                                .productId(i.getProduct() != null ? i.getProduct().getId() : null)
                                .productCode(i.getProductCode())
                                .productName(i.getProductName())
                                .price(i.getPrice())
                                .quantity(i.getQuantity())
                                .subtotal(i.getSubtotal())
                                .size(i.getSize())
                                .color(i.getColor())
                                .build())
                        .toList())
                .build();
    }
}
