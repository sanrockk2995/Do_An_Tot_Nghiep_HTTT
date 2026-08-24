package com.routine.service;

import com.routine.dto.InventoryDtos;
import com.routine.entity.*;
import com.routine.exception.BadRequestException;
import com.routine.exception.ResourceNotFoundException;
import com.routine.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final PhieuNhapKhoRepository phieuNhapRepository;
    private final PhieuXuatKhoRepository phieuXuatRepository;
    private final ChiTietPhieuNhapRepository chiTietNhapRepository;
    private final ChiTietPhieuXuatRepository chiTietXuatRepository;
    private final KiemKeRepository kiemKeRepository;
    private final ChiTietKiemKeRepository chiTietKiemKeRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    // ==================== NHÀ CUNG CẤP ====================

    @Transactional(readOnly = true)
    public List<Supplier> listSuppliers(String q) {
        if (q != null && !q.isBlank()) {
            return supplierRepository.search(q);
        }
        return supplierRepository.findAll();
    }

    @Transactional
    public Supplier createSupplier(Supplier supplier) {
        if (supplier.getTrangThai() == null) supplier.setTrangThai("ACTIVE");
        return supplierRepository.save(supplier);
    }

    @Transactional
    public Supplier updateSupplier(Long id, Supplier input) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp #" + id));
        supplier.setTenNcc(input.getTenNcc());
        supplier.setDiaChi(input.getDiaChi());
        supplier.setSoDienThoai(input.getSoDienThoai());
        supplier.setEmail(input.getEmail());
        supplier.setNguoiLienHe(input.getNguoiLienHe());
        supplier.setGhiChu(input.getGhiChu());
        if (input.getTrangThai() != null) supplier.setTrangThai(input.getTrangThai());
        return supplierRepository.save(supplier);
    }

    /** Xoá mềm: vô hiệu hoá NCC (giữ lịch sử phiếu nhập). */
    @Transactional
    public void softDeleteSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp #" + id));
        supplier.setTrangThai("INACTIVE");
        supplierRepository.save(supplier);
    }

    // ==================== PHIẾU NHẬP KHO ====================

    @Transactional
    public InventoryDtos.PhieuNhapResponse createPhieuNhap(InventoryDtos.PhieuNhapRequest request) {
        Supplier supplier = supplierRepository.findById(request.getNhaCungCapId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp"));
        User nguoiTao = userRepository.findById(com.routine.security.SecurityUtils.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên"));

        PhieuNhapKho phieu = PhieuNhapKho.builder()
                .maPhieuNhap(generateMaPhieu("PN"))
                .ngayNhap(request.getNgayNhap() != null ? request.getNgayNhap() : LocalDateTime.now())
                .nhaCungCap(supplier)
                .trangThai("DRAFT")
                .tongSoLuong(0)
                .tongTien(BigDecimal.ZERO)
                .ghiChu(request.getGhiChu())
                .nguoiTao(nguoiTao)
                .build();

        BigDecimal tongTien = BigDecimal.ZERO;
        int tongSoLuong = 0;
        List<ChiTietPhieuNhap> details = new ArrayList<>();

        for (InventoryDtos.NhapKhoItemInput item : request.getChiTiet()) {
            if (item.getSoLuongNhap() <= 0) {
                throw new BadRequestException("Số lượng nhập phải lớn hơn 0");
            }
            Product product = getProduct(item.getProductId());
            int tonTruoc = product.getStock();
            BigDecimal thanhTien = item.getGiaNhap().multiply(BigDecimal.valueOf(item.getSoLuongNhap()));

            details.add(ChiTietPhieuNhap.builder()
                    .phieuNhap(phieu)
                    .product(product)
                    .soLuongNhap(item.getSoLuongNhap())
                    .giaNhap(item.getGiaNhap())
                    .thanhTien(thanhTien)
                    .soLuongTonTruocNhap(tonTruoc)
                    .ghiChu(item.getGhiChu())
                    .build());

            tongTien = tongTien.add(thanhTien);
            tongSoLuong += item.getSoLuongNhap();
        }

        phieu.setChiTiet(details);
        phieu.setTongSoLuong(tongSoLuong);
        phieu.setTongTien(tongTien);
        return toNhapResponse(phieuNhapRepository.save(phieu));
    }

    /** Duyệt phiếu nhập: cộng tồn kho cho từng sản phẩm. */
    @Transactional
    public InventoryDtos.PhieuNhapResponse duyetPhieuNhap(Long id) {
        PhieuNhapKho phieu = phieuNhapRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập #" + id));
        if (!"DRAFT".equals(phieu.getTrangThai())) {
            throw new BadRequestException("Phiếu đã được duyệt hoặc đã huỷ");
        }

        for (ChiTietPhieuNhap ct : phieu.getChiTiet()) {
            Product product = productRepository.findById(ct.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại"));
            product.setStock(product.getStock() + ct.getSoLuongNhap());
            // Cập nhật giá vốn mới nhất
            product.setCostPrice(ct.getGiaNhap());
            productRepository.save(product);
        }

        phieu.setTrangThai("APPROVED");
        phieu.setNguoiDuyet(userRepository.findById(com.routine.security.SecurityUtils.currentUserId()).orElse(null));
        phieu.setNgayDuyet(LocalDateTime.now());
        return toNhapResponse(phieuNhapRepository.save(phieu));
    }

    @Transactional
    public void cancelPhieuNhap(Long id) {
        PhieuNhapKho phieu = phieuNhapRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập #" + id));
        if (!"DRAFT".equals(phieu.getTrangThai())) {
            throw new BadRequestException("Chỉ huỷ được phiếu ở trạng thái nháp");
        }
        phieu.setTrangThai("CANCELLED");
        phieuNhapRepository.save(phieu);
    }

    @Transactional(readOnly = true)
    public List<InventoryDtos.PhieuNhapResponse> listPhieuNhap() {
        return phieuNhapRepository.findAllByOrderByNgayNhapDesc().stream()
                .map(this::toNhapResponse).toList();
    }

    /** Chi tiết phiếu nhập (dùng cho in/xuất Excel). */
    @Transactional(readOnly = true)
    public InventoryDtos.PhieuNhapResponse getPhieuNhap(Long id) {
        PhieuNhapKho phieu = phieuNhapRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập #" + id));
        return toNhapResponse(phieu);
    }

    // ==================== PHIẾU XUẤT KHO ====================

    @Transactional
    public InventoryDtos.PhieuXuatResponse createPhieuXuat(InventoryDtos.PhieuXuatRequest request) {
        User nguoiTao = userRepository.findById(com.routine.security.SecurityUtils.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên"));

        PhieuXuatKho phieu = PhieuXuatKho.builder()
                .maPhieuXuat(generateMaPhieu("PX"))
                .ngayXuat(request.getNgayXuat() != null ? request.getNgayXuat() : LocalDateTime.now())
                .lyDoXuat(request.getLyDoXuat())
                .trangThai("DRAFT")
                .order(request.getOrderId() != null
                        ? com.routine.entity.Order.builder().id(request.getOrderId()).build() : null)
                .tongSoLuong(0)
                .ghiChu(request.getGhiChu())
                .nguoiTao(nguoiTao)
                .build();

        int tongSoLuong = 0;
        List<ChiTietPhieuXuat> details = new ArrayList<>();
        for (InventoryDtos.XuatKhoItemInput item : request.getChiTiet()) {
            if (item.getSoLuongXuat() <= 0) {
                throw new BadRequestException("Số lượng xuất phải lớn hơn 0");
            }
            Product product = getProduct(item.getProductId());
            if (product.getStock() < item.getSoLuongXuat()) {
                throw new BadRequestException("Sản phẩm '" + product.getName()
                        + "' chỉ còn " + product.getStock() + ", không đủ xuất");
            }
            details.add(ChiTietPhieuXuat.builder()
                    .phieuXuat(phieu)
                    .product(product)
                    .soLuongXuat(item.getSoLuongXuat())
                    .soLuongTonTruocXuat(product.getStock())
                    .ghiChu(item.getGhiChu())
                    .build());
            tongSoLuong += item.getSoLuongXuat();
        }

        phieu.setChiTiet(details);
        phieu.setTongSoLuong(tongSoLuong);
        return toXuatResponse(phieuXuatRepository.save(phieu));
    }

    /** Duyệt phiếu xuất: trừ tồn kho. */
    @Transactional
    public InventoryDtos.PhieuXuatResponse duyetPhieuXuat(Long id) {
        PhieuXuatKho phieu = phieuXuatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu xuất #" + id));
        if (!"DRAFT".equals(phieu.getTrangThai())) {
            throw new BadRequestException("Phiếu đã được duyệt hoặc đã huỷ");
        }
        for (ChiTietPhieuXuat ct : phieu.getChiTiet()) {
            Product product = productRepository.findById(ct.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại"));
            if (product.getStock() < ct.getSoLuongXuat()) {
                throw new BadRequestException("Sản phẩm '" + product.getName() + "' không đủ hàng để xuất");
            }
            product.setStock(product.getStock() - ct.getSoLuongXuat());
            productRepository.save(product);
        }
        phieu.setTrangThai("APPROVED");
        phieu.setNguoiDuyet(userRepository.findById(com.routine.security.SecurityUtils.currentUserId()).orElse(null));
        phieu.setNgayDuyet(LocalDateTime.now());
        return toXuatResponse(phieuXuatRepository.save(phieu));
    }

    @Transactional(readOnly = true)
    public List<InventoryDtos.PhieuXuatResponse> listPhieuXuat() {
        return phieuXuatRepository.findAllByOrderByNgayXuatDesc().stream()
                .map(this::toXuatResponse).toList();
    }

    /** Chi tiết phiếu xuất (dùng cho in/xuất Excel). */
    @Transactional(readOnly = true)
    public InventoryDtos.PhieuXuatResponse getPhieuXuat(Long id) {
        PhieuXuatKho phieu = phieuXuatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu xuất #" + id));
        return toXuatResponse(phieu);
    }

    // ==================== KIỂM KÊ ====================

    /** Tạo phiếu kiểm kê: chụp lại tồn hệ thống tại thời điểm tạo. */
    @Transactional
    public InventoryDtos.KiemKeResponse createKiemKe(InventoryDtos.KiemKeRequest request) {
        User nguoiKiem = userRepository.findById(com.routine.security.SecurityUtils.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên"));

        KiemKe kiemKe = KiemKe.builder()
                .maKiemKe(generateMaPhieu("KK"))
                .ngayKiemKe(request.getNgayKiemKe() != null ? request.getNgayKiemKe() : LocalDate.now())
                .trangThai("DANG_KIEM")
                .nguoiKiem(nguoiKiem)
                .ghiChu(request.getGhiChu())
                .build();

        List<ChiTietKiemKe> details = new ArrayList<>();
        for (InventoryDtos.KiemKeItemInput item : request.getChiTiet()) {
            Product product = getProduct(item.getProductId());
            details.add(ChiTietKiemKe.builder()
                    .kiemKe(kiemKe)
                    .product(product)
                    .soLuongHeThong(product.getStock())
                    .soLuongThucTe(item.getSoLuongThucTe())
                    .chenhLech(item.getSoLuongThucTe() != null
                            ? item.getSoLuongThucTe() - product.getStock() : null)
                    .ghiChu(item.getGhiChu())
                    .build());
        }
        kiemKe.setChiTiet(details);
        return toKiemKeResponse(kiemKeRepository.save(kiemKe));
    }

    /**
     * Hoàn thành kiểm kê: so sánh tồn hệ thống vs thực tế,
     * cập nhật tồn kho theo số thực tế và ghi chênh lệch.
     */
    @Transactional
    public InventoryDtos.KiemKeResponse hoanThanhKiemKe(Long id, InventoryDtos.KiemKeCompleteRequest request) {
        KiemKe kiemKe = kiemKeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu kiểm kê #" + id));
        if (!"DANG_KIEM".equals(kiemKe.getTrangThai())) {
            throw new BadRequestException("Phiếu kiểm kê đã hoàn thành hoặc đã huỷ");
        }

        for (InventoryDtos.KiemKeItemInput item : request.getChiTiet()) {
            kiemKe.getChiTiet().stream()
                    .filter(ct -> ct.getProduct().getId().equals(item.getProductId()))
                    .findFirst()
                    .ifPresent(ct -> {
                        Integer thucTe = item.getSoLuongThucTe();
                        ct.setSoLuongThucTe(thucTe);
                        ct.setChenhLech(thucTe != null ? thucTe - ct.getSoLuongHeThong() : null);
                        if (item.getGhiChu() != null) ct.setGhiChu(item.getGhiChu());
                        // Điều chỉnh tồn kho theo kết quả kiểm thực tế
                        if (thucTe != null) {
                            Product product = productRepository.findById(ct.getProduct().getId())
                                    .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại"));
                            product.setStock(thucTe);
                            productRepository.save(product);
                        }
                    });
        }

        kiemKe.setTrangThai("HOAN_THANH");
        kiemKe.setNgayHoanThanh(LocalDateTime.now());
        return toKiemKeResponse(kiemKeRepository.save(kiemKe));
    }

    @Transactional(readOnly = true)
    public List<InventoryDtos.KiemKeResponse> listKiemKe() {
        return kiemKeRepository.findAllByOrderByNgayKiemKeDesc().stream()
                .map(this::toKiemKeResponse).toList();
    }

    /** Chi tiết một kỳ kiểm kê (kèm chi tiết sản phẩm + tồn hệ thống chốt). */
    @Transactional(readOnly = true)
    public InventoryDtos.KiemKeResponse getKiemKe(Long id) {
        KiemKe kiemKe = kiemKeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỳ kiểm kê #" + id));
        return toKiemKeResponse(kiemKe);
    }

    // ==================== BÁO CÁO TỒN ====================

    @Transactional(readOnly = true)
    public List<InventoryDtos.InventoryReportRow> inventoryReport(String q, boolean onlyLowStock) {
        List<Product> products = productRepository.findAll().stream()
                .filter(p -> !"INACTIVE".equals(p.getStatus()))
                .filter(p -> q == null || q.isBlank()
                        || p.getName().toLowerCase().contains(q.toLowerCase())
                        || p.getCode().toLowerCase().contains(q.toLowerCase()))
                .filter(p -> !onlyLowStock
                        || p.getStock() <= (p.getMinStock() != null ? p.getMinStock() : 10))
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .toList();

        return products.stream().map(p -> InventoryDtos.InventoryReportRow.builder()
                .productId(p.getId()).code(p.getCode()).name(p.getName())
                .categoryName(p.getCategoryId() != null ? p.getCategoryId().toString() : null)
                .stock(p.getStock()).minStock(p.getMinStock())
                .price(p.getPrice()).costPrice(p.getCostPrice())
                .inventoryValue(p.getCostPrice() != null
                        ? p.getCostPrice().multiply(BigDecimal.valueOf(p.getStock()))
                        : p.getPrice().multiply(BigDecimal.valueOf(p.getStock())))
                .lowStock(p.getStock() <= (p.getMinStock() != null ? p.getMinStock() : 10))
                .build()).toList();
    }

    // ==================== Helpers =================

    private String generateMaPhieu(String prefix) {
        String datePart = LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        String candidate;
        do {
            candidate = prefix + datePart + String.format("%04d", ThreadLocalRandom.current().nextInt(1, 10000));
        } while (isMaPhieuExists(prefix, candidate));
        return candidate;
    }

    private boolean isMaPhieuExists(String prefix, String ma) {
        return switch (prefix) {
            case "PN" -> phieuNhapRepository.existsByMaPhieuNhap(ma);
            case "PX" -> phieuXuatRepository.existsByMaPhieuXuat(ma);
            default -> kiemKeRepository.existsByMaKiemKe(ma);
        };
    }

    private Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm #" + id));
    }

    public InventoryDtos.PhieuNhapResponse toNhapResponse(PhieuNhapKho p) {
        return InventoryDtos.PhieuNhapResponse.builder()
                .id(p.getId()).maPhieuNhap(p.getMaPhieuNhap()).ngayNhap(p.getNgayNhap())
                .nhaCungCapId(p.getNhaCungCap().getId())
                .tenNhaCungCap(p.getNhaCungCap().getTenNcc())
                .trangThai(p.getTrangThai()).tongSoLuong(p.getTongSoLuong())
                .tongTien(p.getTongTien()).ghiChu(p.getGhiChu())
                .nguoiTao(p.getNguoiTao() != null ? p.getNguoiTao().getFullName() : null)
                .nguoiDuyet(p.getNguoiDuyet() != null ? p.getNguoiDuyet().getFullName() : null)
                .ngayDuyet(p.getNgayDuyet())
                .chiTiet(p.getChiTiet().stream()
                        .map(ct -> InventoryDtos.ChiTietNhapResponse.builder()
                                .id(ct.getId()).productId(ct.getProduct().getId())
                                .productCode(ct.getProduct().getCode())
                                .productName(ct.getProduct().getName())
                                .soLuongNhap(ct.getSoLuongNhap()).giaNhap(ct.getGiaNhap())
                                .thanhTien(ct.getThanhTien())
                                .soLuongTonTruocNhap(ct.getSoLuongTonTruocNhap())
                                .ghiChu(ct.getGhiChu()).build())
                        .toList())
                .build();
    }

    public InventoryDtos.PhieuXuatResponse toXuatResponse(PhieuXuatKho p) {
        return InventoryDtos.PhieuXuatResponse.builder()
                .id(p.getId()).maPhieuXuat(p.getMaPhieuXuat()).ngayXuat(p.getNgayXuat())
                .lyDoXuat(p.getLyDoXuat()).trangThai(p.getTrangThai())
                .orderId(p.getOrder() != null ? p.getOrder().getId() : null)
                .tongSoLuong(p.getTongSoLuong()).ghiChu(p.getGhiChu())
                .nguoiTao(p.getNguoiTao() != null ? p.getNguoiTao().getFullName() : null)
                .nguoiDuyet(p.getNguoiDuyet() != null ? p.getNguoiDuyet().getFullName() : null)
                .ngayDuyet(p.getNgayDuyet())
                .chiTiet(p.getChiTiet().stream()
                        .map(ct -> InventoryDtos.ChiTietXuatResponse.builder()
                                .id(ct.getId()).productId(ct.getProduct().getId())
                                .productCode(ct.getProduct().getCode())
                                .productName(ct.getProduct().getName())
                                .soLuongXuat(ct.getSoLuongXuat())
                                .soLuongTonTruocXuat(ct.getSoLuongTonTruocXuat())
                                .ghiChu(ct.getGhiChu()).build())
                        .toList())
                .build();
    }

    public InventoryDtos.KiemKeResponse toKiemKeResponse(KiemKe k) {
        return InventoryDtos.KiemKeResponse.builder()
                .id(k.getId()).maKiemKe(k.getMaKiemKe()).ngayKiemKe(k.getNgayKiemKe())
                .trangThai(k.getTrangThai())
                .nguoiKiem(k.getNguoiKiem() != null ? k.getNguoiKiem().getFullName() : null)
                .ghiChu(k.getGhiChu()).ngayHoanThanh(k.getNgayHoanThanh())
                .chiTiet(k.getChiTiet().stream()
                        .map(ct -> InventoryDtos.ChiTietKiemKeResponse.builder()
                                .id(ct.getId()).productId(ct.getProduct().getId())
                                .productCode(ct.getProduct().getCode())
                                .productName(ct.getProduct().getName())
                                .soLuongHeThong(ct.getSoLuongHeThong())
                                .soLuongThucTe(ct.getSoLuongThucTe())
                                .chenhLech(ct.getChenhLech()).ghiChu(ct.getGhiChu()).build())
                        .toList())
                .build();
    }
}
