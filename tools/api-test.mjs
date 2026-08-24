// ===== KIỂM THỬ API TOÀN HỆ THỐNG ROUTINE =====
const BASE = 'http://localhost:8080/api/v1';
let pass = 0, fail = 0;
const failures = [];

function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; failures.push(`${name}${extra ? ` :: ${extra}` : ''}`); console.log(`  FAIL ${name} ${extra}`); }
}

async function req(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('json')) data = await res.json().catch(() => null);
  else data = await res.text();
  return { status: res.status, data };
}

// ---------- 1. AUTH ----------
console.log('\n== 1. XAC THUC ==');
const staffLogins = [
  ['admin@routine.vn', 'ADMIN'], ['sales@routine.vn', 'SALES_STAFF'],
  ['kho@routine.vn', 'WAREHOUSE_STAFF'], ['keToan@routine.vn', 'ACCOUNTANT'],
];
const tokens = {};
for (const [email, role] of staffLogins) {
  const r = await req('POST', '/auth/login', { body: { email, password: '123456', role } });
  check(`login ${email}/${role}`, r.status === 200 && r.data.accessToken);
  tokens[role] = r.data?.accessToken;
}
const custLogin = await req('POST', '/auth/customer-login', { body: { email: 'khach@routine.vn', password: '123456' } });
check('login khach@routine.vn (CUSTOMER)', custLogin.status === 200 && custLogin.data.accessToken);
tokens.CUSTOMER = custLogin.data?.accessToken;

const wrongRole = await req('POST', '/auth/login', { body: { email: 'admin@routine.vn', password: '123456', role: 'SALES_STAFF' } });
check('sai role -> bi tu choi', wrongRole.status === 401 || wrongRole.status === 400);
const badPass = await req('POST', '/auth/login', { body: { email: 'admin@routine.vn', password: 'sai-mat-khau', role: 'ADMIN' } });
check('sai mat khau -> 401', badPass.status === 401);
const refresh = await req('POST', '/auth/refresh-token', { body: {} });
check('refresh-token endpoint phan hoi', [200, 401].includes(refresh.status));

// ---------- 2. SAN PHAM & DANH MUC ----------
console.log('\n== 2. SAN PHAM & DANH MUC ==');
const products = await req('GET', '/products?page=0&size=20');
check('GET /products cong khai', products.status === 200 && Array.isArray(products.data.content));
check(`co san pham seed (${products.data.content?.length})`, products.data.content?.length >= 9);

const search = await req('GET', `/products/search?q=${encodeURIComponent('áo')}`);
check('GET /products/search?q=áo', search.status === 200 && search.data.content?.length >= 1);

// Chọn SP gốc từ seed (tránh SP tạo bởi các lần chạy trước - mã TST*/TEST99,
// thường đã cạn tồn kho do các đơn test) và phải còn tồn để đặt đơn.
const firstProduct =
  products.data.content.find((p) => !/^(TEST99|TST\d+)$/.test(p.code) && Number(p.stock) >= 10)
  || products.data.content.find((p) => Number(p.stock) >= 3)
  || products.data.content[0];
const pdetail = await req('GET', `/products/${firstProduct.id}`);
check('GET /products/{id} co variants', pdetail.status === 200 && pdetail.data.variants !== undefined);

const cats = await req('GET', '/categories');
check('GET /categories >= 6', cats.status === 200 && cats.data.length >= 6);

// admin CRUD san pham - backend dùng POST/PUT /products (ADMIN)
// Lưu ý: backend chỉ có XOÁ MỀM (status→INACTIVE, giữ nguyên mã) nên dùng
// mã duy nhất theo từng lần chạy để không dính ràng buộc unique(code).
const TEST_CODE = 'TST' + String(Date.now()).slice(-7);
const prodPayload = {
  code: TEST_CODE, name: 'San pham kiem thu', categoryId: cats.data[0].id,
  price: 199000, costPrice: 90000, minStock: 5,
  description: 'SP test tu dong', targetGender: 'UNISEX',
  variants: [{ size: 'M', color: 'Den', quantity: 10 }],
};
const newProd = await req('POST', '/products', { token: tokens.ADMIN, body: prodPayload });
check('POST /products tao SP moi (ADMIN)', newProd.status === 200 || newProd.status === 201, JSON.stringify(newProd.data).slice(0, 150));
const testProdId = newProd.data?.id;

