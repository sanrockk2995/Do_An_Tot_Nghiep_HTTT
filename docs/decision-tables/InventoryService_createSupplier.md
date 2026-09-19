# Bảng quyết định: `InventoryService.createSupplier(Supplier supplier)`

## Mô tả chức năng
Quản trị viên (ADMIN) hoặc Nhân viên kho thêm mới nhà cung cấp vào hệ thống Routine. 
Hệ thống tiến hành xác thực dữ liệu đầu vào:
- Đối tượng supplier không được null.
- Mã nhà cung cấp (`maNcc`): bắt buộc, không được để trống, không được trùng lặp trong DB.
- Tên nhà cung cấp (`tenNcc`): bắt buộc, không được để trống.
- Số điện thoại (`soDienThoai`): chỉ được nhập dạng số, đúng 10 chữ số, bắt đầu bằng 0.
- Email (`email`): nếu có nhập phải đúng định dạng email hợp lệ.
- Trạng thái (`trangThai`): nếu chưa truyền thì mặc định gán `"ACTIVE"`.

## Bảng quyết định (Decision Table)

| Điều kiện / Tiêu chí | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | R10 | R11 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **C1: Đối tượng supplier != null** | **F** | T | T | T | T | T | T | T | T | T | T |
| **C2: `maNcc` không trống/blank** | - | **F** | T | T | T | T | T | T | T | T | T |
| **C3: `maNcc` chưa tồn tại trong DB** | - | - | **F** | T | T | T | T | T | T | T | T |
| **C4: `tenNcc` không trống/blank** | - | - | - | **F** | T | T | T | T | T | T | T |
| **C5: SĐT chỉ gồm các ký tự số (0-9)** | - | - | - | - | **F** | T | T | T | T | T | T |
| **C6: SĐT đúng độ dài 10 chữ số** | - | - | - | - | - | **F** | T | T | T | T | T |
| **C7: SĐT bắt đầu bằng chữ số 0** | - | - | - | - | - | - | **F** | T | T | T | T |
| **C8: Định dạng Email hợp lệ (nếu có)** | - | - | - | - | - | - | - | **F** | T | T | T |
| **C9: Trạng thái hợp lệ (nếu có)** | - | - | - | - | - | - | - | - | **F** | T | T |
| **C10: `trangThai` đã được truyền vào** | - | - | - | - | - | - | - | - | - | **F** | **T** |
| **Hành động / Kết quả** | | | | | | | | | | | |
| Ném `BadRequestException("Thông tin nhà cung cấp không được để trống")` | **X** | | | | | | | | | | |
| Ném `BadRequestException("Mã nhà cung cấp không được để trống")` | | **X** | | | | | | | | | |
| Ném `BadRequestException("Mã nhà cung cấp đã tồn tại: ...")` | | | **X** | | | | | | | | |
| Ném `BadRequestException("Tên nhà cung cấp không được để trống")` | | | | **X** | | | | | | | |
| Ném `BadRequestException("Số điện thoại chỉ được chứa các chữ số")` | | | | | **X** | | | | | | |
| Ném `BadRequestException("Số điện thoại phải bao gồm đúng 10 chữ số")` | | | | | | **X** | | | | | |
| Ném `BadRequestException("Số điện thoại phải bắt đầu bằng chữ số 0...")` | | | | | | | **X** | | | | |
| Ném `BadRequestException("Định dạng email không hợp lệ")` | | | | | | | | **X** | | | |
| Ném `BadRequestException("Trạng thái nhà cung cấp không hợp lệ")` | | | | | | | | | **X** | | |
| Gán `trangThai = "ACTIVE"`, lưu DB thành công | | | | | | | | | | **X** | |
| Giữ nguyên `trangThai`, lưu DB thành công | | | | | | | | | | | **X** |

## Ghi chú rút gọn
- R1 đến R9 xử lý các trường hợp vi phạm tính hợp lệ của dữ liệu đầu vào theo cơ chế fail-fast.
- R10 là trường hợp tạo mới thành công nhưng không truyền `trangThai` -> hệ thống tự động gán giá trị mặc định là `"ACTIVE"`.
- R11 là trường hợp tạo mới thành công khi truyền đầy đủ thông tin hợp lệ bao gồm trạng thái xác định.
