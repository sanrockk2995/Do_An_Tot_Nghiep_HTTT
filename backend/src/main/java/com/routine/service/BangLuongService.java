package com.routine.service;

import com.routine.dto.BangLuongDtos;
import com.routine.entity.BangLuong;
import com.routine.entity.User;
import com.routine.exception.BadRequestException;
import com.routine.exception.ResourceNotFoundException;
import com.routine.repository.BangLuongRepository;
import com.routine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Bảng lương nhân viên (UC SRS): kế toán/quản lý xem theo tháng,
 * cập nhật hệ số, phụ cấp, thưởng, khấu trừ; tạo bảng lương hằng tháng.
 */
@Service
@RequiredArgsConstructor
public class BangLuongService {

    /** Lương cơ bản mặc định khi lần đầu tạo dòng lương cho nhân viên. */
    private static final BigDecimal DEFAULT_LUONG_CO_BAN = new BigDecimal("5000000");

    private final BangLuongRepository bangLuongRepository;
    private final UserRepository userRepository;

    /**
     * Xem bảng lương tháng/năm (mặc định tháng hiện tại). Danh sách luôn gồm mọi nhân viên active.
     * Nhân viên nào chưa có dòng lương kỳ này thì tự tạo dòng mặc định (UC "Tạo bảng lương hằng tháng").
     */
    @Transactional
    public List<BangLuongDtos.BangLuongResponse> list(Integer thang, Integer nam) {
        int t = (thang == null) ? LocalDate.now().getMonthValue() : thang;
        int n = (nam == null) ? LocalDate.now().getYear() : nam;
        validateThangNam(t, n);

        List<User> users = userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive())
                        && !"CUSTOMER".equals(u.getRole()))
                .toList();
        List<BangLuongDtos.BangLuongResponse> result = new ArrayList<>();
        for (User u : users) {
            BangLuong bl = bangLuongRepository.findByUserIdAndThangAndNam(u.getId(), t, n)
                    .orElseGet(() -> bangLuongRepository.save(BangLuong.builder()
                            .userId(u.getId()).thang(t).nam(n)
                            .luongCoBan(DEFAULT_LUONG_CO_BAN)
                            .heSo(BigDecimal.ONE)
                            .phuCap(BigDecimal.ZERO).thuong(BigDecimal.ZERO).khauTru(BigDecimal.ZERO)
                            .trangThai("NHAP")
                            .build()));
            result.add(toResponse(bl, u));
        }
        return result;
    }

    /** Cập nhật hệ số/phụ cấp/thưởng/khấu trừ/ghi chú — tự tạo dòng nếu chưa có. */
    @Transactional
    public BangLuongDtos.BangLuongResponse update(Long userId, Integer thang, Integer nam,
                                                  BangLuongDtos.BangLuongUpdateRequest request) {
        validateThangNam(thang, nam);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên #" + userId));

        BangLuong bl = bangLuongRepository.findByUserIdAndThangAndNam(userId, thang, nam)
                .orElseGet(() -> BangLuong.builder()
                        .userId(userId).thang(thang).nam(nam)
                        .luongCoBan(DEFAULT_LUONG_CO_BAN)
                        .heSo(BigDecimal.ONE)
                        .phuCap(BigDecimal.ZERO).thuong(BigDecimal.ZERO).khauTru(BigDecimal.ZERO)
                        .trangThai("NHAP")
                        .build());

        if (request.getHeSo() != null) {
            if (request.getHeSo().compareTo(BigDecimal.ZERO) < 0 || request.getHeSo().compareTo(new BigDecimal("20")) > 0) {
                throw new BadRequestException("Hệ số phải trong khoảng 0 đến 20");
            }
            bl.setHeSo(request.getHeSo());
        }
        if (request.getPhuCap() != null) {
            requireNonNegative(request.getPhuCap(), "Phụ cấp");
            bl.setPhuCap(request.getPhuCap());
        }
        if (request.getThuong() != null) {
            requireNonNegative(request.getThuong(), "Thưởng");
            bl.setThuong(request.getThuong());
        }
        if (request.getKhauTru() != null) {
            requireNonNegative(request.getKhauTru(), "Khấu trừ");
            bl.setKhauTru(request.getKhauTru());
        }
        if (request.getGhiChu() != null) bl.setGhiChu(request.getGhiChu());
        return toResponse(bangLuongRepository.save(bl), user);
    }

    /** Duyệt bảng lương: khoá số liệu tháng đó. */
    @Transactional
    public BangLuongDtos.BangLuongResponse approve(Long id) {
        BangLuong bl = bangLuongRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dòng lương #" + id));
        bl.setTrangThai("DA_DUYET");
        User user = userRepository.findById(bl.getUserId()).orElse(null);
        return toResponse(bangLuongRepository.save(bl), user);
    }

    /** Tổng quỹ lương của kỳ (tháng/năm null = toàn bộ). */
    @Transactional(readOnly = true)
    public BigDecimal tongQuy(Integer thang, Integer nam) {
        return bangLuongRepository.tongQuyLuong(thang, nam);
    }

    private void requireNonNegative(BigDecimal value, String label) {
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException(label + " không được âm");
        }
    }

    private void validateThangNam(Integer thang, Integer nam) {
        if (thang == null || thang < 1 || thang > 12) {
            throw new BadRequestException("Vui lòng chọn tháng hợp lệ (1-12)");
        }
        if (nam == null || nam < 2000 || nam > 2100) {
            throw new BadRequestException("Năm không hợp lệ");
        }
    }

    private BangLuongDtos.BangLuongResponse toResponse(BangLuong bl, User user) {
        return BangLuongDtos.BangLuongResponse.builder()
                .id(bl.getId())
                .userId(bl.getUserId())
                .maNv(user != null ? user.getEmail() : null)
                .tenNhanVien(user != null ? user.getFullName() : null)
                .chucVu(user != null ? user.getRole() : null)
                .thang(bl.getThang())
                .nam(bl.getNam())
                .luongCoBan(bl.getLuongCoBan())
                .heSo(bl.getHeSo())
                .phuCap(bl.getPhuCap())
                .thuong(bl.getThuong())
                .khauTru(bl.getKhauTru())
                .tongLuong(bl.tongLuong())
                .ghiChu(bl.getGhiChu())
                .trangThai(bl.getTrangThai())
                .build();
    }
}
