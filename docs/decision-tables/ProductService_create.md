# Bảng quyết định: `ProductService.create(ProductDtos.ProductRequest request)`

## Mô tả chức năng
Quản trị viên (ADMIN) thêm mới sản phẩm vào hệ thống. Chức năng bao gồm kiểm tra danh mục tồn tại, kiểm tra tính duy nhất của từng cặp biến thể (size + color), tính toán tổng số lượng tồn kho (`stock`) dựa trên các biến thể con hoặc giá trị cơ sở, sinh mã SKU tự động nếu chưa được nhập.

## Bảng quyết định (Decision Table)

| Điều kiện / Tiêu chí | R1 (Danh mục không tồn tại) | R2 (Biến thể trùng cặp Size + Color) | R3 (Tạo thành công với danh sách biến thể đầy đủ) | R4 (Tạo sản phẩm không có biến thể, minStock null) |
|---|---|---|---|---|
| **C1: Category tồn tại theo categoryId** | F | T | T | T |
| **C2: Có cặp biến thể (Size + Color) trùng lặp** | - | T | F | F |
| **C3: Có danh sách biến thể (`variants` != null & not empty)** | - | - | T | F |
| **C4: `request.getMinStock() != null`** | - | - | T | F |
| **Hành động / Kết quả** | | | | |
| Ném `ResourceNotFoundException("Không tìm thấy danh mục...")` | **X** | | | |
| Ném `BadRequestException("Biến thể bị trùng (cặp size + màu phải khác nhau)")` | | **X** | | |
| Tính `stock` = Tổng tồn kho các biến thể | | | **X** | |
| Tính `stock` = Giá trị `request.getStock()` (hoặc 0) | | | | **X** |
| Gán `minStock` từ request | | | **X** | |
| Gán `minStock` mặc định = 10 | | | | **X** |
| Lưu Product với trạng thái `ACTIVE` | | | **X** | **X** |
| Lưu danh sách `ProductVariant`, tự sinh SKU cho variant nếu null | | | **X** | |
| Trả về `ProductResponse` | | | **X** | **X** |

## Ghi chú rút gọn
- Khi C1 = F (danh mục không tồn tại), hệ thống ngắt ngay lập tức, không kiểm tra biến thể.
- Khi C2 = T (trùng biến thể), hệ thống ném ngoại lệ 400 trước khi thực hiện thao tác lưu vào DB.
