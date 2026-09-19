# Bảng quyết định: `UserService.setActive(Long id, boolean active)`

## Mô tả chức năng
Quản trị viên (ADMIN) kích hoạt hoặc vô hiệu hoá tài khoản nhân viên. Nghiệp vụ bảo vệ tài khoản quản trị: ADMIN không được phép tự vô hiệu hoá tài khoản của chính mình.

## Bảng quyết định (Decision Table)

| Điều kiện / Tiêu chí | R1 (User không tồn tại) | R2 (Tự vô hiệu hoá chính mình) | R3 (Tự kích hoạt chính mình) | R4 (Vô hiệu hoá nhân viên khác) | R5 (Kích hoạt nhân viên khác) |
|---|---|---|---|---|---|
| **C1: User tồn tại theo `id`** | F | T | T | T | T |
| **C2: `id.equals(currentUserId)`** | - | T | T | F | F |
| **C3: `active == false` (vô hiệu hoá)** | - | T | F | T | F |
| **Hành động / Kết quả** | | | | | |
| Ném `ResourceNotFoundException("Không tìm thấy nhân viên...")` | **X** | | | | |
| Ném `BadRequestException("Không thể vô hiệu hoá chính tài khoản của bạn")` | | **X** | | | |
| Cập nhật `isActive = false`, lưu DB, trả về `StaffResponse` | | | | **X** | |
| Cập nhật `isActive = true`, lưu DB, trả về `StaffResponse` | | | **X** | | **X** |

## Ghi chú rút gọn
- Khi C1 = F (User không tồn tại), hệ thống ném exception ngay khi tìm trong database, không cần kiểm tra quyền tự vô hiệu hóa.
