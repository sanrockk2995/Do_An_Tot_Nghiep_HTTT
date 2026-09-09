# TÀI LIỆU KIỂM THỬ CÁC CHỨC NĂNG HỆ THỐNG QUẢN LÝ BÁN HÀNG ROUTINE
*(Dành cho Phân hệ Nhân viên Bán hàng - Sales Staff)*

---

## a. Kiểm thử chức năng Đăng nhập

### Mô tả chức năng Đăng nhập
* **Mục tiêu:** Cho phép nhân viên và quản lý xác thực danh tính để truy cập hệ thống quản lý bán hàng.
* **Dữ liệu đầu vào:** Email, Mật khẩu, Vai trò (Quản lý / Nhân viên bán hàng / Nhân viên kho / Kế toán).
* **Điều kiện bắt buộc:** Người dùng phải chọn đúng vai trò tương ứng với tài khoản đã được cấp.
* **Quy trình xử lý:**
  1. Nhập Email, Mật khẩu và chọn Vai trò.
  2. Hệ thống kiểm tra tính hợp lệ của Email và Mật khẩu.
  3. Hệ thống đối chiếu vai trò được chọn với vai trò thực tế của tài khoản trong cơ sở dữ liệu.
  4. Nếu hợp lệ, cấp quyền truy cập và chuyển hướng đến giao diện tương ứng với vai trò.
* **Kết quả:** Đăng nhập thành công và chuyển hướng đến dashboard theo vai trò, hoặc hiển thị thông báo lỗi cụ thể nếu thất bại.

### Ký hiệu quy ước
* **T (True):** Nhập đúng / hợp lệ
* **F (False):** Nhập sai / không hợp lệ
* **- :** Không xét đến / bỏ qua điều kiện này

### Bảng quyết định

| Điều kiện | TH1 | TH2 | TH3 | TH4 | TH5 | TH6 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Nhập đầy đủ thông tin | F | T | T | T | T | T |
| Email đúng định dạng | - | F | T | T | T | T |
| Mật khẩu hợp lệ (≥ 6 ký tự) | - | - | F | T | T | T |
| Email/Mật khẩu khớp tài khoản | - | - | - | F | T | T |
| Vai trò khớp với tài khoản | - | - | - | - | F | T |
| **Kết quả** | Báo thiếu thông tin | Báo Email sai định dạng | Báo MK không hợp lệ | Báo sai thông tin đăng nhập | Báo vai trò không khớp | Đăng nhập thành công |

### Bảng Test Case

| TC ID | Tên test case | Dữ liệu nhập | Bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **TC_AUTH01** | Đăng nhập thành công | Email đúng, MK đúng, vai trò đúng (Quản lý) | Chọn vai trò Quản lý, nhập đúng Email và MK, bấm "ĐĂNG NHẬP" | Đăng nhập thành công, chuyển hướng đến trang Quản trị (Dashboard) |
| **TC_AUTH02** | Email sai định dạng | Email sai cú pháp (vd: `adminroutine.vn`), MK hợp lệ, vai trò Quản lý | Nhập Email sai định dạng, nhập MK và chọn vai trò, bấm "ĐĂNG NHẬP" | Báo lỗi: *"Vui lòng nhập địa chỉ email hợp lệ"* |
| **TC_AUTH03** | Email để trống | Email trống, MK hợp lệ, vai trò Quản lý | Bỏ trống Email, nhập MK và chọn vai trò, bấm "ĐĂNG NHẬP" | Báo lỗi: *"Vui lòng điền đầy đủ email và mật khẩu"* |
| **TC_AUTH04** | Mật khẩu để trống | Email đúng, MK để trống, vai trò Quản lý | Nhập Email hợp lệ, bỏ trống MK, chọn vai trò, bấm "ĐĂNG NHẬP" | Báo lỗi: *"Vui lòng điền đầy đủ email và mật khẩu"* |
| **TC_AUTH05** | Mật khẩu quá ngắn | Email đúng, MK dưới 6 ký tự, vai trò đúng | Nhập MK ngắn, điền các trường còn lại hợp lệ, bấm "ĐĂNG NHẬP" | Báo lỗi: *"Mật khẩu phải có ít nhất 6 ký tự"* |
| **TC_AUTH06** | Sai mật khẩu đăng nhập | Email tồn tại nhưng MK sai, vai trò đúng | Nhập đúng Email, nhập sai MK, chọn vai trò đúng, bấm "ĐĂNG NHẬP" | Báo lỗi: *"Email hoặc mật khẩu hoặc vai trò không đúng"* |
| **TC_AUTH07** | Vai trò không khớp – Kế toán | Email & MK đúng của Quản lý, chọn vai trò Kế toán | Nhập đúng thông tin Quản lý, chọn vai trò Kế toán, bấm "ĐĂNG NHẬP" | Báo lỗi: *"Vai trò không khớp với tài khoản"* |
| **TC_AUTH08** | Vai trò không khớp – NV bán hàng | Email & MK đúng của Quản lý, chọn vai trò NV bán hàng | Nhập đúng thông tin Quản lý, chọn vai trò NV bán hàng, bấm "ĐĂNG NHẬP" | Báo lỗi: *"Vai trò không khớp với tài khoản"* |
| **TC_AUTH09** | Vai trò không khớp – NV kho | Email & MK đúng của Quản lý, chọn vai trò NV kho | Nhập đúng thông tin Quản lý, chọn vai trò NV kho, bấm "ĐĂNG NHẬP" | Báo lỗi: *"Vai trò không khớp với tài khoản"* |

