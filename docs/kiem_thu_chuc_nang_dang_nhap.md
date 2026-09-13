# KIỂM THỬ CHỨC NĂNG ĐĂNG NHẬP HỆ THỐNG

## Mô tả chức năng 

Chức năng cho phép người dùng (Quản lý, Nhân viên bán hàng, Nhân viên kho, Kế toán) nhập thông tin tài khoản gồm Email, Mật khẩu và lựa chọn Vai trò tương ứng để xác thực danh tính và đăng nhập vào hệ thống quản trị nội bộ. Sau khi người dùng nhấn nút "ĐĂNG NHẬP", hệ thống sẽ xử lý kiểm tra tính hợp lệ của dữ liệu đầu vào, đối chiếu thông tin xác thực với cơ sở dữ liệu và kiểm tra vai trò được cấp quyền. Nếu thông tin chính xác và vai trò khớp với tài khoản, hệ thống cấp quyền truy cập, hiển thị thông báo "Đăng nhập thành công" và chuyển hướng người dùng đến giao diện làm việc theo đúng vai trò. Trong trường hợp thông tin sai hoặc vai trò không khớp, hệ thống sẽ hiển thị thông báo lỗi cụ thể để người dùng biết và thao tác lại.

---

## Đặc tả chức năng 

### Tên chức năng 

Đăng nhập hệ thống 

### Mô tả 

Cho phép người dùng xác thực danh tính để truy cập vào hệ thống quản lý bán hàng thông qua Email, Mật khẩu và Vai trò được phân công.

### Tiền điều kiện 

Người dùng đang ở giao diện Đăng nhập hệ thống (màn hình login nội bộ).

### Luồng chính 

1. Người dùng chọn Vai trò của mình trong danh sách (Quản lý, Nhân viên bán hàng, Nhân viên kho, Kế toán). 
2. Người dùng nhập địa chỉ Email đã được cấp. 
3. Người dùng nhập Mật khẩu tương ứng. 
4. Người dùng nhấn nút "ĐĂNG NHẬP" (hoặc phím Enter). 
5. Hệ thống kiểm tra tính đầy đủ và định dạng của dữ liệu đầu vào (Email, Mật khẩu, Vai trò). 
6. Hệ thống gửi thông tin xác thực về máy chủ backend để đối chiếu với cơ sở dữ liệu. 
7. Hệ thống xác nhận tài khoản tồn tại, mật khẩu chính xác và vai trò người dùng chọn khớp hoàn toàn với vai trò được phân quyền trong CSDL. 
8. Hệ thống lưu phiên đăng nhập (Token), hiển thị thông báo "Đăng nhập thành công" và chuyển hướng người dùng đến trang làm việc tương ứng với vai trò. 

### Luồng phụ 

* Nếu người dùng để trống Email hoặc Mật khẩu và nhấn nút "ĐĂNG NHẬP". Hệ thống hiển thị thông báo "Vui lòng nhập email và mật khẩu."
* Nếu người dùng chưa chọn Vai trò và nhấn nút "ĐĂNG NHẬP". Hệ thống hiển thị thông báo "Vui lòng chọn vai trò trước khi đăng nhập."
* Nếu người dùng nhập Email sai định dạng (thiếu @ hoặc sai cú pháp tên miền) và nhấn nút "ĐĂNG NHẬP". Hệ thống hiển thị thông báo "Vui lòng nhập địa chỉ email hợp lệ."
* Nếu người dùng nhập Mật khẩu ngắn hơn 6 ký tự và nhấn nút "ĐĂNG NHẬP". Hệ thống hiển thị thông báo "Mật khẩu phải có ít nhất 6 ký tự."
* Nếu Email không tồn tại trong hệ thống hoặc Mật khẩu không chính xác. Hệ thống hiển thị thông báo "Email hoặc mật khẩu không chính xác."
* Nếu Email và Mật khẩu đúng nhưng Vai trò người dùng chọn không khớp với vai trò được cấp trong CSDL. Hệ thống hiển thị thông báo "Vai trò không khớp với tài khoản."

