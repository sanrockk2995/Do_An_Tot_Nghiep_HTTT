package com.routine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class InventoryDtos {

    // ============ Phiếu nhập kho ============

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    public static class NhapKhoItemInput {
        @NotNull(message = "Sản phẩm không được để trống")
        private Long productId;

        @NotNull(message = "Số lượng nhập không được để trống")
        private Integer soLuongNhap;

        @NotNull(message = "Giá nhập không được để trống")
        private BigDecimal giaNhap;

        private String ghiChu;
    }

    @Getter @Setter
    @NoArgsConstructor
    public static class PhieuNhapRequest {
        @NotNull(message = "Nhà cung cấp không được để trống")
        private Long nhaCungCapId;

        private LocalDateTime ngayNhap;   // null = hiện tại

        @NotEmpty(message = "Phiếu nhập phải có ít nhất 1 dòng sản phẩm")
        private List<NhapKhoItemInput> chiTiet;

        private String ghiChu;
    }

    // ============ Phiếu xuất kho ============

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    public static class XuatKhoItemInput {
        @NotNull(message = "Sản phẩm không được để trống")
        private Long productId;

        @NotNull(message = "Số lượng xuất không được để trống")
        private Integer soLuongXuat;

        private String ghiChu;
    }

    @Getter @Setter
    @NoArgsConstructor
    public static class PhieuXuatRequest {
        /** HANG_HONG | TRA_NCC | SUA_CHUA | DIEU_CHINH */
        @NotBlank(message = "Lý do xuất không được để trống")
        private String lyDoXuat;

        private LocalDateTime ngayXuat;

        private Long orderId;

        @NotEmpty(message = "Phiếu xuất phải có ít nhất 1 dòng sản phẩm")
        private List<XuatKhoItemInput> chiTiet;

        private String ghiChu;
    }

    // ============ Kiểm kê ============

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    public static class KiemKeItemInput {
        @NotNull(message = "Sản phẩm không được để trống")
        private Long productId;

        /** Số lượng đếm được thực tế (null = chưa kiểm) */
        private Integer soLuongThucTe;

        private String ghiChu;
    }

    @Getter @Setter
    @NoArgsConstructor
    public static class KiemKeRequest {
        private LocalDate ngayKiemKe;     // null = hôm nay

        @NotEmpty(message = "Phiếu kiểm kê phải có ít nhất 1 dòng sản phẩm")
        private List<KiemKeItemInput> chiTiet;

        private String ghiChu;
    }

    @Getter @Setter
    @NoArgsConstructor
    public static class KiemKeCompleteRequest {
        /** Danh sách số lượng thực tế đã đếm — chốt và cập nhật tồn kho. */
        @NotEmpty(message = "Cần nhập kết quả kiểm thực tế")
        private List<KiemKeItemInput> chiTiet;
    }

    // ============ Responses ============

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ChiTietNhapResponse {
        private Long id;
        private Long productId;
        private String productCode;
        private String productName;
        private Integer soLuongNhap;
        private BigDecimal giaNhap;
        private BigDecimal thanhTien;
        private Integer soLuongTonTruocNhap;
        private String ghiChu;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class PhieuNhapResponse {
        private Long id;
        private String maPhieuNhap;
        private LocalDateTime ngayNhap;
        private Long nhaCungCapId;
        private String tenNhaCungCap;
        private String trangThai;
        private Integer tongSoLuong;
        private BigDecimal tongTien;
        private String ghiChu;
        private String nguoiTao;
        private String nguoiDuyet;
        private LocalDateTime ngayDuyet;
        private List<ChiTietNhapResponse> chiTiet;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ChiTietXuatResponse {
        private Long id;
        private Long productId;
        private String productCode;
        private String productName;
        private Integer soLuongXuat;
        private Integer soLuongTonTruocXuat;
        private String ghiChu;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class PhieuXuatResponse {
        private Long id;
        private String maPhieuXuat;
        private LocalDateTime ngayXuat;
        private String lyDoXuat;
        private String trangThai;
        private Long orderId;
        private Integer tongSoLuong;
        private String ghiChu;
        private String nguoiTao;
        private String nguoiDuyet;
        private LocalDateTime ngayDuyet;
        private List<ChiTietXuatResponse> chiTiet;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ChiTietKiemKeResponse {
        private Long id;
        private Long productId;
        private String productCode;
        private String productName;
        private Integer soLuongHeThong;
        private Integer soLuongThucTe;
        private Integer chenhLech;
        private String ghiChu;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class KiemKeResponse {
        private Long id;
        private String maKiemKe;
        private LocalDate ngayKiemKe;
        private String trangThai;
        private String nguoiKiem;
        private String ghiChu;
        private LocalDateTime ngayHoanThanh;
        private List<ChiTietKiemKeResponse> chiTiet;
    }

    /** Báo cáo tồn kho. */
    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class InventoryReportRow {
        private Long productId;
        private String code;
        private String name;
        private String categoryName;
        private Integer stock;
        private Integer minStock;
        private BigDecimal price;
        private BigDecimal costPrice;
        private BigDecimal inventoryValue;
        private boolean lowStock;
    }
}