---

## b. Kiểm thử chức năng Thêm khách hàng (Sales Staff)

### Mô tả chức năng Thêm khách hàng
* **Mục tiêu:** Cho phép nhân viên bán hàng (Sales Staff) tạo mới hồ sơ khách hàng ngay tại quầy POS hoặc màn hình Quản lý khách hàng để lưu trữ thông tin, quản lý lịch sử mua hàng, tích lũy doanh số và nâng hạng thành viên.
* **Dữ liệu đầu vào:**
  * Họ tên *(bắt buộc)*
  * Số điện thoại *(bắt buộc, 10 chữ số)*
  * Email *(tùy chọn)*
  * Địa chỉ *(tùy chọn)*
  * Tỉnh/Thành phố *(tùy chọn, chọn từ danh mục)*
  * Phường/Xã *(tùy chọn, chọn theo Tỉnh/Thành phố)*
* **Điều kiện bắt buộc:**
  * Họ tên và Số điện thoại không được để trống.
  * Số điện thoại phải đúng định dạng di động Việt Nam (gồm 10 chữ số, bắt đầu bằng `0` hoặc `+84`).
  * Nếu có nhập Email thì Email phải đúng định dạng chuẩn (`name@domain.ext`).
  * Số điện thoại không được trùng với khách hàng đã có trong hệ thống.
  * Email (nếu nhập) không được trùng với khách hàng đã có trong hệ thống.
* **Quy trình xử lý:**
  1. Tại màn hình Bán hàng POS, nhân viên bấm nút `+ THÊM KHÁCH MỚI` (hoặc nhấn `+ Thêm khách hàng` tại trang Khách hàng).
  2. Hệ thống hiển thị hộp thoại modal "Thêm khách hàng mới".
  3. Nhân viên nhập đầy đủ thông tin: Họ tên, Số điện thoại và các trường tùy chọn (Email, Địa chỉ, Tỉnh/TP, Phường/Xã).
  4. Nhân viên nhấn nút **"LƯU"**.
  5. Hệ thống kiểm tra dữ liệu đầu vào (tính bắt buộc, định dạng SĐT, định dạng Email).
  6. Hệ thống đối chiếu tính duy nhất của Số điện thoại và Email với cơ sở dữ liệu.
  7. Nếu hợp lệ: Hệ thống lưu khách hàng mới với hạng mặc định là `REGULAR` (Thành viên tiêu chuẩn), đóng modal, hiển thị thông báo thành công và tự động gán khách hàng này vào hóa đơn hiện tại.
  8. Nếu không hợp lệ: Giữ nguyên modal và hiển thị cảnh báo lỗi tương ứng để nhân viên sửa đổi.
* **Kết quả:** Khách hàng mới được thêm thành công vào cơ sở dữ liệu và tự động chọn vào hóa đơn POS, hoặc hiển thị thông báo lỗi cụ thể nếu thất bại.

### Ký hiệu quy ước
* **T (True):** Nhập đúng / hợp lệ / thỏa mãn điều kiện
* **F (False):** Nhập sai / không hợp lệ / vi phạm điều kiện
* **- :** Không xét đến / bỏ qua điều kiện này

### Bảng quyết định

