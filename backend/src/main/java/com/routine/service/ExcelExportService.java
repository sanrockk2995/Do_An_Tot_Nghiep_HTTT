package com.routine.service;

import com.routine.dto.BangLuongDtos;
import com.routine.dto.InventoryDtos;
import com.routine.dto.ReportDtos;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Xuất Excel (xlsx) cho: phiếu nhập kho, phiếu xuất kho, bảng lương,
 * báo cáo tài chính — phục vụ in/lưu trữ (UC kho hàng & quản lý tài chính).
 */
@Service
public class ExcelExportService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    // ==================== PHIẾU NHẬP KHO ====================

    public byte[] exportPhieuNhap(InventoryDtos.PhieuNhapResponse phieu) {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Phieu nhap kho");
            headerTitle(sheet, "PHIẾU NHẬP KHO", 7);
            int r = infoRows(sheet, 2,
                    new String[]{"Mã phiếu:", safe(phieu.getMaPhieuNhap()), "Ngày nhập:", fmt(phieu.getNgayNhap())},
                    new String[]{"Nhà cung cấp:", safe(phieu.getTenNhaCungCap()), "Trạng thái:", trangThaiVN(phieu.getTrangThai())},
                    new String[]{"Người tạo:", safe(phieu.getNguoiTao()), "Ghi chú:", safe(phieu.getGhiChu())});

            r += 1;
            r = tableHeader(sheet, r, "STT", "Mã SP", "Tên sản phẩm", "SL nhập",
                    "Giá nhập", "Thành tiền", "Tồn trước");
            int stt = 1;
            for (InventoryDtos.ChiTietNhapResponse ct : phieu.getChiTiet()) {
                Row row = sheet.createRow(r++);
                int c = 0;
                row.createCell(c++).setCellValue(stt++);
                row.createCell(c++).setCellValue(safe(ct.getProductCode()));
                row.createCell(c++).setCellValue(safe(ct.getProductName()));
                cellNumber(row, c++, ct.getSoLuongNhap());
                cellMoney(row, c++, ct.getGiaNhap());
                cellMoney(row, c++, ct.getThanhTien());
                cellNumber(row, c++, ct.getSoLuongTonTruocNhap());
            }
            Row totalRow = sheet.createRow(r);
            CellStyle bold = boldStyle(wb);
            Cell label = totalRow.createCell(2);
            label.setCellValue("TỔNG CỘNG:");
            label.setCellStyle(bold);
            totalRow.createCell(3).setCellValue(phieu.getTongSoLuong() != null ? phieu.getTongSoLuong() : 0);
            cellMoney(totalRow, 4, phieu.getTongTien());

            autosize(sheet, 7);
            signBlock(sheet, r + 3, 4);
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Lỗi tạo file Excel: " + e.getMessage(), e);
        }
    }

    // ==================== PHIẾU XUẤT KHO ====================

    public byte[] exportPhieuXuat(InventoryDtos.PhieuXuatResponse phieu) {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Phieu xuat kho");
            headerTitle(sheet, "PHIẾU XUẤT KHO", 6);
            int r = infoRows(sheet, 2,
                    new String[]{"Mã phiếu:", safe(phieu.getMaPhieuXuat()), "Ngày xuất:", fmt(phieu.getNgayXuat())},
                    new String[]{"Lý do xuất:", safe(phieu.getLyDoXuat()), "Trạng thái:", trangThaiVN(phieu.getTrangThai())},
                    new String[]{"Người tạo:", safe(phieu.getNguoiTao()), "Ghi chú:", safe(phieu.getGhiChu())});

            r += 1;
            r = tableHeader(sheet, r, "STT", "Mã SP", "Tên sản phẩm", "SL xuất", "Tồn trước", "Ghi chú");
            int stt = 1;
            for (InventoryDtos.ChiTietXuatResponse ct : phieu.getChiTiet()) {
                Row row = sheet.createRow(r++);
                int c = 0;
                row.createCell(c++).setCellValue(stt++);
                row.createCell(c++).setCellValue(safe(ct.getProductCode()));
                row.createCell(c++).setCellValue(safe(ct.getProductName()));
                cellNumber(row, c++, ct.getSoLuongXuat());
                cellNumber(row, c++, ct.getSoLuongTonTruocXuat());
                row.createCell(c++).setCellValue(safe(ct.getGhiChu()));
            }
            Row totalRow = sheet.createRow(r);
            Cell label = totalRow.createCell(2);
            label.setCellValue("TỔNG CỘNG SL:");
            label.setCellStyle(boldStyle(wb));
            totalRow.createCell(3).setCellValue(phieu.getTongSoLuong() != null ? phieu.getTongSoLuong() : 0);

            autosize(sheet, 6);
            signBlock(sheet, r + 3, 4);
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Lỗi tạo file Excel: " + e.getMessage(), e);
        }
    }

    // ==================== BẢNG LƯƠNG THÁNG ====================

    public byte[] exportBangLuong(List<BangLuongDtos.BangLuongResponse> rows, Integer thang, Integer nam) {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Bang luong");
            headerTitle(sheet, "BẢNG LƯƠNG NHÂN VIÊN - Tháng " + thang + "/" + nam, 12);
            int r = 2;
            r = tableHeader(sheet, r, "STT", "Họ tên", "Email", "Vai trò",
                    "Lương cơ bản", "Hệ số", "Phụ cấp", "Thưởng", "Khấu trừ",
                    "Thực nhận", "Trạng thái");
            int stt = 1;
            BigDecimal tongCongTy = BigDecimal.ZERO;
            for (BangLuongDtos.BangLuongResponse bl : rows) {
                Row row = sheet.createRow(r++);
                int c = 0;
                row.createCell(c++).setCellValue(stt++);
                row.createCell(c++).setCellValue(safe(bl.getTenNhanVien()));
                row.createCell(c++).setCellValue(safe(bl.getMaNv()));
                row.createCell(c++).setCellValue(vaiTroVN(bl.getChucVu()));
                cellMoney(row, c++, bl.getLuongCoBan());
                cellNumber(row, c++, bl.getHeSo());
                cellMoney(row, c++, bl.getPhuCap());
                cellMoney(row, c++, bl.getThuong());
                cellMoney(row, c++, bl.getKhauTru());
                cellMoney(row, c++, bl.getTongLuong());
                row.createCell(c++).setCellValue(trangThaiLuongVN(bl.getTrangThai()));
                tongCongTy = tongCongTy.add(bl.getTongLuong() == null ? BigDecimal.ZERO : bl.getTongLuong());
            }
            Row totalRow = sheet.createRow(r);
            Cell label = totalRow.createCell(4);
            label.setCellValue("TỔNG QUỸ LƯƠNG:");
            label.setCellStyle(boldStyle(wb));
            cellMoney(totalRow, 10, tongCongTy);

            autosize(sheet, 12);
            signBlock(sheet, r + 3, 4);
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Lỗi tạo file Excel: " + e.getMessage(), e);
        }
    }

    // ==================== BÁO CÁO TÀI CHÍNH ====================

    /** Báo cáo tài chính tổng hợp: tổng quan + doanh thu theo kỳ + top bán chạy. */
    public byte[] exportBaoCaoTaiChinh(String periodLabel,
                                       ReportDtos.OverviewResponse overview,
                                       List<ReportDtos.RevenuePoint> revenuePoints,
                                       List<ReportDtos.BestSellingRow> bestSelling) {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Bao cao tai chinh");
            headerTitle(sheet, "BÁO CÁO TÀI CHÍNH" +
                    (periodLabel != null && !periodLabel.isBlank() ? " (" + periodLabel + ")" : ""), 5);

            int r = 2;
            r = sectionHeader(sheet, r, "I. TỔNG QUAN");
            r = kvRow(sheet, r, "Doanh thu", moneyVND(overview.getRevenue()));
            r = kvRow(sheet, r, "Số đơn hàng", String.valueOf(overview.getOrderCount()));
            r = kvRow(sheet, r, "Số sản phẩm bán ra", String.valueOf(overview.getProductsSold()));
            r = kvRow(sheet, r, "Giá trị trung bình / đơn", moneyVND(overview.getAvgOrderValue()));

            if (revenuePoints != null && !revenuePoints.isEmpty()) {
                r += 1;
                r = sectionHeader(sheet, r, "II. DOANH THU THEO KỲ");
                r = tableHeader(sheet, r, "Kỳ", "Số đơn", "Doanh thu");
                for (ReportDtos.RevenuePoint point : revenuePoints) {
                    Row row = sheet.createRow(r++);
                    row.createCell(0).setCellValue(safe(point.period()));
                    cellNumber(row, 1, point.orderCount());
                    cellMoney(row, 2, point.revenue());
                }
            }

            if (bestSelling != null && !bestSelling.isEmpty()) {
                r += 1;
                r = sectionHeader(sheet, r, "III. TOP SẢN PHẨM BÁN CHẠY");
                r = tableHeader(sheet, r, "#", "Mã SP", "Tên sản phẩm", "Giá bán", "SL bán");
                int stt = 1;
                for (ReportDtos.BestSellingRow p : bestSelling) {
                    Row row = sheet.createRow(r++);
                    row.createCell(0).setCellValue(stt++);
                    row.createCell(1).setCellValue(safe(p.getCode()));
                    row.createCell(2).setCellValue(safe(p.getName()));
                    cellMoney(row, 3, p.getPrice());
                    cellNumber(row, 4, p.getSoldQuantity());
                }
            }

            autosize(sheet, 5);
            signBlock(sheet, r + 3, 3);
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Lỗi tạo file Excel: " + e.getMessage(), e);
        }
    }

    // ==================== Helpers ====================

    private void headerTitle(Sheet sheet, String title, int lastCol) {
        Row row = sheet.createRow(0);
        Cell cell = row.createCell(0);
        cell.setCellValue(title);
        cell.setCellStyle(boldStyle(sheet.getWorkbook(), (short) 14));
        if (lastCol > 0) {
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, lastCol - 1));
        }
    }

    private int infoRows(Sheet sheet, int startRow, String[]... pairsPerLine) {
        int r = startRow;
        for (String[] line : pairsPerLine) {
            Row row = sheet.createRow(r++);
            for (int i = 0; i + 1 < line.length; i += 2) {
                Cell label = row.createCell(i);
                label.setCellValue(line[i]);
                label.setCellStyle(boldStyle(sheet.getWorkbook()));
                row.createCell(i + 1).setCellValue(line[i + 1]);
            }
        }
        return r;
    }

    private int sectionHeader(Sheet sheet, int rowIdx, String title) {
        Row row = sheet.createRow(rowIdx);
        Cell cell = row.createCell(0);
        cell.setCellValue(title);
        cell.setCellStyle(boldStyle(sheet.getWorkbook()));
        return rowIdx + 1;
    }

    private int kvRow(Sheet sheet, int rowIdx, String key, String value) {
        Row row = sheet.createRow(rowIdx);
        row.createCell(0).setCellValue(key);
        row.createCell(1).setCellValue(value);
        return rowIdx + 1;
    }

    private int tableHeader(Sheet sheet, int rowIdx, String... headers) {
        Row row = sheet.createRow(rowIdx);
        CellStyle style = boldStyle(sheet.getWorkbook());
        for (int i = 0; i < headers.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
        }
        return rowIdx + 1;
    }

    /** Khối chữ ký cuối phiếu: Người lập — Kế toán — Thủ kho — Giám đốc. */
    private void signBlock(Sheet sheet, int rowIdx, int count) {
        String[] titles = {"Người lập phiếu", "Kế toán", "Thủ kho", "Giám đốc"};
        Row row = sheet.createRow(rowIdx);
        CellStyle style = boldStyle(sheet.getWorkbook());
        for (int i = 0; i < count && i < titles.length; i++) {
            Cell cell = row.createCell(i * 2);
            cell.setCellValue(titles[i]);
            cell.setCellStyle(style);
        }
    }

    private CellStyle boldStyle(Workbook wb) {
        return boldStyle(wb, null);
    }

    private CellStyle boldStyle(Workbook wb, Short fontHeight) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        if (fontHeight != null) font.setFontHeightInPoints(fontHeight);
        style.setFont(font);
        return style;
    }

    private void cellNumber(Row row, int col, Number value) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value.doubleValue() : 0);
    }

    private void cellMoney(Row row, int col, BigDecimal value) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value.doubleValue() : 0);
        CellStyle style = row.getSheet().getWorkbook().createCellStyle();
        DataFormat format = row.getSheet().getWorkbook().createDataFormat();
        style.setDataFormat(format.getFormat("#,##0"));
        cell.setCellStyle(style);
    }

    private void autosize(Sheet sheet, int cols) {
        for (int i = 0; i < cols; i++) sheet.autoSizeColumn(i);
    }

    private String safe(String s) {
        return s == null ? "" : s;
    }

    private String fmt(LocalDateTime t) {
        return t != null ? DATE_FMT.format(t) : "";
    }

    private String moneyVND(BigDecimal v) {
        if (v == null) return "0";
        return String.format("%,.0f đ", v);
    }

    private String trangThaiVN(String status) {
        if (status == null) return "";
        return switch (status.toUpperCase()) {
            case "CHO_DUYET" -> "Chờ duyệt";
            case "DA_DUYET" -> "Đã duyệt";
            case "NHAP" -> "Nháp";
            case "COMPLETED" -> "Hoàn thành";
            default -> status;
        };
    }

    private String trangThaiLuongVN(String status) {
        if (status == null) return "";
        return switch (status.toUpperCase()) {
            case "NHAP" -> "Nháp";
            case "DA_DUYET" -> "Đã duyệt";
            default -> status;
        };
    }

    private String vaiTroVN(String role) {
        if (role == null) return "";
        return switch (role) {
            case "ADMIN" -> "Quản lý";
            case "SALES_STAFF" -> "Nhân viên bán hàng";
            case "WAREHOUSE_STAFF" -> "Nhân viên kho";
            case "ACCOUNTANT" -> "Kế toán";
            default -> role;
        };
    }
}
