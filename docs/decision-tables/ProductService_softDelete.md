# Bảng quyết định: `ProductService.softDelete(Long id)`

## Mô tả chức năng
Quản trị viên (ADMIN) thực hiện xoá mềm sản phẩm (cập nhật trạng thái `status = "INACTIVE"`).

## Bảng quyết định (Decision Table)

| Điều kiện / Tiêu chí | R1 (Sản phẩm không tồn tại) | R2 (Xoá mềm thành công) |
|---|---|---|
| **C1: Product tồn tại theo id** | F | T |
| **Hành động / Kết quả** | | |
| Ném `ResourceNotFoundException("Không tìm thấy sản phẩm...")` | **X** | |
| Cập nhật `status = "INACTIVE"`, lưu Product vào DB | | **X** |
