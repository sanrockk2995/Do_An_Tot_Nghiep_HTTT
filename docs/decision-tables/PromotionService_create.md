# Bảng quyết định: `PromotionService.create(OtherDtos.PromotionRequest request)`

## Mô tả chức năng
Quản trị viên (ADMIN) tạo chương trình khuyến mại / mã giảm giá. Hệ thống kiểm tra tính hợp lệ của loại giảm giá (`PERCENT` từ 1-100%, `FIXED_AMOUNT` > 0), thời hạn áp dụng, phạm vi sản phẩm áp dụng và chống trùng lặp mã code.

## Bảng quyết định (Decision Table)

| Điều kiện / Tiêu chí | R1 (Giá trị giảm không hợp lệ) | R2 (Ngày kết thúc <= ngày bắt đầu) | R3 (Không chọn sản phẩm khi applyToAllProducts=false) | R4 (Mã giảm giá đã tồn tại) | R5 (Tạo thành công) |
|---|---|---|---|---|---|
| **C1: Loại & giá trị giảm hợp lệ (PERCENT: 1-100; FIXED: > 0)** | F | T | T | T | T |
| **C2: `endDate != null` và `endDate.isAfter(startDate)`** | - | F | T | T | T |
| **C3: `applyToAllProducts == true` HOẶC có `productIds` hợp lệ** | - | - | F | T | T |
| **C4: Mã giảm giá chưa tồn tại (`!existsByCodeIgnoreCase`)** | - | - | - | F | T |
| **Hành động / Kết quả** | | | | | |
| Ném `BadRequestException` về giá trị giảm | **X** | | | | |
| Ném `BadRequestException("Ngày kết thúc phải sau ngày bắt đầu")` | | **X** | | | |
| Ném `BadRequestException("Vui lòng chọn ít nhất một sản phẩm...")` | | | **X** | | |
| Ném `BadRequestException("Mã giảm giá '...' đã tồn tại")` | | | | **X** | |
| Viết hoa code, lưu Promotion vào DB, trả về `PromotionResponse` | | | | | **X** |

## Ghi chú rút gọn
- Khi các điều kiện trước vi phạm (C1, C2, C3), hàm `validateRequest()` ngắt kiểm tra và ném lỗi ngay trước khi truy vấn cơ sở dữ liệu kiểm tra mã trùng (C4).
