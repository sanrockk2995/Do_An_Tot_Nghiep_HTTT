const fs = require('fs');

function buildUrl(rawUrl) {
  const qIdx = rawUrl.indexOf('?');
  const pathStr = qIdx !== -1 ? rawUrl.substring(0, qIdx) : rawUrl;
  const queryStr = qIdx !== -1 ? rawUrl.substring(qIdx + 1) : '';

  const cleanPath = pathStr.replace('{{baseUrl}}', '').replace(/^\/+/, '');
  const pathSegments = cleanPath.split('/').filter(Boolean);

  const res = {
    raw: rawUrl,
    host: ['{{baseUrl}}'],
    path: pathSegments
  };

  if (queryStr) {
    res.query = queryStr.split('&').map(pair => {
      const eqIdx = pair.indexOf('=');
      if (eqIdx !== -1) {
        return {
          key: pair.substring(0, eqIdx),
          value: pair.substring(eqIdx + 1)
        };
      }
      return { key: pair, value: '' };
    });
  }

  return res;
}

function reqItem({ name, method = 'GET', url, headers = [], body = null, auth = null, tests = [], preRequest = null }) {
  const item = {
    name,
    request: {
      method,
      header: [...headers],
      url: buildUrl(url)
    }
  };

  if (body) {
    item.request.body = {
      mode: 'raw',
      raw: typeof body === 'string' ? body : JSON.stringify(body, null, 4),
      options: {
        raw: {
          language: 'json'
        }
      }
    };
    if (!item.request.header.some(h => h.key.toLowerCase() === 'content-type')) {
      item.request.header.push({
        key: 'Content-Type',
        value: 'application/json',
        type: 'text'
      });
    }
  }

  if (auth) {
    item.request.auth = {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: auth,
          type: 'string'
        }
      ]
    };
  }

  const events = [];
  if (preRequest && preRequest.length > 0) {
    events.push({
      listen: 'prerequest',
      script: {
        exec: preRequest,
        type: 'text/javascript'
      }
    });
  }

  if (tests && tests.length > 0) {
    events.push({
      listen: 'test',
      script: {
        exec: tests,
        type: 'text/javascript'
      }
    });
  }

  if (events.length > 0) {
    item.event = events;
  }

  return item;
}

// ==================== COLLECTION DEFINITION ====================
const collection = {
  info: {
    _postman_id: "8f5a11d8-4f26-4ee1-b94d-2a3b4e789901",
    name: "ROUTINE - Hệ Thống Quản Lý Bán Quần Áo Thời Trang API (Full Automated Tests)",
    description: "Bộ Postman Collection kiểm thử tự động 100% REST API dự án Đồ án tốt nghiệp Hệ thống thông tin ROUTINE.\nBao gồm 11 phân hệ nghiệp vụ chuẩn RESTful với đầy đủ kịch bản kiểm thử (Assertions), tự động truyền biến môi trường Token và IDs.\n\n### 🚀 Hướng dẫn chạy tự động:\n1. Backend chạy tại: `http://localhost:8080`\n2. Mật khẩu mẫu đồng bộ cho tất cả tài khoản: `123456`\n3. Chạy qua Postman Collection Runner hoặc lệnh Newman CLI:\n   `npx newman run ROUTINE_API_Postman_Collection.json`",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:8080", type: "string" },
    { key: "admin_token", value: "", type: "string" },
    { key: "admin_refresh_token", value: "", type: "string" },
    { key: "sales_token", value: "", type: "string" },
    { key: "warehouse_token", value: "", type: "string" },
    { key: "accountant_token", value: "", type: "string" },
    { key: "customer_token", value: "", type: "string" },
    { key: "customer_refresh_token", value: "", type: "string" },
    { key: "new_customer_token", value: "", type: "string" },
    { key: "staff_email", value: "staff_temp@routine.vn", type: "string" },
    { key: "staff_phone", value: "0910000001", type: "string" },
    { key: "created_user_id", value: "2", type: "string" },
    { key: "created_category_id", value: "1", type: "string" },
    { key: "created_product_id", value: "1", type: "string" },
    { key: "created_variant_id", value: "1", type: "string" },
    { key: "created_customer_id", value: "1", type: "string" },
    { key: "created_order_id", value: "1", type: "string" },
    { key: "online_order_id", value: "1", type: "string" },
    { key: "cancel_order_id", value: "1", type: "string" },
    { key: "created_supplier_id", value: "1", type: "string" },
    { key: "created_receipt_id", value: "1", type: "string" },
    { key: "created_issue_id", value: "1", type: "string" },
    { key: "created_stocktake_id", value: "1", type: "string" },
    { key: "created_promotion_id", value: "1", type: "string" },
    { key: "cart_item_id", value: "1", type: "string" },
    { key: "payroll_id", value: "1", type: "string" }
  ],
  item: []
};

