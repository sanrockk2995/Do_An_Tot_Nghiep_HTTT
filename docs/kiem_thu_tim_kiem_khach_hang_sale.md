# KIỂM THỬ CHỨC NĂNG TÌM KIẾM KHÁCH HÀNG CỦA SALE (POS & QUẢN LÝ KHÁCH HÀNG)

## Mô tả chức năng

Chức năng cho phép người dùng (Nhân viên bán hàng - `SALES_STAFF`, Quản lý cửa hàng) tìm kiếm thông tin khách hàng trong hệ thống tại quầy thu ngân (POS) hoặc tại danh mục quản lý khách hàng (`/pos/customers`). Nhân viên có thể tìm kiếm nhanh theo Họ tên, Số điện thoại hoặc Email để áp dụng tích điểm thưởng, chiết khấu hạng thành viên (REGULAR, SILVER, GOLD, VIP) và lưu thông tin vào hóa đơn bán lẻ tại quầy.

Hệ thống triển khai cơ chế kiểm soát đầu vào hai lớp (Client-side & Server-side) phòng chống triệt để các lỗ hổng bảo mật như SQL Injection, Cross-Site Scripting (XSS), ký tự độc hại và sai lệch định dạng.

Hệ thống xử lý chuẩn hóa theo đúng 2 luồng phụ nghiệp vụ:
- **Luồng phụ 1 (Không có kết quả):** Nếu không có khách hàng nào khớp với tiêu chí tìm kiếm, hệ thống sẽ thông báo: `"Không tìm thấy khách hàng"`.
- **Luồng phụ 2 (Thông tin không hợp lệ):** Nếu thông tin nhập vào không hợp lệ (ví dụ: sai định dạng, mã độc SQL, ký tự cấm,...), hệ thống sẽ từ chối truy vấn và hiển thị thông báo: `"Hệ thống yêu cầu người dùng nhập lại đúng thông tin"`.

---

## Đặc tả chức năng

### Tên chức năng

Tìm kiếm khách hàng (Phân hệ Bán hàng - Sale POS)

### Mô tả

Cho phép Nhân viên bán hàng (`SALES_STAFF`) hoặc Quản trị viên (`ADMIN`) tra cứu hồ sơ khách hàng theo một trong các tiêu chí: Họ tên, Số điện thoại hoặc Email. Hỗ trợ tìm kiếm thời gian thực (combobox dropdown tại POS) và tìm kiếm danh sách phân trang (tại trang Quản lý khách hàng).

### Tiền điều kiện

Nhân viên bán hàng hoặc Quản trị viên đã đăng nhập thành công vào hệ thống và đang ở màn hình:
1. Giao diện Bán hàng tại quầy POS (`/pos`).
2. Giao diện Tra cứu / Quản lý khách hàng bán hàng (`/pos/customers`).

### Luồng chính

1. Người dùng nhập tiêu chí tìm kiếm (Họ tên, Số điện thoại hoặc Email) vào ô tìm kiếm khách hàng.
2. Người dùng nhấn nút **"Tìm kiếm"** (hoặc gõ ký tự vào ô tìm kiếm nhanh tại quầy POS, hệ thống kích hoạt tìm kiếm tự động).
3. Hệ thống kiểm tra tính hợp lệ của dữ liệu đầu vào (kiểm tra độ dài <= 100 ký tự, kiểm tra mã độc SQL Injection, XSS, ký tự đặc biệt hợp lệ và định dạng email).
4. Dữ liệu hợp lệ, hệ thống gửi yêu cầu tra cứu và truy vấn CSDL tìm kiếm khách hàng tương ứng.
5. Hệ thống hiển thị danh sách các khách hàng thỏa mãn tiêu chí tìm kiếm (gồm: Họ tên, Số điện thoại, Email, Hạng thành viên, Tổng chi tiêu, Tổng đơn hàng).
6. Người dùng chọn khách hàng mong muốn để đưa vào hóa đơn bán lẻ POS hoặc xem chi tiết lịch sử mua sắm.

### Luồng phụ

* **Luồng phụ 1 - Không tìm thấy khách hàng khớp tiêu chí:**  
  Nếu người dùng nhập tiêu chí tìm kiếm hợp lệ nhưng không có khách hàng nào trong hệ thống khớp với thông tin đã nhập:
  - Hệ thống hiển thị thông báo: **"Không tìm thấy khách hàng"**.
  - Tại giao diện POS, hệ thống hiển thị kèm nút gợi ý `"+ Tạo mới khách này"` để nhân viên có thể tạo nhanh hồ sơ cho khách hàng mới ngay tại quầy.
