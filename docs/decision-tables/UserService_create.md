# Bảng quyết định: `UserService.create(OtherDtos.StaffRequest request)`

## Mô tả chức năng
Quản trị viên (ADMIN) tạo tài khoản nhân viên mới trên hệ thống Routine, phân quyền vai trò (`role`), thiết lập mật khẩu và thông tin chi nhánh.

## Bảng quyết định (Decision Table)

| Điều kiện / Tiêu chí | R1 (Role không hợp lệ) | R2 (Trùng Email) | R3 (Mật khẩu rỗng/null) | R4 (Hợp lệ hoàn toàn) |
|---|---|---|---|---|
| **C1: Role hợp lệ (`ADMIN`, `SALES_STAFF`, `WAREHOUSE_STAFF`, `ACCOUNTANT`)** | F | T | T | T |
| **C2: Email đã tồn tại trong hệ thống (ignore case)** | - | T | F | F |
| **C3: Password hợp lệ (khác null và không blank)** | - | - | F | T |
| **Hành động / Kết quả** | | | | |
| Ném `BadRequestException("Vai trò không hợp lệ: ...")` | **X** | | | |
| Ném `BadRequestException("Email đã được sử dụng")` | | **X** | | |
| Ném `BadRequestException("Mật khẩu không được để trống")` | | | **X** | |
| Mã hóa mật khẩu, gán `isActive = true`, lưu User, trả về `StaffResponse` | | | | **X** |

## Ghi chú rút gọn (Simplification notes)
- **R1**: Khi C1 = F (role sai hoặc rỗng), hàm `validateRole()` ném ngoại lệ ngay lập tức; không cần đánh giá C2 và C3.
- **R2**: Khi C1 = T và C2 = T (email đã tồn tại), hệ thống chặn trước khi kiểm tra mật khẩu; không cần đánh giá C3.
