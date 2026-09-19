package com.routine.service;

import com.routine.dto.OtherDtos;
import com.routine.entity.Promotion;
import com.routine.exception.BadRequestException;
import com.routine.exception.ResourceNotFoundException;
import com.routine.repository.PromotionProductRepository;
import com.routine.repository.PromotionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PromotionServiceAdminTest {

    @Mock
    private PromotionRepository promotionRepository;

    @Mock
    private PromotionProductRepository promotionProductRepository;

    @InjectMocks
    private PromotionService promotionService;

    // ==========================================
    // 1. PromotionService.create(PromotionRequest)
    // Decision Table: docs/decision-tables/PromotionService_create.md
    // ==========================================

    @ParameterizedTest(name = "Giảm % không hợp lệ: {0}")
    @ValueSource(strings = {"0", "-5", "100.5", "150"})
    @DisplayName("R1: create() ném BadRequestException khi giảm theo % nằm ngoài khoảng (0, 100]")
    void test_create_percentDiscountOutOfRange_throwsBadRequestException(String invalidVal) {
        OtherDtos.PromotionRequest req = new OtherDtos.PromotionRequest();
        req.setCode("SALE_PERCENT");
        req.setName("Giảm giá phần trăm");
        req.setType("PERCENT");
        req.setDiscountValue(new BigDecimal(invalidVal));
        req.setStartDate(LocalDateTime.now());
        req.setEndDate(LocalDateTime.now().plusDays(7));

        assertThatThrownBy(() -> promotionService.create(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Giảm theo % phải trong khoảng 1–100");

        verify(promotionRepository, never()).save(any());
    }

    @ParameterizedTest(name = "Giảm tiền FIXED <= 0: {0}")
    @ValueSource(strings = {"0", "-10000"})
    @DisplayName("R1: create() ném BadRequestException khi giảm tiền cố định <= 0")
    void test_create_fixedDiscountZeroOrNegative_throwsBadRequestException(String invalidVal) {
        OtherDtos.PromotionRequest req = new OtherDtos.PromotionRequest();
        req.setCode("SALE_FIXED");
        req.setName("Giảm tiền cố định");
        req.setType("FIXED_AMOUNT");
        req.setDiscountValue(new BigDecimal(invalidVal));
        req.setStartDate(LocalDateTime.now());
        req.setEndDate(LocalDateTime.now().plusDays(7));

        assertThatThrownBy(() -> promotionService.create(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số tiền giảm phải lớn hơn 0");

        verify(promotionRepository, never()).save(any());
    }

    @Test
    @DisplayName("R2: create() ném BadRequestException khi ngày kết thúc không sau ngày bắt đầu")
    void test_create_endDateBeforeOrEqualStartDate_throwsBadRequestException() {
        LocalDateTime now = LocalDateTime.now();

        OtherDtos.PromotionRequest req = new OtherDtos.PromotionRequest();
        req.setCode("SALE_TIME");
        req.setName("Giảm giá sai ngày");
        req.setType("PERCENT");
        req.setDiscountValue(new BigDecimal("10"));
        req.setStartDate(now);
        req.setEndDate(now); // endDate trùng startDate

        assertThatThrownBy(() -> promotionService.create(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Ngày kết thúc phải sau ngày bắt đầu");

        verify(promotionRepository, never()).save(any());
    }

    @Test
    @DisplayName("R3: create() ném BadRequestException khi applyToAllProducts=false nhưng không chọn sản phẩm nào")
    void test_create_specificProductsWithoutProductIds_throwsBadRequestException() {
        OtherDtos.PromotionRequest req = new OtherDtos.PromotionRequest();
        req.setCode("SALE_SELECT");
        req.setName("Giảm sản phẩm chọn lọc");
        req.setType("PERCENT");
        req.setDiscountValue(new BigDecimal("20"));
        req.setStartDate(LocalDateTime.now());
        req.setEndDate(LocalDateTime.now().plusDays(5));
        req.setApplyToAllProducts(false);
        req.setProductIds(List.of()); // danh sách rỗng

        assertThatThrownBy(() -> promotionService.create(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Vui lòng chọn ít nhất một sản phẩm khi không áp dụng cho tất cả sản phẩm");

        verify(promotionRepository, never()).save(any());
    }

    @Test
    @DisplayName("R4: create() ném BadRequestException khi mã khuyến mại đã tồn tại (không phân biệt hoa/thường)")
    void test_create_duplicateCode_throwsBadRequestException() {
        OtherDtos.PromotionRequest req = new OtherDtos.PromotionRequest();
        req.setCode("summer2026");
        req.setName("Hè rực rỡ");
        req.setType("PERCENT");
        req.setDiscountValue(new BigDecimal("15"));
        req.setStartDate(LocalDateTime.now());
        req.setEndDate(LocalDateTime.now().plusDays(10));
        req.setApplyToAllProducts(true);

        when(promotionRepository.existsByCodeIgnoreCase("summer2026")).thenReturn(true);

        assertThatThrownBy(() -> promotionService.create(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Mã giảm giá 'summer2026' đã tồn tại");

        verify(promotionRepository, never()).save(any());
    }

    @Test
    @DisplayName("R5: create() tạo thành công chương trình khuyến mại, viết hoa code và lưu DB")
    void test_create_validPromotion_success() {
        OtherDtos.PromotionRequest req = new OtherDtos.PromotionRequest();
        req.setCode("welcome50");
        req.setName("Chào mừng thành viên mới");
        req.setType("FIXED_AMOUNT");
        req.setDiscountValue(new BigDecimal("50000"));
        req.setStartDate(LocalDateTime.now());
        req.setEndDate(LocalDateTime.now().plusMonths(1));
        req.setApplyToAllProducts(true);
        req.setMinOrderAmount(new BigDecimal("200000"));
        req.setUsageLimit(500);

        when(promotionRepository.existsByCodeIgnoreCase("welcome50")).thenReturn(false);
        when(promotionRepository.save(any(Promotion.class))).thenAnswer(i -> {
            Promotion p = i.getArgument(0);
            p.setId(10L);
            return p;
        });

        OtherDtos.PromotionResponse response = promotionService.create(req);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getCode()).isEqualTo("WELCOME50"); // Đã viết hoa
        assertThat(response.getType()).isEqualTo("FIXED_AMOUNT");
        assertThat(response.getDiscountValue()).isEqualByComparingTo(new BigDecimal("50000"));

        ArgumentCaptor<Promotion> captor = ArgumentCaptor.forClass(Promotion.class);
        verify(promotionRepository).save(captor.capture());
        Promotion captured = captor.getValue();
        assertThat(captured.getCode()).isEqualTo("WELCOME50");
        assertThat(captured.getStatus()).isEqualTo("ACTIVE");
        assertThat(captured.getUsageCount()).isEqualTo(0);
    }

    // ==========================================
    // 2. PromotionService.calculateDiscount(Promotion, subtotal)
    // Decision Table: docs/decision-tables/PromotionService_calculateDiscount.md
    // ==========================================

    @Test
    @DisplayName("R1: calculateDiscount() PERCENT không vượt trần tính đúng tỉ lệ phần trăm")
    void test_calculateDiscount_percentWithoutCap_calculatesPercentage() {
        Promotion p = Promotion.builder()
                .type("PERCENT")
                .discountValue(new BigDecimal("20")) // 20%
                .maxDiscountAmount(null)
                .build();

        BigDecimal subtotal = new BigDecimal("500000"); // 20% của 500k = 100k
        BigDecimal discount = promotionService.calculateDiscount(p, subtotal);

        assertThat(discount).isEqualByComparingTo(new BigDecimal("100000.00"));
    }

    @Test
    @DisplayName("R2: calculateDiscount() PERCENT có maxDiscountAmount và tiền giảm vượt trần thì trả về mức trần")
    void test_calculateDiscount_percentExceedsMaxCap_returnsMaxDiscountAmount() {
        Promotion p = Promotion.builder()
                .type("PERCENT")
                .discountValue(new BigDecimal("50")) // 50%
                .maxDiscountAmount(new BigDecimal("150000")) // Trần 150k
                .build();

        BigDecimal subtotal = new BigDecimal("600000"); // 50% của 600k = 300k > 150k trần
        BigDecimal discount = promotionService.calculateDiscount(p, subtotal);

        assertThat(discount).isEqualByComparingTo(new BigDecimal("150000.00"));
    }

    @Test
    @DisplayName("R3: calculateDiscount() FIXED_AMOUNT nhỏ hơn giá trị đơn hàng trả về đúng giá trị mã")
    void test_calculateDiscount_fixedAmountNormal_returnsDiscountValue() {
        Promotion p = Promotion.builder()
                .type("FIXED_AMOUNT")
                .discountValue(new BigDecimal("70000"))
                .build();

        BigDecimal subtotal = new BigDecimal("300000");
        BigDecimal discount = promotionService.calculateDiscount(p, subtotal);

        assertThat(discount).isEqualByComparingTo(new BigDecimal("70000.00"));
    }

    @Test
    @DisplayName("R4: calculateDiscount() FIXED_AMOUNT lớn hơn subtotal thì giảm tối đa bằng đúng subtotal")
    void test_calculateDiscount_fixedAmountExceedsSubtotal_cappedAtSubtotal() {
        Promotion p = Promotion.builder()
                .type("FIXED_AMOUNT")
                .discountValue(new BigDecimal("200000")) // Mã giảm 200k
                .build();

        BigDecimal subtotal = new BigDecimal("120000"); // Đơn chỉ có 120k
        BigDecimal discount = promotionService.calculateDiscount(p, subtotal);

        assertThat(discount).isEqualByComparingTo(new BigDecimal("120000.00"));
    }

    // ==========================================
    // 3. PromotionService.delete(id)
    // ==========================================

    @Test
    @DisplayName("delete() xóa khuyến mại thành công khi ID tồn tại")
    void test_delete_existingPromotion_deletesSuccessfully() {
        Long promoId = 5L;
        Promotion promo = Promotion.builder().id(promoId).code("FLASH_SALE").build();

        when(promotionRepository.findById(promoId)).thenReturn(Optional.of(promo));

        promotionService.delete(promoId);

        verify(promotionRepository).delete(promo);
    }

    @Test
    @DisplayName("delete() ném ResourceNotFoundException khi khuyến mại không tồn tại")
    void test_delete_promotionNotFound_throwsResourceNotFoundException() {
        when(promotionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> promotionService.delete(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy khuyến mại #999");

        verify(promotionRepository, never()).delete(any());
    }
}
