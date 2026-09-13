# KIỂM THỬ CHỨC NĂNG THÊM KHÁCH HÀNG CỦA SALE (POS)

## Mô tả chức năng 

Chức năng cho phép người dùng (Nhân viên bán hàng, Quản lý) nhập thông tin khách hàng mới vào form thêm khách hàng tại quầy bán hàng (POS) để lưu trữ thông tin, phục vụ tích lũy điểm thưởng và tạo hóa đơn bán hàng. Sau khi người dùng nhấn nút "LƯU", hệ thống sẽ xử lý kiểm tra tính hợp lệ của dữ liệu, kiểm tra trùng lặp số điện thoại và email với cơ sở dữ liệu. Nếu hợp lệ, hệ thống sẽ lưu thông tin khách hàng mới vào cơ sở dữ liệu, hiển thị thông báo "Thêm khách hàng thành công" và tự động chọn khách hàng vào hóa đơn hiện tại. Trong trường hợp thông tin không hợp lệ hoặc đã tồn tại, hệ thống sẽ hiển thị thông báo lỗi cụ thể để người dùng chỉnh sửa.

---

## Đặc tả chức năng 

### Tên chức năng 

Thêm khách hàng 

### Mô tả 

Cho phép người dùng (Nhân viên bán hàng, Quản lý) tạo mới hồ sơ khách hàng ngay tại quầy POS một cách nhanh chóng bằng cách nhập các thông tin: Họ tên, Số điện thoại (bắt buộc) và Email, Địa chỉ, Tỉnh/Thành phố, Phường/Xã (tùy chọn).

### Tiền điều kiện 

Người dùng (Nhân viên bán hàng, Quản lý) đã đăng nhập vào hệ thống và đang ở giao diện Bán hàng POS (hoặc giao diện Quản lý khách hàng).

### Luồng chính 

1. Người dùng nhấn vào nút "+ THÊM KHÁCH MỚI". 
2. Hệ thống hiển thị hộp thoại (modal) "Thêm khách hàng mới". 
3. Người dùng nhập đầy đủ thông tin hợp lệ gồm: Họ tên, Số điện thoại (bắt buộc) và các thông tin tùy chọn (Email, Địa chỉ, Tỉnh/Thành phố, Phường/Xã). 
4. Người dùng nhấn nút "LƯU". 
5. Hệ thống kiểm tra tính hợp lệ của dữ liệu đầu vào (tính bắt buộc, định dạng SĐT, định dạng Email). 
6. Hệ thống gửi truy vấn đến CSDL để kiểm tra trùng lặp Số điện thoại và Email. 
7. Hệ thống lưu thông tin khách hàng mới vào cơ sở dữ liệu với hạng thành viên mặc định là REGULAR. 
8. Hệ thống đóng hộp thoại thêm khách hàng, hiển thị thông báo "Thêm khách hàng thành công" và tự động chọn khách hàng vừa thêm vào hóa đơn hiện tại. 

### Luồng phụ 

* Nếu người dùng để trống ô Họ tên và nhấn nút "LƯU". Hệ thống hiển thị thông báo "Vui lòng nhập họ tên khách hàng."
* Nếu người dùng để trống ô Số điện thoại và nhấn nút "LƯU". Hệ thống hiển thị thông báo "Vui lòng nhập số điện thoại."
* Nếu người dùng nhập Số điện thoại sai định dạng (dưới 10 số, trên 10 số, chứa chữ cái/ký tự đặc biệt hoặc đầu số không hợp lệ) và nhấn nút "LƯU". Hệ thống hiển thị thông báo "Số điện thoại không đúng định dạng hoặc độ dài (yêu cầu 10 chữ số, ví dụ 0912345678)."
* Nếu người dùng nhập Email sai định dạng (thiếu @ hoặc sai đuôi tên miền) và nhấn nút "LƯU". Hệ thống hiển thị thông báo "Email không đúng định dạng (ví dụ: khachhang@example.com)."
* Nếu Số điện thoại đã tồn tại trong hệ thống và nhấn nút "LƯU". Hệ thống hiển thị thông báo "Khách hàng đã tồn tại. Số điện thoại này đã có trong hệ thống."
* Nếu Email đã tồn tại trong hệ thống và nhấn nút "LƯU". Hệ thống hiển thị thông báo "Khách hàng đã tồn tại. Email này đã có trong hệ thống."
* Nếu người dùng nhấn nút "Huỷ" (hoặc nút đóng X). Hệ thống đóng hộp thoại thêm khách hàng, làm mới form và không lưu dữ liệu.

### Hậu điều kiện 

Thông tin khách hàng mới được lưu vào hệ thống và được tự động chọn vào hóa đơn hiện tại trên giao diện bán hàng POS.

---

