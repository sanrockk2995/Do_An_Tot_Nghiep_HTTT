# ROUTINE — Hệ thống quản lý bán quần áo thời trang

Hệ thống quản lý cửa hàng bán lẻ thời trang **Routine**, gồm:

- **Website bán hàng online** cho khách hàng: xem sản phẩm, tìm kiếm, giỏ hàng, yêu thích, đánh giá, đặt hàng, theo dõi đơn.
- **Hệ thống quản trị nội bộ** cho 4 vai trò nhân sự: Quản lý (ADMIN), Nhân viên bán hàng (SALES_STAFF), Thủ kho (WAREHOUSE_STAFF), Kế toán (ACCOUNTANT) — với POS bán tại quầy, quản lý sản phẩm/kho/kiểm kê/khuyến mãi/NCC/nhân viên và báo cáo doanh thu.

> Kiến trúc: Spring Boot MVC 3 tầng (Controller → Service → Repository/Entity), RESTful `/api/v1/**`, JWT (access + refresh), BCrypt, MySQL + Flyway; frontend ReactJS (React Router theo role, Axios + interceptor tự refresh token, Context API). Toàn bộ giao diện tiếng Việt.

---

## 1. Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Backend | Java 17, Spring Boot 3.3.4 (Web, Data JPA, Security, Validation), Lombok |
| Bảo mật | JWT HS256 (jjwt 0.12.6): access token 30 phút + refresh token 7 ngày (httpOnly cookie `routine_refresh_token`); BCrypt cho mật khẩu; `@PreAuthorize` phân quyền theo role |
| CSDL | MySQL 8, Flyway migration (19 bảng đúng đặc tả + dữ liệu mẫu) |
| API docs | Springdoc OpenAPI (Swagger UI tại `/swagger-ui.html`) |
| Hóa đơn | OpenPDF — xuất PDF A5 tiếng Việt (font Roboto nhúng) |
| Frontend | ReactJS 18 (Vite), React Router v6, Axios, Recharts, Context API |

## 2. Yêu cầu môi trường

- JDK 17+
- Maven 3.9+ (đã kèm sẵn trong `tools/apache-maven-3.9.9/` của repo)
- Node.js 18+ & npm
- MySQL/MariaDB đang chạy ở `10.216.1.218:3306`, user `sanrockk` / mật khẩu `1` (có thể đổi bằng biến môi trường, xem mục cấu hình)

## 3. Chạy backend

```bash
cd backend
mvn spring-boot:run
```

Backend chạy tại **http://localhost:8080**. Lần chạy đầu Flyway sẽ tự:

1. Tạo database `routine_db` (`createDatabaseIfNotExist=true`)
2. Tạo đủ **19 bảng** (`V1__init_schema.sql`)
3. Nhập **dữ liệu mẫu** (`V2__seed_data.sql`): tài khoản từng vai trò, 6 danh mục, 9 sản phẩm + 24 biến thể, khách hàng, NCC, khuyến mãi, đơn hàng hoàn tất…

Cấu hình kết nối qua biến môi trường (tuỳ chọn):

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `DB_HOST` / `DB_PORT` / `DB_NAME` | `10.216.1.218` / `3306` / `routine_db` | Địa chỉ MySQL/MariaDB và tên CSDL |
| `DB_USER` / `DB_PASSWORD` | `sanrockk` / `1` | Tài khoản MySQL |
| `JWT_SECRET` | chuỗi dev mặc định | Khóa ký JWT (khuyến nghị đổi khi triển khai thật) |
| `SERVER_PORT` | `8080` (trong `application.yml`) | Port backend |

Swagger UI: http://localhost:8080/swagger-ui.html

## 4. Chạy frontend

```bash
cd frontend
npm install
npm run dev
```

Mở **http://localhost:5173**. Vite đã cấu hình proxy `/api` → `http://localhost:8080` nên không cần CORS thủ công khi dev.

Build production: `npm run build` (kết quả ở `frontend/dist/`).

## 5. Triển khai bằng Docker & Docker Compose (Server Production)

Hệ thống đã được đóng gói toàn diện với Docker và tích hợp **GitHub Actions CI/CD** tự động build và xuất bản Docker Images lên **GitHub Packages (GHCR - GitHub Container Registry)**:
- **Backend Image**: `ghcr.io/sanrockk2995/routine-backend:latest`
- **Frontend Image**: `ghcr.io/sanrockk2995/routine-frontend:latest`
- **Database**: Mặc định kết nối trực tiếp MySQL Server tại `10.216.1.218:3306` (hoặc kích hoạt MySQL cục bộ qua profile `local-db`).