// ==================== 01. AUTH & XÁC THỰC ====================
collection.item.push({
  name: "01. Auth & Xác thực",
  description: "Các API xác thực phân vai (RBAC) với JWT token, đăng nhập đa vai trò, đăng ký, refresh token, đổi mật khẩu và đăng xuất.",
  item: [
    reqItem({
      name: "1.1 Đăng nhập ADMIN (Quản trị)",
      method: "POST",
      url: "{{baseUrl}}/api/v1/auth/login",
      body: {
        email: "admin@routine.vn",
        password: "123456",
        role: "ADMIN"
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về Access Token và vai trò ADMIN", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("accessToken");',
        '    pm.expect(data.role).to.eql("ADMIN");',
        '    pm.collectionVariables.set("admin_token", data.accessToken);',
        '    if (data.refreshToken) {',
        '        pm.collectionVariables.set("admin_refresh_token", data.refreshToken);',
        '    }',
        '});'
      ]
    }),
    reqItem({
      name: "1.2 Đăng nhập SALES_STAFF (Nhân viên bán hàng)",
      method: "POST",
      url: "{{baseUrl}}/api/v1/auth/login",
      body: {
        email: "sales@routine.vn",
        password: "123456",
        role: "SALES_STAFF"
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về Access Token vai trò SALES_STAFF", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("accessToken");',
        '    pm.expect(data.role).to.eql("SALES_STAFF");',
        '    pm.collectionVariables.set("sales_token", data.accessToken);',
        '});'
      ]
    }),
    reqItem({
      name: "1.3 Đăng nhập WAREHOUSE_STAFF (Thủ kho)",
      method: "POST",
      url: "{{baseUrl}}/api/v1/auth/login",
      body: {
        email: "kho@routine.vn",
        password: "123456",
        role: "WAREHOUSE_STAFF"
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về Access Token vai trò WAREHOUSE_STAFF", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("accessToken");',
        '    pm.expect(data.role).to.eql("WAREHOUSE_STAFF");',
        '    pm.collectionVariables.set("warehouse_token", data.accessToken);',
        '});'
      ]
    }),
    reqItem({
      name: "1.4 Đăng nhập ACCOUNTANT (Kế toán)",
      method: "POST",
      url: "{{baseUrl}}/api/v1/auth/login",
      body: {
        email: "keToan@routine.vn",
        password: "123456",
        role: "ACCOUNTANT"
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về Access Token vai trò ACCOUNTANT", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("accessToken");',
        '    pm.expect(data.role).to.eql("ACCOUNTANT");',
        '    pm.collectionVariables.set("accountant_token", data.accessToken);',
        '});'
      ]
    }),
    reqItem({
      name: "1.5 Đăng nhập Khách hàng",
      method: "POST",
      url: "{{baseUrl}}/api/v1/auth/customer-login",
      body: {
        email: "khach@routine.vn",
        password: "123456"
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về Access Token vai trò CUSTOMER", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("accessToken");',
        '    pm.expect(data.role).to.eql("CUSTOMER");',
        '    pm.collectionVariables.set("customer_token", data.accessToken);',
        '    if (data.refreshToken) {',
        '        pm.collectionVariables.set("customer_refresh_token", data.refreshToken);',
        '    }',
        '});'
      ]
    }),
    reqItem({
      name: "1.6 Đăng ký tài khoản Khách hàng mới",
      method: "POST",
      url: "{{baseUrl}}/api/v1/auth/register",
      preRequest: [
        'var uniqueSuffix = Date.now();',
        'pm.collectionVariables.set("register_email", "khach_" + uniqueSuffix + "@routine-test.vn");',
        'pm.collectionVariables.set("register_phone", "098" + String(uniqueSuffix).slice(-7));'
      ],
      body: {
        fullName: "Khách Hàng Kiểm Thử",
        phone: "{{register_phone}}",
        email: "{{register_email}}",
        password: "Password@123",
        address: "123 Nguyễn Trãi",
        district: "Thanh Xuân",
        city: "Hà Nội"
      },
      tests: [
        'pm.test("Status code is 201 Created", function () {',
        '    pm.response.to.have.status(201);',
        '});',
        'pm.test("Tự động đăng nhập và trả về Token khách hàng mới", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("accessToken");',
        '    pm.expect(data.role).to.eql("CUSTOMER");',
        '    pm.collectionVariables.set("new_customer_token", data.accessToken);',
        '});'
      ]
    }),
    reqItem({
      name: "1.7 Làm mới Access Token (Refresh Token)",
      method: "POST",
      url: "{{baseUrl}}/api/v1/auth/refresh-token",
      body: {
        refreshToken: "{{admin_refresh_token}}"
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Cấp mới Access Token thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("accessToken");',
        '    pm.expect(data.accessToken).to.be.a("string");',
        '});'
      ]
    }),
    reqItem({
      name: "1.8 Đổi mật khẩu tài khoản",
      method: "POST",
      url: "{{baseUrl}}/api/v1/auth/change-password",
      auth: "{{new_customer_token}}",
      body: {
        currentPassword: "Password@123",
        newPassword: "NewPassword@123",
        confirmPassword: "NewPassword@123"
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Đổi mật khẩu thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.message).to.eql("Đổi mật khẩu thành công");',
        '});'
      ]
    }),
    reqItem({
      name: "1.9 Đăng xuất",
      method: "POST",
      url: "{{baseUrl}}/api/v1/auth/logout",
      auth: "{{new_customer_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Đăng xuất thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.message).to.eql("Đăng xuất thành công");',
        '});'
      ]
    })
  ]
});

// ==================== 02. QUẢN LÝ NHÂN SỰ (USERS) ====================
collection.item.push({
  name: "02. Quản lý Nhân sự (Users)",
  description: "Các API quản lý tài khoản nhân viên nội bộ Routine (ADMIN), xem/sửa hồ sơ cá nhân /me, thêm nhân viên, đổi vai trò, khóa/mở tài khoản.",
  item: [
    reqItem({
      name: "2.1 Danh sách nhân viên (ADMIN)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/users",
      auth: "{{admin_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về danh sách nhân viên hợp lệ", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.be.an("array");',
        '    pm.expect(data.length).to.be.above(0);',
        '    pm.expect(data[0]).to.have.property("id");',
        '    pm.expect(data[0]).to.have.property("email");',
        '    pm.collectionVariables.set("created_user_id", String(data[0].id));',
        '});'
      ]
    }),
    reqItem({
      name: "2.2 Xem thông tin hồ sơ cá nhân nhân viên (/me)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/users/me",
      auth: "{{admin_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về hồ sơ cá nhân chính xác", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("id");',
        '    pm.expect(data.email).to.eql("admin@routine.vn");',
        '    pm.expect(data.role).to.eql("ADMIN");',
        '});'
      ]
    }),
    reqItem({
      name: "2.3 Cập nhật hồ sơ cá nhân nhân viên",
      method: "PUT",
      url: "{{baseUrl}}/api/v1/users/me",
      auth: "{{admin_token}}",
      body: {
        fullName: "Nguyễn Quản Lý",
        phone: "0901000001",
        branch: "Hà Nội"
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Thông tin cá nhân được cập nhật", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.fullName).to.eql("Nguyễn Quản Lý");',
        '});'
      ]
    }),
    reqItem({
      name: "2.4 Thêm nhân viên mới (ADMIN)",
      method: "POST",
      url: "{{baseUrl}}/api/v1/users",
      auth: "{{admin_token}}",
      preRequest: [
        'var uniqueSuffix = Date.now();',
        'var staffEmail = "staff_" + uniqueSuffix + "@routine.vn";',
        'var staffPhone = "091" + String(uniqueSuffix).slice(-7);',
        'pm.collectionVariables.set("staff_email", staffEmail);',
        'pm.collectionVariables.set("staff_phone", staffPhone);'
      ],
      body: {
        email: "{{staff_email}}",
        password: "Password@123",
        fullName: "Nhân Viên Kinh Doanh Mới",
        phone: "{{staff_phone}}",
        role: "SALES_STAFF",
        branch: "Hà Nội"
      },
      tests: [
        'pm.test("Status code is 201 Created", function () {',
        '    pm.response.to.have.status(201);',
        '});',
        'pm.test("Nhân viên mới được tạo thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("id");',
        '    pm.expect(data.role).to.eql("SALES_STAFF");',
        '    pm.collectionVariables.set("created_user_id", String(data.id));',
        '});'
      ]
    }),
    reqItem({
      name: "2.5 Cập nhật thông tin nhân viên (ADMIN)",
      method: "PUT",
      url: "{{baseUrl}}/api/v1/users/{{created_user_id}}",
      auth: "{{admin_token}}",
      body: {
        email: "{{staff_email}}",
        fullName: "Nhân Viên Kinh Doanh (Đã sửa)",
        phone: "{{staff_phone}}",
        role: "SALES_STAFF",
        branch: "TP.HCM"
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Cập nhật thông tin nhân viên thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.fullName).to.eql("Nhân Viên Kinh Doanh (Đã sửa)");',
        '    pm.expect(data.branch).to.eql("TP.HCM");',
        '});'
      ]
    }),
    reqItem({
      name: "2.6 Khóa / Mở khóa tài khoản nhân viên (ADMIN)",
      method: "PUT",
      url: "{{baseUrl}}/api/v1/users/{{created_user_id}}/active",
      auth: "{{admin_token}}",
      body: {
        isActive: true
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trạng thái kích hoạt được cập nhật", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.isActive).to.eql(true);',
        '});'
      ]
    })
  ]
});