## Ký hiệu quy ước:
•	T (True): Nhập đúng/ hợp lệ
•	F (False): Nhập sai/ không hợp lệ
•	- : Không xét đến bỏ qua điều kiện này.

---

## Bảng quyết định:

| Điều kiện | TH1 | TH2 | TH3 | TH4 | TH5 | TH6 | TH7 | TH8 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Nhập đầy đủ Họ tên | F | T | T | T | T | T | T | T |
| Nhập đầy đủ SĐT | - | F | T | T | T | T | T | T |
| SĐT đúng định dạng (10 số, đầu 0/+84) | - | - | F | T | T | T | T | T |
| Email đúng định dạng (nếu có nhập) | - | - | - | F | T | T | T | T |
| SĐT chưa tồn tại trong hệ thống | - | - | - | - | F | T | T | T |
| Email chưa tồn tại trong hệ thống | - | - | - | - | - | F | T | T |
| Có nhập thông tin Email | - | - | - | - | - | - | F | T |
| **Actions** | | | | | | | | |
| Báo lỗi: "Vui lòng nhập họ tên khách hàng." | X | | | | | | | |
| Báo lỗi: "Vui lòng nhập số điện thoại." | | X | | | | | | |
| Báo lỗi: "Số điện thoại không đúng định dạng..." | | | X | | | | | |
| Báo lỗi: "Email không đúng định dạng..." | | | | X | | | | |
| Báo lỗi: "Số điện thoại này đã có trong hệ thống." | | | | | X | | | |
| Báo lỗi: "Email này đã có trong hệ thống." | | | | | | X | | |
| Thêm khách hàng thành công (Chỉ có SĐT) | | | | | | | X | |
| Thêm khách hàng thành công (Đầy đủ SĐT & Email) | | | | | | | | X |
| Tự động chọn khách hàng vào hóa đơn POS | | | | | | | X | X |

---

## Bảng Test Case:

