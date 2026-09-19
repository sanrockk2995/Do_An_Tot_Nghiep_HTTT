# Bảng quyết định: `UserService.update(Long id, OtherDtos.StaffRequest request)`

## Mô tả chức năng
Quản trị viên (ADMIN) cập nhật thông tin tài khoản nhân viên (họ tên, vai trò, số điện thoại, chi nhánh, mật khẩu mới).

## Bảng quyết định (Decision Table)

| Điều kiện / Tiêu chí | R1 (Role sai) | R2 (Không tìm thấy User) | R3 (Cập nhật cả Phone + Mật khẩu mới) | R4 (Không đổi Phone, Không đổi Mật khẩu) | R5 (Đổi Phone, Giữ Mật khẩu cũ) | R6 (Giữ Phone cũ, Đổi Mật khẩu mới) |
|---|---|---|---|---|---|---|
| **C1: Role hợp lệ** | F | T | T | T | T | T |
| **C2: User tồn tại theo id** | - | F | T | T | T | T |
| **C3: `request.getPhone() != null`** | - | - | T | F | T | F |
| **C4: `password` mới hợp lệ (không null & không blank)** | - | - | T | F | F | T |
| **Hành động / Kết quả** | | | | | | |
| Ném `BadRequestException("Vai trò không hợp lệ: ...")` | **X** | | | | | |
| Ném `ResourceNotFoundException("Không tìm thấy nhân viên...")` | | **X** | | | | |
| Cập nhật `fullName`, `branch`, `role` | | | **X** | **X** | **X** | **X** |
| Cập nhật `phone` mới | | | **X** | | **X** | |
| Giữ nguyên `phone` cũ | | | | **X** | | **X** |
| Mã hóa và cập nhật mật khẩu mới | | | **X** | | | **X** |
| Giữ nguyên mật khẩu cũ | | | | **X** | **X** | |
| Lưu và trả về `StaffResponse` | | | **X** | **X** | **X** | **X** |

## Ghi chú rút gọn
- Khi C1 = F (role không hợp lệ), phương thức dừng ngay tại `validateRole()`, không truy vấn DB tìm user.
- Khi C2 = F (không tìm thấy User), ném ngoại lệ 404 `ResourceNotFoundException`.