// ==================== 03. DANH MỤC SẢN PHẨM (CATEGORIES) ====================
collection.item.push({
  name: "03. Danh mục sản phẩm (Categories)",
  description: "Quản lý cây danh mục sản phẩm Routine, tra cứu công khai và CRUD danh mục dành cho Quản trị viên (ADMIN).",
  item: [
    reqItem({
      name: "3.1 Lấy danh sách danh mục (Công khai)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/categories",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về danh sách danh mục sản phẩm", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.be.an("array");',
        '    pm.expect(data.length).to.be.above(0);',
        '    pm.expect(data[0]).to.have.property("id");',
        '    pm.expect(data[0]).to.have.property("name");',
        '    pm.expect(data[0]).to.have.property("slug");',
        '    pm.collectionVariables.set("created_category_id", String(data[0].id));',
        '});'
      ]
    }),
    reqItem({
      name: "3.2 Tạo danh mục mới (ADMIN)",
      method: "POST",
      url: "{{baseUrl}}/api/v1/categories",
      auth: "{{admin_token}}",
      preRequest: [
        'var uniqueSuffix = Date.now();',
        'pm.collectionVariables.set("category_name", "Danh Mục Mới " + uniqueSuffix);',
        'pm.collectionVariables.set("category_slug", "danh-muc-moi-" + uniqueSuffix);'
      ],
      body: {
        name: "{{category_name}}",
        slug: "{{category_slug}}",
        description: "Danh mục kiểm thử tự động Postman",
        icon: "tag",
        displayOrder: 10
      },
      tests: [
        'pm.test("Status code is 201 Created", function () {',
        '    pm.response.to.have.status(201);',
        '});',
        'pm.test("Tạo danh mục thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("id");',
        '    pm.collectionVariables.set("created_category_id", String(data.id));',
        '});'
      ]
    }),
    reqItem({
      name: "3.3 Cập nhật danh mục (ADMIN)",
      method: "PUT",
      url: "{{baseUrl}}/api/v1/categories/{{created_category_id}}",
      auth: "{{admin_token}}",
      preRequest: [
        'var uniqueSuffix = Date.now();',
        'pm.collectionVariables.set("category_updated_name", "Danh Mục Cập Nhật " + uniqueSuffix);'
      ],
      body: {
        name: "{{category_updated_name}}",
        description: "Mô tả danh mục sau khi cập nhật",
        icon: "shirt",
        displayOrder: 5
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Cập nhật danh mục thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.name).to.include("Danh Mục Cập Nhật");',
        '});'
      ]
    }),
    reqItem({
      name: "3.4 Xóa mềm danh mục (ADMIN)",
      method: "DELETE",
      url: "{{baseUrl}}/api/v1/categories/{{created_category_id}}",
      auth: "{{admin_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Xóa danh mục thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("message");',
        '});'
      ]
    })
  ]
});

// ==================== 04. SẢN PHẨM & BIẾN THỂ (PRODUCTS) ====================
collection.item.push({
  name: "04. Sản phẩm & Biến thể (Products)",
  description: "Tra cứu sản phẩm, tìm kiếm, lọc phân trang, sản phẩm nổi bật, quản trị sản phẩm và biến thể (size, màu, tồn kho).",
  item: [
    reqItem({
      name: "4.1 Danh sách sản phẩm (Công khai - lọc, phân trang)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/products?page=0&size=12&sort=newest",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về trang danh sách sản phẩm", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("content");',
        '    pm.expect(data.content).to.be.an("array");',
        '    if (data.content.length > 0) {',
        '        pm.collectionVariables.set("created_product_id", String(data.content[0].id));',
        '    }',
        '});'
      ]
    }),
    reqItem({
      name: "4.2 Tìm kiếm sản phẩm theo từ khóa",
      method: "GET",
      url: "{{baseUrl}}/api/v1/products/search?q=áo&page=0&size=10",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về kết quả tìm kiếm sản phẩm", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("content");',
        '    pm.expect(data.content).to.be.an("array");',
        '});'
      ]
    }),
    reqItem({
      name: "4.3 Sản phẩm nổi bật (Featured / Carousel)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/products/featured",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về danh sách sản phẩm nổi bật", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.be.an("array");',
        '});'
      ]
    }),
    reqItem({
      name: "4.4 Chi tiết sản phẩm theo ID",
      method: "GET",
      url: "{{baseUrl}}/api/v1/products/{{created_product_id}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về chi tiết sản phẩm hợp lệ kèm biến thể", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("id");',
        '    pm.expect(data).to.have.property("name");',
        '    pm.expect(data).to.have.property("price");',
        '    pm.expect(data).to.have.property("variants");',
        '    pm.expect(data.variants).to.be.an("array");',
        '});'
      ]
    }),
    reqItem({
      name: "4.5 Danh sách sản phẩm quản trị (ADMIN/STAFF)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/admin/products?page=0&size=20",
      auth: "{{admin_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về danh sách sản phẩm quản trị đầy đủ", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("content");',
        '    pm.expect(data.content).to.be.an("array");',
        '});'
      ]
    }),
    reqItem({
      name: "4.6 Thêm sản phẩm mới kèm biến thể (ADMIN)",
      method: "POST",
      url: "{{baseUrl}}/api/v1/products",
      auth: "{{admin_token}}",
      preRequest: [
        'var uniqueSuffix = Date.now();',
        'pm.collectionVariables.set("product_code", "SP" + String(uniqueSuffix).slice(-5));',
        'pm.collectionVariables.set("product_name", "Sản phẩm Postman " + uniqueSuffix);',
        'pm.collectionVariables.set("product_sku", "SKU-" + uniqueSuffix);'
      ],
      body: {
        code: "{{product_code}}",
        name: "{{product_name}}",
        categoryId: 1,
        description: "Mô tả sản phẩm tạo từ Postman Collection",
        price: 450000,
        costPrice: 200000,
        oldPrice: 500000,
        stock: 50,
        minStock: 10,
        sku: "{{product_sku}}",
        material: "Cotton 100%",
        fit: "Regular",
        season: "Summer",
        targetGender: "UNISEX",
        badge: "NEW",
        variants: [
          {
            size: "M",
            color: "Xanh Navy",
            stock: 25,
            sku: "{{product_sku}}-M-NAVY"
          },
          {
            size: "L",
            color: "Xanh Navy",
            stock: 25,
            sku: "{{product_sku}}-L-NAVY"
          }
        ]
      },
      tests: [
        'pm.test("Status code is 201 Created", function () {',
        '    pm.response.to.have.status(201);',
        '});',
        'pm.test("Tạo sản phẩm thành công và lưu ID", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("id");',
        '    pm.expect(data.name).to.include("Sản phẩm Postman");',
        '    pm.collectionVariables.set("created_product_id", String(data.id));',
        '});'
      ]
    }),
    reqItem({
      name: "4.7 Cập nhật thông tin sản phẩm (ADMIN)",
      method: "PUT",
      url: "{{baseUrl}}/api/v1/products/{{created_product_id}}",
      auth: "{{admin_token}}",
      body: {
        code: "{{product_code}}",
        name: "Sản phẩm Postman (Đã cập nhật)",
        categoryId: 1,
        description: "Mô tả đã được cập nhật qua API",
        price: 480000,
        costPrice: 210000,
        oldPrice: 550000,
        stock: 60,
        minStock: 15,
        sku: "{{product_sku}}",
        material: "Cotton pha Linen",
        fit: "Slim",
        season: "All Season",
        targetGender: "MALE",
        badge: "HOT"
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Cập nhật thông tin sản phẩm thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.name).to.eql("Sản phẩm Postman (Đã cập nhật)");',
        '    pm.expect(data.price).to.eql(480000);',
        '});'
      ]
    }),
    reqItem({
      name: "4.8 Thêm biến thể mới vào sản phẩm (ADMIN)",
      method: "POST",
      url: "{{baseUrl}}/api/v1/products/{{created_product_id}}/variants",
      auth: "{{admin_token}}",
      body: [
        {
          size: "XL",
          color: "Đen",
          stock: 30,
          sku: "VAR-XL-DEN"
        }
      ],
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Thêm biến thể thành công và lưu ID biến thể", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("variants");',
        '    var added = data.variants.find(function(v) { return v.size === "XL" && v.color === "Đen"; });',
        '    pm.expect(added).to.not.be.undefined;',
        '    if (added && added.id) {',
        '        pm.collectionVariables.set("created_variant_id", String(added.id));',
        '    }',
        '});'
      ]
    }),
    reqItem({
      name: "4.9 Xóa biến thể sản phẩm (ADMIN)",
      method: "DELETE",
      url: "{{baseUrl}}/api/v1/products/{{created_product_id}}/variants/{{created_variant_id}}",
      auth: "{{admin_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Xóa biến thể sản phẩm thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("message");',
        '});'
      ]
    }),
    reqItem({
      name: "4.10 Xóa mềm sản phẩm (ADMIN)",
      method: "DELETE",
      url: "{{baseUrl}}/api/v1/products/{{created_product_id}}",
      auth: "{{admin_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Xóa mềm sản phẩm thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("message");',
        '});'
      ]
    })
  ]
});