| Điều kiện | TH1 | TH2 | TH3 | TH4 | TH5 | TH6 | TH7 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Nhập đầy đủ Họ tên & SĐT (bắt buộc) | F | T | T | T | T | T | T |
| SĐT đúng định dạng (10 chữ số, đầu 0/+84) | - | F | T | T | T | T | T |
| Email đúng định dạng (nếu có nhập) | - | - | F | T | T | T | T |
| SĐT chưa tồn tại trong hệ thống | - | - | - | F | T | T | T |
| Email chưa tồn tại trong hệ thống | - | - | - | - | F | T | T |
| Có nhập thông tin Email (tùy chọn) | - | - | - | - | - | F | T |
| **Kết quả** | Báo thiếu thông tin bắt buộc | Báo SĐT không đúng định dạng | Báo Email không đúng định dạng | Báo SĐT đã có trong hệ thống | Báo Email đã có trong hệ thống | Thêm khách hàng thành công (chỉ có SĐT) | Thêm khách hàng thành công (đầy đủ SĐT & Email) |

### Bảng Test Case

| TC ID | Tên test case | Dữ liệu nhập | Bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **TC_CUST01** | Thêm khách hàng thành công – Đầy đủ thông tin | Họ tên: `Nguyễn Văn An`<br>SĐT: `0912345678` (chưa có trong DB)<br>Email: `nguyenvanan@gmail.com`<br>Địa chỉ: `123 Kim Mã`<br>Tỉnh/TP: `Hà Nội`<br>Phường/Xã: `Kim Mã` | 1. Bấm `+ THÊM KHÁCH MỚI`<br>2. Nhập đầy đủ tất cả các trường<br>3. Bấm **"LƯU"** | Đóng modal, hiển thị thông báo: *"Thêm khách hàng thành công"*, khách hàng mới được tự động chọn vào hóa đơn POS với hạng `REGULAR` |
| **TC_CUST02** | Thêm khách hàng thành công – Chỉ điền thông tin bắt buộc | Họ tên: `Trần Thị Bình`<br>SĐT: `0987654321` (chưa có trong DB)<br>Email, Địa chỉ: *Để trống* | 1. Bấm `+ THÊM KHÁCH MỚI`<br>2. Chỉ điền Họ tên và SĐT<br>3. Bấm **"LƯU"** | Đóng modal, hiển thị thông báo: *"Thêm khách hàng thành công"*, thông tin lưu thành công không bắt buộc email |
| **TC_CUST03** | Bỏ trống Họ tên | Họ tên: *Để trống*<br>SĐT: `0912345678` | 1. Bấm `+ THÊM KHÁCH MỚI`<br>2. Để trống Họ tên, nhập SĐT<br>3. Bấm **"LƯU"** | Modal không đóng, hiển thị thông báo lỗi: *"Vui lòng nhập họ tên khách hàng."* |
| **TC_CUST04** | Bỏ trống Số điện thoại | Họ tên: `Lê Hoàng Cường`<br>SĐT: *Để trống* | 1. Bấm `+ THÊM KHÁCH MỚI`<br>2. Nhập Họ tên, để trống SĐT<br>3. Bấm **"LƯU"** | Modal không đóng, hiển thị thông báo lỗi: *"Vui lòng nhập số điện thoại."* |
| **TC_CUST05** | Bỏ trống cả Họ tên và SĐT | Họ tên: *Để trống*<br>SĐT: *Để trống* | 1. Bấm `+ THÊM KHÁCH MỚI`<br>2. Để trống toàn bộ trường<br>3. Bấm **"LƯU"** | Modal không đóng, hiển thị thông báo lỗi: *"Vui lòng nhập họ tên khách hàng."* |
| **TC_CUST06** | SĐT ngắn hơn 10 chữ số | Họ tên: `Phạm Văn Dũng`<br>SĐT: `091234567` (9 chữ số) | 1. Bấm `+ THÊM KHÁCH MỚI`<br>2. Nhập SĐT có 9 chữ số<br>3. Bấm **"LƯU"** | Modal không đóng, hiển thị thông báo: *"Số điện thoại không đúng định dạng hoặc độ dài (yêu cầu 10 chữ số, ví dụ 0912345678)."* |
| **TC_CUST07** | SĐT dài hơn 10 chữ số | Họ tên: `Phạm Văn Dũng`<br>SĐT: `09123456789` (11 chữ số) | 1. Bấm `+ THÊM KHÁCH MỚI`<br>2. Nhập SĐT có 11 chữ số<br>3. Bấm **"LƯU"** | Modal không đóng, hiển thị thông báo: *"Số điện thoại không đúng định dạng hoặc độ dài (yêu cầu 10 chữ số, ví dụ 0912345678)."* |
| **TC_CUST08** | SĐT chứa chữ cái hoặc ký tự đặc biệt | Họ tên: `Vũ Minh Đức`<br>SĐT: `091234abcd` | 1. Bấm `+ THÊM KHÁCH MỚI`<br>2. Nhập SĐT chứa chữ cái<br>3. Bấm **"LƯU"** | Modal không đóng, hiển thị thông báo: *"Số điện thoại không đúng định dạng hoặc độ dài (yêu cầu 10 chữ số, ví dụ 0912345678)."* |
| **TC_CUST09** | SĐT đầu số không hợp lệ | Họ tên: `Đỗ Thu Hà`<br>SĐT: `1234567890` (không bắt đầu bằng 0 hoặc +84) | 1. Bấm `+ THÊM KHÁCH MỚI`<br>2. Nhập SĐT đầu `12` không hợp lệ<br>3. Bấm **"LƯU"** | Modal không đóng, hiển thị thông báo: *"Số điện thoại không đúng định dạng hoặc độ dài (yêu cầu 10 chữ số, ví dụ 0912345678)."* |
| **TC_CUST10** | Email sai cú pháp (thiếu `@`) | Họ tên: `Hoàng Văn Em`<br>SĐT: `0911223344`<br>Email: `hoangvanemgmail.com` | 1. Bấm `+ THÊM KHÁCH MỚI`<br>2. Nhập Email thiếu ký tự `@`<br>3. Bấm **"LƯU"** | Modal không đóng, hiển thị thông báo: *"Email không đúng định dạng (ví dụ: khachhang@example.com)."* |
| **TC_CUST11** | Email sai cú pháp (thiếu tên miền `.com`) | Họ tên: `Hoàng Văn Em`<br>SĐT: `0911223344`<br>Email: `hoangvanem@gmail` | 1. Bấm `+ THÊM KHÁCH MỚI`<br>2. Nhập Email thiếu tên miền cấp 1<br>3. Bấm **"LƯU"** | Modal không đóng, hiển thị thông báo: *"Email không đúng định dạng (ví dụ: khachhang@example.com)."* |
| **TC_CUST12** | Trùng số điện thoại đã có trong hệ thống | Họ tên: `Nguyễn Khách Cũ`<br>SĐT: `0901234567` (SĐT đã tồn tại trong DB) | 1. Bấm `+ THÊM KHÁCH MỚI`<br>2. Nhập SĐT đã có của khách khác<br>3. Bấm **"LƯU"** | Modal không đóng, hiển thị thông báo lỗi từ backend: *"Khách hàng đã tồn tại. Số điện thoại này đã có trong hệ thống."* |
| **TC_CUST13** | Trùng Email đã có trong hệ thống | Họ tên: `Lê Khách Cũ`<br>SĐT: `0933445566` (mới)<br>Email: `khach@routine.vn` (đã có trong DB) | 1. Bấm `+ THÊM KHÁCH MỚI`<br>2. Nhập Email đã đăng ký trước đó<br>3. Bấm **"LƯU"** | Modal không đóng, hiển thị thông báo lỗi từ backend: *"Khách hàng đã tồn tại. Email này đã có trong hệ thống."* |
| **TC_CUST14** | Hủy thêm khách hàng mới | Điền dở thông tin khách hàng | 1. Bấm `+ THÊM KHÁCH MỚI`<br>2. Nhập dở một số thông tin<br>3. Bấm nút **"HUỶ"** | Modal đóng lại, form được reset, không lưu dữ liệu rác vào hệ thống |

