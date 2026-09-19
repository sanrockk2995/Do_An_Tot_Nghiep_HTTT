# Bảng quyết định: `CategoryService.softDelete(Long id)`

## Mô tả chức năng
Quản trị viên (ADMIN) thực hiện xoá mềm danh mục sản phẩm (chuyển cờ `isActive = false` thay vì xoá cứng khỏi cơ sở dữ liệu để bảo toàn tính toàn vẹn dữ liệu đơn hàng và lịch sử sản phẩm).

## Bảng quyết định (Decision Table)

| Điều kiện / Tiêu chí | R1 (Danh mục không tồn tại) | R2 (Xoá mềm thành công) |
|---|---|---|
| **C1: Category tồn tại theo id** | F | T |
| **Hành động / Kết quả** | | |
| Ném `ResourceNotFoundException("Không tìm thấy danh mục...")` | **X** | |
| Gán `isActive = false`, lưu Category vào DB | | **X** |