| TC ID | Tên test case | Dữ liệu nhập | Bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **TC01** | Thêm khách hàng thành công (Đầy đủ thông tin) | Họ tên: "Nguyễn Văn An"<br>SĐT: "0912345678" (chưa có trong DB)<br>Email: "nguyenvanan@gmail.com"<br>Địa chỉ: "123 Kim Mã"<br>Tỉnh/TP: "Hà Nội"<br>Phường/Xã: "Kim Mã" | 1. Nhấn nút "+ THÊM KHÁCH MỚI"<br>2. Nhập đầy đủ tất cả các trường hợp lệ<br>3. Nhấn nút "LƯU" | Đóng modal, hiển thị thông báo: "Thêm khách hàng thành công", tự động chọn khách hàng vào hóa đơn với hạng REGULAR |
| **TC02** | Thêm khách hàng thành công (Chỉ nhập trường bắt buộc) | Họ tên: "Trần Thị Bình"<br>SĐT: "0987654321" (chưa có trong DB)<br>Email, Địa chỉ: Để trống | 1. Nhấn nút "+ THÊM KHÁCH MỚI"<br>2. Chỉ nhập Họ tên và SĐT<br>3. Nhấn nút "LƯU" | Đóng modal, hiển thị thông báo: "Thêm khách hàng thành công", lưu thành công không bắt buộc Email/Địa chỉ |
| **TC03** | Thêm thành công với SĐT định dạng quốc tế +84 | Họ tên: "Phạm Quốc Bảo"<br>SĐT: "+84934567890"<br>Các trường khác: Tùy chọn | 1. Nhấn nút "+ THÊM KHÁCH MỚI"<br>2. Nhập Họ tên và SĐT có tiền tố +84<br>3. Nhấn nút "LƯU" | Đóng modal, hiển thị thông báo: "Thêm khách hàng thành công" |
| **TC04** | Thiếu thông tin Họ tên | Để trống Họ tên, SĐT: "0912345678" | 1. Nhấn nút "+ THÊM KHÁCH MỚI"<br>2. Bỏ trống Họ tên, nhập SĐT<br>3. Nhấn nút "LƯU" | Hiển thị lỗi: "Vui lòng nhập họ tên khách hàng." |
| **TC05** | Họ tên chỉ chứa khoảng trắng | Nhập Họ tên: "   ", SĐT: "0912345678" | 1. Nhấn nút "+ THÊM KHÁCH MỚI"<br>2. Nhập khoảng trắng vào Họ tên, nhập SĐT<br>3. Nhấn nút "LƯU" | Hiển thị lỗi: "Vui lòng nhập họ tên khách hàng." |
| **TC06** | Thiếu thông tin Số điện thoại | Họ tên: "Lê Hoàng Cường", để trống SĐT | 1. Nhấn nút "+ THÊM KHÁCH MỚI"<br>2. Nhập Họ tên, bỏ trống SĐT<br>3. Nhấn nút "LƯU" | Hiển thị lỗi: "Vui lòng nhập số điện thoại." |
| **TC07** | Bỏ trống cả Họ tên và Số điện thoại | Để trống cả Họ tên và SĐT | 1. Nhấn nút "+ THÊM KHÁCH MỚI"<br>2. Bỏ trống toàn bộ form<br>3. Nhấn nút "LƯU" | Hiển thị lỗi: "Vui lòng nhập họ tên khách hàng." |
| **TC08** | SĐT ngắn hơn 10 chữ số | Họ tên: "Phạm Văn Dũng"<br>SĐT: "091234567" (9 số) | 1. Nhấn nút "+ THÊM KHÁCH MỚI"<br>2. Nhập SĐT thiếu chữ số<br>3. Nhấn nút "LƯU" | Hiển thị lỗi: "Số điện thoại không đúng định dạng hoặc độ dài (yêu cầu 10 chữ số, ví dụ 0912345678)." |
| **TC09** | SĐT dài hơn 10 chữ số | Họ tên: "Phạm Văn Dũng"<br>SĐT: "091234567890" (12 số) | 1. Nhấn nút "+ THÊM KHÁCH MỚI"<br>2. Nhập SĐT thừa chữ số<br>3. Nhấn nút "LƯU" | Hiển thị lỗi: "Số điện thoại không đúng định dạng hoặc độ dài (yêu cầu 10 chữ số, ví dụ 0912345678)." |
| **TC10** | SĐT chứa chữ cái hoặc ký tự đặc biệt | Họ tên: "Vũ Minh Đức"<br>SĐT: "091234abcd" hoặc "09123@#456" | 1. Nhấn nút "+ THÊM KHÁCH MỚI"<br>2. Nhập SĐT có chữ hoặc ký tự lạ<br>3. Nhấn nút "LƯU" | Hiển thị lỗi: "Số điện thoại không đúng định dạng hoặc độ dài (yêu cầu 10 chữ số, ví dụ 0912345678)." |
| **TC11** | SĐT có đầu số không hợp lệ | Họ tên: "Đỗ Thu Hà"<br>SĐT: "1234567890" (không bắt đầu bằng 0 hoặc +84) | 1. Nhấn nút "+ THÊM KHÁCH MỚI"<br>2. Nhập SĐT đầu 12<br>3. Nhấn nút "LƯU" | Hiển thị lỗi: "Số điện thoại không đúng định dạng hoặc độ dài (yêu cầu 10 chữ số, ví dụ 0912345678)." |
| **TC12** | Email sai định dạng (Thiếu @) | Họ tên: "Hoàng Văn Em"<br>SĐT: "0911223344"<br>Email: "hoangvanemgmail.com" | 1. Nhấn nút "+ THÊM KHÁCH MỚI"<br>2. Nhập Email thiếu @<br>3. Nhấn nút "LƯU" | Hiển thị lỗi: "Email không đúng định dạng (ví dụ: khachhang@example.com)." |
| **TC13** | Email sai định dạng (Thiếu đuôi tên miền) | Họ tên: "Hoàng Văn Em"<br>SĐT: "0911223344"<br>Email: "hoangvanem@gmail" | 1. Nhấn nút "+ THÊM KHÁCH MỚI"<br>2. Nhập Email thiếu .com/.vn<br>3. Nhấn nút "LƯU" | Hiển thị lỗi: "Email không đúng định dạng (ví dụ: khachhang@example.com)." |
| **TC14** | Số điện thoại đã tồn tại | Họ tên: "Nguyễn Khách Cũ"<br>SĐT: "0901234567" (đã có trong hệ thống) | 1. Nhấn nút "+ THÊM KHÁCH MỚI"<br>2. Nhập SĐT đã có của khách khác<br>3. Nhấn nút "LƯU" | Hiển thị lỗi: "Khách hàng đã tồn tại. Số điện thoại này đã có trong hệ thống." |
| **TC15** | Email đã tồn tại | Họ tên: "Lê Khách Cũ"<br>SĐT: "0933445566" (mới)<br>Email: "khach@routine.vn" (đã có trong hệ thống) | 1. Nhấn nút "+ THÊM KHÁCH MỚI"<br>2. Nhập Email đã có của khách khác<br>3. Nhấn nút "LƯU" | Hiển thị lỗi: "Khách hàng đã tồn tại. Email này đã có trong hệ thống." |
| **TC16** | Hủy thêm khách hàng mới | Đang nhập dở Họ tên "Đặng Văn H", SĐT "0977..." | 1. Nhấn nút "+ THÊM KHÁCH MỚI"<br>2. Nhập một số thông tin dở dang<br>3. Nhấn nút "Huỷ" | Đóng hộp thoại thêm khách hàng, làm mới form và không lưu dữ liệu |
