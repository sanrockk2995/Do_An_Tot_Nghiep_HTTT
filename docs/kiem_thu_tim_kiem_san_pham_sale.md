# KIỂM THỬ CHỨC NĂNG TÌM KIẾM SẢN PHẨM CỦA SALE & QUẢN LÝ (TRUY VẤN SẢN PHẨM & POS)

## Mô tả chức năng

Chức năng cho phép người dùng (Nhân viên bán hàng - `SALES_STAFF`, Quản lý - `ADMIN`) tra cứu, tìm kiếm sản phẩm trong hệ thống theo các tiêu chí như tên sản phẩm, mã sản phẩm hoặc danh mục. Nhân viên có thể tìm kiếm nhanh tại chức năng chuyên biệt **"Truy vấn sản phẩm"** (`/pos/products`) hoặc tại quầy thu ngân **"Bán hàng tại quầy"** (`/pos`) để kiểm tra giá bán, tồn kho thực tế, màu sắc, kích thước và tư vấn sản phẩm cho khách hàng.

Hệ thống triển khai cơ chế kiểm soát dữ liệu đầu vào hai lớp (Client-side & Server-side) phòng chống triệt để các lỗ hổng bảo mật như SQL Injection, Cross-Site Scripting (XSS), ký tự đặc biệt nguy hại và sai định dạng.

Hệ thống xử lý chuẩn hóa theo đúng đặc tả nghiệp vụ:
- **Luồng chính:** Hệ thống xử lý yêu cầu và hiển thị danh sách sản phẩm phù hợp với tiêu chí tìm kiếm.
- **Luồng phụ 1 (Không có kết quả):** Không tìm thấy sản phẩm → Hệ thống thông báo: `"Không tìm thấy sản phẩm phù hợp"`.
- **Luồng phụ 2 (Bỏ trống tiêu chí):** Người dùng bỏ trống trường tìm kiếm (không nhập tên/mã và không chọn danh mục) nhưng bấm "Tìm kiếm" → Hệ thống yêu cầu: `"Hệ thống yêu cầu nhập ít nhất một tiêu chí"`.
- **Luồng phụ bổ sung (Thông tin không hợp lệ):** Nếu thông tin nhập vào chứa mã độc SQL, XSS, ký tự cấm hoặc vượt quá 100 ký tự → Hệ thống hiển thị: `"Thông tin nhập vào không hợp lệ (...). Hệ thống yêu cầu người dùng nhập lại đúng thông tin."`.

---

## Đặc tả chức năng

### Tên UC
Tìm kiếm sản phẩm

### Actor
Nhân viên bán hàng, quản lý

### Mô tả
Cho phép người dùng tìm kiếm sản phẩm trong hệ thống theo các tiêu chí như tên sản phẩm, mã sản phẩm hoặc danh mục.

### Tiền điều kiện
Người dùng đã đăng nhập vào hệ thống và chọn chức năng **“Truy vấn sản phẩm”** (đường dẫn `/pos/products` cho Nhân viên bán hàng hoặc `/admin/products` cho Quản lý).

### Luồng chính
1. Hệ thống hiển thị giao diện tìm kiếm sản phẩm (hỗ trợ nhập tên, mã sản phẩm, từ khóa liên quan hoặc chọn danh mục).
2. Người dùng nhập thông tin tìm kiếm (tên, mã hoặc từ khóa liên quan, hoặc chọn danh mục).
3. Người dùng chọn **“Tìm kiếm”** (nhấn nút "Tìm kiếm" hoặc phím Enter).
4. Hệ thống kiểm tra dữ liệu đầu vào, xử lý yêu cầu và hiển thị danh sách sản phẩm phù hợp với tiêu chí tìm kiếm (gồm: Mã SP, Tên sản phẩm, Danh mục, Giá bán, Tồn kho, Trạng thái, Biến thể kích thước/màu sắc).

### Luồng phụ
* **Luồng phụ 1 - Không tìm thấy sản phẩm:**  
  Nếu người dùng nhập tiêu chí tìm kiếm hợp lệ nhưng không có sản phẩm nào trong hệ thống khớp với thông tin đã chọn/nhập:
  - Hệ thống thông báo: **“Không tìm thấy sản phẩm phù hợp”** (hiển thị banner cảnh báo và thông báo tại bảng danh sách).
