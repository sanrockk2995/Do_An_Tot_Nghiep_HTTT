# Bảng quyết định: `CategoryService.update(Long id, OtherDtos.CategoryRequest request)`

## Mô tả chức năng
Quản trị viên (ADMIN) cập nhật thông tin danh mục sản phẩm.

## Bảng quyết định (Decision Table)

| Điều kiện / Tiêu chí | R1 (Danh mục không tồn tại) | R2 (Cập nhật đầy đủ kể cả displayOrder và isActive) | R3 (Không cập nhật displayOrder và isActive) |
|---|---|---|---|
| **C1: Category tồn tại theo id** | F | T | T |
| **C2: `request.getDisplayOrder() != null`** | - | T | F |
| **C3: `request.getIsActive() != null`** | - | T | F |
| **Hành động / Kết quả** | | | |
| Ném `ResourceNotFoundException("Không tìm thấy danh mục...")` | **X** | | |
| Cập nhật `name`, `description`, `icon` | | **X** | **X** |
| Cập nhật `displayOrder` mới | | **X** | |
| Giữ nguyên `displayOrder` cũ | | | **X** |
| Cập nhật `isActive` mới | | **X** | |
| Giữ nguyên `isActive` cũ | | | **X** |
| Lưu và trả về `CategoryResponse` | | **X** | **X** |

## Ghi chú rút gọn
- Khi C1 = F (không tìm thấy ID), hệ thống ném exception ngay lập tức.
