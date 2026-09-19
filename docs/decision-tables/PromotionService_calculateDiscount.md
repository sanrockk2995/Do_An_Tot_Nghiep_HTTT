# Bảng quyết định: `PromotionService.calculateDiscount(Promotion p, BigDecimal subtotal)`

## Mô tả chức năng
Tính toán số tiền giảm giá thực tế cho đơn hàng dựa trên chính sách khuyến mại: tính theo phần trăm (kèm giới hạn trần `maxDiscountAmount` nếu có) hoặc số tiền cố định (`FIXED_AMOUNT`), đồng thời đảm bảo số tiền giảm không bao giờ vượt quá tổng giá trị đơn hàng (`subtotal`).

## Bảng quyết định (Decision Table)

| Điều kiện / Tiêu chí | R1 (PERCENT không vượt trần) | R2 (PERCENT vượt trần maxDiscountAmount) | R3 (FIXED_AMOUNT nhỏ hơn subtotal) | R4 (FIXED_AMOUNT lớn hơn subtotal) |
|---|---|---|---|---|
| **C1: Loại giảm giá** | `PERCENT` | `PERCENT` | `FIXED_AMOUNT` | `FIXED_AMOUNT` |
| **C2: Có `maxDiscountAmount` và tiền giảm vượt trần** | F | T | - | - |
| **C3: Tiền giảm tính ra > `subtotal`** | F | F | F | T |
| **Hành động / Kết quả** | | | | |
| Tiền giảm = `subtotal * discountValue / 100` | **X** | | | |
| Tiền giảm = `maxDiscountAmount` | | **X** | | |
| Tiền giảm = `discountValue` | | | **X** | |
| Tiền giảm bị chặn lại bằng đúng `subtotal` | | | | **X** |
| Làm tròn 2 chữ số thập phân (`HALF_UP`) | **X** | **X** | **X** | **X** |

## Ghi chú rút gọn
- Đối với `FIXED_AMOUNT`, `maxDiscountAmount` không áp dụng nên C2 bỏ qua.