* **Luồng phụ 2 - Thông tin nhập vào không hợp lệ:**  
  Nếu thông tin nhập vào không hợp lệ (ví dụ: chuỗi chứa mã độc SQL Injection `'`, `"`, `;`, `--`, `/*`, từ khóa `UNION`, `SELECT`, `DROP`; hoặc chứa thẻ script XSS `<script>`; hoặc chứa ký tự đặc biệt ngoài danh mục cho phép; hoặc sai định dạng email `@` bắt đầu chuỗi, nhiều dấu `@`, chứa khoảng trắng; hoặc vượt quá 100 ký tự):
  - Hệ thống chặn gửi yêu cầu truy vấn đến CSDL.
  - Hệ thống hiển thị thông báo lỗi cụ thể: **"Thông tin nhập vào không hợp lệ (...). Hệ thống yêu cầu người dùng nhập lại đúng thông tin."**
  - Không hiển thị bất kỳ thông tin nhạy cảm hay lỗi cú pháp CSDL nào ra màn hình.
* **Luồng phụ 3 - Xóa tiêu chí tìm kiếm:**  
  Nếu người dùng nhấn nút `"Xóa tìm kiếm"` hoặc xóa trắng ô nhập liệu:
  - Hệ thống tự động đặt lại bộ lọc, xóa các thông báo lỗi và tải lại danh sách khách hàng mặc định ban đầu.

### Hậu điều kiện

Khách hàng được chọn thành công sẽ được gán vào đơn hàng tại quầy POS để tính điểm và chiết khấu, hoặc hiển thị kết quả lọc trên bảng danh sách khách hàng.

---

## Ký hiệu quy ước:

- **T (True):** Nhập đúng / Thỏa mãn điều kiện
- **F (False):** Nhập sai / Vi phạm điều kiện
- **- :** Không xét đến (bỏ qua điều kiện này)

---

## Bảng quyết định (Decision Table):

| Điều kiện | TH1 | TH2 | TH3 | TH4 | TH5 | TH6 | TH7 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Ô tìm kiếm có dữ liệu (không để trống) | F | T | T | T | T | T | T |
| Độ dài chuỗi <= 100 ký tự | - | F | T | T | T | T | T |
| Không chứa mã độc SQL Injection / Script XSS | - | - | F | T | T | T | T |
| Ký tự hợp lệ (Unicode, số, khoảng trắng, `@._-+/,`) | - | - | - | F | T | T | T |
| Đúng định dạng Email (nếu chuỗi có ký tự `@`) | - | - | - | - | F | T | T |
| Có dữ liệu khách hàng khớp trong CSDL | - | - | - | - | - | F | T |
| **Hành động (Actions)** | | | | | | | |
| Hiển thị danh sách khách hàng mặc định ban đầu | X | | | | | | |
| Báo lỗi: "Thông tin tìm kiếm không hợp lệ (độ dài vượt quá 100 ký tự). Hệ thống yêu cầu người dùng nhập lại đúng thông tin." | | X | | | | | |
| Báo lỗi: "Thông tin nhập vào không hợp lệ (chứa ký tự đặc biệt hoặc mã độc SQL). Hệ thống yêu cầu người dùng nhập lại đúng thông tin." | | | X | | | | |
| Báo lỗi: "Thông tin nhập vào không hợp lệ (sai định dạng hoặc chứa ký tự đặc biệt). Hệ thống yêu cầu người dùng nhập lại đúng thông tin." | | | | X | | | |
| Báo lỗi: "Thông tin nhập vào không hợp lệ (sai định dạng email). Hệ thống yêu cầu người dùng nhập lại đúng thông tin." | | | | | X | | |
| **Luồng phụ 1:** Thông báo `"Không tìm thấy khách hàng"` | | | | | | X | |
| **Luồng chính:** Hiển thị danh sách khách hàng thỏa mãn và cho phép chọn vào POS | | | | | | | X |

---

## Bảng Test Case:

