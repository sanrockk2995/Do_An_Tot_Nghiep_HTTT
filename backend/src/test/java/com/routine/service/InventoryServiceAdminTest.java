package com.routine.service;

import com.routine.entity.Supplier;
import com.routine.exception.BadRequestException;
import com.routine.exception.ResourceNotFoundException;
import com.routine.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceAdminTest {

    @Mock
    private PhieuNhapKhoRepository phieuNhapRepository;

    @Mock
    private PhieuXuatKhoRepository phieuXuatRepository;

    @Mock
    private ChiTietPhieuNhapRepository chiTietNhapRepository;

    @Mock
    private ChiTietPhieuXuatRepository chiTietXuatRepository;

    @Mock
    private KiemKeRepository kiemKeRepository;

    @Mock
    private ChiTietKiemKeRepository chiTietKiemKeRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private InventoryService inventoryService;

    // ==========================================
    // 1. InventoryService.validateSupplierPhone(phone)
    // Decision Table: docs/decision-tables/InventoryService_validateSupplierPhone.md
    // ==========================================

    @ParameterizedTest(name = "SĐT null hoặc blank: '{0}'")
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "\t\n"})
    @DisplayName("R1: validateSupplierPhone() trả về null khi truyền null hoặc chuỗi rỗng")
    void test_validateSupplierPhone_nullOrBlank_returnsNull(String phone) {
        String result = inventoryService.validateSupplierPhone(phone);
        assertThat(result).isNull();
    }

    @ParameterizedTest(name = "SĐT chứa chữ cái: {0}")
    @ValueSource(strings = {"09012abcde", "ncc12345", "098765432a", "O901234567"})
    @DisplayName("R2: validateSupplierPhone() ném BadRequestException khi SĐT chứa chữ cái")
    void test_validateSupplierPhone_containsLetters_throwsBadRequestException(String phoneWithLetters) {
        assertThatThrownBy(() -> inventoryService.validateSupplierPhone(phoneWithLetters))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại chỉ được chứa các chữ số");
    }

    @ParameterizedTest(name = "SĐT chứa ký tự đặc biệt: {0}")
    @ValueSource(strings = {"090-123456", "090.123.456", "+8490123456", "090 123 456", "090@123456"})
    @DisplayName("R3: validateSupplierPhone() ném BadRequestException khi SĐT chứa ký tự đặc biệt hoặc dấu cách ở giữa")
    void test_validateSupplierPhone_containsSpecialChars_throwsBadRequestException(String phoneWithSpecialChars) {
        assertThatThrownBy(() -> inventoryService.validateSupplierPhone(phoneWithSpecialChars))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại chỉ được chứa các chữ số");
    }

    @ParameterizedTest(name = "SĐT quá ngắn (< 10 số): {0}")
    @ValueSource(strings = {"0", "09", "0901234", "012345678"})
    @DisplayName("R4: validateSupplierPhone() ném BadRequestException khi độ dài ít hơn 10 chữ số")
    void test_validateSupplierPhone_tooShort_throwsBadRequestException(String shortPhone) {
        assertThatThrownBy(() -> inventoryService.validateSupplierPhone(shortPhone))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại phải bao gồm đúng 10 chữ số");
    }

    @ParameterizedTest(name = "SĐT quá dài (> 10 số): {0}")
    @ValueSource(strings = {"09012345678", "0123456789012", "098765432100"})
    @DisplayName("R5: validateSupplierPhone() ném BadRequestException khi độ dài nhiều hơn 10 chữ số")
    void test_validateSupplierPhone_tooLong_throwsBadRequestException(String longPhone) {
        assertThatThrownBy(() -> inventoryService.validateSupplierPhone(longPhone))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại phải bao gồm đúng 10 chữ số");
    }

    @ParameterizedTest(name = "SĐT không bắt đầu bằng số 0: {0}")
    @ValueSource(strings = {"1901234567", "9876543210", "2345678901", "8490123456"})
    @DisplayName("R6: validateSupplierPhone() ném BadRequestException khi SĐT không bắt đầu bằng chữ số 0")
    void test_validateSupplierPhone_notStartingWithZero_throwsBadRequestException(String invalidPrefixPhone) {
        assertThatThrownBy(() -> inventoryService.validateSupplierPhone(invalidPrefixPhone))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại phải bắt đầu bằng chữ số 0");
    }

    @ParameterizedTest(name = "SĐT hợp lệ: {0}")
    @ValueSource(strings = {"0901234567", "0281234567", "0389998877", "  0987654321  "})
    @DisplayName("R7: validateSupplierPhone() trả về chuỗi SĐT đã chuẩn hoá trim khi hợp lệ 10 chữ số")
    void test_validateSupplierPhone_validTenDigits_returnsTrimmed(String validPhone) {
        String result = inventoryService.validateSupplierPhone(validPhone);
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(validPhone.trim());
        assertThat(result).hasSize(10);
        assertThat(result).startsWith("0");
    }

    // ==========================================
    // 2. InventoryService.createSupplier(Supplier supplier)
    // Decision Table: docs/decision-tables/InventoryService_createSupplier.md
    // ==========================================

    @Test
    @DisplayName("R1: createSupplier() ném BadRequestException khi đối tượng supplier là null")
    void test_createSupplier_nullSupplier_throwsBadRequestException() {
        assertThatThrownBy(() -> inventoryService.createSupplier(null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Thông tin nhà cung cấp không được để trống");

        verify(supplierRepository, never()).save(any());
    }

    @ParameterizedTest(name = "Mã NCC rỗng hoặc null: '{0}'")
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "\t"})
    @DisplayName("R2: createSupplier() ném BadRequestException khi mã nhà cung cấp để trống")
    void test_createSupplier_blankOrNullMaNcc_throwsBadRequestException(String invalidMaNcc) {
        Supplier supplier = Supplier.builder()
                .maNcc(invalidMaNcc)
                .tenNcc("Công ty TNHH Vải Việt")
                .build();

        assertThatThrownBy(() -> inventoryService.createSupplier(supplier))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Mã nhà cung cấp không được để trống");

        verify(supplierRepository, never()).save(any());
    }

    @Test
    @DisplayName("R3: createSupplier() ném BadRequestException khi mã nhà cung cấp đã tồn tại trong DB")
    void test_createSupplier_duplicateMaNcc_throwsBadRequestException() {
        Supplier supplier = Supplier.builder()
                .maNcc("NCC_DUPLICATE")
                .tenNcc("Công ty May Mặc ABC")
                .build();

        when(supplierRepository.existsByMaNccIgnoreCase("NCC_DUPLICATE")).thenReturn(true);

        assertThatThrownBy(() -> inventoryService.createSupplier(supplier))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Mã nhà cung cấp đã tồn tại: NCC_DUPLICATE");

        verify(supplierRepository, never()).save(any());
    }

    @ParameterizedTest(name = "Tên NCC rỗng hoặc null: '{0}'")
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "\t\n"})
    @DisplayName("R4: createSupplier() ném BadRequestException khi tên nhà cung cấp để trống")
    void test_createSupplier_blankOrNullTenNcc_throwsBadRequestException(String invalidTenNcc) {
        Supplier supplier = Supplier.builder()
                .maNcc("NCC_NEW")
                .tenNcc(invalidTenNcc)
                .build();

        when(supplierRepository.existsByMaNccIgnoreCase("NCC_NEW")).thenReturn(false);

        assertThatThrownBy(() -> inventoryService.createSupplier(supplier))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Tên nhà cung cấp không được để trống");

        verify(supplierRepository, never()).save(any());
    }

    @ParameterizedTest(name = "SĐT chứa chữ cái: {0}")
    @ValueSource(strings = {"09012abcde", "ncc-phone", "098765432a"})
    @DisplayName("R5: createSupplier() ném BadRequestException khi số điện thoại nhà cung cấp chứa chữ cái")
    void test_createSupplier_phoneContainsLetters_throwsBadRequestException(String phoneWithLetters) {
        Supplier supplier = Supplier.builder()
                .maNcc("NCC_PHONE_ERR")
                .tenNcc("Nhà Cung Cấp SĐT Chữ")
                .soDienThoai(phoneWithLetters)
                .build();

        when(supplierRepository.existsByMaNccIgnoreCase("NCC_PHONE_ERR")).thenReturn(false);

        assertThatThrownBy(() -> inventoryService.createSupplier(supplier))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại chỉ được chứa các chữ số");

        verify(supplierRepository, never()).save(any());
    }

    @ParameterizedTest(name = "SĐT chứa ký tự đặc biệt: {0}")
    @ValueSource(strings = {"090-123-4567", "090.123.456", "+8490123456", "090 123 456"})
    @DisplayName("R5: createSupplier() ném BadRequestException khi số điện thoại nhà cung cấp chứa ký tự đặc biệt")
    void test_createSupplier_phoneContainsSpecialChars_throwsBadRequestException(String phoneWithSpecialChars) {
        Supplier supplier = Supplier.builder()
                .maNcc("NCC_PHONE_SPECIAL")
                .tenNcc("Nhà Cung Cấp SĐT Ký Tự Đặc Biệt")
                .soDienThoai(phoneWithSpecialChars)
                .build();

        when(supplierRepository.existsByMaNccIgnoreCase("NCC_PHONE_SPECIAL")).thenReturn(false);

        assertThatThrownBy(() -> inventoryService.createSupplier(supplier))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại chỉ được chứa các chữ số");

        verify(supplierRepository, never()).save(any());
    }

    @ParameterizedTest(name = "SĐT sai độ dài: {0}")
    @ValueSource(strings = {"090123", "012345678", "090123456789"})
    @DisplayName("R6: createSupplier() ném BadRequestException khi số điện thoại không đúng 10 chữ số")
    void test_createSupplier_phoneWrongLength_throwsBadRequestException(String wrongLengthPhone) {
        Supplier supplier = Supplier.builder()
                .maNcc("NCC_PHONE_LEN")
                .tenNcc("Nhà Cung Cấp Độ Dài SĐT")
                .soDienThoai(wrongLengthPhone)
                .build();

        when(supplierRepository.existsByMaNccIgnoreCase("NCC_PHONE_LEN")).thenReturn(false);

        assertThatThrownBy(() -> inventoryService.createSupplier(supplier))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại phải bao gồm đúng 10 chữ số");

        verify(supplierRepository, never()).save(any());
    }

    @ParameterizedTest(name = "SĐT không bắt đầu bằng số 0: {0}")
    @ValueSource(strings = {"1901234567", "9876543210", "8490123456"})
    @DisplayName("R7: createSupplier() ném BadRequestException khi SĐT nhà cung cấp không bắt đầu bằng số 0")
    void test_createSupplier_phoneNotStartingWithZero_throwsBadRequestException(String invalidPrefix) {
        Supplier supplier = Supplier.builder()
                .maNcc("NCC_PHONE_PREFIX")
                .tenNcc("Nhà Cung Cấp Đầu Số")
                .soDienThoai(invalidPrefix)
                .build();

        when(supplierRepository.existsByMaNccIgnoreCase("NCC_PHONE_PREFIX")).thenReturn(false);

        assertThatThrownBy(() -> inventoryService.createSupplier(supplier))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại phải bắt đầu bằng chữ số 0");

        verify(supplierRepository, never()).save(any());
    }

    @ParameterizedTest(name = "Email sai định dạng: {0}")
    @ValueSource(strings = {"plainaddress", "test@", "@supplier.com", "supplier@domain..com", "ncc@domain"})
    @DisplayName("R8: createSupplier() ném BadRequestException khi định dạng email nhà cung cấp không hợp lệ")
    void test_createSupplier_invalidEmailFormat_throwsBadRequestException(String invalidEmail) {
        Supplier supplier = Supplier.builder()
                .maNcc("NCC_EMAIL_ERR")
                .tenNcc("Nhà Cung Cấp Sai Email")
                .soDienThoai("0901234567")
                .email(invalidEmail)
                .build();

        when(supplierRepository.existsByMaNccIgnoreCase("NCC_EMAIL_ERR")).thenReturn(false);

        assertThatThrownBy(() -> inventoryService.createSupplier(supplier))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Định dạng email không hợp lệ");

        verify(supplierRepository, never()).save(any());
    }

    @ParameterizedTest(name = "Trạng thái không hợp lệ: {0}")
    @ValueSource(strings = {"UNKNOWN", "DELETED", "PENDING", "123"})
    @DisplayName("R9: createSupplier() ném BadRequestException khi trạng thái không phải ACTIVE hoặc INACTIVE")
    void test_createSupplier_invalidTrangThai_throwsBadRequestException(String invalidTrangThai) {
        Supplier supplier = Supplier.builder()
                .maNcc("NCC_STATUS_ERR")
                .tenNcc("Nhà Cung Cấp Sai Status")
                .trangThai(invalidTrangThai)
                .build();

        when(supplierRepository.existsByMaNccIgnoreCase("NCC_STATUS_ERR")).thenReturn(false);

        assertThatThrownBy(() -> inventoryService.createSupplier(supplier))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Trạng thái nhà cung cấp không hợp lệ");

        verify(supplierRepository, never()).save(any());
    }

    @Test
    @DisplayName("R10: createSupplier() thành công và tự động gán trangThai = 'ACTIVE' khi không truyền trạng thái")
    void test_createSupplier_validSupplierWithoutTrangThai_defaultsToActive() {
        Supplier supplier = Supplier.builder()
                .maNcc("  NCC_DEFAULT  ")
                .tenNcc("  Công ty Cổ phần Sợi Dệt Việt Nam  ")
                .diaChi("  KCN Tân Bình, TP.HCM  ")
                .soDienThoai("  0908112233  ")
                .email("  contact@soidetvietnam.vn  ")
                .nguoiLienHe("  Nguyễn Văn Quản Lý  ")
                .ghiChu("Đối tác chiến lược cung ứng sợi")
                .trangThai(null)
                .build();

        when(supplierRepository.existsByMaNccIgnoreCase("NCC_DEFAULT")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(i -> {
            Supplier s = i.getArgument(0);
            s.setId(100L);
            return s;
        });

        Supplier created = inventoryService.createSupplier(supplier);

        assertThat(created).isNotNull();
        assertThat(created.getId()).isEqualTo(100L);
        assertThat(created.getMaNcc()).isEqualTo("NCC_DEFAULT");
        assertThat(created.getTenNcc()).isEqualTo("Công ty Cổ phần Sợi Dệt Việt Nam");
        assertThat(created.getDiaChi()).isEqualTo("KCN Tân Bình, TP.HCM");
        assertThat(created.getSoDienThoai()).isEqualTo("0908112233");
        assertThat(created.getEmail()).isEqualTo("contact@soidetvietnam.vn");
        assertThat(created.getNguoiLienHe()).isEqualTo("Nguyễn Văn Quản Lý");
        assertThat(created.getTrangThai()).isEqualTo("ACTIVE");

        ArgumentCaptor<Supplier> captor = ArgumentCaptor.forClass(Supplier.class);
        verify(supplierRepository).save(captor.capture());
        assertThat(captor.getValue().getTrangThai()).isEqualTo("ACTIVE");
    }

    @Test
    @DisplayName("R10: createSupplier() cho phép số điện thoại và email để trống (null hoặc blank)")
    void test_createSupplier_nullOrBlankPhoneAndEmail_success() {
        Supplier supplier = Supplier.builder()
                .maNcc("NCC_NO_CONTACT")
                .tenNcc("Nhà Cung Cấp Chưa Có SĐT")
                .soDienThoai("   ")
                .email(null)
                .build();

        when(supplierRepository.existsByMaNccIgnoreCase("NCC_NO_CONTACT")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(i -> i.getArgument(0));

        Supplier created = inventoryService.createSupplier(supplier);

        assertThat(created).isNotNull();
        assertThat(created.getSoDienThoai()).isNull();
        assertThat(created.getEmail()).isNull();
        assertThat(created.getTrangThai()).isEqualTo("ACTIVE");
    }

    @Test
    @DisplayName("R11: createSupplier() thành công với đầy đủ thông tin hợp lệ và trạng thái INACTIVE chủ động")
    void test_createSupplier_validSupplierWithAllFields_success() {
        Supplier supplier = Supplier.builder()
                .maNcc("NCC_INACTIVE")
                .tenNcc("Nhà Cung Cấp Tạm Dừng")
                .soDienThoai("0912345678")
                .email("support@inactive-ncc.com")
                .trangThai("inactive") // thường -> tự động chuẩn hoá UPPERCASE
                .build();

        when(supplierRepository.existsByMaNccIgnoreCase("NCC_INACTIVE")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(i -> i.getArgument(0));

        Supplier created = inventoryService.createSupplier(supplier);

        assertThat(created).isNotNull();
        assertThat(created.getTrangThai()).isEqualTo("INACTIVE");
    }

    // ==========================================
    // 3. InventoryService.updateSupplier(id, input)
    // ==========================================

    @Test
    @DisplayName("updateSupplier() ném BadRequestException khi đối tượng input là null")
    void test_updateSupplier_nullInput_throwsBadRequestException() {
        assertThatThrownBy(() -> inventoryService.updateSupplier(1L, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Thông tin cập nhật nhà cung cấp không được để trống");
    }

    @Test
    @DisplayName("updateSupplier() ném ResourceNotFoundException khi không tìm thấy nhà cung cấp theo ID")
    void test_updateSupplier_supplierNotFound_throwsResourceNotFoundException() {
        Supplier input = Supplier.builder().tenNcc("Tên Cập Nhật").build();
        when(supplierRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.updateSupplier(999L, input))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy nhà cung cấp #999");
    }

    @Test
    @DisplayName("updateSupplier() ném BadRequestException khi cập nhật tên nhà cung cấp rỗng")
    void test_updateSupplier_blankTenNcc_throwsBadRequestException() {
        Long id = 5L;
        Supplier existing = Supplier.builder().id(id).maNcc("NCC05").tenNcc("Tên Cũ").build();
        when(supplierRepository.findById(id)).thenReturn(Optional.of(existing));

        Supplier input = Supplier.builder().tenNcc("   ").build();

        assertThatThrownBy(() -> inventoryService.updateSupplier(id, input))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Tên nhà cung cấp không được để trống");
    }

    @Test
    @DisplayName("updateSupplier() ném BadRequestException khi đổi sang mã NCC đã bị trùng với nhà cung cấp khác")
    void test_updateSupplier_duplicateMaNcc_throwsBadRequestException() {
        Long id = 5L;
        Supplier existing = Supplier.builder().id(id).maNcc("NCC05").tenNcc("Tên Cũ").build();
        when(supplierRepository.findById(id)).thenReturn(Optional.of(existing));
        when(supplierRepository.existsByMaNccIgnoreCaseAndIdNot("NCC_EXISTING", id)).thenReturn(true);

        Supplier input = Supplier.builder().maNcc("NCC_EXISTING").tenNcc("Tên Mới").build();

        assertThatThrownBy(() -> inventoryService.updateSupplier(id, input))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Mã nhà cung cấp đã tồn tại: NCC_EXISTING");
    }

    @Test
    @DisplayName("updateSupplier() ném BadRequestException khi số điện thoại cập nhật chứa chữ cái")
    void test_updateSupplier_phoneContainsLetters_throwsBadRequestException() {
        Long id = 6L;
        Supplier existing = Supplier.builder().id(id).maNcc("NCC06").tenNcc("NCC Hiện Tại").build();
        when(supplierRepository.findById(id)).thenReturn(Optional.of(existing));

        Supplier input = Supplier.builder().soDienThoai("09012abcde").build();

        assertThatThrownBy(() -> inventoryService.updateSupplier(id, input))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại chỉ được chứa các chữ số");
    }

    @Test
    @DisplayName("updateSupplier() ném BadRequestException khi số điện thoại cập nhật sai độ dài")
    void test_updateSupplier_phoneWrongLength_throwsBadRequestException() {
        Long id = 6L;
        Supplier existing = Supplier.builder().id(id).maNcc("NCC06").tenNcc("NCC Hiện Tại").build();
        when(supplierRepository.findById(id)).thenReturn(Optional.of(existing));

        Supplier input = Supplier.builder().soDienThoai("090123").build();

        assertThatThrownBy(() -> inventoryService.updateSupplier(id, input))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại phải bao gồm đúng 10 chữ số");
    }

    @Test
    @DisplayName("updateSupplier() ném BadRequestException khi email cập nhật không đúng định dạng")
    void test_updateSupplier_invalidEmail_throwsBadRequestException() {
        Long id = 6L;
        Supplier existing = Supplier.builder().id(id).maNcc("NCC06").tenNcc("NCC Hiện Tại").build();
        when(supplierRepository.findById(id)).thenReturn(Optional.of(existing));

        Supplier input = Supplier.builder().email("invalid-email-format").build();

        assertThatThrownBy(() -> inventoryService.updateSupplier(id, input))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Định dạng email không hợp lệ");
    }

    @Test
    @DisplayName("updateSupplier() ném BadRequestException khi trạng thái cập nhật không hợp lệ")
    void test_updateSupplier_invalidTrangThai_throwsBadRequestException() {
        Long id = 6L;
        Supplier existing = Supplier.builder().id(id).maNcc("NCC06").tenNcc("NCC Hiện Tại").build();
        when(supplierRepository.findById(id)).thenReturn(Optional.of(existing));

        Supplier input = Supplier.builder().trangThai("INVALID_STATUS").build();

        assertThatThrownBy(() -> inventoryService.updateSupplier(id, input))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Trạng thái nhà cung cấp không hợp lệ");
    }

    @Test
    @DisplayName("updateSupplier() cập nhật thành công các thông tin hợp lệ")
    void test_updateSupplier_validFields_success() {
        Long id = 7L;
        Supplier existing = Supplier.builder()
                .id(id)
                .maNcc("NCC07")
                .tenNcc("Tên Cũ")
                .diaChi("Địa chỉ Cũ")
                .soDienThoai("0900000000")
                .email("old@ncc.com")
                .trangThai("ACTIVE")
                .build();

        when(supplierRepository.findById(id)).thenReturn(Optional.of(existing));
        when(supplierRepository.existsByMaNccIgnoreCaseAndIdNot("NCC07_NEW", id)).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(i -> i.getArgument(0));

        Supplier input = Supplier.builder()
                .maNcc("NCC07_NEW")
                .tenNcc("Tên Mới Cập Nhật")
                .diaChi("KCN Tân Tạo")
                .soDienThoai("0988776655")
                .email("new@ncc.com")
                .nguoiLienHe("Anh Tuấn")
                .ghiChu("Cập nhật lại số liên lạc mới")
                .trangThai("INACTIVE")
                .build();

        Supplier updated = inventoryService.updateSupplier(id, input);

        assertThat(updated.getMaNcc()).isEqualTo("NCC07_NEW");
        assertThat(updated.getTenNcc()).isEqualTo("Tên Mới Cập Nhật");
        assertThat(updated.getDiaChi()).isEqualTo("KCN Tân Tạo");
        assertThat(updated.getSoDienThoai()).isEqualTo("0988776655");
        assertThat(updated.getEmail()).isEqualTo("new@ncc.com");
        assertThat(updated.getNguoiLienHe()).isEqualTo("Anh Tuấn");
        assertThat(updated.getGhiChu()).isEqualTo("Cập nhật lại số liên lạc mới");
        assertThat(updated.getTrangThai()).isEqualTo("INACTIVE");
    }

    // ==========================================
    // 4. InventoryService.listSuppliers(q)
    // ==========================================

    @Test
    @DisplayName("listSuppliers() gọi search(q) khi q có giá trị tìm kiếm")
    void test_listSuppliers_withQuery_callsSearch() {
        List<Supplier> mockList = List.of(Supplier.builder().id(1L).maNcc("NCC_FIND").tenNcc("Công ty Tìm").build());
        when(supplierRepository.search("Routine")).thenReturn(mockList);

        List<Supplier> result = inventoryService.listSuppliers("Routine");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getMaNcc()).isEqualTo("NCC_FIND");
        verify(supplierRepository).search("Routine");
        verify(supplierRepository, never()).findAll();
    }

    @ParameterizedTest(name = "Query rỗng hoặc null: '{0}'")
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "\t"})
    @DisplayName("listSuppliers() gọi findAll() khi query tìm kiếm null hoặc blank")
    void test_listSuppliers_withoutQuery_callsFindAll(String emptyQuery) {
        List<Supplier> mockList = List.of(Supplier.builder().id(1L).maNcc("NCC01").build());
        when(supplierRepository.findAll()).thenReturn(mockList);

        List<Supplier> result = inventoryService.listSuppliers(emptyQuery);

        assertThat(result).hasSize(1);
        verify(supplierRepository).findAll();
        verify(supplierRepository, never()).search(anyString());
    }

    // ==========================================
    // 5. InventoryService.softDeleteSupplier(id)
    // Decision Table: docs/decision-tables/InventoryService_softDeleteSupplier.md
    // ==========================================

    @Test
    @DisplayName("R1: softDeleteSupplier() ném ResourceNotFoundException khi nhà cung cấp không tồn tại")
    void test_softDeleteSupplier_supplierNotFound_throwsResourceNotFoundException() {
        when(supplierRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.softDeleteSupplier(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy nhà cung cấp #999");

        verify(supplierRepository, never()).save(any());
    }

    @Test
    @DisplayName("R2: softDeleteSupplier() cập nhật trangThai = INACTIVE và lưu DB khi NCC tồn tại")
    void test_softDeleteSupplier_existingSupplier_setsTrangThaiInactive() {
        Long supplierId = 1L;
        Supplier existingSupplier = Supplier.builder()
                .id(supplierId)
                .maNcc("NCC01")
                .tenNcc("Công ty Dệt May Routine")
                .trangThai("ACTIVE")
                .build();

        when(supplierRepository.findById(supplierId)).thenReturn(Optional.of(existingSupplier));
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(i -> i.getArgument(0));

        inventoryService.softDeleteSupplier(supplierId);

        assertThat(existingSupplier.getTrangThai()).isEqualTo("INACTIVE");
        verify(supplierRepository).save(existingSupplier);
    }
}