if (testProdId) {
  const upd = await req('PUT', `/products/${testProdId}`, {
    token: tokens.ADMIN,
    body: { ...prodPayload, name: 'San pham kiem thu (da sua)' },
  });
  check('PUT /products/{id} sua SP', upd.status === 200, JSON.stringify(upd.data).slice(0, 150));

  const rev = await req('POST', `/products/${testProdId}/reviews`, {
    token: tokens.CUSTOMER, body: { rating: 5, comment: 'Rat dep, chat vai tot!' },
  });
  check('POST reviews khach danh gia', rev.status === 200 || rev.status === 201, JSON.stringify(rev.data).slice(0, 120));
  const getRev = await req('GET', `/products/${testProdId}/reviews`);
  check('GET reviews cua SP', getRev.status === 200 && Array.isArray(getRev.data.content));
}

// ---------- 3. KHUYEN MAI ----------
console.log('\n== 3. KHUYEN MAI ==');
const promos = await req('GET', '/promotions?page=0&size=10', { token: tokens.ADMIN });
check('GET /promotions', promos.status === 200);

const applyOk = await req('POST', '/promotions/apply', { token: tokens.CUSTOMER, body: { code: 'SALE10', orderAmount: 1000000 } });
check('ap ma SALE10 -> giam dung 10%', applyOk.status === 200 && applyOk.data.valid === true && Number(applyOk.data.discountAmount) === 100000, JSON.stringify(applyOk.data));
const applyMin = await req('POST', '/promotions/apply', { token: tokens.CUSTOMER, body: { code: 'GIAM50K', orderAmount: 50000 } });
check('ma co dieu kien xu dung (duoi min)', applyMin.status === 200);
const applyBad = await req('POST', '/promotions/apply', { token: tokens.CUSTOMER, body: { code: 'KHONGTONTAI', orderAmount: 1000000 } });
check('ma khong ton tai -> valid=false + message', applyBad.status === 200 && applyBad.data.valid === false);

// ---------- 4. GIO + WISHLIST ----------
console.log('\n== 4. GIO HANG & YEU THICH (CUSTOMER) ==');
const cartAdd = await req('POST', '/cart-items', {
  token: tokens.CUSTOMER,
  body: {
    productId: firstProduct.id, quantity: 2,
    size: firstProduct.variants?.[0]?.size, color: firstProduct.variants?.[0]?.color,
  },
});
check('POST /cart-items them gio', cartAdd.status === 200 || cartAdd.status === 201, JSON.stringify(cartAdd.data).slice(0, 150));

const cartGet = await req('GET', '/cart-items', { token: tokens.CUSTOMER });
check('GET /cart-items', cartGet.status === 200 && Array.isArray(cartGet.data));

const wlAdd = await req('POST', '/wishlist-items', {
  token: tokens.CUSTOMER, body: { productId: firstProduct.id },
});
check('them wishlist (POST /wishlist-items)', wlAdd.status === 200 || wlAdd.status === 201 || wlAdd.status === 204, String(wlAdd.status));
const wlGet = await req('GET', '/wishlist-items', { token: tokens.CUSTOMER });
check('GET /wishlist-items', wlGet.status === 200 && Array.isArray(wlGet.data));

