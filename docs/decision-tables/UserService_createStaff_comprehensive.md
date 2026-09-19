# Bảng quyết định: `UserService.create(StaffRequest request)` (Toàn diện)

## Mô tả chức năng
Quản trị viên (ADMIN) thêm mới nhân viên vào hệ thống Routine. Kiểm tra nghiêm ngặt tính hợp lệ của tất cả các trường: Vai trò (`role`), Họ tên (`fullName`), Định dạng email và chống trùng (`email`), Mật khẩu và độ dài an toàn (`password`), Định dạng số điện thoại chỉ gồm chữ số (`phone`).

## Bảng quyết định (Decision Table)

| Điều kiện / Tiêu chí | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | R10 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **C1: Role hợp lệ (`ADMIN`, `SALES_STAFF`, `WAREHOUSE_STAFF`, `ACCOUNTANT`)** | **F** | T | T | T | T | T | T | T | T | T |
| **C2: Họ tên hợp lệ (`!fullName.isBlank()`)** | - | **F** | T | T | T | T | T | T | T | T |
| **C3: Định dạng Email hợp lệ** | - | - | **F** | T | T | T | T | T | T | T |
| **C4: Email chưa tồn tại trong DB (ignore case)** | - | - | - | **F** | T | T | T | T | T | T |
| **C5: Mật khẩu không rỗng/blank** | - | - | - | - | **F** | T | T | T | T | T |
| **C6: Mật khẩu tối thiểu 6 ký tự** | - | - | - | - | - | **F** | T | T | T | T |
| **C7: Số điện thoại chỉ gồm các ký tự số** | - | - | - | - | - | - | **F** | T | T | T |
| **C8: Số điện thoại đúng 10 chữ số** | - | - | - | - | - | - | - | **F** | T | T |
| **C9: Số điện thoại bắt đầu bằng số 0** | - | - | - | - | - | - | - | - | **F** | T |
| **Hành động / Kết quả** | | | | | | | | | | |
| Ném `BadRequestException("Vai trò không hợp lệ...")` | **X** | | | | | | | | | |
| Ném `BadRequestException("Họ tên không được để trống")` | | **X** | | | | | | | | |
| Ném `BadRequestException("Định dạng email không hợp lệ")` | | | **X** | | | | | | | |
| Ném `BadRequestException("Email đã được sử dụng")` | | | | **X** | | | | | | |
| Ném `BadRequestException("Mật khẩu không được để trống")` | | | | | **X** | | | | | |
| Ném `BadRequestException("Mật khẩu phải có độ dài tối thiểu 6 ký tự")` | | | | | | **X** | | | | |
| Ném `BadRequestException("Số điện thoại chỉ được chứa các chữ số")` | | | | | | | **X** | | | |
| Ném `BadRequestException("Số điện thoại phải bao gồm đúng 10 chữ số")` | | | | | | | | **X** | | |
| Ném `BadRequestException("Số điện thoại phải bắt đầu bằng chữ số 0...")` | | | | | | | | | **X** | |
| Mã hóa mật khẩu, gán `isActive = true`, lưu DB, trả về `StaffResponse` | | | | | | | | | | **X** |

## Ghi chú rút gọn
- Thứ tự kiểm tra diễn ra tuần tự (fail-fast): Vi phạm điều kiện nào sẽ lập tức ném lỗi tương ứng và dừng luồng xử lý, tránh truy vấn cơ sở dữ liệu không cần thiết.
- R10 là trường hợp thành công khi tất cả các điều kiện ràng buộc đều thỏa mãn (Pass).
