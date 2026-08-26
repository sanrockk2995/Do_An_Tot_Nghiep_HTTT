package com.routine.service;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.routine.dto.ReportDtos;
import com.routine.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * Xuất báo cáo thống kê ra file PDF khổ A4 — phục vụ UC "In báo cáo" (Quản lý).
 * Dùng lại font Roboto kèm sẵn (tiếng Việt có dấu) như hóa đơn.
 */
@Service
@RequiredArgsConstructor
public class ReportPdfService {

    private static final Color BRAND_COLOR = new Color(30, 64, 175);
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    /** Các loại báo cáo hỗ trợ in/xuất PDF. */
    public static final List<String> SUPPORTED_TYPES =
            List.of("doanh-thu", "san-pham-ban-chay", "ton-kho");

    private final ReportService reportService;

    @Transactional(readOnly = true)
    public byte[] generate(String type, LocalDateTime from, LocalDateTime to,
                           String groupBy, String reporterName) {
        String title = switch (type != null ? type : "") {
            case "doanh-thu" -> "BÁO CÁO DOANH THU";
            case "san-pham-ban-chay" -> "BÁO CÁO SẢN PHẨM BÁN CHẠY";
            case "ton-kho" -> "BÁO CÁO TỒN KHO";
            default -> throw new BadRequestException("Loại báo cáo không hợp lệ: " + type);
        };

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            BaseFont baseFont = BaseFont.createFont(
                    "fonts/Roboto-Regular.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            Font titleFont = new Font(baseFont, 16, Font.BOLD, BRAND_COLOR);
            Font headerFont = new Font(baseFont, 10, Font.BOLD);
            Font normalFont = new Font(baseFont, 10);
            Font smallFont = new Font(baseFont, 9);

            Paragraph brand = new Paragraph("ROUTINE — THỜI TRANG", titleFont);
            brand.setAlignment(Element.ALIGN_CENTER);
            document.add(brand);

            Paragraph reportTitle = new Paragraph(title, headerFont);
            reportTitle.setAlignment(Element.ALIGN_CENTER);
            reportTitle.setSpacingBefore(6);
            document.add(reportTitle);

            Paragraph meta = new Paragraph(String.format(
                    "Kỳ báo cáo: %s → %s     Ngày lập: %s",
                    from.format(DATE), to.minusDays(1).format(DATE),
                    LocalDateTime.now().format(DATETIME)), smallFont);
            meta.setAlignment(Element.ALIGN_CENTER);
            meta.setSpacingBefore(6);
            document.add(meta);

            Paragraph reporter = new Paragraph("Người lập: " + reporterName, smallFont);
            reporter.setAlignment(Element.ALIGN_CENTER);
            reporter.setSpacingBefore(2);
            document.add(reporter);

            NumberFormat vnd = NumberFormat.getNumberInstance(new Locale("vi", "VN"));
            switch (type) {
                case "doanh-thu" ->
                        renderRevenue(document, from, to, groupBy, vnd, headerFont, normalFont);
                case "san-pham-ban-chay" ->
                        renderBestSelling(document, vnd, headerFont, normalFont);
                case "ton-kho" ->
                        renderLowStock(document, headerFont, normalFont);
                default -> { }
            }

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new BadRequestException("Không tạo được file PDF báo cáo: " + e.getMessage());
        }
    }

    /** Nội dung báo cáo doanh thu: số liệu tổng quan + bảng doanh thu theo kỳ. */
    private void renderRevenue(Document document, LocalDateTime from, LocalDateTime to,
                               String groupBy, NumberFormat vnd,
                               Font headerFont, Font normalFont) throws Exception {
        ReportDtos.OverviewResponse ov = reportService.overview(from, to);

        PdfPTable stat = new PdfPTable(new float[]{1.4f, 1f});
        stat.setWidthPercentage(62);
        stat.setHorizontalAlignment(Element.ALIGN_LEFT);
        stat.setSpacingBefore(14);
        addStatRow(stat, "Tổng doanh thu:", vnd.format(ov.getRevenue()) + " đ", normalFont);
        addStatRow(stat, "Số đơn hàng:", String.valueOf(ov.getOrderCount()), normalFont);
        addStatRow(stat, "Sản phẩm bán ra:", String.valueOf(ov.getProductsSold()), normalFont);
        addStatRow(stat, "Giá trị TB / đơn:", vnd.format(ov.getAvgOrderValue()) + " đ", normalFont);
        document.add(stat);

        PdfPTable table = new PdfPTable(new float[]{2f, 1.4f, 2.6f});
        table.setWidthPercentage(100);
        table.setSpacingBefore(18);
        table.setHeaderRows(1);
        addCell(table, "Kỳ", headerFont, true);
        addCell(table, "Số đơn", headerFont, true);
        addCell(table, "Doanh thu (VNĐ)", headerFont, true);
        for (ReportDtos.RevenuePoint p : reportService.revenueByPeriod(from, to, groupBy)) {
            addCell(table, p.period(), normalFont, true);
            addCell(table, String.valueOf(p.orderCount()), normalFont, true);
            addCell(table, vnd.format(p.revenue()), normalFont, false);
        }
        document.add(table);
    }