### Hậu điều kiện 

Người dùng đăng nhập thành công vào hệ thống, phiên làm việc được thiết lập và màn hình làm việc tương ứng với vai trò được hiển thị.

---

## Ký hiệu quy ước:
•	**T (True):** Nhập đúng/ hợp lệ  
•	**F (False):** Nhập sai/ không hợp lệ  
•	**- :** Không xét đến bỏ qua điều kiện này.  

---

## Bảng quyết định:

| Điều kiện | TH1 | TH2 | TH3 | TH4 | TH5 | TH6 | TH7 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Nhập đầy đủ Email và Mật khẩu | F | T | T | T | T | T | T |
| Đã chọn Vai trò | - | F | T | T | T | T | T |
| Email đúng định dạng | - | - | F | T | T | T | T |
| Mật khẩu hợp lệ (≥ 6 ký tự) | - | - | - | F | T | T | T |
| Email và Mật khẩu khớp với CSDL | - | - | - | - | F | T | T |
| Vai trò chọn khớp với tài khoản trong CSDL | - | - | - | - | - | F | T |
| **Actions** | | | | | | | |
| Báo lỗi: "Vui lòng nhập email và mật khẩu." | X | | | | | | |
| Báo lỗi: "Vui lòng chọn vai trò trước khi đăng nhập." | | X | | | | | |
| Báo lỗi: "Vui lòng nhập địa chỉ email hợp lệ." | | | X | | | | |
| Báo lỗi: "Mật khẩu phải có ít nhất 6 ký tự." | | | | X | | | |
| Báo lỗi: "Email hoặc mật khẩu không chính xác." | | | | | X | | |
| Báo lỗi: "Vai trò không khớp với tài khoản." | | | | | | X | |
| Đăng nhập thành công & Chuyển hướng đúng vai trò | | | | | | | X |

---

## Bảng Test Case:

| TC ID | Tên test case | Dữ liệu nhập | Bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **TC01** | Đăng nhập thành công – Vai trò Quản lý | • Vai trò: "Quản lý"<br>• Email: "admin@routine.vn"<br>• Mật khẩu: "Admin@123" (đúng trong DB) | 1. Chọn vai trò "Quản lý"<br>2. Nhập đúng Email và Mật khẩu<br>3. Nhấn "ĐĂNG NHẬP" | Đăng nhập thành công, lưu token, chuyển hướng đến trang Quản lý (`/quan-ly`) |
| **TC02** | Đăng nhập thành công – Vai trò NV bán hàng | • Vai trò: "Nhân viên bán hàng"<br>• Email: "sale@routine.vn"<br>• Mật khẩu: "Sale@123" (đúng trong DB) | 1. Chọn vai trò "Nhân viên bán hàng"<br>2. Nhập đúng Email và Mật khẩu<br>3. Nhấn "ĐĂNG NHẬP" | Đăng nhập thành công, chuyển hướng đến trang Bán hàng POS (`/ban-hang`) |
| **TC03** | Đăng nhập thành công – Vai trò NV kho | • Vai trò: "Nhân viên kho"<br>• Email: "kho@routine.vn"<br>• Mật khẩu: "Kho@123" (đúng trong DB) | 1. Chọn vai trò "Nhân viên kho"<br>2. Nhập đúng Email và Mật khẩu<br>3. Nhấn "ĐĂNG NHẬP" | Đăng nhập thành công, chuyển hướng đến trang Quản lý kho (`/kho-hang`) |
| **TC04** | Đăng nhập thành công – Vai trò Kế toán | • Vai trò: "Kế toán"<br>• Email: "ketoan@routine.vn"<br>• Mật khẩu: "Ketoan@123" (đúng trong DB) | 1. Chọn vai trò "Kế toán"<br>2. Nhập đúng Email và Mật khẩu<br>3. Nhấn "ĐĂNG NHẬP" | Đăng nhập thành công, chuyển hướng đến trang Kế toán (`/ke-toan`) |
| **TC05** | Thiếu thông tin Email (để trống) | • Vai trò: "Quản lý"<br>• Email: Để trống<br>• Mật khẩu: "Admin@123" | 1. Chọn vai trò "Quản lý"<br>2. Để trống Email, nhập Mật khẩu<br>3. Nhấn "ĐĂNG NHẬP" | Hiển thị lỗi: "Vui lòng nhập email và mật khẩu." |
| **TC06** | Thiếu thông tin Mật khẩu (để trống) | • Vai trò: "Quản lý"<br>• Email: "admin@routine.vn"<br>• Mật khẩu: Để trống | 1. Chọn vai trò "Quản lý"<br>2. Nhập Email, để trống Mật khẩu<br>3. Nhấn "ĐĂNG NHẬP" | Hiển thị lỗi: "Vui lòng nhập email và mật khẩu." |
| **TC07** | Bỏ trống cả Email và Mật khẩu | • Vai trò: "Quản lý"<br>• Email: Để trống<br>• Mật khẩu: Để trống | 1. Chọn vai trò "Quản lý"<br>2. Để trống cả Email và Mật khẩu<br>3. Nhấn "ĐĂNG NHẬP" | Hiển thị lỗi: "Vui lòng nhập email và mật khẩu." |
| **TC08** | Chưa chọn Vai trò | • Vai trò: Không chọn (để mặc định)<br>• Email: "admin@routine.vn"<br>• Mật khẩu: "Admin@123" | 1. Không chọn vai trò<br>2. Nhập Email và Mật khẩu<br>3. Nhấn "ĐĂNG NHẬP" | Hiển thị lỗi: "Vui lòng chọn vai trò trước khi đăng nhập." |
| **TC09** | Email sai định dạng (thiếu @) | • Vai trò: "Quản lý"<br>• Email: "adminroutine.vn"<br>• Mật khẩu: "Admin@123" | 1. Chọn vai trò "Quản lý"<br>2. Nhập Email thiếu @, nhập MK<br>3. Nhấn "ĐĂNG NHẬP" | Hiển thị lỗi: "Vui lòng nhập địa chỉ email hợp lệ." |
| **TC10** | Email sai định dạng (thiếu tên miền) | • Vai trò: "Quản lý"<br>• Email: "admin@" hoặc "admin@vn"<br>• Mật khẩu: "Admin@123" | 1. Chọn vai trò "Quản lý"<br>2. Nhập Email sai cú pháp tên miền<br>3. Nhấn "ĐĂNG NHẬP" | Hiển thị lỗi: "Vui lòng nhập địa chỉ email hợp lệ." |
| **TC11** | Mật khẩu ngắn hơn 6 ký tự | • Vai trò: "Quản lý"<br>• Email: "admin@routine.vn"<br>• Mật khẩu: "12345" (5 ký tự) | 1. Chọn vai trò "Quản lý"<br>2. Nhập Email đúng, nhập MK 5 ký tự<br>3. Nhấn "ĐĂNG NHẬP" | Hiển thị lỗi: "Mật khẩu phải có ít nhất 6 ký tự." |
| **TC12** | Email không tồn tại trong hệ thống | • Vai trò: "Quản lý"<br>• Email: "khongtontai@routine.vn"<br>• Mật khẩu: "Admin@123" | 1. Chọn vai trò "Quản lý"<br>2. Nhập Email chưa đăng ký<br>3. Nhấn "ĐĂNG NHẬP" | Hiển thị lỗi: "Email hoặc mật khẩu không chính xác." |
| **TC13** | Sai mật khẩu đăng nhập | • Vai trò: "Quản lý"<br>• Email: "admin@routine.vn" (đúng)<br>• Mật khẩu: "SaiMatKhau999" (sai) | 1. Chọn vai trò "Quản lý"<br>2. Nhập đúng Email, nhập sai Mật khẩu<br>3. Nhấn "ĐĂNG NHẬP" | Hiển thị lỗi: "Email hoặc mật khẩu không chính xác." |
| **TC14** | Chọn sai vai trò – Tài khoản Quản lý chọn thành Kế toán | • Vai trò chọn: "Kế toán"<br>• Email & MK: Thông tin của Quản lý | 1. Chọn vai trò "Kế toán"<br>2. Nhập Email và MK của Quản lý<br>3. Nhấn "ĐĂNG NHẬP" | Hiển thị lỗi: "Vai trò không khớp với tài khoản." |
| **TC15** | Chọn sai vai trò – Tài khoản Quản lý chọn thành NV bán hàng | • Vai trò chọn: "Nhân viên bán hàng"<br>• Email & MK: Thông tin của Quản lý | 1. Chọn vai trò "Nhân viên bán hàng"<br>2. Nhập Email và MK của Quản lý<br>3. Nhấn "ĐĂNG NHẬP" | Hiển thị lỗi: "Vai trò không khớp với tài khoản." |
| **TC16** | Chọn sai vai trò – Tài khoản Quản lý chọn thành NV kho | • Vai trò chọn: "Nhân viên kho"<br>• Email & MK: Thông tin của Quản lý | 1. Chọn vai trò "Nhân viên kho"<br>2. Nhập Email và MK của Quản lý<br>3. Nhấn "ĐĂNG NHẬP" | Hiển thị lỗi: "Vai trò không khớp với tài khoản." |