// ==================== 05. KHÁCH HÀNG & HỒ SƠ (CUSTOMERS) ====================
collection.item.push({
  name: "05. Khách hàng & Hồ sơ (Customers)",
  description: "Tra cứu khách hàng, thêm/sửa khách hàng (UC Thêm khách hàng cho Staff), lịch sử mua hàng, và hồ sơ cá nhân /me của khách.",
  item: [
    reqItem({
      name: "5.1 Tra cứu / Danh sách khách hàng (Staff)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/customers?page=0&size=10",
      auth: "{{sales_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về danh sách khách hàng", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("content");',
        '    pm.expect(data.content).to.be.an("array");',
        '    if (data.content.length > 0) {',
        '        pm.collectionVariables.set("created_customer_id", String(data.content[0].id));',
        '    }',
        '});'
      ]
    }),
    reqItem({
      name: "5.2 Thêm khách hàng mới (Staff - UC Thêm khách hàng)",
      method: "POST",
      url: "{{baseUrl}}/api/v1/customers",
      auth: "{{sales_token}}",
      preRequest: [
        'var uniqueSuffix = Date.now();',
        'pm.collectionVariables.set("cust_phone", "097" + String(uniqueSuffix).slice(-7));',
        'pm.collectionVariables.set("cust_email", "khach_" + uniqueSuffix + "@gmail.com");'
      ],
      body: {
        fullName: "Nguyễn Thu Hà",
        phone: "{{cust_phone}}",
        email: "{{cust_email}}",
        address: "88 Trần Duy Hưng",
        district: "Cầu Giấy",
        city: "Hà Nội",
        tier: "REGULAR"
      },
      tests: [
        'pm.test("Status code is 201 Created", function () {',
        '    pm.response.to.have.status(201);',
        '});',
        'pm.test("Thêm khách hàng thành công và lưu ID", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("id");',
        '    pm.expect(data.fullName).to.eql("Nguyễn Thu Hà");',
        '    pm.collectionVariables.set("created_customer_id", String(data.id));',
        '});'
      ]
    }),
    reqItem({
      name: "5.3 Chi tiết thông tin khách hàng",
      method: "GET",
      url: "{{baseUrl}}/api/v1/customers/{{created_customer_id}}",
      auth: "{{sales_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về chi tiết khách hàng chính xác", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("id");',
        '    pm.expect(data).to.have.property("fullName");',
        '    pm.expect(data).to.have.property("tier");',
        '});'
      ]
    }),
    reqItem({
      name: "5.4 Cập nhật thông tin khách hàng (Staff)",
      method: "PUT",
      url: "{{baseUrl}}/api/v1/customers/{{created_customer_id}}",
      auth: "{{sales_token}}",
      body: {
        fullName: "Nguyễn Thu Hà (VIP)",
        phone: "{{cust_phone}}",
        email: "{{cust_email}}",
        address: "99 Trần Duy Hưng",
        district: "Cầu Giấy",
        city: "Hà Nội",
        tier: "SILVER"
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Cập nhật khách hàng thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.fullName).to.eql("Nguyễn Thu Hà (VIP)");',
        '    pm.expect(data.tier).to.eql("SILVER");',
        '});'
      ]
    }),
    reqItem({
      name: "5.5 Lịch sử đơn hàng của khách",
      method: "GET",
      url: "{{baseUrl}}/api/v1/customers/1/orders?page=0&size=10",
      auth: "{{sales_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về lịch sử đơn hàng của khách", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("content");',
        '    pm.expect(data.content).to.be.an("array");',
        '});'
      ]
    }),
    reqItem({
      name: "5.6 Khách hàng xem hồ sơ chính mình (/me)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/me",
      auth: "{{customer_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Hồ sơ khách hàng hợp lệ", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("id");',
        '    pm.expect(data.email).to.eql("khach@routine.vn");',
        '});'
      ]
    }),
    reqItem({
      name: "5.7 Khách hàng cập nhật hồ sơ cá nhân",
      method: "PUT",
      url: "{{baseUrl}}/api/v1/me/profile",
      auth: "{{customer_token}}",
      body: {
        fullName: "Ngô Thị Khách",
        phone: "0933000001",
        address: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội"
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Cập nhật hồ sơ cá nhân thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.fullName).to.eql("Ngô Thị Khách");',
        '});'
      ]
    })
  ]
});