// ---------- 5. LUONG DAT HANG ONLINE ----------
console.log('\n== 5. LUONG DAT HANG ONLINE ==');
const orderRes = await req('POST', '/orders', {
  token: tokens.CUSTOMER,
  body: {
    items: [{
      productId: firstProduct.id,
      size: firstProduct.variants?.[0]?.size,
      color: firstProduct.variants?.[0]?.color,
      quantity: 1,
    }],
    paymentMethod: 'COD', channel: 'ONLINE', promotionCode: 'SALE10',
    notes: 'Don test tu dong - giao gio hanh chinh',
  },
});
check('khach dat don ONLINE (COD + SALE10)', orderRes.status === 200 || orderRes.status === 201, JSON.stringify(orderRes.data).slice(0, 250));
const orderId = orderRes.data?.id;
check('don co giam gia > 0', Number(orderRes.data?.discount) > 0, `discount=${orderRes.data?.discount}`);

const myOrders = await req('GET', '/orders/my-orders', { token: tokens.CUSTOMER });
check('GET /orders/my-orders co don vua dat', myOrders.status === 200 && myOrders.data.content?.length >= 1);

for (const st of ['CONFIRMED', 'SHIPPING', 'COMPLETED']) {
  const up = await req('PUT', `/orders/${orderId}/status`, { token: tokens.SALES_STAFF, body: { status: st } });
  check(`chuyen trang thai -> ${st}`, up.status === 200, JSON.stringify(up.data).slice(0, 120));
}
const afterComplete = await req('GET', `/orders/${orderId}`, { token: tokens.SALES_STAFF });
check('don COMPLETED co deliveredAt', afterComplete.data?.status === 'COMPLETED' && !!afterComplete.data?.deliveredAt,
  `status=${afterComplete.data?.status} deliveredAt=${afterComplete.data?.deliveredAt}`);

const inv = await fetch(`${BASE}/orders/${orderId}/invoice`, {
  headers: { Authorization: `Bearer ${tokens.SALES_STAFF}` },
});
const buf = await inv.arrayBuffer();
const sig = String.fromCharCode(...new Uint8Array(buf.slice(0, 4)));
check('tai hoa don PDF (%PDF header)', inv.status === 200 && sig === '%PDF', `sig=${sig} status=${inv.status}`);

// huy don tra lai ton kho: tao don -3, sau khi huy phive ve dung muc cu
const stockBefore = (await req('GET', `/products/${firstProduct.id}`)).data.stock;
const cancelTest = await req('POST', '/orders', {
  token: tokens.CUSTOMER,
  body: { items: [{ productId: firstProduct.id, quantity: 3 }], paymentMethod: 'COD', channel: 'ONLINE' },
});
const cancelId = cancelTest.data?.id;
const stockDuringOrder = (await req('GET', `/products/${firstProduct.id}`, {})).data.stock;
check('tao don tru ton kho -3', Number(stockBefore) - Number(stockDuringOrder) === 3, `${stockBefore} -> ${stockDuringOrder}`);
await req('PUT', `/orders/${cancelId}/status`, { token: tokens.SALES_STAFF, body: { status: 'CANCELLED' } });
const stockAfterCancel = (await req('GET', `/products/${firstProduct.id}`)).data.stock;
check('huy don tra lai ton kho ve muc cu', Number(stockAfterCancel) === Number(stockBefore), `${stockDuringOrder} -> ${stockAfterCancel} (truoc: ${stockBefore})`);

// ---------- 6. KHACH HANG ----------
console.log('\n== 6. QUAN LY KHACH HANG ==');
const custList = await req('GET', '/customers?page=0&size=10', { token: tokens.SALES_STAFF });
check('GET /customers (sales)', custList.status === 200 && custList.data.content.length >= 3);
const custId = custList.data.content[0].id;
const custDetail = await req('GET', `/customers/${custId}`, { token: tokens.SALES_STAFF });
check('GET /customers/{id}', custDetail.status === 200 && !!custDetail.data.fullName);
const custOrders = await req('GET', `/customers/${custId}/orders?page=0&size=5`, { token: tokens.SALES_STAFF });
check('GET /customers/{id}/orders', custOrders.status === 200);

