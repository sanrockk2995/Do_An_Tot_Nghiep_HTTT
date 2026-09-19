# Bảng quyết định: `UserService.validatePhone(String phone)`

## Mô tả chức năng
Kiểm tra tính hợp lệ của số điện thoại nhân viên khi Quản trị viên (ADMIN) thêm mới hoặc cập nhật thông tin nhân viên trong hệ thống Routine. Nghiệp vụ quy định: **Số điện thoại chỉ có thể nhập dạng số**, phải gồm đúng 10 chữ số và bắt đầu bằng số 0 (theo quy chuẩn số điện thoại di động Việt Nam).

## Bảng quyết định (Decision Table)

| Điều kiện / Tiêu chí | R1 (Null hoặc rỗng) | R2 (Chứa chữ cái) | R3 (Chứa ký tự đặc biệt) | R4 (Độ dài < 10 số) | R5 (Độ dài > 10 số) | R6 (Không bắt đầu bằng 0) | R7 (Hợp lệ hoàn toàn) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **C1: Có nhập số điện thoại (`phone != null && !isBlank()`)** | F | T | T | T | T | T | T |
| **C2: Chỉ chứa ký tự số (`0-9`)** | - | F | F | T | T | T | T |
| **C3: Độ dài bằng đúng 10 chữ số** | - | - | - | F (< 10) | F (> 10) | T | T |
| **C4: Bắt đầu bằng chữ số `0`** | - | - | - | - | - | F | T |
| **Hành động / Kết quả** | | | | | | | |
| Chấp nhận (giữ null/rỗng) | **X** | | | | | | |
| Ném `BadRequestException("Số điện thoại chỉ được chứa các chữ số")` | | **X** | **X** | | | | |
| Ném `BadRequestException("Số điện thoại phải bao gồm đúng 10 chữ số")` | | | | **X** | **X** | | |
| Ném `BadRequestException("Số điện thoại phải bắt đầu bằng chữ số 0...")` | | | | | | **X** | |
| Chấp nhận số điện thoại hợp lệ | | | | | | | **X** |

## Ghi chú rút gọn (Simplification notes)
- **R2, R3**: Khi C2 = F (chứa bất kỳ ký tự không phải số nào như chữ cái `a-z`, khoảng trắng, dấu gạch ngang, `@`, `#`...), hệ thống lập tức từ chối và thông báo số điện thoại chỉ được chứa số, không cần xét C3 và C4.
- **R4, R5**: Khi đã đảm bảo chỉ gồm số nhưng C3 = F (độ dài sai, < 10 hoặc > 10 ký tự), hệ thống thông báo lỗi độ dài 10 số.
- **R6**: Khi gồm đúng 10 số nhưng không bắt đầu bằng đầu số `0` chuẩn Việt Nam, hệ thống báo lỗi đầu số.