### 5.1. Yêu cầu trên Server
- Docker Engine (v24+)
- Docker Compose (v2+)

### 5.2. Các bước triển khai

1. **Clone repository về server:**
   ```bash
   git clone https://github.com/sanrockk2995/Do_An_Tot_Nghiep_HTTT.git
   cd Do_An_Tot_Nghiep_HTTT
   ```

2. **Cấu hình biến môi trường:**
   ```bash
   cp .env.example .env
   # Điều chỉnh thông tin nếu cần (mặc định đã kết nối 10.216.1.218)
   nano .env
   ```

3. **Khởi chạy hệ thống:**
   - **Cách 1: Kéo trực tiếp Image đã build sẵn từ GitHub Packages (Nhanh nhất, không tốn RAM build trên server):**
     ```bash
     # Đăng nhập GHCR (nếu repo private):
     # echo $CR_PAT | docker login ghcr.io -u sanrockk2995 --password-stdin
     docker compose pull
     docker compose up -d
     ```
   - **Cách 2: Tự build image trực tiếp từ mã nguồn trên server:**
     ```bash
     docker compose up -d --build
     ```

4. **Kiểm tra trạng thái container và logs:**
   ```bash
   # Xem trạng thái các container (backend và frontend có status Up / healthy)
   docker compose ps

   # Theo dõi log thời gian thực backend
   docker compose logs -f backend
   ```

5. **Truy cập hệ thống:**
   - **Giao diện Website & Quản trị**: `http://<IP_SERVER>:81` (hoặc Port đã cấu hình trong `.env`)
   - **Backend API & Swagger UI**: `http://<IP_SERVER>:8080/swagger-ui.html`
   - *Lưu ý*: Nginx frontend đã được cấu hình Reverse Proxy chuyển tiếp toàn bộ yêu cầu `/api/**` về container Backend, đồng thời hỗ trợ SPA routing và nén Gzip.

6. **Cập nhật phiên bản mới khi có code mới:**
   ```bash
   git pull origin main
   docker compose pull
   docker compose up -d
   ```

7. **Dọn dẹp build cũ của riêng dự án (không ảnh hưởng Docker khác):**
   ```bash
   # Dừng container và chỉ xóa image của riêng dự án này
   docker compose down --rmi local

   # Xây dựng lại mới hoàn toàn (nếu cần)
   docker compose up -d --build --no-cache
   ```

8. **Dừng hệ thống:**
   ```bash
   docker compose down
   ```

## 6. Tài khoản mẫu (mật khẩu chung: `123456`)

### Nhân viên — đăng nhập tại `/staff-login` (phải chọn đúng vai trò)

| Vai trò | Email | Trang chủ sau đăng nhập |
|---|---|---|
| ADMIN (Quản lý) | `admin@routine.vn` | `/admin` |
| SALES_STAFF (NV bán hàng) | `sales@routine.vn` | `/pos` |
| WAREHOUSE_STAFF (Thủ kho) | `kho@routine.vn` | `/warehouse` |
| ACCOUNTANT (Kế toán) | `keToan@routine.vn` | `/accounting` |

> ⚠️ Đặc tả yêu cầu: form đăng nhập có chọn vai trò; nếu vai trò chọn không khớp vai trò trong DB thì hệ thống **từ chối đăng nhập**.

### Khách hàng — đăng nhập tại `/login`

- `linh@example.com` / `123456`
- Hoặc tự đăng ký tại `/register`.

### Mã khuyến mãi mẫu

- `SALE10` — giảm 10% (tối đa 100.000₫)
- `GIAM50K` — giảm cố định 50.000₫ cho đơn từ 500.000₫

## 7. Chức năng chính theo vai trò