// ---------- 7. TAI KHOAN ----------
console.log('\n== 7. QUAN LY TAI KHOAN (ADMIN) ==');
const users = await req('GET', '/users', { token: tokens.ADMIN });
check('GET /users (mảng)', users.status === 200 && Array.isArray(users.data) && users.data.length >= 4, JSON.stringify(users.data).slice(0, 100));
const noAuthUsers = await req('GET', '/users', { token: tokens.SALES_STAFF });
check('SALES_STAFF bi chan /users (403)', noAuthUsers.status === 403, String(noAuthUsers.status));

// ---------- 8. KHO ----------
console.log('\n== 8. QUAN LY KHO ==');
const suppliers = await req('GET', '/suppliers', { token: tokens.WAREHOUSE_STAFF });
check('GET /suppliers (mảng)', suppliers.status === 200 && Array.isArray(suppliers.data) && suppliers.data.length >= 1, JSON.stringify(suppliers.data).slice(0, 100));
const supId = suppliers.data?.[0]?.id;

const stockBN = (await req('GET', `/products/${firstProduct.id}`)).data.stock;
const nhap = await req('POST', '/phieu-nhap-kho', {
  token: tokens.WAREHOUSE_STAFF,
  body: {
    nhaCungCapId: supId, ghiChu: 'Phieu test tu dong',
    chiTiet: [{ productId: firstProduct.id, soLuongNhap: 15, giaNhap: 95000 }],
  },
});
check('tao phieu nhap kho', nhap.status === 200 || nhap.status === 201, JSON.stringify(nhap.data).slice(0, 200));
const nhapId = nhap.data?.id;
const duyetNhap = await req('PUT', `/phieu-nhap-kho/${nhapId}/duyet`, { token: tokens.ADMIN, body: {} });
check('ADMIN duyet phieu nhap', duyetNhap.status === 200, String(duyetNhap.status));
const stockAN = (await req('GET', `/products/${firstProduct.id}`)).data.stock;
check('duyet nhap -> ton kho +15', Number(stockAN) - Number(stockBN) === 15, `${stockBN} -> ${stockAN}`);

const xuat = await req('POST', '/phieu-xuat-kho', {
  token: tokens.WAREHOUSE_STAFF,
  body: { lyDoXuat: 'Hang hong - test tu dong', chiTiet: [{ productId: firstProduct.id, soLuongXuat: 2 }] },
});
check('tao phieu xuat kho', xuat.status === 200 || xuat.status === 201, JSON.stringify(xuat.data).slice(0, 200));
const xuatId = xuat.data?.id;
const stockBX = (await req('GET', `/products/${firstProduct.id}`)).data.stock;
const duyetXuat = await req('PUT', `/phieu-xuat-kho/${xuatId}/duyet`, { token: tokens.ADMIN, body: {} });
check('ADMIN duyet phieu xuat', duyetXuat.status === 200, String(duyetXuat.status));
const stockAX = (await req('GET', `/products/${firstProduct.id}`)).data.stock;
check('duyet xuat -> ton kho -2', Number(stockBX) - Number(stockAX) === 2, `${stockBX} -> ${stockAX}`);

