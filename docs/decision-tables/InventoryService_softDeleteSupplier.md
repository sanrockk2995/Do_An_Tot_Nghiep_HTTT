# Bảng quyết định: `InventoryService.softDeleteSupplier(Long id)`

## Mô tả chức năng
Quản trị viên (ADMIN) vô hiệu hoá (xoá mềm) nhà cung cấp để không hiển thị khi tạo phiếu nhập kho mới, nhưng vẫn giữ nguyên dữ liệu và lịch sử phiếu nhập kho đã phát sinh.

## Bảng quyết định (Decision Table)

| Điều kiện / Tiêu chí | R1 (Nhà cung cấp không tồn tại) | R2 (Vô hiệu hoá thành công) |
|---|---|---|
| **C1: Nhà cung cấp tồn tại theo `id`** | F | T |
| **Hành động / Kết quả** | | |
| Ném `ResourceNotFoundException("Không tìm thấy nhà cung cấp #" + id)` | **X** | |
| Cập nhật `trangThai = "INACTIVE"`, lưu vào DB | | **X** |