| TC ID | Tên test case | Dữ liệu nhập | Bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **TC01** | **[Luồng chính]** Tìm kiếm thành công theo Họ tên đầy đủ | Tiêu chí: `"Nguyễn Văn An"` | 1. Nhập `"Nguyễn Văn An"` vào ô tìm kiếm<br>2. Nhấn nút "Tìm kiếm" (hoặc Enter) | Hiển thị danh sách khách hàng có tên "Nguyễn Văn An", thông tin SĐT, Email, Hạng thành viên |
| **TC02** | **[Luồng chính]** Tìm kiếm thành công theo Họ tên không dấu | Tiêu chí: `"Nguyen Van An"` | 1. Nhập `"Nguyen Van An"` vào ô tìm kiếm<br>2. Nhấn nút "Tìm kiếm" | Hiển thị khách hàng khớp tên tương ứng trong CSDL |
| **TC03** | **[Luồng chính]** Tìm kiếm thành công theo một phần Họ tên | Tiêu chí: `"Văn An"` | 1. Nhập `"Văn An"` vào ô tìm kiếm<br>2. Nhấn nút "Tìm kiếm" | Hiển thị tất cả khách hàng có chứa cụm "Văn An" |
| **TC04** | **[Luồng chính]** Tìm kiếm thành công theo Số điện thoại chính xác | Tiêu chí: `"0912345678"` | 1. Nhập SĐT `"0912345678"` vào ô tìm kiếm<br>2. Nhấn nút "Tìm kiếm" | Hiển thị đúng duy nhất khách hàng sở hữu SĐT "0912345678" |
| **TC05** | **[Luồng chính]** Tìm kiếm thành công theo vài số cuối SĐT | Tiêu chí: `"45678"` | 1. Nhập 5 số cuối `"45678"`<br>2. Nhấn nút "Tìm kiếm" | Hiển thị danh sách các khách hàng có SĐT chứa đuôi "45678" |
| **TC06** | **[Luồng chính]** Tìm kiếm thành công theo Email chính xác | Tiêu chí: `"customer@example.com"` | 1. Nhập email `"customer@example.com"`<br>2. Nhấn nút "Tìm kiếm" | Hiển thị khách hàng có địa chỉ email khớp |
| **TC07** | **[Luồng chính]** Tìm kiếm nhanh tại combobox POS và chọn khách | Tiêu chí: `"0987654321"` tại POS | 1. Gõ `"0987654321"` vào ô tìm kiếm POS<br>2. Dropdown gợi ý khách hàng<br>3. Click chọn khách hàng (hoặc ấn Enter) | Khách hàng được gắn vào đơn hàng POS, hiển thị tên, SĐT và nhãn Hạng thành viên |
| **TC08** | **[Luồng chính]** Xóa tiêu chí tìm kiếm quay về mặc định | Đang tìm kiếm `"Nguyễn Văn An"` | 1. Nhấn nút "Xóa tìm kiếm"<br>2. Quan sát bảng dữ liệu | Ô tìm kiếm được xóa trắng, hệ thống tải lại toàn bộ danh sách khách hàng ban đầu |
| **TC09** | **[Luồng phụ 1]** Tìm kiếm Họ tên không tồn tại | Tiêu chí: `"Khách Hàng Không Tồn Tại 9999"` | 1. Nhập họ tên không có trong DB<br>2. Nhấn nút "Tìm kiếm" | Hệ thống thông báo: `"Không tìm thấy khách hàng"` |
| **TC10** | **[Luồng phụ 1]** Tìm kiếm Số điện thoại chưa đăng ký | Tiêu chí: `"0999999999"` (chưa có trong DB) | 1. Nhập SĐT chưa có trong DB<br>2. Nhấn nút "Tìm kiếm" | Hệ thống thông báo: `"Không tìm thấy khách hàng"` |
| **TC11** | **[Luồng phụ 1]** Tìm kiếm tại POS không có kết quả -> Gợi ý tạo mới | Tiêu chí: `"0919888777"` tại quầy POS | 1. Gõ SĐT mới tại POS<br>2. Quan sát dropdown | Dropdown thông báo `"Không tìm thấy khách hàng"`, hiển thị nút `"+ Tạo mới khách này"` |
| **TC12** | **[Luồng phụ 1]** Nhấn nút tạo mới từ gợi ý POS | Tiêu chí: `"0919888777"` tại quầy POS | 1. Nhập từ khóa không có kết quả<br>2. Nhấn nút `"+ Tạo mới khách này"` | Mở modal "Thêm khách hàng mới", tự động điền sẵn SĐT "0919888777" vào form |
| **TC13** | **[Luồng phụ 2]** Nhập mã độc SQL Injection dạng dấu nháy đơn | Tiêu chí: `' OR '1'='1` | 1. Nhập `' OR '1'='1` vào ô tìm kiếm<br>2. Nhấn nút "Tìm kiếm" | Báo lỗi: `"Thông tin nhập vào không hợp lệ (chứa ký tự đặc biệt hoặc mã độc SQL). Hệ thống yêu cầu người dùng nhập lại đúng thông tin."` |
| **TC14** | **[Luồng phụ 2]** Nhập mã độc SQL Injection dạng lệnh UNION/DROP | Tiêu chí: `admin'; DROP TABLE customers;--` | 1. Nhập lệnh SQL độc hại<br>2. Nhấn nút "Tìm kiếm" | Báo lỗi: `"Thông tin nhập vào không hợp lệ (chứa ký tự đặc biệt hoặc mã độc SQL). Hệ thống yêu cầu người dùng nhập lại đúng thông tin."` (Chặn API) |
| **TC15** | **[Luồng phụ 2]** Nhập mã Script XSS | Tiêu chí: `<script>alert('xss')</script>` | 1. Nhập thẻ script độc hại<br>2. Nhấn nút "Tìm kiếm" | Báo lỗi: `"Thông tin nhập vào không hợp lệ (chứa ký tự đặc biệt hoặc mã độc SQL). Hệ thống yêu cầu người dùng nhập lại đúng thông tin."` |
| **TC16** | **[Luồng phụ 2]** Nhập chuỗi vượt quá 100 ký tự | Tiêu chí: Chuỗi 105 ký tự `"a".repeat(105)` | 1. Nhập chuỗi dài hơn 100 ký tự<br>2. Nhấn nút "Tìm kiếm" | Báo lỗi: `"Thông tin tìm kiếm không hợp lệ (độ dài vượt quá 100 ký tự). Hệ thống yêu cầu người dùng nhập lại đúng thông tin."` |
| **TC17** | **[Luồng phụ 2]** Nhập ký tự đặc biệt nguy hại ngoài danh mục | Tiêu chí: `Nguyễn Văn #$%^&*~` | 1. Nhập ký tự `# $ % ^ & * ~`<br>2. Nhấn nút "Tìm kiếm" | Báo lỗi: `"Thông tin nhập vào không hợp lệ (sai định dạng hoặc chứa ký tự đặc biệt). Hệ thống yêu cầu người dùng nhập lại đúng thông tin."` |
| **TC18** | **[Luồng phụ 2]** Tìm kiếm Email nhưng sai định dạng (nhiều dấu @) | Tiêu chí: `customer@@gmail.com` | 1. Nhập `customer@@gmail.com`<br>2. Nhấn nút "Tìm kiếm" | Báo lỗi: `"Thông tin nhập vào không hợp lệ (sai định dạng email). Hệ thống yêu cầu người dùng nhập lại đúng thông tin."` |
| **TC19** | **[Luồng phụ 2]** Tìm kiếm Email nhưng bắt đầu bằng @ | Tiêu chí: `@gmail.com` | 1. Nhập `@gmail.com`<br>2. Nhấn nút "Tìm kiếm" | Báo lỗi: `"Thông tin nhập vào không hợp lệ (sai định dạng email). Hệ thống yêu cầu người dùng nhập lại đúng thông tin."` |
| **TC20** | **[Luồng phụ 2]** Tìm kiếm Email nhưng chứa khoảng trắng | Tiêu chí: `user @gmail.com` | 1. Nhập `user @gmail.com`<br>2. Nhấn nút "Tìm kiếm" | Báo lỗi: `"Thông tin nhập vào không hợp lệ (sai định dạng email). Hệ thống yêu cầu người dùng nhập lại đúng thông tin."` |
| **TC21** | **[Luồng phụ 2]** Kiểm tra phòng vệ Server-side trực tiếp qua API | Gọi `GET /api/v1/customers?q=' OR 1=1--` | 1. Gửi request trực tiếp đến API với query độc hại | Server trả về mã HTTP 400 Bad Request, message: `"Thông tin nhập vào không hợp lệ (chứa ký tự đặc biệt hoặc mã độc SQL). Hệ thống yêu cầu người dùng nhập lại đúng thông tin."` |
