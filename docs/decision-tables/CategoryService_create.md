# Bảng quyết định: `CategoryService.create(OtherDtos.CategoryRequest request)`

## Mô tả chức năng
Quản trị viên (ADMIN) tạo mới danh mục sản phẩm. Hệ thống chuẩn hóa slug từ tiếng Việt (hoặc dùng slug được cung cấp), kiểm tra trùng lặp slug trong DB, gán giá trị mặc định cho `displayOrder` và `isActive`.

## Bảng quyết định (Decision Table)

| Điều kiện / Tiêu chí | R1 (Slug đã tồn tại) | R2 (Tự sinh slug từ Name tiếng Việt, default fields) | R3 (Truyền slug sẵn và đầy đủ displayOrder, isActive) |
|---|---|---|---|
| **C1: Slug sau chuẩn hóa đã tồn tại trong DB** | T | F | F |
| **C2: `request.getSlug()` có giá trị** | - | F (null/blank) | T |
| **C3: `request.getDisplayOrder() != null`** | - | F (null) | T |
| **C4: `request.getIsActive() != null`** | - | F (null) | T |
| **Hành động / Kết quả** | | | |
| Ném `BadRequestException("Danh mục với slug '...' đã tồn tại")` | **X** | | |
| Tự sinh slug từ `name` (bỏ dấu tiếng Việt, lowercase, replace space bằng `-`) | | **X** | |
| Sử dụng slug truyền vào sau khi chuẩn hóa | | | **X** |
| Gán `displayOrder` mặc định = 0 | | **X** | |
| Gán `displayOrder` từ request | | | **X** |
| Gán `isActive` mặc định = true | | **X** | |
| Gán `isActive` từ request | | | **X** |
| Lưu Category vào DB và trả về `CategoryResponse` | | **X** | **X** |

## Ghi chú rút gọn
- Khi C1 = T (slug trùng), dừng ngay lập tức và ném lỗi 400.