---

## c. Kiểm thử chức năng Tạo hóa đơn tại quầy - POS (Sales Staff)

### Mô tả chức năng Tạo hóa đơn tại quầy
* **Mục tiêu:** Cho phép nhân viên bán hàng (Sales Staff) lập hóa đơn bán lẻ trực tiếp cho khách mua tại cửa hàng: chọn sản phẩm kèm biến thể (Size/Màu sắc), chọn khách hàng (khách thành viên hoặc khách lẻ), áp dụng mã khuyến mãi (nếu có), chọn hình thức thanh toán và hoàn tất đơn hàng; hệ thống tự động trừ tồn kho và ghi nhận doanh thu.
* **Dữ liệu đầu vào:**
  * Danh sách mặt hàng mua: Mã/Tên sản phẩm, Kích cỡ (`Size`), Màu sắc (`Color`), Số lượng mua (`Quantity ≥ 1`).
  * Khách hàng: Khách hàng thành viên được chọn (`customerId`) HOẶC Tên khách lẻ (`walkInName` - tùy chọn).
  * Mã giảm giá: `promotionCode` *(tùy chọn, ví dụ: SALE10, SALE20)*.
  * Hình thức thanh toán *(bắt buộc)*: Tiền mặt (`CASH`), Thẻ ngân hàng (`CARD`), Chuyển khoản QR (`BANK_TRANSFER`).