---

## Giải thích cơ sở thiết kế:

### 1. Tại sao ra được Bảng quyết định có 7 trường hợp (TH1 – TH7)?
* Hệ thống có **6 điều kiện logic**:
  1. Nhập đầy đủ Email và Mật khẩu.
  2. Đã chọn Vai trò.
  3. Email đúng định dạng.
  4. Mật khẩu hợp lệ (≥ 6 ký tự).
  5. Email và Mật khẩu khớp với dữ liệu CSDL.
  6. Vai trò người dùng chọn khớp với vai trò được gán cho tài khoản trong CSDL.
* Áp dụng nguyên tắc **kiểm tra lỗi tuần tự (Short-circuit / Fast-fail)**: Khi một điều kiện vi phạm ở bước trước, hệ thống lập tức báo lỗi và dừng xét các bước tiếp theo, ký hiệu các điều kiện sau là `-` (Không xét đến).
* Do đó, $2^6 = 64$ trường hợp toán học được rút gọn thành **7 trường hợp đại diện (TH1 đến TH7)** phủ kín toàn bộ các nhánh rẽ nghiệp vụ.

### 2. Tại sao lại có 16 Test Cases?
Từ 7 trường hợp logic của Bảng quyết định, Tester áp dụng thêm kỹ thuật **Phân vùng tương đương (Equivalence Partitioning)** và **Phân tích giá trị biên (Boundary Value Analysis)**:
* **Nhóm thành công (TH7):** Cần 4 test case (**TC01 - TC04**) để kiểm thử đăng nhập thành công cho cả **4 vai trò** khác nhau (Quản lý, Bán hàng, Kho, Kế toán), đảm bảo chuyển hướng đúng giao diện tương ứng.
* **Nhóm thiếu dữ liệu (TH1, TH2):** Cần 4 test case (**TC05 - TC08**) bao quát: thiếu Email, thiếu Mật khẩu, thiếu cả hai, và chưa chọn Vai trò.
* **Nhóm sai định dạng (TH3, TH4):** Cần 3 test case (**TC09 - TC11**) kiểm thử biên mật khẩu (5 ký tự < 6 ký tự) và các dạng email sai cú pháp.
* **Nhóm sai thông tin xác thực (TH5):** Cần 2 test case (**TC12, TC13**) kiểm thử tài khoản không tồn tại và sai mật khẩu.
* **Nhóm vai trò không khớp (TH6):** Cần 3 test case (**TC14 - TC16**) để kiểm tra khi tài khoản đăng nhập chọn sai chéo các vai trò khác nhau.
$\rightarrow$ Tổng cộng **16 Test Cases** đảm bảo độ bao phủ 100% các tình huống thực tế.
