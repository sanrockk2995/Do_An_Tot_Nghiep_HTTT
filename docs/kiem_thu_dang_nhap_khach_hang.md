# KIỂM THỬ CHỨC NĂNG ĐĂNG NHẬP DÀNH CHO KHÁCH HÀNG (CUSTOMER LOGIN)

## Mô tả chức năng 

Chức năng cho phép người dùng (Khách mua, Khách hàng thành viên) nhập thông tin tài khoản gồm Email và Mật khẩu vào giao diện đăng nhập để xác thực danh tính, truy cập tài khoản cá nhân, xem lịch sử đơn hàng, tích lũy điểm thưởng và thực hiện mua sắm trực tuyến. Sau khi người dùng nhấn nút "ĐĂNG NHẬP", hệ thống sẽ xử lý kiểm tra tính hợp lệ của dữ liệu đầu vào và đối chiếu thông tin với cơ sở dữ liệu. Nếu Email tồn tại và Mật khẩu chính xác, hệ thống sẽ cấp quyền truy cập, hiển thị thông báo "Đăng nhập thành công" và chuyển hướng người dùng về trang chủ hoặc trang cá nhân. Trong trường hợp để trống thông tin, sai định dạng hoặc thông tin đăng nhập không chính xác, hệ thống sẽ hiển thị thông báo lỗi cụ thể để người dùng chỉnh sửa.

---

## Đặc tả chức năng 

### Tên chức năng 

Đăng nhập khách hàng 

### Mô tả 

Cho phép khách hàng đăng nhập vào hệ thống website mua sắm Routine bằng tài khoản cá nhân thông qua địa chỉ Email và Mật khẩu đã đăng ký.

### Tiền điều kiện 

Khách hàng đang ở giao diện Đăng nhập của website (`/dang-nhap`).

### Luồng chính 

1. Khách hàng nhấp vào ô "Email" và nhập địa chỉ Email của tài khoản. 
2. Khách hàng nhấp vào ô "Mật khẩu" và nhập Mật khẩu tương ứng. 
3. Khách hàng nhấn nút "ĐĂNG NHẬP" (hoặc nhấn phím Enter). 
4. Hệ thống kiểm tra tính đầy đủ và định dạng hợp lệ của Email và Mật khẩu. 
5. Hệ thống gửi yêu cầu xác thực (`POST /api/v1/auth/customer-login`) về máy chủ backend. 
6. Hệ thống đối chiếu Email và Mật khẩu mã hóa (BCrypt) với cơ sở dữ liệu khách hàng. 
7. Hệ thống xác nhận thông tin trùng khớp, tạo mã xác thực (Access Token & Refresh Token) và lưu phiên đăng nhập của khách hàng. 
8. Hệ thống thông báo "Đăng nhập thành công" và chuyển hướng khách hàng về Trang chủ (`/`) với trạng thái đã đăng nhập. 

### Luồng phụ 

* Nếu khách hàng để trống ô Email và nhấn nút "ĐĂNG NHẬP". Hệ thống hiển thị thông báo "Vui lòng nhập email và mật khẩu."
* Nếu khách hàng để trống ô Mật khẩu và nhấn nút "ĐĂNG NHẬP". Hệ thống hiển thị thông báo "Vui lòng nhập email và mật khẩu."
* Nếu khách hàng để trống cả Email và Mật khẩu và nhấn nút "ĐĂNG NHẬP". Hệ thống hiển thị thông báo "Vui lòng nhập email và mật khẩu."
* Nếu khách hàng nhập Email sai định dạng (thiếu ký tự @ hoặc sai cấu trúc tên miền) và nhấn "ĐĂNG NHẬP". Hệ thống hiển thị thông báo "Email không hợp lệ."
* Nếu khách hàng nhập Mật khẩu ngắn hơn 6 ký tự và nhấn "ĐĂNG NHẬP". Hệ thống hiển thị thông báo "Mật khẩu phải có ít nhất 6 ký tự."
* Nếu Email chưa được đăng ký trong hệ thống hoặc Mật khẩu không chính xác và nhấn "ĐĂNG NHẬP". Hệ thống hiển thị thông báo "Email hoặc mật khẩu không chính xác."

### Hậu điều kiện 