    /** Nội dung báo cáo sản phẩm bán chạy: top 10 theo số lượng bán ra. */
    private void renderBestSelling(Document document, NumberFormat vnd,
                                   Font headerFont, Font normalFont) throws Exception {
        List<ReportDtos.BestSellingRow> rows = reportService.bestSelling(10);

        PdfPTable table = new PdfPTable(new float[]{0.6f, 1.3f, 3.4f, 1.5f, 0.9f});
        table.setWidthPercentage(100);
        table.setSpacingBefore(14);
        table.setHeaderRows(1);
        addCell(table, "STT", headerFont, true);
        addCell(table, "Mã SP", headerFont, true);
        addCell(table, "Tên sản phẩm", headerFont, true);
        addCell(table, "Đơn giá (VNĐ)", headerFont, true);
        addCell(table, "SL bán", headerFont, true);
        int index = 1;
        for (ReportDtos.BestSellingRow row : rows) {
            addCell(table, String.valueOf(index++), normalFont, true);
            addCell(table, row.getCode(), normalFont, true);
            addCell(table, row.getName(), normalFont, false);
            addCell(table, vnd.format(row.getPrice()), normalFont, true);
            addCell(table, String.valueOf(row.getSoldQuantity()), normalFont, true);
        }
        document.add(table);
    }

    /** Nội dung báo cáo tồn kho: sản phẩm tồn bằng/ngưỡng tối thiểu. */
    private void renderLowStock(Document document,
                                Font headerFont, Font normalFont) throws Exception {
        List<ReportDtos.LowStockRow> rows = reportService.lowStock();
        if (rows.isEmpty()) {
            Paragraph empty = new Paragraph(
                    "Không có sản phẩm nào chạm ngưỡng tồn kho tối thiểu.", normalFont);
            empty.setSpacingBefore(14);
            document.add(empty);
            return;
        }

        PdfPTable table = new PdfPTable(new float[]{0.6f, 1.3f, 3.6f, 1.1f, 1.4f});
        table.setWidthPercentage(100);
        table.setSpacingBefore(14);
        table.setHeaderRows(1);
        addCell(table, "STT", headerFont, true);
        addCell(table, "Mã SP", headerFont, true);
        addCell(table, "Tên sản phẩm", headerFont, true);
        addCell(table, "Tồn kho", headerFont, true);
        addCell(table, "Ngưỡng tối thiểu", headerFont, true);
        int index = 1;
        for (ReportDtos.LowStockRow row : rows) {
            addCell(table, String.valueOf(index++), normalFont, true);
            addCell(table, row.getCode(), normalFont, true);
            addCell(table, row.getName(), normalFont, false);
            addCell(table, String.valueOf(row.getStock()), normalFont, true);
            addCell(table, String.valueOf(row.getMinStock()), normalFont, true);
        }
        document.add(table);
    }

    private void addCell(PdfPTable table, String text, Font font, boolean centerAlign) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(centerAlign ? Element.ALIGN_CENTER : Element.ALIGN_LEFT);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(4);
        table.addCell(cell);
    }

    /** Dòng số liệu không viền (khối tổng quan đầu báo cáo). */
    private void addStatRow(PdfPTable table, String label, String value, Font font) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, font));
        labelCell.setBorder(PdfPCell.NO_BORDER);
        labelCell.setPadding(3);
        PdfPCell valueCell = new PdfPCell(new Phrase(value, font));
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        valueCell.setBorder(PdfPCell.NO_BORDER);
        valueCell.setPadding(3);
        table.addCell(labelCell);
        table.addCell(valueCell);
    }
}