* **Điều kiện bắt buộc:**
  * Giỏ hàng phải chứa ít nhất 1 sản phẩm (`items.length ≥ 1`).
  * Sản phẩm được chọn phải đang kinh doanh (`status = 'ACTIVE'`) và còn tồn kho khả dụng (`stock > 0`).
  * Số lượng mua của từng sản phẩm không được vượt quá số lượng tồn kho khả dụng hiện tại.
  * Hình thức thanh toán phải được lựa chọn hợp lệ.
  * Nếu áp dụng mã giảm giá: Mã phải tồn tại, đang hoạt động, chưa hết hạn, còn lượt sử dụng và tổng tiền hàng phải đạt mức tối thiểu quy định của mã.
* **Quy trình xử lý:**
  1. Nhân viên tìm kiếm sản phẩm theo tên hoặc mã tại thanh tìm kiếm bên trái.
  2. Bấm vào sản phẩm để thêm vào giỏ hàng Hóa đơn mới bên phải.
  3. Nhân viên điều chỉnh số lượng, chọn biến thể Kích cỡ (Size) và Màu sắc (Color) theo yêu cầu của khách.
  4. Nhân viên tìm và chọn khách hàng thành viên qua thanh tìm kiếm khách (hoặc để trống/nhập tên khách lẻ).
  5. (Tùy chọn) Nhập mã giảm giá và bấm **"ÁP DỤNG"**. Hệ thống kiểm tra điều kiện mã và trừ tiền giảm giá tương ứng.
  6. Nhân viên chọn Phương thức thanh toán (Tiền mặt / Thẻ / Chuyển khoản).
  7. Kiểm tra tổng tiền hàng, số tiền giảm giá và số tiền khách phải trả.
  8. Bấm nút **"THANH TOÁN & TẠO HÓA ĐƠN"**.
  9. Hệ thống kiểm tra tính hợp lệ toàn bộ đơn hàng, khóa bản ghi và kiểm tra tồn kho tức thời:
     * **Hợp lệ:** Sinh mã đơn hàng tự động (`ORD-YYYYMMDD-XXXXXX`), trừ tồn kho theo từng biến thể sản phẩm, lưu hóa đơn vào CSDL với trạng thái `COMPLETED` (đối với tiền mặt tại quầy), hiển thị Toast thành công và tự động làm mới giao diện về trạng thái sẵn sàng đón lượt khách tiếp theo.
     * **Không hợp lệ:** Hiển thị cảnh báo hoặc thông báo lỗi cụ thể (giỏ hàng trống, hết hàng, vượt tồn kho, mã giảm giá không hợp lệ).
* **Kết quả:** Hóa đơn được lập thành công, tồn kho hàng hóa được cập nhật trừ đi chính xác, doanh thu ca bán hàng được ghi nhận vào hệ thống; hoặc hiển thị thông báo lỗi nếu không thỏa mãn điều kiện.

### Ký hiệu quy ước
* **T (True):** Nhập đúng / hợp lệ / thỏa mãn điều kiện
* **F (False):** Nhập sai / không hợp lệ / vi phạm điều kiện
* **- :** Không xét đến / bỏ qua điều kiện này

### Bảng quyết định

