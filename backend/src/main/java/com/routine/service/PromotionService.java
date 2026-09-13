package com.routine.service;

import com.routine.dto.OtherDtos;
import com.routine.dto.ProductDtos;
import com.routine.entity.Promotion;
import com.routine.entity.PromotionProduct;
import com.routine.exception.BadRequestException;
import com.routine.exception.ResourceNotFoundException;
import com.routine.repository.PromotionProductRepository;
import com.routine.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final PromotionProductRepository promotionProductRepository;

    @Transactional(readOnly = true)
    public List<OtherDtos.PromotionResponse> getAll() {
        return promotionRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OtherDtos.PromotionResponse getById(Long id) {
        return toResponse(getPromotion(id));
    }

    @Transactional
    public OtherDtos.PromotionResponse create(OtherDtos.PromotionRequest request) {
        validateRequest(request);
        if (promotionRepository.existsByCodeIgnoreCase(request.getCode())) {
            throw new BadRequestException("Mã giảm giá '" + request.getCode() + "' đã tồn tại");
        }

        Promotion promotion = Promotion.builder()
                .code(request.getCode().toUpperCase())
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .discountValue(request.getDiscountValue())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .minOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO)
                .applyToAllProducts(request.getApplyToAllProducts() != null ? request.getApplyToAllProducts() : true)
                .usageLimit(request.getUsageLimit())
                .usageCount(0)
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();
        promotion = promotionRepository.save(promotion);

        savePromotionProducts(promotion, request.getProductIds());
        return toResponse(promotion);
    }

    @Transactional
    public OtherDtos.PromotionResponse update(Long id, OtherDtos.PromotionRequest request) {
        validateRequest(request);
        Promotion promotion = getPromotion(id);

        promotion.setName(request.getName());
        promotion.setDescription(request.getDescription());
        promotion.setType(request.getType());
        promotion.setDiscountValue(request.getDiscountValue());
        promotion.setMaxDiscountAmount(request.getMaxDiscountAmount());
        promotion.setStartDate(request.getStartDate());
        promotion.setEndDate(request.getEndDate());
        promotion.setMinOrderAmount(request.getMinOrderAmount());
        if (request.getApplyToAllProducts() != null) {
            promotion.setApplyToAllProducts(request.getApplyToAllProducts());
        }
        promotion.setUsageLimit(request.getUsageLimit());
        if (request.getStatus() != null) promotion.setStatus(request.getStatus());
        promotion = promotionRepository.save(promotion);

        // Đồng bộ lại danh sách sản phẩm áp dụng
        promotionProductRepository.findByPromotionId(id)
                .forEach(pp -> promotionProductRepository.delete(pp));
        if (!Boolean.TRUE.equals(promotion.getApplyToAllProducts())) {
            savePromotionProducts(promotion, request.getProductIds());
        }
        return toResponse(promotion);
    }

    @Transactional
    public void delete(Long id) {
        promotionRepository.delete(getPromotion(id));
    }

    /**
     * Kiểm tra & tính tiền giảm cho mã áp vào đơn.
     * Trả về kết quả kèm thông báo tiếng Việt.
     */
    @Transactional(readOnly = true)
    public ProductDtos.PromotionApplyResult apply(String code, BigDecimal orderAmount, List<Long> productIds) {
        var promotionOpt = promotionRepository.findByCodeIgnoreCase(code.trim());
        if (promotionOpt.isEmpty()) {
            return new ProductDtos.PromotionApplyResult(false, "Mã giảm giá không tồn tại", code, BigDecimal.ZERO);
        }
        Promotion p = promotionOpt.get();

        if (!"ACTIVE".equals(p.getStatus())) {
            return new ProductDtos.PromotionApplyResult(false, "Mã giảm giá không còn hiệu lực", p.getCode(), BigDecimal.ZERO);
        }
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(p.getStartDate()) || now.isAfter(p.getEndDate())) {
            return new ProductDtos.PromotionApplyResult(false, "Mã giảm giá ngoài thời gian áp dụng", p.getCode(), BigDecimal.ZERO);
        }
        if (p.getUsageLimit() != null && p.getUsageCount() >= p.getUsageLimit()) {
            return new ProductDtos.PromotionApplyResult(false, "Mã giảm giá đã hết lượt sử dụng", p.getCode(), BigDecimal.ZERO);
        }
        BigDecimal amount = orderAmount != null ? orderAmount : BigDecimal.ZERO;
        if (p.getMinOrderAmount() != null && amount.compareTo(p.getMinOrderAmount()) < 0) {
            return new ProductDtos.PromotionApplyResult(false,
                    "Đơn hàng tối thiểu " + p.getMinOrderAmount().toBigInteger() + "đ để dùng mã này",
                    p.getCode(), BigDecimal.ZERO);
        }
        // Kiểm tra mã chỉ áp cho một số sản phẩm nhất định
        if (!Boolean.TRUE.equals(p.getApplyToAllProducts())) {
            if (productIds == null || productIds.isEmpty()) {
                return new ProductDtos.PromotionApplyResult(false,
                        "Mã chỉ áp dụng cho một số sản phẩm cụ thể trong đơn hàng", p.getCode(), BigDecimal.ZERO);
            }
            List<Long> allowed = promotionProductRepository.findByPromotionId(p.getId()).stream()
                    .map(PromotionProduct::getProduct).map(prod -> prod.getId()).toList();
            boolean anyMatch = productIds.stream().anyMatch(allowed::contains);
            if (!anyMatch) {
                return new ProductDtos.PromotionApplyResult(false,
                        "Mã chỉ áp dụng cho một số sản phẩm cụ thể trong đơn hàng", p.getCode(), BigDecimal.ZERO);
            }
        }

        BigDecimal discount = calculateDiscount(p, amount);
        return new ProductDtos.PromotionApplyResult(true, "Áp dụng mã thành công", p.getCode(), discount);
    }

    /** Tính số tiền được giảm từ loại và giá trị mã. */
    public BigDecimal calculateDiscount(Promotion p, BigDecimal subtotal) {
        BigDecimal discount;
        if ("PERCENT".equals(p.getType())) {
            discount = subtotal.multiply(p.getDiscountValue())
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            if (p.getMaxDiscountAmount() != null && discount.compareTo(p.getMaxDiscountAmount()) > 0) {
                discount = p.getMaxDiscountAmount();
            }
        } else { // FIXED_AMOUNT
            discount = p.getDiscountValue();
        }
        // Không giảm vượt quá tiền hàng
        if (discount.compareTo(subtotal) > 0) {
            discount = subtotal;
        }
        return discount.setScale(2, RoundingMode.HALF_UP);
    }

    /** Tăng usage_count khi đơn dùng mã được thanh toán. */
    @Transactional
    public void recordUsage(String code) {
        promotionRepository.findByCodeIgnoreCase(code).ifPresent(p -> {
            p.setUsageCount((p.getUsageCount() != null ? p.getUsageCount() : 0) + 1);
            promotionRepository.save(p);
        });
    }

    private void savePromotionProducts(Promotion promotion, List<Long> productIds) {
        if (productIds == null || Boolean.TRUE.equals(promotion.getApplyToAllProducts())) return;
        for (Long pid : productIds) {
            if (!promotionProductRepository.existsByPromotionIdAndProductId(promotion.getId(), pid)) {
                promotionProductRepository.save(PromotionProduct.builder()
                        .promotion(promotion)
                        .product(com.routine.entity.Product.builder().id(pid).build())
                        .build());
            }
        }
    }

    private void validateRequest(OtherDtos.PromotionRequest r) {
        if ("PERCENT".equals(r.getType())
                && (r.getDiscountValue() == null
                    || r.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0
                    || r.getDiscountValue().compareTo(new BigDecimal("100")) > 0)) {
            throw new BadRequestException("Giảm theo % phải trong khoảng 1–100");
        }
        if ("FIXED_AMOUNT".equals(r.getType())
                && (r.getDiscountValue() == null || r.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0)) {
            throw new BadRequestException("Số tiền giảm phải lớn hơn 0");
        }
        if (r.getStartDate() == null || r.getEndDate() == null || !r.getEndDate().isAfter(r.getStartDate())) {
            throw new BadRequestException("Ngày kết thúc phải sau ngày bắt đầu");
        }
        if (Boolean.FALSE.equals(r.getApplyToAllProducts())
                && (r.getProductIds() == null || r.getProductIds().isEmpty())) {
            throw new BadRequestException("Vui lòng chọn ít nhất một sản phẩm khi không áp dụng cho tất cả sản phẩm");
        }
    }

    private Promotion getPromotion(Long id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khuyến mại #" + id));
    }

    private OtherDtos.PromotionResponse toResponse(Promotion p) {
        return OtherDtos.PromotionResponse.builder()
                .id(p.getId()).code(p.getCode()).name(p.getName()).description(p.getDescription())
                .type(p.getType()).discountValue(p.getDiscountValue())
                .maxDiscountAmount(p.getMaxDiscountAmount())
                .startDate(p.getStartDate()).endDate(p.getEndDate())
                .minOrderAmount(p.getMinOrderAmount())
                .applyToAllProducts(p.getApplyToAllProducts())
                .usageLimit(p.getUsageLimit()).usageCount(p.getUsageCount())
                .status(p.getStatus())
                .productIds(Boolean.TRUE.equals(p.getApplyToAllProducts()) ? List.of()
                        : promotionProductRepository.findByPromotionId(p.getId()).stream()
                                .map(pp -> pp.getProduct().getId()).toList())
                .build();
    }
}
