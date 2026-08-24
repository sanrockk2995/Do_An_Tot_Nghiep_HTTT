package com.routine.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Builder;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

public class BangLuongDtos {

    /** Body cập nhật một dòng lương (các field null = giữ nguyên). */
    @Getter @Setter
    @NoArgsConstructor
    public static class BangLuongUpdateRequest {
        @DecimalMin(value = "0", message = "Hệ số không được âm")
        private BigDecimal heSo;

        @DecimalMin(value = "0", message = "Phụ cấp không được âm")
        private BigDecimal phuCap;

        @DecimalMin(value = "0", message = "Thưởng không được âm")
        private BigDecimal thuong;

        @DecimalMin(value = "0", message = "Khấu trừ không được âm")
        private BigDecimal khauTru;

        private String ghiChu;
    }

    /** Tham số tháng/năm cho PUT /bang-luong/{userId}. */
    @Getter @Setter
    @NoArgsConstructor
    public static class ThangNamRequest {
        @Min(value = 1, message = "Tháng từ 1 đến 12")
        @Max(value = 12, message = "Tháng từ 1 đến 12")
        private Integer thang;

        @Min(value = 2000, message = "Năm không hợp lệ")
        private Integer nam;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class BangLuongResponse {
        private Long id;
        private Long userId;
        private String maNv;
        private String tenNhanVien;
        private String chucVu;
        private Integer thang;
        private Integer nam;
        private BigDecimal luongCoBan;
        private BigDecimal heSo;
        private BigDecimal phuCap;
        private BigDecimal thuong;
        private BigDecimal khauTru;
        private BigDecimal tongLuong;
        private String ghiChu;
        private String trangThai;
    }
}