* **Luồng phụ 2 - Bỏ trống trường tìm kiếm:**  
  Nếu người dùng bỏ trống trường tìm kiếm (không nhập tên/mã sản phẩm và không chọn danh mục) nhưng bấm nút **“Tìm kiếm”**:
  - Hệ thống từ chối gửi yêu cầu và thông báo yêu cầu: **“Hệ thống yêu cầu nhập ít nhất một tiêu chí”**.
* **Luồng phụ 3 - Thông tin nhập vào không hợp lệ / chứa mã độc:**  
  Nếu người dùng nhập từ khóa chứa mã độc SQL Injection (`'`, `"`, `;`, `--`, `/*`, `UNION`, `SELECT`, `DROP`), thẻ Script XSS (`<script>`), ký tự đặc biệt nguy hại, hoặc độ dài vượt quá 100 ký tự:
  - Hệ thống chặn gửi yêu cầu và thông báo: **“Thông tin nhập vào không hợp lệ (...). Hệ thống yêu cầu người dùng nhập lại đúng thông tin.”**
* **Luồng phụ 4 - Xóa tiêu chí tìm kiếm:**  
  Khi người dùng chọn nút **“Xóa tìm kiếm”**:
  - Hệ thống xóa trắng ô nhập từ khóa, đưa danh mục về "Tất cả danh mục", xóa toàn bộ thông báo lỗi và tải lại danh sách sản phẩm mặc định ban đầu.

### Hậu điều kiện
Danh sách sản phẩm thỏa mãn tiêu chí tìm kiếm được hiển thị trên bảng dữ liệu. Nhân viên có thể nhấn "Chi tiết" để xem toàn bộ biến thể kích thước, màu sắc và số lượng tồn kho từng loại.

---

## Ký hiệu quy ước:

- **T (True):** Thỏa mãn điều kiện / Có chọn hoặc nhập
- **F (False):** Không thỏa mãn / Để trống / Vi phạm điều kiện
- **- :** Không xét đến (bỏ qua điều kiện này)

---

## Bảng quyết định (Decision Table):

| Điều kiện | TH1 | TH2 | TH3 | TH4 | TH5 | TH6 | TH7 | TH8 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Có nhập từ khóa (tên/mã SP) | F | F | T | T | T | T | T | T |
| Có chọn Danh mục | F | T | - | - | - | - | - | - |
| Độ dài từ khóa <= 100 ký tự | - | - | F | T | T | T | T | T |
| Không chứa mã độc SQLi / Script XSS | - | - | - | F | T | T | T | T |
| Ký tự hợp lệ (Unicode, số, khoảng trắng, `._-+/,#`) | - | - | - | - | F | T | T | T |
| Có sản phẩm khớp tiêu chí trong CSDL | - | - | - | - | - | F | T | T |
| **Hành động (Actions)** | | | | | | | | |
| **Luồng phụ 2:** Báo lỗi `"Hệ thống yêu cầu nhập ít nhất một tiêu chí"` | X | | | | | | | |
| Báo lỗi: "Thông tin tìm kiếm không hợp lệ (độ dài vượt quá 100 ký tự)..." | | | X | | | | | |
| Báo lỗi: "Thông tin nhập vào không hợp lệ (chứa ký tự đặc biệt hoặc mã độc SQL)..." | | | | X | | | | |
| Báo lỗi: "Thông tin nhập vào không hợp lệ (sai định dạng hoặc chứa ký tự đặc biệt)..." | | | | | X | | | |
| **Luồng phụ 1:** Thông báo `"Không tìm thấy sản phẩm phù hợp"` | | | | | | X | | |
| **Luồng chính:** Hiển thị danh sách sản phẩm phù hợp theo Danh mục | | X | | | | | | |
| **Luồng chính:** Hiển thị danh sách sản phẩm phù hợp theo Tên / Mã SP | | | | | | | X | |
| **Luồng chính:** Hiển thị danh sách kết hợp Tên/Mã + Danh mục | | | | | | | | X |

---

## Bảng Test Case:

| TC ID | Nhóm kiểm thử | Dữ liệu nhập | Bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **TC01** | **[Tiền điều kiện]** | Đăng nhập tài khoản `sales1` (Sale) | 1. Đăng nhập hệ thống với quyền NV bán hàng<br>2. Quan sát menu thanh điều hướng (sidebar)<br>3. Chọn menu "Truy vấn sản phẩm" | 1. Menu hiển thị đúng nhãn `"Truy vấn sản phẩm"`<br>2. Chuyển đến URL `/pos/products`<br>3. Tiêu đề trang hiển thị `"Truy vấn sản phẩm"` |
| **TC02** | **[Luồng chính]** Tìm kiếm theo Tên sản phẩm đầy đủ | Từ khóa: `"Áo Sơ Mi Oxford Dài Tay"` | 1. Nhập `"Áo Sơ Mi Oxford Dài Tay"`<br>2. Nhấn nút "Tìm kiếm" | Hiển thị danh sách sản phẩm có tên khớp, hiển thị đầy đủ mã SP, danh mục, giá bán, số lượng tồn kho |
| **TC03** | **[Luồng chính]** Tìm kiếm theo Tên sản phẩm không dấu | Từ khóa: `"Ao So Mi Oxford"` | 1. Nhập `"Ao So Mi Oxford"`<br>2. Nhấn nút "Tìm kiếm" | Hiển thị các sản phẩm áo sơ mi Oxford tương ứng trong hệ thống |
| **TC04** | **[Luồng chính]** Tìm kiếm theo một phần tên sản phẩm | Từ khóa: `"Polo"` | 1. Nhập `"Polo"`<br>2. Nhấn nút "Tìm kiếm" | Hiển thị danh sách tất cả sản phẩm có chứa từ "Polo" trong tên |
| **TC05** | **[Luồng chính]** Tìm kiếm theo Mã sản phẩm chính xác | Từ khóa: `"ASM001"` | 1. Nhập mã `"ASM001"`<br>2. Nhấn nút "Tìm kiếm" | Hiển thị đúng duy nhất sản phẩm có mã "ASM001" |
| **TC06** | **[Luồng chính]** Tìm kiếm chỉ theo Danh mục | Từ khóa: Trống<br>Danh mục: `"Áo sơ mi"` | 1. Để trống ô từ khóa<br>2. Chọn danh mục `"Áo sơ mi"`<br>3. Nhấn nút "Tìm kiếm" | Hiển thị tất cả sản phẩm thuộc danh mục "Áo sơ mi" |
| **TC07** | **[Luồng chính]** Tìm kiếm kết hợp Tên/Mã và Danh mục | Từ khóa: `"Slimfit"`<br>Danh mục: `"Quần Jeans"` | 1. Nhập `"Slimfit"` vào ô từ khóa<br>2. Chọn danh mục `"Quần Jeans"`<br>3. Nhấn nút "Tìm kiếm" | Chỉ hiển thị các sản phẩm vừa có tên/mã chứa "Slimfit" vừa thuộc danh mục "Quần Jeans" |
| **TC08** | **[Luồng chính]** Tìm kiếm sản phẩm tại quầy POS | Từ khóa: `"Polo"` tại màn hình `/pos` | 1. Truy cập `/pos`<br>2. Nhập `"Polo"` vào ô tìm kiếm sản phẩm<br>3. Nhấn "Tìm" hoặc phím Enter | Lưới sản phẩm POS lọc ra các sản phẩm Polo đang kinh doanh (`ACTIVE`) để thêm vào giỏ hàng |
| **TC09** | **[Luồng chính]** Xóa tiêu chí tìm kiếm | Đang tìm kiếm `"Polo"` | 1. Nhấn nút "Xóa tìm kiếm"<br>2. Quan sát giao diện | Ô từ khóa được xóa trắng, danh mục về mặc định, hệ thống tải lại toàn bộ danh sách sản phẩm |
| **TC10** | **[Luồng phụ 1]** Tìm kiếm từ khóa không tồn tại | Từ khóa: `"Sản Phẩm Không Tồn Tại 99999"` | 1. Nhập từ khóa không có trong hệ thống<br>2. Nhấn nút "Tìm kiếm" | Hệ thống hiển thị thông báo cảnh báo: `"Không tìm thấy sản phẩm phù hợp"` và bảng hiển thị `"Không tìm thấy sản phẩm phù hợp"` |
| **TC11** | **[Luồng phụ 1]** Tìm kiếm theo Mã SP không tồn tại | Từ khóa: `"SP_KHONG_CO_TRONG_KHO_123"` | 1. Nhập mã không có trong hệ thống<br>2. Nhấn nút "Tìm kiếm" | Hệ thống thông báo: `"Không tìm thấy sản phẩm phù hợp"` |
| **TC12** | **[Luồng phụ 1]** Tìm kiếm tại POS không có kết quả | Từ khóa: `"XYZ9999"` tại `/pos` | 1. Nhập `"XYZ9999"` vào ô tìm kiếm POS<br>2. Nhấn "Tìm" | Hệ thống toast thông báo `"Không tìm thấy sản phẩm phù hợp"` và hiển thị chữ `"Không tìm thấy sản phẩm phù hợp."` |
| **TC13** | **[Luồng phụ 2]** Bỏ trống toàn bộ tiêu chí tìm kiếm | Từ khóa: Trống<br>Danh mục: `"Tất cả danh mục"` | 1. Để trống ô từ khóa và không chọn danh mục<br>2. Nhấn nút "Tìm kiếm" | Hệ thống chặn gọi API và hiển thị thông báo lỗi: `"Hệ thống yêu cầu nhập ít nhất một tiêu chí"` |
| **TC14** | **[Luồng phụ 2]** Nhập toàn khoảng trắng | Từ khóa: `"     "` (5 khoảng trắng)<br>Danh mục: Trống | 1. Nhập toàn dấu cách<br>2. Nhấn nút "Tìm kiếm" | Hệ thống cắt tỉa chuỗi rỗng và hiển thị: `"Hệ thống yêu cầu nhập ít nhất một tiêu chí"` |
| **TC15** | **[Bảo mật]** Nhập mã độc SQL Injection dạng nháy đơn | Từ khóa: `' OR '1'='1` | 1. Nhập `' OR '1'='1`<br>2. Nhấn nút "Tìm kiếm" | Hệ thống chặn và báo lỗi: `"Thông tin nhập vào không hợp lệ (chứa ký tự đặc biệt hoặc mã độc SQL). Hệ thống yêu cầu người dùng nhập lại đúng thông tin."` |
| **TC16** | **[Bảo mật]** Nhập mã độc SQL Injection dạng lệnh DROP/UNION | Từ khóa: `ao'; DROP TABLE products;--` | 1. Nhập lệnh SQL độc hại<br>2. Nhấn nút "Tìm kiếm" | Hệ thống chặn và báo lỗi: `"Thông tin nhập vào không hợp lệ (chứa ký tự đặc biệt hoặc mã độc SQL). Hệ thống yêu cầu người dùng nhập lại đúng thông tin."` |
| **TC17** | **[Bảo mật]** Nhập mã Script XSS | Từ khóa: `<script>alert('hack')</script>` | 1. Nhập thẻ script<br>2. Nhấn nút "Tìm kiếm" | Hệ thống chặn và báo lỗi: `"Thông tin nhập vào không hợp lệ (chứa ký tự đặc biệt hoặc mã độc SQL). Hệ thống yêu cầu người dùng nhập lại đúng thông tin."` |
| **TC18** | **[Bảo mật]** Nhập chuỗi độ dài vượt quá 100 ký tự | Từ khóa: 110 ký tự liên tiếp | 1. Nhập chuỗi dài hơn 100 ký tự<br>2. Nhấn nút "Tìm kiếm" | Hệ thống báo lỗi: `"Thông tin tìm kiếm không hợp lệ (độ dài vượt quá 100 ký tự). Hệ thống yêu cầu người dùng nhập lại đúng thông tin."` |
| **TC19** | **[Bảo mật]** Nhập ký tự cấm nguy hại | Từ khóa: `Áo sơ mi @@@ $$$ %%% ^^^` | 1. Nhập các ký tự đặc biệt không được phép<br>2. Nhấn nút "Tìm kiếm" | Hệ thống báo lỗi: `"Thông tin nhập vào không hợp lệ (sai định dạng hoặc chứa ký tự đặc biệt). Hệ thống yêu cầu người dùng nhập lại đúng thông tin."` |
| **TC20** | **[Bảo mật Server-side]** Kiểm tra phòng vệ API trực tiếp | Gọi API `GET /api/v1/admin/products?q=' OR 1=1--` | 1. Gửi request trực tiếp đến API với query độc hại | Server ném `BadRequestException`, trả về HTTP 400 Bad Request kèm message `"Thông tin nhập vào không hợp lệ (chứa ký tự đặc biệt hoặc mã độc SQL). Hệ thống yêu cầu người dùng nhập lại đúng thông tin."` |
| **TC21** | **[Bảo mật Server-side]** Kiểm tra phòng vệ API với từ khóa > 100 ký tự | Gọi API với param `q` dài 110 ký tự | 1. Gửi request trực tiếp đến API | Server trả về HTTP 400 Bad Request kèm message `"Thông tin tìm kiếm không hợp lệ (độ dài tối đa 100 ký tự). Hệ thống yêu cầu người dùng nhập lại đúng thông tin."` |