// ==================== 06. GIỎ HÀNG, YÊU THÍCH & ĐÁNH GIÁ ====================
collection.item.push({
  name: "06. Giỏ hàng, Yêu thích & Đánh giá (Cart & Reviews)",
  description: "Các chức năng trải nghiệm mua sắm của khách hàng: giỏ hàng (Cart), danh sách yêu thích (Wishlist) và viết/xem đánh giá sản phẩm (Reviews).",
  item: [
    reqItem({
      name: "6.1 Xem giỏ hàng cá nhân",
      method: "GET",
      url: "{{baseUrl}}/api/v1/cart-items",
      auth: "{{customer_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Giỏ hàng trả về mảng danh sách mặt hàng", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.be.an("array");',
        '});'
      ]
    }),
    reqItem({
      name: "6.2 Thêm sản phẩm vào giỏ hàng",
      method: "POST",
      url: "{{baseUrl}}/api/v1/cart-items",
      auth: "{{customer_token}}",
      body: {
        productId: 1,
        size: "M",
        color: "Trắng",
        quantity: 2
      },
      tests: [
        'pm.test("Status code is 201 Created", function () {',
        '    pm.response.to.have.status(201);',
        '});',
        'pm.test("Thêm vào giỏ thành công và lưu ID mặt hàng", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.be.an("array");',
        '    pm.expect(data.length).to.be.above(0);',
        '    if (data[0].id) {',
        '        pm.collectionVariables.set("cart_item_id", String(data[0].id));',
        '    }',
        '});'
      ]
    }),
    reqItem({
      name: "6.3 Cập nhật số lượng mặt hàng trong giỏ",
      method: "PUT",
      url: "{{baseUrl}}/api/v1/cart-items/{{cart_item_id}}",
      auth: "{{customer_token}}",
      body: {
        quantity: 3
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Cập nhật số lượng giỏ hàng thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.be.an("array");',
        '});'
      ]
    }),
    reqItem({
      name: "6.4 Xóa mặt hàng khỏi giỏ",
      method: "DELETE",
      url: "{{baseUrl}}/api/v1/cart-items/{{cart_item_id}}",
      auth: "{{customer_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Xóa mặt hàng khỏi giỏ thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("message");',
        '});'
      ]
    }),
    reqItem({
      name: "6.5 Xem danh sách sản phẩm yêu thích (Wishlist)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/wishlist-items",
      auth: "{{customer_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Wishlist trả về danh sách hợp lệ", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.be.an("array");',
        '});'
      ]
    }),
    reqItem({
      name: "6.6 Thêm sản phẩm vào Wishlist",
      method: "POST",
      url: "{{baseUrl}}/api/v1/wishlist-items",
      auth: "{{customer_token}}",
      body: {
        productId: 1
      },
      tests: [
        'pm.test("Status code is 201 Created", function () {',
        '    pm.response.to.have.status(201);',
        '});',
        'pm.test("Thêm vào wishlist thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.be.an("array");',
        '});'
      ]
    }),
    reqItem({
      name: "6.7 Bỏ sản phẩm khỏi Wishlist",
      method: "DELETE",
      url: "{{baseUrl}}/api/v1/wishlist-items/1",
      auth: "{{customer_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Bỏ khỏi wishlist thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("message");',
        '});'
      ]
    }),
    reqItem({
      name: "6.8 Xem đánh giá của một sản phẩm (Công khai)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/products/1/reviews?page=0&size=10",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Danh sách đánh giá có trường content", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("content");',
        '    pm.expect(data.content).to.be.an("array");',
        '});'
      ]
    }),
    reqItem({
      name: "6.9 Gửi đánh giá sản phẩm (Khách hàng)",
      method: "POST",
      url: "{{baseUrl}}/api/v1/products/{{created_product_id}}/reviews",
      auth: "{{customer_token}}",
      body: {
        rating: 5,
        comment: "Áo sơ mi mặc rất đứng form, chất vải thoáng mát và đường may kỹ lưỡng!"
      },
      tests: [
        'pm.test("Status code is 201 Created", function () {',
        '    pm.response.to.have.status(201);',
        '});',
        'pm.test("Đánh giá sản phẩm thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.rating).to.eql(5);',
        '});'
      ]
    })
  ]
});

// ==================== 07. ĐƠN HÀNG & HÓA ĐƠN (ORDERS) ====================
collection.item.push({
  name: "07. Đơn hàng & Hóa đơn (Orders)",
  description: "Tạo đơn hàng tại quầy (POS), đặt hàng online, quản lý trạng thái đơn hàng, khách hàng tự hủy đơn và xuất hóa đơn PDF chuẩn.",
  item: [
    reqItem({
      name: "7.1 Tạo đơn hàng mới (POS / Bán tại quầy)",
      method: "POST",
      url: "{{baseUrl}}/api/v1/orders",
      auth: "{{sales_token}}",
      body: {
        customerId: 1,
        channel: "OFFLINE",
        paymentMethod: "CASH",
        items: [
          {
            productId: 1,
            size: "M",
            color: "Trắng",
            quantity: 1
          }
        ],
        notes: "Đơn bán tại quầy Routine Store"
      },
      tests: [
        'pm.test("Status code is 201 Created", function () {',
        '    pm.response.to.have.status(201);',
        '});',
        'pm.test("Tạo đơn hàng thành công và lưu mã đơn", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("id");',
        '    pm.expect(data).to.have.property("orderNumber");',
        '    pm.collectionVariables.set("created_order_id", String(data.id));',
        '});'
      ]
    }),
    reqItem({
      name: "7.2 Danh sách đơn hàng (Staff)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/orders?page=0&size=10",
      auth: "{{sales_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về danh sách đơn hàng phân trang", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("content");',
        '    pm.expect(data.content).to.be.an("array");',
        '});'
      ]
    }),
    reqItem({
      name: "7.3 Đơn hàng của tôi (Khách online)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/orders/my-orders?page=0&size=10",
      auth: "{{customer_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về lịch sử đơn hàng của khách hàng", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("content");',
        '    pm.expect(data.content).to.be.an("array");',
        '});'
      ]
    }),
    reqItem({
      name: "7.4 Chi tiết đơn hàng",
      method: "GET",
      url: "{{baseUrl}}/api/v1/orders/{{created_order_id}}",
      auth: "{{sales_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Chi tiết đơn hàng đầy đủ mặt hàng", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("id");',
        '    pm.expect(data).to.have.property("items");',
        '    pm.expect(data.items).to.be.an("array");',
        '});'
      ]
    }),
    reqItem({
      name: "7.5 Tạo đơn hàng ONLINE (Chờ xác nhận)",
      method: "POST",
      url: "{{baseUrl}}/api/v1/orders",
      auth: "{{customer_token}}",
      body: {
        channel: "ONLINE",
        paymentMethod: "COD",
        items: [
          {
            productId: 1,
            size: "M",
            color: "Trắng",
            quantity: 1
          }
        ],
        notes: "Đơn hàng online chờ xác nhận"
      },
      tests: [
        'pm.test("Status code is 201 Created", function () {',
        '    pm.response.to.have.status(201);',
        '});',
        'pm.test("Tạo đơn online PENDING thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.status).to.eql("PENDING");',
        '    pm.collectionVariables.set("online_order_id", String(data.id));',
        '});'
      ]
    }),
    reqItem({
      name: "7.6 Cập nhật trạng thái đơn hàng (Staff)",
      method: "PUT",
      url: "{{baseUrl}}/api/v1/orders/{{online_order_id}}/status",
      auth: "{{sales_token}}",
      body: {
        status: "CONFIRMED"
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trạng thái đơn hàng cập nhật thành CONFIRMED", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.status).to.eql("CONFIRMED");',
        '});'
      ]
    }),
    reqItem({
      name: "7.7 Tạo đơn hàng ONLINE để test khách hủy đơn",
      method: "POST",
      url: "{{baseUrl}}/api/v1/orders",
      auth: "{{customer_token}}",
      body: {
        channel: "ONLINE",
        paymentMethod: "COD",
        items: [
          {
            productId: 1,
            size: "L",
            color: "Trắng",
            quantity: 1
          }
        ],
        notes: "Đơn thử nghiệm hủy"
      },
      tests: [
        'pm.test("Status code is 201 Created", function () {',
        '    pm.response.to.have.status(201);',
        '});',
        'pm.test("Tạo đơn hàng chờ hủy", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.status).to.eql("PENDING");',
        '    pm.collectionVariables.set("cancel_order_id", String(data.id));',
        '});'
      ]
    }),
    reqItem({
      name: "7.8 Khách hàng tự hủy đơn hàng ONLINE",
      method: "PUT",
      url: "{{baseUrl}}/api/v1/orders/{{cancel_order_id}}/cancel",
      auth: "{{customer_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Đơn hàng được chuyển sang trạng thái CANCELLED", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.status).to.eql("CANCELLED");',
        '});'
      ]
    }),
    reqItem({
      name: "7.9 Xuất hóa đơn bán hàng PDF (In ấn)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/orders/{{created_order_id}}/invoice",
      auth: "{{sales_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về định dạng tệp PDF hóa đơn", function () {',
        '    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/pdf");',
        '});'
      ]
    })
  ]
});