Khách hàng đăng nhập thành công vào hệ thống, thông tin cá nhân và giỏ hàng của khách hàng được hiển thị trên thanh điều hướng website.

---

## Ký hiệu quy ước:
•	**T (True):** Nhập đúng/ hợp lệ  
•	**F (False):** Nhập sai/ không hợp lệ  
•	**- :** Không xét đến bỏ qua điều kiện này.  

---

## Bảng quyết định:

| Điều kiện | TH1 | TH2 | TH3 | TH4 | TH5 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Nhập đầy đủ Email và Mật khẩu | F | T | T | T | T |
| Email đúng định dạng | - | F | T | T | T |
| Mật khẩu hợp lệ (≥ 6 ký tự) | - | - | F | T | T |
| Email và Mật khẩu khớp với CSDL | - | - | - | F | T |
| **Actions** | | | | | |
| Báo lỗi: "Vui lòng nhập email và mật khẩu." | X | | | | |
| Báo lỗi: "Email không hợp lệ." | | X | | | |
| Báo lỗi: "Mật khẩu phải có ít nhất 6 ký tự." | | | X | | |
| Báo lỗi: "Email hoặc mật khẩu không chính xác." | | | | X | |
| Đăng nhập thành công & Chuyển hướng Trang chủ | | | | | X |

---

## Bảng Test Case:

| TC ID | Tên test case | Dữ liệu nhập | Bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **TC01** | Đăng nhập thành công | Email: "khachhang@gmail.com" (đã có trong DB)<br>Mật khẩu: "123456" (mật khẩu đúng) | 1. Nhập đúng Email đã đăng ký<br>2. Nhập đúng Mật khẩu<br>3. Nhấn nút "ĐĂNG NHẬP" | Đăng nhập thành công, lưu token, chuyển hướng về Trang chủ, thanh header hiển thị tên khách hàng |
| **TC02** | Thiếu thông tin Email | Email: Để trống<br>Mật khẩu: "123456" | 1. Để trống ô Email<br>2. Nhập Mật khẩu hợp lệ<br>3. Nhấn nút "ĐĂNG NHẬP" | Hiển thị lỗi: "Vui lòng nhập email và mật khẩu." |
| **TC03** | Thiếu thông tin Mật khẩu | Email: "khachhang@gmail.com"<br>Mật khẩu: Để trống | 1. Nhập Email hợp lệ<br>2. Để trống ô Mật khẩu<br>3. Nhấn nút "ĐĂNG NHẬP" | Hiển thị lỗi: "Vui lòng nhập email và mật khẩu." |
| **TC04** | Bỏ trống cả Email và Mật khẩu | Email: Để trống<br>Mật khẩu: Để trống | 1. Để trống toàn bộ cả Email và Mật khẩu<br>2. Nhấn nút "ĐĂNG NHẬP" | Hiển thị lỗi: "Vui lòng nhập email và mật khẩu." |
| **TC05** | Email sai định dạng (thiếu ký tự `@`) | Email: "khachhanggmail.com"<br>Mật khẩu: "123456" | 1. Nhập Email thiếu ký tự @<br>2. Nhập Mật khẩu hợp lệ<br>3. Nhấn nút "ĐĂNG NHẬP" | Hiển thị lỗi: "Email không hợp lệ." |
| **TC06** | Email sai định dạng (thiếu đuôi tên miền) | Email: "khachhang@gmail"<br>Mật khẩu: "123456" | 1. Nhập Email thiếu đuôi miền .com/.vn<br>2. Nhập Mật khẩu hợp lệ<br>3. Nhấn nút "ĐĂNG NHẬP" | Hiển thị lỗi: "Email không hợp lệ." |
| **TC07** | Email chứa ký tự khoảng trắng | Email: "khach hang@gmail.com"<br>Mật khẩu: "123456" | 1. Nhập Email có dấu cách ở giữa<br>2. Nhập Mật khẩu hợp lệ<br>3. Nhấn nút "ĐĂNG NHẬP" | Hiển thị lỗi: "Email không hợp lệ." |
| **TC08** | Mật khẩu ngắn hơn 6 ký tự | Email: "khachhang@gmail.com"<br>Mật khẩu: "12345" (5 ký tự) | 1. Nhập Email hợp lệ<br>2. Nhập Mật khẩu có độ dài 5 ký tự<br>3. Nhấn nút "ĐĂNG NHẬP" | Hiển thị lỗi: "Mật khẩu phải có ít nhất 6 ký tự." |
| **TC09** | Email chưa đăng ký tài khoản | Email: "chuatontai999@gmail.com"<br>Mật khẩu: "123456" | 1. Nhập Email chưa từng đăng ký trong hệ thống<br>2. Nhập Mật khẩu bất kỳ<br>3. Nhấn nút "ĐĂNG NHẬP" | Hiển thị lỗi: "Email hoặc mật khẩu không chính xác." |
| **TC10** | Mật khẩu không chính xác | Email: "khachhang@gmail.com" (tồn tại)<br>Mật khẩu: "SaiPassWord999" | 1. Nhập đúng Email tài khoản<br>2. Nhập sai Mật khẩu<br>3. Nhấn nút "ĐĂNG NHẬP" | Hiển thị lỗi: "Email hoặc mật khẩu không chính xác." |
| **TC11** | Tự động loại bỏ khoảng trắng đầu/cuối của Email | Email: "  khachhang@gmail.com  "<br>Mật khẩu: "123456" | 1. Nhập Email có khoảng trắng thừa ở đầu và cuối<br>2. Nhập đúng Mật khẩu<br>3. Nhấn nút "ĐĂNG NHẬP" | Hệ thống tự động trim() khoảng trắng thừa, đăng nhập thành công và chuyển hướng về Trang chủ |