| Điều kiện | TH1 | TH2 | TH3 | TH4 | TH5 | TH6 | TH7 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Giỏ hàng có sản phẩm (≥ 1 sản phẩm) | F | T | T | T | T | T | T |
| Số lượng mua hợp lệ và còn đủ tồn kho | - | F | T | T | T | T | T |
| Mã giảm giá hợp lệ (nếu có nhập) | - | - | F | T | T | T | - |
| Phương thức thanh toán hợp lệ | - | - | - | F | T | T | T |
| Có chọn khách hàng thành viên | - | - | - | - | F | T | F |
| **Kết quả** | Báo chưa chọn sản phẩm | Cảnh báo vượt tồn kho / hết hàng | Báo mã giảm giá không hợp lệ | Báo PT thanh toán không hợp lệ | Tạo đơn thành công (Khách lẻ / Tiền mặt) | Tạo đơn thành công (Khách VIP + Voucher) | Tạo đơn thành công (Khách lẻ / Thẻ hoặc CK) |

### Bảng Test Case

| TC ID | Tên test case | Dữ liệu nhập | Bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **TC_ORD01** | Tạo hóa đơn thành công – Khách lẻ, Tiền mặt | • Sản phẩm: Áo thun (SL: 1, Size: L, Màu: Đen)<br>• Khách hàng: Không chọn (Khách lẻ)<br>• Thanh toán: Tiền mặt (`CASH`) | 1. Chọn 1 sản phẩm vào giỏ<br>2. Chọn thanh toán Tiền mặt<br>3. Bấm **"THANH TOÁN & TẠO HÓA ĐƠN"** | Tạo hóa đơn thành công, trạng thái `COMPLETED`, tồn kho sản phẩm giảm 1, giỏ hàng tự động làm mới |
| **TC_ORD02** | Tạo hóa đơn thành công – Chọn khách hàng thành viên | • Sản phẩm: Quần Jeans (SL: 2, Size: 31, Màu: Xanh)<br>• Khách hàng: Chọn `Nguyễn Văn An (0912345678)`<br>• Thanh toán: Tiền mặt | 1. Chọn sản phẩm vào giỏ<br>2. Tìm và chọn khách hàng `Nguyễn Văn An`<br>3. Bấm **"THANH TOÁN & TẠO HÓA ĐƠN"** | Tạo hóa đơn thành công, hóa đơn được liên kết với ID khách hàng `Nguyễn Văn An`, tích lũy doanh số cho khách |
| **TC_ORD03** | Tạo hóa đơn thành công – Áp dụng mã giảm giá hợp lệ | • Sản phẩm: Đơn hàng trị giá 1.000.000 đ<br>• Mã giảm giá: `SALE10` (giảm 10%)<br>• Thanh toán: Tiền mặt | 1. Chọn sản phẩm đạt giá trị tối thiểu<br>2. Nhập mã `SALE10`, bấm "Áp dụng"<br>3. Kiểm tra tiền giảm giá: `100.000 đ`<br>4. Bấm **"THANH TOÁN & TẠO HÓA ĐƠN"** | Áp dụng mã thành công, tiền khách phải trả còn `900.000 đ`, tạo hóa đơn thành công và ghi nhận lượt dùng mã |
| **TC_ORD04** | Tạo hóa đơn thành công – Thanh toán Chuyển khoản QR | • Sản phẩm: Sơ mi Oxford (SL: 1)<br>• Thanh toán: Chuyển khoản (`BANK_TRANSFER`) | 1. Chọn sản phẩm vào giỏ<br>2. Chọn hình thức "Chuyển khoản"<br>3. Bấm **"THANH TOÁN & TẠO HÓA ĐƠN"** | Tạo hóa đơn thành công với phương thức thanh toán `BANK_TRANSFER` |
| **TC_ORD05** | Tạo hóa đơn thành công – Thanh toán Thẻ POS | • Sản phẩm: Áo khoác Bomber (SL: 1)<br>• Thanh toán: Thẻ (`CARD`) | 1. Chọn sản phẩm vào giỏ<br>2. Chọn hình thức "Thẻ"<br>3. Bấm **"THANH TOÁN & TẠO HÓA ĐƠN"** | Tạo hóa đơn thành công với phương thức thanh toán `CARD` |
| **TC_ORD06** | Bấm thanh toán khi giỏ hàng trống | Giỏ hàng: *Không có sản phẩm nào* | 1. Mở trang POS, không chọn sản phẩm nào<br>2. Bấm **"THANH TOÁN & TẠO HÓA ĐƠN"** | Hệ thống chặn gửi và cảnh báo Toast: *"Chưa chọn sản phẩm nào."* |
| **TC_ORD07** | Chọn sản phẩm đã hết hàng (Tồn = 0) | Sản phẩm có số lượng tồn kho `stock = 0` | 1. Tìm sản phẩm có badge "Tồn: 0"<br>2. Bấm vào sản phẩm để thêm vào giỏ | Không thêm vào giỏ hàng, hiển thị cảnh báo: *"Sản phẩm \"[Tên SP]\" đã hết hàng."* |
| **TC_ORD08** | Tăng số lượng mua vượt quá số lượng tồn kho | Sản phẩm chỉ còn 3 cái trong kho; nhập số lượng: 4 | 1. Thêm sản phẩm có tồn kho = 3 vào giỏ<br>2. Bấm tăng số lượng lên 4 | Hệ thống chặn không cho tăng và hiển thị cảnh báo: *"Sản phẩm \"[Tên SP]\" chỉ còn 3 trong kho."* |
| **TC_ORD09** | Chọn mua nhiều biến thể khác nhau (Size / Màu) của cùng một sản phẩm | • Dòng 1: Áo Polo - Size M, Màu Trắng (SL: 1)<br>• Dòng 2: Áo Polo - Size L, Màu Đen (SL: 2) | 1. Thêm sản phẩm vào giỏ hàng<br>2. Chọn Size M - Trắng cho dòng 1<br>3. Tiếp tục thêm SP đó và đổi Size L - Đen cho dòng 2<br>4. Bấm Thanh toán | Giỏ hàng hiển thị thành 2 dòng riêng biệt với giá và số lượng tương ứng; tạo hóa đơn thành công và trừ kho đúng từng biến thể |
| **TC_ORD10** | Áp dụng mã giảm giá không tồn tại | Nhập mã: `MAGIAMGIAKHONGCO999` | 1. Nhập mã vào ô Mã giảm giá<br>2. Bấm "Áp dụng" | Hiển thị thông báo lỗi: *"Mã giảm giá không hợp lệ."* (hoặc mã không tồn tại), tiền giảm giá vẫn là `0 đ` |
| **TC_ORD11** | Áp dụng mã giảm giá chưa đạt giá trị đơn hàng tối thiểu | Đơn hàng 200.000 đ; nhập mã yêu cầu đơn từ 500.000 đ trở lên | 1. Chọn sản phẩm có tổng tiền `200.000 đ`<br>2. Nhập mã khuyến mãi yêu cầu min 500k<br>3. Bấm "Áp dụng" | Báo lỗi: *"Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã giảm giá."*, không áp dụng giảm giá |
| **TC_ORD12** | Áp dụng mã giảm giá đã hết hạn hoặc hết lượt | Nhập mã khuyến mãi đã hết hạn sử dụng | 1. Nhập mã khuyến mãi đã hết hạn<br>2. Bấm "Áp dụng" | Báo lỗi: *"Mã giảm giá đã hết hạn sử dụng hoặc hết lượt dùng."* |
| **TC_ORD13** | Nhập tên khách lẻ tùy chọn | Tên khách lẻ: `Chị Hòa` | 1. Chọn sản phẩm vào giỏ<br>2. Nhập `Chị Hòa` vào ô "Tên khách lẻ (tùy chọn)"<br>3. Bấm **"THANH TOÁN & TẠO HÓA ĐƠN"** | Đơn hàng được tạo thành công với ghi chú: `Khách lẻ: Chị Hòa` giúp nhân viên dễ phân biệt khi giao hàng |
| **TC_ORD14** | Xóa sản phẩm khỏi giỏ hàng | Giỏ hàng có 2 sản phẩm, xóa bớt 1 sản phẩm | 1. Thêm 2 sản phẩm vào giỏ hàng<br>2. Bấm nút xóa (icon thùng rác/X) ở sản phẩm thứ nhất<br>3. Kiểm tra lại tổng tiền | Sản phẩm bị xóa khỏi giỏ, tổng tiền hàng tự động tính lại chính xác theo sản phẩm còn lại |
| **TC_ORD15** | Tìm kiếm sản phẩm theo tên hoặc mã tại quầy | Từ khóa: Mã sản phẩm (vd: `AT-001`) hoặc tên (vd: `Sơ mi`) | 1. Nhập từ khóa vào ô tìm kiếm sản phẩm<br>2. Nhấn phím `Enter` hoặc nút "Tìm" | Lưới sản phẩm lọc ra đúng các sản phẩm khớp với tên hoặc mã được nhập, các sản phẩm không khớp bị ẩn đi |