// ==================== 08. KHUYẾN MÃI & VOUCHER (PROMOTIONS) ====================
collection.item.push({
  name: "08. Khuyến mãi & Voucher (Promotions)",
  description: "Quản lý chương trình khuyến mãi, mã giảm giá voucher phần trăm/tiền mặt, áp dụng tính chiết khấu đơn hàng.",
  item: [
    reqItem({
      name: "8.1 Danh sách chương trình khuyến mãi (Staff)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/promotions",
      auth: "{{sales_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về danh sách khuyến mãi", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.be.an("array");',
        '    pm.expect(data.length).to.be.above(0);',
        '    pm.collectionVariables.set("created_promotion_id", String(data[0].id));',
        '});'
      ]
    }),
    reqItem({
      name: "8.2 Thêm chương trình khuyến mãi mới (ADMIN)",
      method: "POST",
      url: "{{baseUrl}}/api/v1/promotions",
      auth: "{{admin_token}}",
      preRequest: [
        'var uniqueSuffix = Date.now();',
        'pm.collectionVariables.set("promo_code", "KM" + String(uniqueSuffix).slice(-6));'
      ],
      body: {
        code: "{{promo_code}}",
        name: "Giảm giá đặc biệt Postman",
        description: "Voucher tự động tạo qua test script",
        type: "PERCENT",
        discountValue: 15,
        maxDiscountAmount: 50000,
        minOrderAmount: 200000,
        startDate: "2026-09-01T00:00:00",
        endDate: "2026-09-30T23:59:59",
        usageLimit: 100,
        applyToAllProducts: true,
        productIds: []
      },
      tests: [
        'pm.test("Status code is 201 Created", function () {',
        '    pm.response.to.have.status(201);',
        '});',
        'pm.test("Tạo khuyến mãi thành công và lưu ID", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("id");',
        '    pm.collectionVariables.set("created_promotion_id", String(data.id));',
        '});'
      ]
    }),
    reqItem({
      name: "8.3 Chi tiết chương trình khuyến mãi",
      method: "GET",
      url: "{{baseUrl}}/api/v1/promotions/{{created_promotion_id}}",
      auth: "{{sales_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Chi tiết khuyến mãi chính xác", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("id");',
        '    pm.expect(data).to.have.property("code");',
        '    pm.expect(data).to.have.property("discountValue");',
        '});'
      ]
    }),
    reqItem({
      name: "8.4 Cập nhật chương trình khuyến mãi (ADMIN)",
      method: "PUT",
      url: "{{baseUrl}}/api/v1/promotions/{{created_promotion_id}}",
      auth: "{{admin_token}}",
      body: {
        code: "{{promo_code}}",
        name: "Giảm giá đặc biệt (Đã sửa)",
        description: "Mô tả khuyến mãi cập nhật",
        type: "PERCENT",
        discountValue: 20,
        maxDiscountAmount: 70000,
        minOrderAmount: 250000,
        startDate: "2026-09-01T00:00:00",
        endDate: "2026-09-30T23:59:59",
        usageLimit: 200,
        applyToAllProducts: true,
        productIds: []
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Cập nhật khuyến mãi thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.name).to.eql("Giảm giá đặc biệt (Đã sửa)");',
        '    pm.expect(data.discountValue).to.eql(20);',
        '});'
      ]
    }),
    reqItem({
      name: "8.5 Kiểm tra & áp dụng mã giảm giá (/apply)",
      method: "POST",
      url: "{{baseUrl}}/api/v1/promotions/apply",
      auth: "{{customer_token}}",
      body: {
        code: "SALE10",
        orderAmount: 500000,
        productIds: [1]
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Tính số tiền giảm giá chính xác", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("discountAmount");',
        '    pm.expect(data.discountAmount).to.be.above(0);',
        '});'
      ]
    }),
    reqItem({
      name: "8.6 Xóa chương trình khuyến mãi (ADMIN)",
      method: "DELETE",
      url: "{{baseUrl}}/api/v1/promotions/{{created_promotion_id}}",
      auth: "{{admin_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Xóa khuyến mãi thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("message");',
        '});'
      ]
    })
  ]
});

