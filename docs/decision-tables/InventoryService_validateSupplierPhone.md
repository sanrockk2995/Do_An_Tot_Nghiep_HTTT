# Bảng quyết định: `InventoryService.validateSupplierPhone(String phone)`

## Mô tả chức năng
Kiểm tra tính hợp lệ của số điện thoại nhà cung cấp khi Quản trị viên (ADMIN) hoặc Nhân viên kho (WAREHOUSE_STAFF) thêm mới hoặc cập nhật thông tin nhà cung cấp trong phân hệ Quản lý kho Routine.
Theo yêu cầu nghiệp vụ: **Số điện thoại chỉ có thể nhập dạng số**, không được chứa chữ cái hay ký tự đặc biệt, phải đủ 10 chữ số và bắt đầu bằng số 0 (theo chuẩn số điện thoại Việt Nam).

## Bảng quyết định (Decision Table)

| Điều kiện / Tiêu chí | R1 (Null hoặc rỗng) | R2 (Chứa chữ cái) | R3 (Ký tự đặc biệt) | R4 (Độ dài < 10 số) | R5 (Độ dài > 10 số) | R6 (Không bắt đầu bằng 0) | R7 (Hợp lệ hoàn toàn) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **C1: Có nhập số điện thoại (`phone != null && !isBlank()`)** | **F** | T | T | T | T | T | T |
| **C2: Chỉ chứa ký tự số (`0-9`)** | - | **F** | **F** | T | T | T | T |
| **C3: Độ dài đúng 10 chữ số** | - | - | - | **F (< 10)** | **F (> 10)** | T | T |
| **C4: Bắt đầu bằng chữ số `0`** | - | - | - | - | - | **F** | **T** |
| **Hành động / Kết quả** | | | | | | | |
| Trả về `null` (cho phép để trống) | **X** | | | | | | |
| Ném `BadRequestException("Số điện thoại chỉ được chứa các chữ số")` | | **X** | **X** | | | | |
| Ném `BadRequestException("Số điện thoại phải bao gồm đúng 10 chữ số")` | | | | **X** | **X** | | |
| Ném `BadRequestException("Số điện thoại phải bắt đầu bằng chữ số 0 (ví dụ: 0901234567)")` | | | | | | **X** | |
| Chấp nhận số điện thoại, tự động trim khoảng trắng | | | | | | | **X** |

## Ghi chú rút gọn
- Áp dụng nguyên tắc fail-fast:
  - Nếu C1 = F: Trả về null cho phép nhà cung cấp chưa có SĐT.
  - Nếu C2 = F: Từ chối ngay khi phát hiện chữ cái hoặc ký tự đặc biệt (R2, R3), không cần kiểm tra C3 và C4.
  - Nếu C3 = F: Khi đã toàn số nhưng sai độ dài (< 10 hoặc > 10) sẽ báo lỗi độ dài (R4, R5).
  - Nếu C4 = F: Đúng 10 chữ số nhưng không bắt đầu bằng số 0 (R6).
  - R7 là trường hợp hợp lệ thỏa mãn mọi điều kiện.
