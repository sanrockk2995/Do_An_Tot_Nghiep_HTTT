# Bảng quyết định: `BangLuongService.update(userId, thang, nam, request)`

## Mô tả chức năng
Quản trị viên (ADMIN) hoặc Kế toán (ACCOUNTANT) cập nhật bảng lương cho nhân viên theo tháng/năm: điều chỉnh hệ số lương (0-20), phụ cấp (>= 0), tiền thưởng (>= 0), khấu trừ (>= 0).

## Bảng quyết định (Decision Table)

| Điều kiện / Tiêu chí | R1 (Tháng/Năm không hợp lệ hoặc tương lai) | R2 (Không tìm thấy nhân viên) | R3 (Hệ số lương âm hoặc > 20) | R4 (Phụ cấp/Thưởng/Khấu trừ âm) | R5 (Cập nhật hợp lệ) |
|---|---|---|---|---|---|
| **C1: Tháng (1-12), Năm (>= 2000) và <= Tháng hiện tại** | F | T | T | T | T |
| **C2: Nhân viên tồn tại theo `userId`** | - | F | T | T | T |
| **C3: `heSo != null` và `(heSo < 0 || heSo > 20)`** | - | - | T | F | F |
| **C4: `phuCap < 0` HOẶC `thuong < 0` HOẶC `khauTru < 0`** | - | - | - | T | F |
| **Hành động / Kết quả** | | | | | |
| Ném `BadRequestException` về thời gian | **X** | | | | |
| Ném `ResourceNotFoundException("Không tìm thấy nhân viên...")` | | **X** | | | |
| Ném `BadRequestException("Hệ số phải trong khoảng 0 đến 20")` | | | **X** | | |
| Ném `BadRequestException("... không được âm")` | | | | **X** | |
| Cập nhật hệ số, tiền thưởng, phụ cấp, lưu DB và trả về `BangLuongResponse` | | | | | **X** |

## Ghi chú rút gọn
- Khi C1 hoặc C2 hoặc C3 vi phạm, hệ thống ném ngoại lệ dừng thực thi trước khi lưu vào cơ sở dữ liệu.