// ==================== 09. QUẢN LÝ KHO & KIỂM KÊ (INVENTORY) ====================
collection.item.push({
  name: "09. Quản lý Kho & Kiểm kê (Inventory)",
  description: "Quản lý nhà cung cấp, lập và duyệt phiếu nhập kho, phiếu xuất kho, đợt kiểm kê cân đối tồn và báo cáo tồn kho.",
  item: [
    reqItem({
      name: "9.1 Danh sách nhà cung cấp (Suppliers)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/suppliers",
      auth: "{{warehouse_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về danh sách nhà cung cấp", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.be.an("array");',
        '    pm.expect(data.length).to.be.above(0);',
        '    pm.collectionVariables.set("created_supplier_id", String(data[0].id));',
        '});'
      ]
    }),
    reqItem({
      name: "9.2 Thêm nhà cung cấp mới",
      method: "POST",
      url: "{{baseUrl}}/api/v1/suppliers",
      auth: "{{warehouse_token}}",
      preRequest: [
        'var uniqueSuffix = Date.now();',
        'pm.collectionVariables.set("supplier_code", "NCC" + String(uniqueSuffix).slice(-5));',
        'pm.collectionVariables.set("supplier_name", "Công Ty Dệt May " + uniqueSuffix);',
        'pm.collectionVariables.set("supplier_phone", "0918" + String(uniqueSuffix).slice(-6));',
        'pm.collectionVariables.set("supplier_email", "ncc_" + uniqueSuffix + "@textile.vn");'
      ],
      body: {
        maNcc: "{{supplier_code}}",
        tenNcc: "{{supplier_name}}",
        diaChi: "Khu Công Nghiệp Sóng Thần, Bình Dương",
        soDienThoai: "{{supplier_phone}}",
        email: "{{supplier_email}}",
        nguoiLienHe: "Anh Hoàng",
        ghiChu: "Nhà cung cấp vải và áo thun xuất khẩu"
      },
      tests: [
        'pm.test("Status code is 201 Created", function () {',
        '    pm.response.to.have.status(201);',
        '});',
        'pm.test("Tạo nhà cung cấp thành công và lưu ID", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("id");',
        '    pm.collectionVariables.set("created_supplier_id", String(data.id));',
        '});'
      ]
    }),
    reqItem({
      name: "9.3 Cập nhật thông tin nhà cung cấp",
      method: "PUT",
      url: "{{baseUrl}}/api/v1/suppliers/{{created_supplier_id}}",
      auth: "{{warehouse_token}}",
      body: {
        maNcc: "{{supplier_code}}",
        tenNcc: "Công Ty Dệt May (Đã cập nhật)",
        diaChi: "Khu Công Nghiệp VSIP, Bình Dương",
        soDienThoai: "0918999888",
        email: "ncc.updated@textile.vn",
        nguoiLienHe: "Anh Hoàng Quản Lý",
        ghiChu: "Đối tác chiến lược"
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Cập nhật nhà cung cấp thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.tenNcc).to.eql("Công Ty Dệt May (Đã cập nhật)");',
        '});'
      ]
    }),
    reqItem({
      name: "9.4 Xóa / Vô hiệu hóa nhà cung cấp (ADMIN)",
      method: "DELETE",
      url: "{{baseUrl}}/api/v1/suppliers/{{created_supplier_id}}",
      auth: "{{admin_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Vô hiệu hóa nhà cung cấp thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("message");',
        '});'
      ]
    }),
    reqItem({
      name: "9.5 Danh sách phiếu nhập kho (Goods Receipts)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/goods-receipts",
      auth: "{{warehouse_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về danh sách phiếu nhập kho", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.be.an("array");',
        '    if (data.length > 0) {',
        '        pm.collectionVariables.set("created_receipt_id", String(data[0].id));',
        '    }',
        '});'
      ]
    }),
    reqItem({
      name: "9.6 Tạo phiếu nhập kho mới",
      method: "POST",
      url: "{{baseUrl}}/api/v1/goods-receipts",
      auth: "{{warehouse_token}}",
      body: {
        nhaCungCapId: 1,
        ghiChu: "Nhập bổ sung hàng hè Routine",
        chiTiet: [
          {
            productId: 1,
            soLuongNhap: 20,
            giaNhap: 180000,
            ghiChu: "Áo sơ mi size M"
          }
        ]
      },
      tests: [
        'pm.test("Status code is 201 Created", function () {',
        '    pm.response.to.have.status(201);',
        '});',
        'pm.test("Tạo phiếu nhập thành công và lưu ID", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("id");',
        '    pm.expect(data).to.have.property("maPhieuNhap");',
        '    pm.collectionVariables.set("created_receipt_id", String(data.id));',
        '});'
      ]
    }),
    reqItem({
      name: "9.7 Duyệt phiếu nhập kho (Tăng tồn kho & giá vốn)",
      method: "PUT",
      url: "{{baseUrl}}/api/v1/goods-receipts/{{created_receipt_id}}/approve",
      auth: "{{warehouse_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Phiếu nhập được chuyển sang trạng thái APPROVED", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.trangThai).to.eql("APPROVED");',
        '});'
      ]
    }),
    reqItem({
      name: "9.8 Xuất Excel phiếu nhập kho",
      method: "GET",
      url: "{{baseUrl}}/api/v1/goods-receipts/{{created_receipt_id}}/export",
      auth: "{{warehouse_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về tệp Excel hợp lệ", function () {',
        '    pm.expect(pm.response.headers.get("Content-Type")).to.include("spreadsheetml.sheet");',
        '});'
      ]
    }),
    reqItem({
      name: "9.9 Danh sách phiếu xuất kho (Goods Issues)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/goods-issues",
      auth: "{{warehouse_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về danh sách phiếu xuất kho", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.be.an("array");',
        '    if (data.length > 0) {',
        '        pm.collectionVariables.set("created_issue_id", String(data[0].id));',
        '    }',
        '});'
      ]
    }),
    reqItem({
      name: "9.10 Tạo phiếu xuất kho mới",
      method: "POST",
      url: "{{baseUrl}}/api/v1/goods-issues",
      auth: "{{warehouse_token}}",
      body: {
        lyDoXuat: "TRA_NCC",
        ghiChu: "Xuất kho tự động Postman",
        chiTiet: [
          {
            productId: 1,
            soLuongXuat: 2,
            ghiChu: "Trả mẫu hàng lỗi"
          }
        ]
      },
      tests: [
        'pm.test("Status code is 201 Created", function () {',
        '    pm.response.to.have.status(201);',
        '});',
        'pm.test("Tạo phiếu xuất thành công và lưu ID", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("id");',
        '    pm.expect(data).to.have.property("maPhieuXuat");',
        '    pm.collectionVariables.set("created_issue_id", String(data.id));',
        '});'
      ]
    }),
    reqItem({
      name: "9.11 Duyệt phiếu xuất kho (Trừ tồn kho)",
      method: "PUT",
      url: "{{baseUrl}}/api/v1/goods-issues/{{created_issue_id}}/approve",
      auth: "{{warehouse_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Phiếu xuất chuyển sang APPROVED", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.trangThai).to.eql("APPROVED");',
        '});'
      ]
    }),
    reqItem({
      name: "9.12 Xuất Excel phiếu xuất kho",
      method: "GET",
      url: "{{baseUrl}}/api/v1/goods-issues/{{created_issue_id}}/export",
      auth: "{{warehouse_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về tệp Excel phiếu xuất hợp lệ", function () {',
        '    pm.expect(pm.response.headers.get("Content-Type")).to.include("spreadsheetml.sheet");',
        '});'
      ]
    }),
    reqItem({
      name: "9.13 Danh sách đợt kiểm kê kho (Stocktakes)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/stocktakes",
      auth: "{{warehouse_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về danh sách đợt kiểm kê", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.be.an("array");',
        '    if (data.length > 0) {',
        '        pm.collectionVariables.set("created_stocktake_id", String(data[0].id));',
        '    }',
        '});'
      ]
    }),
    reqItem({
      name: "9.14 Chi tiết đợt kiểm kê kho theo ID",
      method: "GET",
      url: "{{baseUrl}}/api/v1/stocktakes/{{created_stocktake_id}}",
      auth: "{{warehouse_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Chi tiết kiểm kê gồm danh sách mặt hàng", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("id");',
        '    pm.expect(data).to.have.property("maKiemKe");',
        '    pm.expect(data).to.have.property("chiTiet");',
        '});'
      ]
    }),
    reqItem({
      name: "9.15 Tạo đợt kiểm kê kho mới",
      method: "POST",
      url: "{{baseUrl}}/api/v1/stocktakes",
      auth: "{{warehouse_token}}",
      body: {
        ghiChu: "Đợt kiểm kê định kỳ tháng Routine",
        chiTiet: [
          {
            productId: 1,
            soLuongThucTe: 30,
            ghiChu: "Đếm thực tế"
          }
        ]
      },
      tests: [
        'pm.test("Status code is 201 Created", function () {',
        '    pm.response.to.have.status(201);',
        '});',
        'pm.test("Tạo đợt kiểm kê thành công và lưu ID", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("id");',
        '    pm.expect(data.trangThai).to.eql("DANG_KIEM");',
        '    pm.collectionVariables.set("created_stocktake_id", String(data.id));',
        '});'
      ]
    }),
    reqItem({
      name: "9.16 Hoàn thành kiểm kê kho (Cân đối tồn kho)",
      method: "PUT",
      url: "{{baseUrl}}/api/v1/stocktakes/{{created_stocktake_id}}/complete",
      auth: "{{warehouse_token}}",
      body: {
        chiTiet: [
          {
            productId: 1,
            soLuongThucTe: 30,
            ghiChu: "Chốt số lượng tồn kho thực tế"
          }
        ]
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Kiểm kê hoàn thành và chốt trạng thái HOAN_THANH", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.trangThai).to.eql("HOAN_THANH");',
        '});'
      ]
    }),
    reqItem({
      name: "9.17 Báo cáo tồn kho toàn hệ thống",
      method: "GET",
      url: "{{baseUrl}}/api/v1/reports/inventory?onlyLowStock=false",
      auth: "{{warehouse_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Báo cáo tồn kho chứa thông tin các sản phẩm", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.be.an("array");',
        '    if (data.length > 0) {',
        '        pm.expect(data[0]).to.have.property("code");',
        '        pm.expect(data[0]).to.have.property("stock");',
        '    }',
        '});'
      ]
    })
  ]
});