---

## Giải thích cơ sở thiết kế:

### 1. Tại sao ra được Bảng quyết định có 5 trường hợp (TH1 – TH5)?
* Chức năng Đăng nhập khách hàng gồm **4 điều kiện logic**:
  1. Nhập đầy đủ Email và Mật khẩu (không rỗng).
  2. Email đúng định dạng chuẩn.
  3. Mật khẩu hợp lệ (tối thiểu 6 ký tự).
  4. Email và Mật khẩu khớp với dữ liệu trong cơ sở dữ liệu.
* Theo nguyên tắc **kiểm tra lỗi tuần tự (Short-circuit / Fast-fail)**: Khi một điều kiện trước vi phạm (F), hệ thống sẽ dừng kiểm tra và hiển thị cảnh báo ngay lập tức, các điều kiện sau không cần xét đến (ký hiệu `-`).
* Do đó, từ $2^4 = 16$ tổ hợp lý thuyết được rút gọn thành **5 trường hợp đại diện (TH1 đến TH5)** bao phủ trọn vẹn mọi nhánh rẽ.

### 2. Tại sao lại thiết kế 11 Test Cases?
Từ 5 trường hợp logic của Bảng quyết định, Tester kết hợp kỹ thuật **Phân vùng tương đương (Equivalence Partitioning)** và **Phân tích giá trị biên (Boundary Value Analysis)**:
* **TH1 (Thiếu thông tin):** Sinh ra 3 test cases (**TC02, TC03, TC04**) để kiểm thử đầy đủ: thiếu Email, thiếu Mật khẩu và thiếu cả hai.
* **TH2 (Email sai định dạng):** Sinh ra 3 test cases (**TC05, TC06, TC07**) kiểm thử các dạng lỗi email: thiếu ký tự `@`, thiếu tên miền cấp cao (`.com`), và email chứa khoảng trắng.
* **TH3 (Mật khẩu không hợp lệ):** Sinh ra 1 test case (**TC08**) kiểm thử giá trị biên: 5 ký tự (< 6 ký tự theo quy định).
* **TH4 (Sai thông tin xác thực):** Sinh ra 2 test cases (**TC09, TC10**) phân biệt 2 tình huống: tài khoản chưa tồn tại trong CSDL và tài khoản có tồn tại nhưng nhập sai mật khẩu.
* **TH5 (Đăng nhập thành công):** Gồm 2 test cases (**TC01, TC11**): đăng nhập chuẩn thành công và kiểm thử xử lý cắt khoảng trắng đầu/cuối của Email (`trim()`).
$\rightarrow$ Tổng cộng **11 Test Cases** đảm bảo độ bao phủ 100% các tình huống thực tế người dùng có thể thao tác.
