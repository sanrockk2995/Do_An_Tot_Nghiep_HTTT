package com.routine.service;

import com.routine.entity.Order;
import com.routine.exception.BadRequestException;
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
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Xuất hóa đơn PDF cho đơn hàng (OpenPDF).
 * Dùng font Roboto kèm sẵn (hỗ trợ tiếng Việt có dấu).
 */
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private static final Color BRAND_COLOR = new Color(30, 64, 175);
    private static final DateTimeFormatter DATETIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final OrderService orderService;
    private final com.routine.repository.OrderRepository orderRepository;
    private final com.routine.repository.CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public byte[] generateInvoicePdf(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new com.routine.exception.ResourceNotFoundException(
                        "Không tìm thấy đơn hàng #" + orderId));
        String customerName = order.getCustomer() != null ? order.getCustomer().getFullName() : "Khách lẻ";
        String customerPhone = order.getCustomer() != null ? order.getCustomer().getPhone() : null;

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A5, 24, 24, 28, 28);
            PdfWriter.getInstance(document, out);
            document.open();

            BaseFont baseFont = BaseFont.createFont(
                    "fonts/Roboto-Regular.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            Font titleFont = new Font(baseFont, 18, Font.BOLD, BRAND_COLOR);
            Font headerFont = new Font(baseFont, 11, Font.BOLD);
            Font normalFont = new Font(baseFont, 10);
            Font boldFont = new Font(baseFont, 10, Font.BOLD);
            Font smallFont = new Font(baseFont, 8);

            // Header
            Paragraph shopName = new Paragraph("ROUTINE — THỜI TRANG", titleFont);
            shopName.setAlignment(Element.ALIGN_CENTER);
            document.add(shopName);

            Paragraph invoiceTitle = new Paragraph("HÓA ĐƠN BÁN HÀNG", headerFont);
            invoiceTitle.setAlignment(Element.ALIGN_CENTER);
            invoiceTitle.setSpacingBefore(6);
            document.add(invoiceTitle);

            Paragraph info = new Paragraph(String.format(
                    "Số: %s    Ngày: %s", order.getOrderNumber(),
                    order.getCreatedAt() != null ? order.getCreatedAt().format(DATETIME) : ""),
                    normalFont);
            info.setAlignment(Element.ALIGN_CENTER);
            info.setSpacingBefore(4);
            document.add(info);

            // Khách hàng
            Paragraph customer = new Paragraph(
                    "Khách hàng: " + customerName
                            + (customerPhone != null ? "  —  " + customerPhone : ""),
                    normalFont);
            customer.setSpacingBefore(10);
            document.add(customer);

            // Bảng sản phẩm
            PdfPTable table = new PdfPTable(new float[]{0.7f, 3f, 1.2f, 1f, 1.5f});
            table.setWidthPercentage(100);
            table.setSpacingBefore(10);
            addCell(table, "STT", headerFont, true);
            addCell(table, "Sản phẩm", headerFont, false);
            addCell(table, "Đơn giá", headerFont, true);
            addCell(table, "SL", headerFont, true);
            addCell(table, "Thành tiền", headerFont, true);

            NumberFormat vnd = NumberFormat.getNumberInstance(new Locale("vi", "VN"));
            int index = 1;
            for (var item : order.getItems()) {
                String name = item.getProductName()
                        + ((item.getSize() != null || item.getColor() != null)
                           ? "\n(" + nvl(item.getSize()) + " - " + nvl(item.getColor()) + ")" : "");
                addCell(table, String.valueOf(index++), normalFont, true);
                addCell(table, name, smallFont, false);
                addCell(table, vnd.format(item.getPrice()), normalFont, true);
                addCell(table, String.valueOf(item.getQuantity()), normalFont, true);
                addCell(table, vnd.format(item.getSubtotal()), normalFont, true);
            }
            document.add(table);

            // Tổng tiền
            PdfPTable totals = new PdfPTable(new float[]{2f, 2f});
            totals.setWidthPercentage(70);
            totals.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totals.setSpacingBefore(10);
            addTotalRow(totals, "Tạm tính:", vnd.format(order.getSubtotal()) + " đ", normalFont);
            if (order.getDiscount() != null && order.getDiscount().signum() > 0) {
                addTotalRow(totals, "Giảm giá:", "-" + vnd.format(order.getDiscount()) + " đ", normalFont);
            }
            addTotalRow(totals, "TỔNG CỘNG:", vnd.format(order.getTotal()) + " đ", boldFont);
            document.add(totals);

            Paragraph payment = new Paragraph(
                    "Thanh toán: " + paymentLabel(order.getPaymentMethod())
                            + "   |   Trạng thái: " + statusLabel(order.getStatus()),
                    smallFont);
            payment.setSpacingBefore(12);
            document.add(payment);

            Paragraph thanks = new Paragraph("Cảm ơn quý khách đã mua hàng tại Routine!", normalFont);
            thanks.setAlignment(Element.ALIGN_CENTER);
            thanks.setSpacingBefore(16);
            document.add(thanks);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new BadRequestException("Không tạo được hóa đơn PDF: " + e.getMessage());
        }
    }

    private void addCell(PdfPTable table, String text, Font font, boolean centerAlign) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(centerAlign ? Element.ALIGN_CENTER : Element.ALIGN_LEFT);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(4);
        table.addCell(cell);
    }

    private void addTotalRow(PdfPTable table, String label, String value, Font font) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, font));
        labelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        labelCell.setBorder(PdfPCell.NO_BORDER);
        labelCell.setPadding(3);
        PdfPCell valueCell = new PdfPCell(new Phrase(value, font));
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        valueCell.setBorder(PdfPCell.NO_BORDER);
        valueCell.setPadding(3);
        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private String nvl(String s) {
        return s == null ? "" : s;
    }

    private String paymentLabel(String method) {
        return switch (method) {
            case "CASH" -> "Tiền mặt";
            case "BANK_TRANSFER" -> "Chuyển khoản";
            case "CARD" -> "Thẻ";
            case "COD" -> "COD (khi nhận hàng)";
            default -> method;
        };
    }

    private String statusLabel(String status) {
        return switch (status) {
            case "PENDING" -> "Chờ xử lý";
            case "PAID" -> "Đã thanh toán";
            case "COMPLETED" -> "Hoàn tất";
            case "CANCELLED" -> "Đã huỷ";
            default -> status;
        };
    }
}