// ==================== 10. BẢNG LƯƠNG NHÂN VIÊN (PAYROLLS) ====================
collection.item.push({
  name: "10. Bảng lương nhân viên (Payrolls)",
  description: "Quản lý bảng lương nhân viên theo tháng/năm, tính lương theo hệ số/phụ cấp/thưởng/khấu trừ, duyệt lương và xuất file Excel.",
  item: [
    reqItem({
      name: "10.1 Bảng lương nhân viên theo tháng/năm",
      method: "GET",
      url: "{{baseUrl}}/api/v1/payrolls?thang=9&nam=2026",
      auth: "{{accountant_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Bảng lương trả về danh sách nhân viên và lưu ID dòng lương", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.be.an("array");',
        '    pm.expect(data.length).to.be.above(0);',
        '    pm.expect(data[0]).to.have.property("userId");',
        '    pm.expect(data[0]).to.have.property("tongLuong");',
        '    if (data[0].id) {',
        '        pm.collectionVariables.set("payroll_id", String(data[0].id));',
        '    }',
        '});'
      ]
    }),
    reqItem({
      name: "10.2 Cập nhật lương/thưởng/phụ cấp cho nhân viên",
      method: "PUT",
      url: "{{baseUrl}}/api/v1/payrolls/2?thang=9&nam=2026",
      auth: "{{accountant_token}}",
      body: {
        heSo: 1.2,
        phuCap: 500000,
        thuong: 300000,
        khauTru: 0
      },
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Cập nhật các khoản phụ cấp và thưởng thành công", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.heSo).to.eql(1.2);',
        '    pm.expect(data.phuCap).to.eql(500000);',
        '});'
      ]
    }),
    reqItem({
      name: "10.3 Duyệt dòng lương nhân viên",
      method: "PUT",
      url: "{{baseUrl}}/api/v1/payrolls/{{payroll_id}}/approve",
      auth: "{{accountant_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Dòng lương chuyển sang trạng thái DA_DUYET", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data.trangThai).to.eql("DA_DUYET");',
        '});'
      ]
    }),
    reqItem({
      name: "10.4 Xem tổng quỹ lương kỳ",
      method: "GET",
      url: "{{baseUrl}}/api/v1/payrolls/total-fund?thang=9&nam=2026",
      auth: "{{accountant_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về tổng quỹ lương", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("tongQuyLuong");',
        '});'
      ]
    }),
    reqItem({
      name: "10.5 Xuất Excel bảng lương tháng",
      method: "GET",
      url: "{{baseUrl}}/api/v1/payrolls/export?thang=9&nam=2026",
      auth: "{{accountant_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Xuất Excel bảng lương định dạng chuẩn", function () {',
        '    pm.expect(pm.response.headers.get("Content-Type")).to.include("spreadsheetml.sheet");',
        '});'
      ]
    })
  ]
});

// ==================== 11. BÁO CÁO & THỐNG KÊ (REPORTS) ====================
collection.item.push({
  name: "11. Báo cáo & Thống kê (Reports)",
  description: "Tổng quan doanh số, biểu đồ doanh thu theo chu kỳ, sản phẩm bán chạy nhất, cảnh báo tồn thấp, xuất Excel tài chính và in báo cáo PDF A4.",
  item: [
    reqItem({
      name: "11.1 Tổng quan chỉ số kinh doanh (/overview)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/reports/overview",
      auth: "{{admin_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về các chỉ số KPI kinh doanh chính", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.have.property("revenue");',
        '    pm.expect(data).to.have.property("orderCount");',
        '    pm.expect(data).to.have.property("customerCount");',
        '    pm.expect(data).to.have.property("lowStockCount");',
        '});'
      ]
    }),
    reqItem({
      name: "11.2 Biểu đồ doanh thu theo thời gian (day/month/year)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/reports/revenue?groupBy=day",
      auth: "{{accountant_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Dữ liệu chuỗi thời gian biểu đồ doanh thu", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.be.an("array");',
        '});'
      ]
    }),
    reqItem({
      name: "11.3 Top sản phẩm bán chạy nhất",
      method: "GET",
      url: "{{baseUrl}}/api/v1/reports/best-selling-products?limit=5",
      auth: "{{sales_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Danh sách sản phẩm bán chạy có tên và doanh thu", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.be.an("array");',
        '});'
      ]
    }),
    reqItem({
      name: "11.4 Cảnh báo sản phẩm sắp hết hàng (Low stock)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/reports/low-stock",
      auth: "{{warehouse_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về danh sách sản phẩm dưới định mức tồn", function () {',
        '    var data = pm.response.json();',
        '    pm.expect(data).to.be.an("array");',
        '});'
      ]
    }),
    reqItem({
      name: "11.5 Xuất báo cáo tài chính Excel",
      method: "GET",
      url: "{{baseUrl}}/api/v1/reports/financial/export?groupBy=day",
      auth: "{{accountant_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về tệp Excel báo cáo tài chính", function () {',
        '    pm.expect(pm.response.headers.get("Content-Type")).to.include("spreadsheetml.sheet");',
        '});'
      ]
    }),
    reqItem({
      name: "11.6 In báo cáo PDF chuẩn A4 (/print)",
      method: "GET",
      url: "{{baseUrl}}/api/v1/reports/print?type=doanh-thu&groupBy=day",
      auth: "{{admin_token}}",
      tests: [
        'pm.test("Status code is 200 OK", function () {',
        '    pm.response.to.have.status(200);',
        '});',
        'pm.test("Trả về tệp PDF in ấn chuẩn A4", function () {',
        '    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/pdf");',
        '});'
      ]
    })
  ]
});

// ==================== WRITE FILE ====================
fs.writeFileSync('ROUTINE_API_Postman_Collection.json', JSON.stringify(collection, null, 2), 'utf8');
console.log('Successfully generated ROUTINE_API_Postman_Collection.json');
