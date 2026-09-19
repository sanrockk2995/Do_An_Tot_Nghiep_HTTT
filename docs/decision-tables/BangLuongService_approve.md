# Bảng quyết định: `BangLuongService.approve(Long id)`

## Mô tả chức năng
Quản trị viên (ADMIN) hoặc Kế toán (ACCOUNTANT) phê duyệt (chốt) bảng lương cho nhân viên (cập nhật trạng thái `trangThai = "DA_DUYET"`).

## Bảng quyết định (Decision Table)

| Điều kiện / Tiêu chí | R1 (Không tìm thấy dòng lương) | R2 (Duyệt lương thành công) |
|---|---|---|
| **C1: Dòng lương tồn tại theo `id`** | F | T |
| **Hành động / Kết quả** | | |
| Ném `ResourceNotFoundException("Không tìm thấy dòng lương #" + id)` | **X** | |
| Gán `trangThai = "DA_DUYET"`, lưu DB và trả về `BangLuongResponse` | | **X** |