const kiemKe = await req('POST', '/kiem-ke', {
  token: tokens.WAREHOUSE_STAFF,
  body: { ngayKiemKe: null, ghiChu: 'Kiem ke test tu dong', chiTiet: [{ productId: firstProduct.id }] },
});
check('tao phieu kiem ke', kiemKe.status === 200 || kiemKe.status === 201, JSON.stringify(kiemKe.data).slice(0, 200));
const kkId = kiemKe.data?.id || kiemKe.data?.maKiemKe;
if (kkId) {
  const kkList = await req('GET', '/kiem-ke', { token: tokens.WAREHOUSE_STAFF });
  const kkRow = (Array.isArray(kkList.data) ? kkList.data : []).find((k) => String(k.id) === String(kkId));
  check('GET /kiem-ke co phieu vua tao + so lieu he thong',
    kkList.status === 200 && kkRow?.chiTiet?.[0]?.soLuongHeThong !== undefined,
    JSON.stringify(kkRow || kkList.data).slice(0, 150));
  const kkDone = await req('PUT', `/kiem-ke/${kkId}/hoan-thanh`, {
    token: tokens.ADMIN,
    body: { chiTiet: [{ productId: firstProduct.id, soLuongThucTe: Number(stockAX), ghiChu: 'Khop he thong' }] },
  });
  check('hoan thanh kiem ke', kkDone.status === 200, String(kkDone.status));
}

const invReport = await req('GET', '/reports/inventory', { token: tokens.WAREHOUSE_STAFF });
check('GET /reports/inventory (mảng)', invReport.status === 200 && Array.isArray(invReport.data) && invReport.data.length >= 1);

// ---------- 9. BAO CAO ----------
console.log('\n== 9. BAO CAO & PHAN QUYEN ==');
for (const [path, who] of [['overview', 'ADMIN'], ['revenue?group=day', 'ACCOUNTANT'], ['best-selling-products?limit=5', 'ADMIN'], ['low-stock', 'WAREHOUSE_STAFF']]) {
  const r = await req('GET', `/reports/${path}`, { token: tokens[who] });
  check(`GET /reports/${path.split('?')[0]} (${who})`, r.status === 200, String(r.status));
}
const accDenied = await req('GET', '/reports/revenue?group=day', { token: tokens.CUSTOMER });
check('CUSTOMER bi chan bao cao (403)', accDenied.status === 403, String(accDenied.status));
const noTok = await req('GET', '/customers?page=0&size=5');
check('khong token -> 401/403', noTok.status === 401 || noTok.status === 403, String(noTok.status));
check('khong token -> 401/403', noTok.status === 401 || noTok.status === 403, String(noTok.status));

// ---------- 10. POS ----------
console.log('\n== 10. BAN TAI QUAY (POS) ==');
const posOrder = await req('POST', '/orders', {
  token: tokens.SALES_STAFF,
  body: {
    customerId: null,
    items: [{ productId: firstProduct.id, quantity: 1 }],
    paymentMethod: 'CASH', channel: 'OFFLINE',
  },
});
check('POS tao don OFFLINE tien mat', posOrder.status === 200 || posOrder.status === 201, JSON.stringify(posOrder.data).slice(0, 200));
check('POS: CASH+OFFLINE -> COMPLETED ngay', posOrder.data?.status === 'COMPLETED', posOrder.data?.status);

// ---------- DON DEP ----------
// Backend chỉ xoá mềm (status→INACTIVE) nên SP test không còn hiện trên storefront.
if (testProdId) {
  const del = await req('DELETE', `/products/${testProdId}`, { token: tokens.ADMIN });
  check('don dep: xoa mem SP test', del.status === 200 || del.status === 204, String(del.status));
}
// Xoá SP test khỏi giỏ/wishlist của khách seed để lần chạy sau sạch sẽ
const cartNow = await req('GET', '/cart-items', { token: tokens.CUSTOMER });
for (const it of (cartNow.data || []).filter((c) => c.productId === firstProduct.id || c.product?.id === firstProduct.id)) {
  await req('DELETE', `/cart-items/${it.id}`, { token: tokens.CUSTOMER });
}
await req('DELETE', `/wishlist-items/${firstProduct.id}`, { token: tokens.CUSTOMER }).catch(() => {});

// ---------- KET QUA ----------
console.log('\n==========================================');
console.log(`KET QUA: ${pass} PASS / ${fail} FAIL`);
if (failures.length) {
  console.log('CAC LOI:');
  failures.forEach((f) => console.log('  X ' + f));
}
process.exit(fail ? 1 : 0);
