package com.routine.service;

import com.routine.dto.BangLuongDtos;
import com.routine.entity.BangLuong;
import com.routine.entity.User;
import com.routine.exception.BadRequestException;
import com.routine.exception.ResourceNotFoundException;
import com.routine.repository.BangLuongRepository;
import com.routine.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BangLuongServiceAdminTest {

    @Mock
    private BangLuongRepository bangLuongRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private BangLuongService bangLuongService;

    // ==========================================
    // 1. BangLuongService.update(...)
    // Decision Table: docs/decision-tables/BangLuongService_update.md
    // ==========================================

    @ParameterizedTest(name = "Tháng không hợp lệ: {0}")
    @ValueSource(ints = {0, 13, -1})
    @DisplayName("R1: update() ném BadRequestException khi tháng không nằm trong khoảng 1-12")
    void test_update_invalidMonth_throwsBadRequestException(int invalidMonth) {
        BangLuongDtos.BangLuongUpdateRequest req = new BangLuongDtos.BangLuongUpdateRequest();

        assertThatThrownBy(() -> bangLuongService.update(1L, invalidMonth, 2025, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Vui lòng chọn tháng hợp lệ (1-12)");

        verify(bangLuongRepository, never()).save(any());
    }

    @Test
    @DisplayName("R1: update() ném BadRequestException khi chọn kỳ tương lai vượt quá tháng hiện tại")
    void test_update_futurePeriod_throwsBadRequestException() {
        int nextYear = LocalDate.now().getYear() + 1;
        BangLuongDtos.BangLuongUpdateRequest req = new BangLuongDtos.BangLuongUpdateRequest();

        assertThatThrownBy(() -> bangLuongService.update(1L, 12, nextYear, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể xem hoặc tạo bảng lương cho kỳ tương lai");

        verify(bangLuongRepository, never()).save(any());
    }

    @Test
    @DisplayName("R2: update() ném ResourceNotFoundException khi không tìm thấy nhân viên theo userId")
    void test_update_userNotFound_throwsResourceNotFoundException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        BangLuongDtos.BangLuongUpdateRequest req = new BangLuongDtos.BangLuongUpdateRequest();

        assertThatThrownBy(() -> bangLuongService.update(999L, 1, 2024, req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy nhân viên #999");
    }

    @ParameterizedTest(name = "Hệ số sai khoảng: {0}")
    @ValueSource(strings = {"-0.1", "-5", "20.1", "25"})
    @DisplayName("R3: update() ném BadRequestException khi hệ số lương < 0 hoặc > 20")
    void test_update_heSoOutOfRange_throwsBadRequestException(String invalidHeSo) {
        Long userId = 2L;
        User user = User.builder().id(userId).email("staff@routine.vn").fullName("Nhân Viên").build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        BangLuongDtos.BangLuongUpdateRequest req = new BangLuongDtos.BangLuongUpdateRequest();
        req.setHeSo(new BigDecimal(invalidHeSo));

        assertThatThrownBy(() -> bangLuongService.update(userId, 1, 2024, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Hệ số phải trong khoảng 0 đến 20");

        verify(bangLuongRepository, never()).save(any());
    }

    @Test
    @DisplayName("R4: update() ném BadRequestException khi phụ cấp bị âm")
    void test_update_negativePhuCap_throwsBadRequestException() {
        Long userId = 2L;
        User user = User.builder().id(userId).email("staff@routine.vn").fullName("Nhân Viên").build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        BangLuongDtos.BangLuongUpdateRequest req = new BangLuongDtos.BangLuongUpdateRequest();
        req.setPhuCap(new BigDecimal("-100000"));

        assertThatThrownBy(() -> bangLuongService.update(userId, 1, 2024, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Phụ cấp không được âm");
    }

    @Test
    @DisplayName("R4: update() ném BadRequestException khi tiền thưởng bị âm")
    void test_update_negativeThuong_throwsBadRequestException() {
        Long userId = 2L;
        User user = User.builder().id(userId).email("staff@routine.vn").fullName("Nhân Viên").build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        BangLuongDtos.BangLuongUpdateRequest req = new BangLuongDtos.BangLuongUpdateRequest();
        req.setThuong(new BigDecimal("-50000"));

        assertThatThrownBy(() -> bangLuongService.update(userId, 1, 2024, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Thưởng không được âm");
    }

    @Test
    @DisplayName("R4: update() ném BadRequestException khi tiền khấu trừ bị âm")
    void test_update_negativeKhauTru_throwsBadRequestException() {
        Long userId = 2L;
        User user = User.builder().id(userId).email("staff@routine.vn").fullName("Nhân Viên").build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        BangLuongDtos.BangLuongUpdateRequest req = new BangLuongDtos.BangLuongUpdateRequest();
        req.setKhauTru(new BigDecimal("-20000"));

        assertThatThrownBy(() -> bangLuongService.update(userId, 1, 2024, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Khấu trừ không được âm");
    }

    @Test
    @DisplayName("R5: update() cập nhật thành công hệ số, phụ cấp, thưởng, khấu trừ cho nhân viên")
    void test_update_validData_success() {
        Long userId = 2L;
        User user = User.builder().id(userId).email("staff@routine.vn").fullName("Trần Thu Ngân").role("SALES_STAFF").build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        BangLuong existing = BangLuong.builder()
                .id(10L)
                .userId(userId)
                .thang(1).nam(2024)
                .luongCoBan(new BigDecimal("5000000"))
                .heSo(BigDecimal.ONE)
                .phuCap(BigDecimal.ZERO)
                .thuong(BigDecimal.ZERO)
                .khauTru(BigDecimal.ZERO)
                .trangThai("NHAP")
                .build();

        when(bangLuongRepository.findByUserIdAndThangAndNam(userId, 1, 2024)).thenReturn(Optional.of(existing));
        when(bangLuongRepository.save(any(BangLuong.class))).thenAnswer(i -> i.getArgument(0));

        BangLuongDtos.BangLuongUpdateRequest req = new BangLuongDtos.BangLuongUpdateRequest();
        req.setHeSo(new BigDecimal("1.5"));
        req.setPhuCap(new BigDecimal("500000"));
        req.setThuong(new BigDecimal("1000000"));
        req.setKhauTru(new BigDecimal("200000"));
        req.setGhiChu("Thưởng doanh số tháng 1");

        BangLuongDtos.BangLuongResponse response = bangLuongService.update(userId, 1, 2024, req);

        assertThat(response).isNotNull();
        assertThat(response.getHeSo()).isEqualTo(new BigDecimal("1.5"));
        assertThat(response.getPhuCap()).isEqualTo(new BigDecimal("500000"));
        assertThat(response.getThuong()).isEqualTo(new BigDecimal("1000000"));
        assertThat(response.getKhauTru()).isEqualTo(new BigDecimal("200000"));
        assertThat(response.getGhiChu()).isEqualTo("Thưởng doanh số tháng 1");
    }

    // ==========================================
    // 2. BangLuongService.approve(id)
    // Decision Table: docs/decision-tables/BangLuongService_approve.md
    // ==========================================

    @Test
    @DisplayName("R1: approve() ném ResourceNotFoundException khi không tìm thấy dòng lương theo ID")
    void test_approve_salaryRowNotFound_throwsResourceNotFoundException() {
        when(bangLuongRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bangLuongService.approve(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy dòng lương #999");
    }

    @Test
    @DisplayName("R2: approve() cập nhật trạng thái DA_DUYET thành công")
    void test_approve_existingRow_setsTrangThaiDaDuyet() {
        Long salaryId = 15L;
        BangLuong row = BangLuong.builder()
                .id(salaryId)
                .userId(3L)
                .thang(2).nam(2024)
                .trangThai("NHAP")
                .build();

        User user = User.builder().id(3L).email("staff2@routine.vn").fullName("Lê Bán Hàng").build();

        when(bangLuongRepository.findById(salaryId)).thenReturn(Optional.of(row));
        when(userRepository.findById(3L)).thenReturn(Optional.of(user));
        when(bangLuongRepository.save(any(BangLuong.class))).thenAnswer(i -> i.getArgument(0));

        BangLuongDtos.BangLuongResponse res = bangLuongService.approve(salaryId);

        assertThat(row.getTrangThai()).isEqualTo("DA_DUYET");
        assertThat(res.getTrangThai()).isEqualTo("DA_DUYET");
        verify(bangLuongRepository).save(row);
    }

    @Test
    @DisplayName("tongQuy() trả về tổng quỹ lương kỳ theo tháng/năm")
    void test_tongQuy_returnsTotalFund() {
        when(bangLuongRepository.tongQuyLuong(3, 2024)).thenReturn(new BigDecimal("150000000"));

        BigDecimal total = bangLuongService.tongQuy(3, 2024);

        assertThat(total).isEqualByComparingTo(new BigDecimal("150000000"));
    }
}