| Nhóm | Chức năng |
|---|---|
| **Khách hàng** | Xem/tìm kiếm/lọc sản phẩm, chi tiết SP + biến thể size/màu, giỏ hàng, yêu thích, đánh giá (chỉ ai đã mua mới được đánh giá "đã xác thực"), đặt hàng online (COD/chuyển khoản/thẻ), áp mã giảm giá, xem "Đơn hàng của tôi", trung tâm hỗ trợ |
| **ADMIN** | Toàn quyền: tổng quan + biểu đồ doanh thu, POS bán tại quầy, sản phẩm (CRUD + biến thể + xoá mềm), khách hàng + lịch sử mua + hạng thành viên, đơn hàng online (duyệt trạng thái), kho (nhập/xuất/báo cáo tồn), kiểm kê (chốt tồn → nhập thực tế → điều chỉnh + chênh lệch), khuyến mãi, nhà cung cấp, nhân viên (vô hiệu hoá), tra cứu hóa đơn + tải PDF |
| **NV bán hàng** | POS tạo hóa đơn nhanh (khách thành viên tích điểm / khách lẻ), tra cứu khách hàng, áp mã khuyến mãi, xử lý đơn online, tra cứu hóa đơn |
| **Thủ kho** | Phiếu nhập kho (duyệt → cộng tồn + cập nhật giá vốn), phiếu xuất kho (kiểm tra tồn → duyệt → trừ tồn), kiểm kê, báo cáo tồn kho (lọc sắp hết hàng) |
| **Kế toán** | Báo cáo doanh thu theo ngày/tháng/năm + lọc khoảng thời gian, biểu đồ xu hướng, tra cứu hóa đơn PDF |

Quy tắc nghiệp vụ nổi bật:

- Đặt hàng trừ tồn kho ngay; **huỷ đơn được hoàn lại tồn kho**.
- Đơn `CASH` bán `OFFLINE` chuyển thẳng `COMPLETED`; đơn online đi qua PENDING → CONFIRMED → SHIPPING → COMPLETED.
- Hoàn tất đơn cộng doanh thu + tổng chi tiêu cho khách và **tự nâng hạng**: SILVER ≥ 5tr · GOLD ≥ 20tr · VIP ≥ 50tr.
- Khuyến mãi hỗ trợ PERCENT (giới hạn mức giảm tối đa) và FIXED_AMOUNT, kiểm tra thời gian/lượt dùng/giá trị đơn tối thiểu/phạm vi sản phẩm.

## 7. Cấu trúc thư mục

```
├── backend/
│   └── src/main/
│       ├── java/com/routine/
│       │   ├── config/        # Security, CORS, OpenAPI, JwtConfig…
│       │   ├── controller/    # REST /api/v1/**
│       │   ├── dto/           # Request/Response DTO
│       │   ├── entity/        # 19 entity JPA
│       │   ├── exception/     # Xử lý lỗi tập trung
│       │   ├── repository/    # Spring Data JPA
│       │   ├── security/      # JWT filter, provider, principal
│       │   └── service/       # Logic nghiệp vụ
│       └── resources/
│           ├── application.yml
│           ├── db/migration/  # V1 schema 19 bảng, V2 seed
│           └── fonts/Roboto-Regular.ttf
├── frontend/
│   └── src/
│       ├── components/        # ProductCard…
│       ├── context/           # AuthContext, CartContext
│       ├── layouts/           # StoreLayout (khách), AdminLayout (sidebar tối)
│       ├── pages/auth|customer|admin/
│       ├── services/api.js    # Axios + tự refresh token
│       ├── styles/global.css  # Design system (ui-ux-pro-max)
│       └── utils/format.js    # formatVND, nhãn trạng thái…
└── tools/                     # Maven + local .m2 (không bắt buộc)
```

## 8. API chính (`/api/v1`)

| Nhóm | Endpoint tiêu biểu |
|---|---|
| Auth | `POST /auth/login` (staff + role), `/auth/customer-login`, `/auth/register`, `/auth/refresh-token`, `/auth/logout` |
| Sản phẩm | `GET /products`, `/products/search`, `/products/{id}` (công khai); CRUD `/admin/products` (ADMIN); danh mục `/categories` |
| Đơn hàng | `POST /orders` (đã đăng nhập), `GET /orders` (staff), `PUT /orders/{id}/status`, `GET /orders/{id}/invoice` (PDF) |
| Khách hàng | `GET/POST /customers` (staff), `/customers/me` (customer) |
| Kho | `/suppliers`, `/phieu-nhap-kho(+/{id}/duyet)`, `/phieu-xuat-kho(+/{id}/duyet)`, `/kiem-ke(+/{id}/hoan-thanh)`, `/reports/inventory` |
| Khuyến mãi | CRUD `/promotions` (ADMIN), `POST /promotions/apply` |
| Khách dùng | `/cart-items`, `/wishlist-items`, `/reviews` |
| Báo cáo | `/reports/overview`, `/reports/revenue?group=day|month|year`, `/reports/best-selling`, `/reports/low-stock` |
| Nhân viên | `GET /users`, `PUT /users/{id}/active` (ADMIN) |
