package com.routine.service;

import com.routine.dto.OtherDtos;
import com.routine.entity.User;
import com.routine.exception.BadRequestException;
import com.routine.exception.ResourceNotFoundException;
import com.routine.repository.UserRepository;
import com.routine.security.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private static final Long CURRENT_ADMIN_ID = 1L;
    private static final String CURRENT_ADMIN_EMAIL = "admin@routine.vn";

    @BeforeEach
    void setUpSecurityContext() {
        UserPrincipal principal = new UserPrincipal(
                CURRENT_ADMIN_ID, CURRENT_ADMIN_EMAIL, "hash", "Admin Quản Trị", "ADMIN", true
        );
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDownSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    // ==========================================
    // 1. UserService.create(StaffRequest) tests
    // Decision Table: docs/decision-tables/UserService_create.md
    // ==========================================

    @ParameterizedTest(name = "Role không hợp lệ: {0}")
    @ValueSource(strings = {"CUSTOMER", "SUPERADMIN", "GUEST", "admin", "UNKNOWN"})
    @DisplayName("R1: create() ném BadRequestException khi vai trò không hợp lệ")
    void test_create_invalidRole_throwsBadRequestException(String invalidRole) {
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole(invalidRole);
        req.setEmail("staff@routine.vn");
        req.setPassword("secret123");
        req.setFullName("Nguyễn Văn A");

        assertThatThrownBy(() -> userService.create(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Vai trò không hợp lệ: " + invalidRole);

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("R2: create() ném BadRequestException khi email đã tồn tại (không phân biệt hoa/thường)")
    void test_create_duplicateEmail_throwsBadRequestException() {
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole("SALES_STAFF");
        req.setEmail("Staff@Routine.vn");
        req.setPassword("secret123");
        req.setFullName("Nguyễn Văn A");

        when(userRepository.existsByEmailIgnoreCase(req.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> userService.create(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Email đã được sử dụng");

        verify(userRepository, never()).save(any());
    }

    @ParameterizedTest(name = "Mật khẩu rỗng hoặc blank: '{0}'")
    @ValueSource(strings = {"", "   ", "\t\n"})
    @DisplayName("R3: create() ném BadRequestException khi mật khẩu rỗng hoặc khoảng trắng")
    void test_create_blankPassword_throwsBadRequestException(String blankPassword) {
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole("WAREHOUSE_STAFF");
        req.setEmail("warehouse@routine.vn");
        req.setPassword(blankPassword);
        req.setFullName("Trần Kho");

        when(userRepository.existsByEmailIgnoreCase(req.getEmail())).thenReturn(false);

        assertThatThrownBy(() -> userService.create(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Mật khẩu không được để trống");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("R3: create() ném BadRequestException khi mật khẩu là null")
    void test_create_nullPassword_throwsBadRequestException() {
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole("ACCOUNTANT");
        req.setEmail("ketoan@routine.vn");
        req.setPassword(null);
        req.setFullName("Lê Kế Toán");

        when(userRepository.existsByEmailIgnoreCase(req.getEmail())).thenReturn(false);

        assertThatThrownBy(() -> userService.create(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Mật khẩu không được để trống");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("R4: create() tạo nhân viên thành công với đầy đủ thông tin hợp lệ")
    void test_create_validRequest_success() {
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole("SALES_STAFF");
        req.setEmail("sales@routine.vn");
        req.setPassword("Password@123");
        req.setFullName("Trần Bán Hàng");
        req.setPhone("0987654321");
        req.setBranch("Chi nhánh Quận 1");

        when(userRepository.existsByEmailIgnoreCase(req.getEmail())).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("encodedPasswordHash");

        User savedUser = User.builder()
                .id(2L)
                .email(req.getEmail())
                .passwordHash("encodedPasswordHash")
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .branch(req.getBranch())
                .role(req.getRole())
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        OtherDtos.StaffResponse response = userService.create(req);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(2L);
        assertThat(response.getEmail()).isEqualTo("sales@routine.vn");
        assertThat(response.getFullName()).isEqualTo("Trần Bán Hàng");
        assertThat(response.getRole()).isEqualTo("SALES_STAFF");
        assertThat(response.getIsActive()).isTrue();

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User captured = captor.getValue();
        assertThat(captured.getPasswordHash()).isEqualTo("encodedPasswordHash");
        assertThat(captured.getIsActive()).isTrue();
    }

    // ==========================================
    // Các quy tắc nghiệp vụ mở rộng (Decision Table Toàn diện)
    // ==========================================

    @ParameterizedTest(name = "Họ tên không hợp lệ: '{0}'")
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "\t\n"})
    @DisplayName("R2 (Toàn diện): create() ném BadRequestException khi họ tên trống hoặc null")
    void test_create_blankOrNullFullName_throwsBadRequestException(String invalidFullName) {
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole("SALES_STAFF");
        req.setEmail("staff@routine.vn");
        req.setPassword("secret123");
        req.setFullName(invalidFullName);

        assertThatThrownBy(() -> userService.create(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Họ tên không được để trống");

        verify(userRepository, never()).save(any());
    }

    @ParameterizedTest(name = "Email sai định dạng: {0}")
    @ValueSource(strings = {"invalid-email", "test@", "@routine.vn", "test@domain", "test.com", "user@domain..com"})
    @DisplayName("R3 (Toàn diện): create() ném BadRequestException khi định dạng email không hợp lệ")
    void test_create_invalidEmailFormat_throwsBadRequestException(String invalidEmail) {
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole("SALES_STAFF");
        req.setEmail(invalidEmail);
        req.setPassword("secret123");
        req.setFullName("Nguyễn Văn A");

        assertThatThrownBy(() -> userService.create(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Định dạng email không hợp lệ");

        verify(userRepository, never()).save(any());
    }

    @ParameterizedTest(name = "Mật khẩu quá ngắn (< 6 ký tự): '{0}'")
    @ValueSource(strings = {"1", "12", "123", "1234", "12345", "abcde"})
    @DisplayName("R6 (Toàn diện): create() ném BadRequestException khi mật khẩu dưới 6 ký tự")
    void test_create_shortPassword_throwsBadRequestException(String shortPassword) {
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole("WAREHOUSE_STAFF");
        req.setEmail("warehouse@routine.vn");
        req.setPassword(shortPassword);
        req.setFullName("Trần Kho");

        when(userRepository.existsByEmailIgnoreCase(req.getEmail())).thenReturn(false);

        assertThatThrownBy(() -> userService.create(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Mật khẩu phải có độ dài tối thiểu 6 ký tự");

        verify(userRepository, never()).save(any());
    }

    @ParameterizedTest(name = "SĐT chứa chữ cái: {0}")
    @ValueSource(strings = {"09012abcde", "phone12345", "098765432a", "O912345678"})
    @DisplayName("R7 (Toàn diện): create() ném BadRequestException khi SĐT chứa chữ cái")
    void test_create_phoneContainsLetters_throwsBadRequestException(String phoneWithLetters) {
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole("SALES_STAFF");
        req.setEmail("sales@routine.vn");
        req.setPassword("secret123");
        req.setFullName("Nguyễn Văn A");
        req.setPhone(phoneWithLetters);

        when(userRepository.existsByEmailIgnoreCase(req.getEmail())).thenReturn(false);

        assertThatThrownBy(() -> userService.create(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại chỉ được chứa các chữ số");

        verify(userRepository, never()).save(any());
    }

    @ParameterizedTest(name = "SĐT chứa ký tự đặc biệt: {0}")
    @ValueSource(strings = {"090-123456", "090.123.456", "090 123 456", "+8490123456", "090@123456", "(090)12345"})
    @DisplayName("R7 (Toàn diện): create() ném BadRequestException khi SĐT chứa ký tự đặc biệt")
    void test_create_phoneContainsSpecialCharacters_throwsBadRequestException(String phoneWithSpecialChars) {
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole("SALES_STAFF");
        req.setEmail("sales@routine.vn");
        req.setPassword("secret123");
        req.setFullName("Nguyễn Văn A");
        req.setPhone(phoneWithSpecialChars);

        when(userRepository.existsByEmailIgnoreCase(req.getEmail())).thenReturn(false);

        assertThatThrownBy(() -> userService.create(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại chỉ được chứa các chữ số");

        verify(userRepository, never()).save(any());
    }

    @ParameterizedTest(name = "SĐT quá ngắn (< 10 số): {0}")
    @ValueSource(strings = {"0", "09", "09012", "012345678"})
    @DisplayName("R8 (Toàn diện): create() ném BadRequestException khi SĐT ít hơn 10 chữ số")
    void test_create_phoneTooShort_throwsBadRequestException(String shortPhone) {
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole("SALES_STAFF");
        req.setEmail("sales@routine.vn");
        req.setPassword("secret123");
        req.setFullName("Nguyễn Văn A");
        req.setPhone(shortPhone);

        when(userRepository.existsByEmailIgnoreCase(req.getEmail())).thenReturn(false);

        assertThatThrownBy(() -> userService.create(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại phải bao gồm đúng 10 chữ số");

        verify(userRepository, never()).save(any());
    }

    @ParameterizedTest(name = "SĐT quá dài (> 10 số): {0}")
    @ValueSource(strings = {"09012345678", "0123456789012", "098765432100"})
    @DisplayName("R8 (Toàn diện): create() ném BadRequestException khi SĐT nhiều hơn 10 chữ số")
    void test_create_phoneTooLong_throwsBadRequestException(String longPhone) {
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole("SALES_STAFF");
        req.setEmail("sales@routine.vn");
        req.setPassword("secret123");
        req.setFullName("Nguyễn Văn A");
        req.setPhone(longPhone);

        when(userRepository.existsByEmailIgnoreCase(req.getEmail())).thenReturn(false);

        assertThatThrownBy(() -> userService.create(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại phải bao gồm đúng 10 chữ số");

        verify(userRepository, never()).save(any());
    }

    @ParameterizedTest(name = "SĐT không bắt đầu bằng số 0: {0}")
    @ValueSource(strings = {"1901234567", "9876543210", "2345678901", "8490123456"})
    @DisplayName("R9 (Toàn diện): create() ném BadRequestException khi SĐT không bắt đầu bằng chữ số 0")
    void test_create_phoneNotStartingWithZero_throwsBadRequestException(String invalidPrefixPhone) {
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole("SALES_STAFF");
        req.setEmail("sales@routine.vn");
        req.setPassword("secret123");
        req.setFullName("Nguyễn Văn A");
        req.setPhone(invalidPrefixPhone);

        when(userRepository.existsByEmailIgnoreCase(req.getEmail())).thenReturn(false);

        assertThatThrownBy(() -> userService.create(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại phải bắt đầu bằng chữ số 0");

        verify(userRepository, never()).save(any());
    }

    @ParameterizedTest(name = "SĐT null hoặc rỗng: '{0}'")
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "\t"})
    @DisplayName("R10 (Toàn diện): create() cho phép SĐT để trống/null khi tạo nhân viên")
    void test_create_nullOrBlankPhone_success(String emptyPhone) {
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole("SALES_STAFF");
        req.setEmail("sales.optional@routine.vn");
        req.setPassword("Password@123");
        req.setFullName("Trần Văn Không SĐT");
        req.setPhone(emptyPhone);
        req.setBranch("Chi nhánh 1");

        when(userRepository.existsByEmailIgnoreCase(req.getEmail())).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("encodedPasswordHash");

        User savedUser = User.builder()
                .id(10L)
                .email(req.getEmail())
                .passwordHash("encodedPasswordHash")
                .fullName(req.getFullName())
                .phone(null)
                .branch(req.getBranch())
                .role(req.getRole())
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        OtherDtos.StaffResponse response = userService.create(req);

        assertThat(response).isNotNull();
        assertThat(response.getPhone()).isNull();
    }

    @Test
    @DisplayName("R10 (Toàn diện): create() tự động loại bỏ khoảng trắng thừa đầu/cuối của họ tên và SĐT")
    void test_create_phoneWithWhitespace_trimmedAndSuccess() {
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole("ACCOUNTANT");
        req.setEmail("ketoan.trim@routine.vn");
        req.setPassword("Password@123");
        req.setFullName("  Lê Kế Toán Trim  ");
        req.setPhone("   0901234567   ");
        req.setBranch("Hội Sở");

        when(userRepository.existsByEmailIgnoreCase(req.getEmail())).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("encodedHash");

        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(11L);
            u.setCreatedAt(LocalDateTime.now());
            return u;
        });

        OtherDtos.StaffResponse response = userService.create(req);

        assertThat(response).isNotNull();
        assertThat(response.getFullName()).isEqualTo("Lê Kế Toán Trim");
        assertThat(response.getPhone()).isEqualTo("0901234567");
    }

    // ==========================================
    // 2. UserService.update(id, StaffRequest) tests
    // Decision Table: docs/decision-tables/UserService_update.md
    // ==========================================

    @Test
    @DisplayName("R1: update() ném BadRequestException khi đổi sang vai trò không hợp lệ")
    void test_update_invalidRole_throwsBadRequestException() {
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole("INVALID_ROLE");
        req.setFullName("Tên Mới");

        assertThatThrownBy(() -> userService.update(2L, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Vai trò không hợp lệ");

        verify(userRepository, never()).findById(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("R2: update() ném ResourceNotFoundException khi không tìm thấy nhân viên theo ID")
    void test_update_userNotFound_throwsResourceNotFoundException() {
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole("SALES_STAFF");
        req.setFullName("Tên Mới");

        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.update(999L, req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy nhân viên #999");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("R3: update() cập nhật thông tin kèm cả số điện thoại và mật khẩu mới")
    void test_update_allFieldsWithNewPassword_success() {
        Long staffId = 2L;
        User existingUser = User.builder()
                .id(staffId)
                .email("staff@routine.vn")
                .fullName("Tên Cũ")
                .phone("0900000000")
                .branch("Chi nhánh Cũ")
                .role("SALES_STAFF")
                .passwordHash("oldHash")
                .isActive(true)
                .build();

        when(userRepository.findById(staffId)).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.encode("NewSecret@456")).thenReturn("newHash456");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setFullName("Tên Mới Cập Nhật");
        req.setRole("ACCOUNTANT");
        req.setBranch("Chi nhánh Mới");
        req.setPhone("0911222333");
        req.setPassword("NewSecret@456");

        OtherDtos.StaffResponse response = userService.update(staffId, req);

        assertThat(response.getFullName()).isEqualTo("Tên Mới Cập Nhật");
        assertThat(response.getRole()).isEqualTo("ACCOUNTANT");
        assertThat(response.getBranch()).isEqualTo("Chi nhánh Mới");
        assertThat(response.getPhone()).isEqualTo("0911222333");
        assertThat(existingUser.getPasswordHash()).isEqualTo("newHash456");
    }

    @Test
    @DisplayName("R4: update() không truyền phone và password thì giữ nguyên giá trị cũ")
    void test_update_withoutPhoneAndPassword_keepsOldValues() {
        Long staffId = 2L;
        User existingUser = User.builder()
                .id(staffId)
                .email("staff@routine.vn")
                .fullName("Tên Cũ")
                .phone("0900000000")
                .branch("Chi nhánh Cũ")
                .role("SALES_STAFF")
                .passwordHash("originalHash")
                .isActive(true)
                .build();

        when(userRepository.findById(staffId)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setFullName("Tên Mới");
        req.setRole("SALES_STAFF");
        req.setBranch("Chi nhánh Khác");
        req.setPhone(null);       // Giữ phone cũ
        req.setPassword(null);    // Giữ password cũ

        OtherDtos.StaffResponse response = userService.update(staffId, req);

        assertThat(response.getPhone()).isEqualTo("0900000000");
        assertThat(existingUser.getPasswordHash()).isEqualTo("originalHash");
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("R5: update() chỉ đổi phone mới, password null hoặc blank thì giữ password cũ")
    void test_update_phoneOnly_keepsOldPassword() {
        Long staffId = 3L;
        User existingUser = User.builder()
                .id(staffId)
                .email("kho@routine.vn")
                .fullName("Nguyễn Kho")
                .phone("0900000001")
                .branch("Kho Tổng")
                .role("WAREHOUSE_STAFF")
                .passwordHash("keepThisHash")
                .isActive(true)
                .build();

        when(userRepository.findById(staffId)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setFullName("Nguyễn Kho Cập Nhật");
        req.setRole("WAREHOUSE_STAFF");
        req.setBranch("Kho Tổng 2");
        req.setPhone("0988888888");
        req.setPassword("   "); // blank password

        OtherDtos.StaffResponse response = userService.update(staffId, req);

        assertThat(response.getPhone()).isEqualTo("0988888888");
        assertThat(existingUser.getPasswordHash()).isEqualTo("keepThisHash");
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("R6: update() phone null thì giữ phone cũ, password có giá trị thì đổi mật khẩu mới")
    void test_update_passwordOnly_keepsOldPhone() {
        Long staffId = 4L;
        User existingUser = User.builder()
                .id(staffId)
                .email("sales2@routine.vn")
                .fullName("Trần Thu Ngân")
                .phone("0977777777")
                .branch("Store 1")
                .role("SALES_STAFF")
                .passwordHash("oldHash2")
                .isActive(true)
                .build();

        when(userRepository.findById(staffId)).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.encode("brandNewPassword")).thenReturn("brandNewHash");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setFullName("Trần Thu Ngân");
        req.setRole("SALES_STAFF");
        req.setBranch("Store 1");
        req.setPhone(null); // Giữ phone cũ
        req.setPassword("brandNewPassword");

        OtherDtos.StaffResponse response = userService.update(staffId, req);

        assertThat(response.getPhone()).isEqualTo("0977777777");
        assertThat(existingUser.getPasswordHash()).isEqualTo("brandNewHash");
    }

    // ==========================================
    // 3. UserService.setActive(id, active) tests
    // Decision Table: docs/decision-tables/UserService_setActive.md
    // ==========================================

    @Test
    @DisplayName("R1: setActive() ném ResourceNotFoundException khi không tìm thấy nhân viên theo ID")
    void test_setActive_userNotFound_throwsResourceNotFoundException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.setActive(999L, false))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy nhân viên #999");
    }

    @Test
    @DisplayName("R2: setActive() ném BadRequestException khi Admin tự vô hiệu hoá tài khoản của chính mình")
    void test_setActive_selfDeactivate_throwsBadRequestException() {
        User currentAdmin = User.builder()
                .id(CURRENT_ADMIN_ID)
                .email(CURRENT_ADMIN_EMAIL)
                .fullName("Admin Quản Trị")
                .role("ADMIN")
                .isActive(true)
                .build();

        when(userRepository.findById(CURRENT_ADMIN_ID)).thenReturn(Optional.of(currentAdmin));

        assertThatThrownBy(() -> userService.setActive(CURRENT_ADMIN_ID, false))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể vô hiệu hoá chính tài khoản của bạn");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("R3: setActive() cho phép Admin tự kích hoạt lại tài khoản của chính mình (active=true)")
    void test_setActive_selfActivate_success() {
        User currentAdmin = User.builder()
                .id(CURRENT_ADMIN_ID)
                .email(CURRENT_ADMIN_EMAIL)
                .fullName("Admin Quản Trị")
                .role("ADMIN")
                .isActive(true)
                .build();

        when(userRepository.findById(CURRENT_ADMIN_ID)).thenReturn(Optional.of(currentAdmin));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        OtherDtos.StaffResponse response = userService.setActive(CURRENT_ADMIN_ID, true);

        assertThat(response.getIsActive()).isTrue();
        assertThat(currentAdmin.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("R4: setActive() cho phép Admin vô hiệu hoá tài khoản của nhân viên khác (active=false)")
    void test_setActive_deactivateOtherUser_success() {
        Long targetId = 5L;
        User otherStaff = User.builder()
                .id(targetId)
                .email("other@routine.vn")
                .fullName("Nhân Viên Khác")
                .role("SALES_STAFF")
                .isActive(true)
                .build();

        when(userRepository.findById(targetId)).thenReturn(Optional.of(otherStaff));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        OtherDtos.StaffResponse response = userService.setActive(targetId, false);

        assertThat(response.getIsActive()).isFalse();
        assertThat(otherStaff.getIsActive()).isFalse();
        verify(userRepository).save(otherStaff);
    }

    @Test
    @DisplayName("R5: setActive() cho phép Admin mở khóa/kích hoạt lại tài khoản nhân viên khác (active=true)")
    void test_setActive_activateOtherUser_success() {
        Long targetId = 6L;
        User otherStaff = User.builder()
                .id(targetId)
                .email("locked@routine.vn")
                .fullName("Nhân Viên Bị Khóa")
                .role("WAREHOUSE_STAFF")
                .isActive(false)
                .build();

        when(userRepository.findById(targetId)).thenReturn(Optional.of(otherStaff));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        OtherDtos.StaffResponse response = userService.setActive(targetId, true);

        assertThat(response.getIsActive()).isTrue();
        assertThat(otherStaff.getIsActive()).isTrue();
        verify(userRepository).save(otherStaff);
    }

    // ==========================================
    // 4. Các chức năng danh sách & hồ sơ cá nhân
    // ==========================================

    @Test
    @DisplayName("getAll() trả về danh sách tất cả nhân viên")
    void test_getAll_returnsStaffList() {
        List<User> users = List.of(
                User.builder().id(1L).email("admin@routine.vn").role("ADMIN").isActive(true).build(),
                User.builder().id(2L).email("staff@routine.vn").role("SALES_STAFF").isActive(false).build()
        );
        when(userRepository.findAll()).thenReturn(users);

        List<OtherDtos.StaffResponse> responses = userService.getAll();

        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getEmail()).isEqualTo("admin@routine.vn");
        assertThat(responses.get(1).getEmail()).isEqualTo("staff@routine.vn");
    }

    @Test
    @DisplayName("getMyProfile() trả về thông tin hồ sơ của Admin đang đăng nhập")
    void test_getMyProfile_returnsCurrentProfile() {
        User admin = User.builder()
                .id(CURRENT_ADMIN_ID)
                .email(CURRENT_ADMIN_EMAIL)
                .fullName("Admin Quản Trị")
                .role("ADMIN")
                .branch("Hội Sở")
                .isActive(true)
                .build();

        when(userRepository.findById(CURRENT_ADMIN_ID)).thenReturn(Optional.of(admin));

        OtherDtos.StaffResponse profile = userService.getMyProfile();

        assertThat(profile.getId()).isEqualTo(CURRENT_ADMIN_ID);
        assertThat(profile.getFullName()).isEqualTo("Admin Quản Trị");
    }

    @Test
    @DisplayName("updateMyProfile() cập nhật các trường được phép cho tài khoản đang đăng nhập")
    void test_updateMyProfile_updatesAllowedFields() {
        User admin = User.builder()
                .id(CURRENT_ADMIN_ID)
                .email(CURRENT_ADMIN_EMAIL)
                .fullName("Admin Cũ")
                .phone("0900000000")
                .branch("Chi nhánh Cũ")
                .role("ADMIN")
                .build();

        when(userRepository.findById(CURRENT_ADMIN_ID)).thenReturn(Optional.of(admin));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        OtherDtos.MyProfileRequest req = new OtherDtos.MyProfileRequest();
        req.setFullName("Admin Mới");
        req.setPhone("0912345678");
        req.setBranch("Trụ sở chính");

        OtherDtos.StaffResponse profile = userService.updateMyProfile(req);

        assertThat(profile.getFullName()).isEqualTo("Admin Mới");
        assertThat(profile.getPhone()).isEqualTo("0912345678");
        assertThat(profile.getBranch()).isEqualTo("Trụ sở chính");
    }

    @Test
    @DisplayName("updateMyProfile() ném BadRequestException khi số điện thoại chứa chữ hoặc ký tự không hợp lệ")
    void test_updateMyProfile_invalidPhone_throwsBadRequestException() {
        User admin = User.builder().id(CURRENT_ADMIN_ID).role("ADMIN").build();
        when(userRepository.findById(CURRENT_ADMIN_ID)).thenReturn(Optional.of(admin));

        OtherDtos.MyProfileRequest req = new OtherDtos.MyProfileRequest();
        req.setFullName("Admin Tên Mới");
        req.setPhone("090-abc-xyz");

        assertThatThrownBy(() -> userService.updateMyProfile(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại chỉ được chứa các chữ số");
    }

    @Test
    @DisplayName("updateMyProfile() tự động loại bỏ khoảng trắng thừa (trim) cho SĐT hợp lệ")
    void test_updateMyProfile_validPhoneWithWhitespace_trimmedAndSuccess() {
        User admin = User.builder().id(CURRENT_ADMIN_ID).role("ADMIN").build();
        when(userRepository.findById(CURRENT_ADMIN_ID)).thenReturn(Optional.of(admin));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        OtherDtos.MyProfileRequest req = new OtherDtos.MyProfileRequest();
        req.setFullName("Admin Cập Nhật");
        req.setPhone("   0988776655   ");

        OtherDtos.StaffResponse profile = userService.updateMyProfile(req);

        assertThat(profile.getPhone()).isEqualTo("0988776655");
    }

    // ==========================================
    // 5. Kiểm thử hàm UserService.validatePhone(String phone)
    // Decision Table: docs/decision-tables/UserService_validatePhone.md
    // ==========================================

    @ParameterizedTest(name = "SĐT null hoặc blank: '{0}'")
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "\t\n"})
    @DisplayName("R1: validatePhone() trả về null khi truyền null hoặc chuỗi khoảng trắng")
    void test_validatePhone_nullOrBlank_returnsNull(String input) {
        String result = userService.validatePhone(input);
        assertThat(result).isNull();
    }

    @ParameterizedTest(name = "SĐT chứa chữ cái: {0}")
    @ValueSource(strings = {"09012abcde", "phone12345", "098765432a", "abc", "090O123456"})
    @DisplayName("R2: validatePhone() ném BadRequestException khi chứa chữ cái")
    void test_validatePhone_containsLetters_throwsBadRequestException(String input) {
        assertThatThrownBy(() -> userService.validatePhone(input))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại chỉ được chứa các chữ số");
    }

    @ParameterizedTest(name = "SĐT chứa ký tự đặc biệt: {0}")
    @ValueSource(strings = {"090-123456", "090.123.456", "090 123 456", "+8490123456", "090#123456", "!090123456"})
    @DisplayName("R3: validatePhone() ném BadRequestException khi chứa ký tự đặc biệt hoặc khoảng trắng ở giữa")
    void test_validatePhone_containsSpecialChars_throwsBadRequestException(String input) {
        assertThatThrownBy(() -> userService.validatePhone(input))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại chỉ được chứa các chữ số");
    }

    @ParameterizedTest(name = "SĐT quá ngắn (< 10 số): {0}")
    @ValueSource(strings = {"0", "09", "0901234", "012345678"})
    @DisplayName("R4: validatePhone() ném BadRequestException khi độ dài < 10 chữ số")
    void test_validatePhone_tooShort_throwsBadRequestException(String input) {
        assertThatThrownBy(() -> userService.validatePhone(input))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại phải bao gồm đúng 10 chữ số");
    }

    @ParameterizedTest(name = "SĐT quá dài (> 10 số): {0}")
    @ValueSource(strings = {"09012345678", "0123456789012", "0987654321000"})
    @DisplayName("R5: validatePhone() ném BadRequestException khi độ dài > 10 chữ số")
    void test_validatePhone_tooLong_throwsBadRequestException(String input) {
        assertThatThrownBy(() -> userService.validatePhone(input))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại phải bao gồm đúng 10 chữ số");
    }

    @ParameterizedTest(name = "SĐT không bắt đầu bằng 0: {0}")
    @ValueSource(strings = {"1901234567", "9876543210", "2345678901", "8490123456"})
    @DisplayName("R6: validatePhone() ném BadRequestException khi không bắt đầu bằng chữ số 0")
    void test_validatePhone_notStartingWithZero_throwsBadRequestException(String input) {
        assertThatThrownBy(() -> userService.validatePhone(input))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại phải bắt đầu bằng chữ số 0");
    }

    @ParameterizedTest(name = "SĐT hợp lệ: {0}")
    @ValueSource(strings = {"0901234567", "0389998877", "0912345678", "0868123456", "  0987654321  "})
    @DisplayName("R7: validatePhone() trả về chuỗi đã chuẩn hoá (trimmed) khi hợp lệ 10 chữ số")
    void test_validatePhone_validTenDigits_returnsTrimmedPhone(String input) {
        String result = userService.validatePhone(input);
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(input.trim());
        assertThat(result).hasSize(10);
        assertThat(result).startsWith("0");
    }

    // ==========================================
    // 6. Kiểm thử ràng buộc bổ sung khi Cập nhật (update)
    // ==========================================

    @Test
    @DisplayName("update() ném BadRequestException khi số điện thoại cập nhật chứa chữ cái")
    void test_update_phoneContainsLetters_throwsBadRequestException() {
        Long staffId = 2L;
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole("SALES_STAFF");
        req.setFullName("Trần Bán Hàng");
        req.setPhone("09012abcde");

        User user = User.builder().id(staffId).role("SALES_STAFF").build();
        when(userRepository.findById(staffId)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> userService.update(staffId, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại chỉ được chứa các chữ số");
    }

    @Test
    @DisplayName("update() ném BadRequestException khi số điện thoại cập nhật sai độ dài")
    void test_update_phoneWrongLength_throwsBadRequestException() {
        Long staffId = 2L;
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole("SALES_STAFF");
        req.setFullName("Trần Bán Hàng");
        req.setPhone("090123");

        User user = User.builder().id(staffId).role("SALES_STAFF").build();
        when(userRepository.findById(staffId)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> userService.update(staffId, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Số điện thoại phải bao gồm đúng 10 chữ số");
    }

    @Test
    @DisplayName("update() ném BadRequestException khi mật khẩu mới dưới 6 ký tự")
    void test_update_shortPassword_throwsBadRequestException() {
        Long staffId = 2L;
        OtherDtos.StaffRequest req = new OtherDtos.StaffRequest();
        req.setRole("SALES_STAFF");
        req.setFullName("Trần Bán Hàng");
        req.setPassword("123");

        User user = User.builder().id(staffId).role("SALES_STAFF").build();
        when(userRepository.findById(staffId)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> userService.update(staffId, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Mật khẩu phải có độ dài tối thiểu 6 ký tự");
    }
}
