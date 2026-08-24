/**
 * Kiểm thử logic tồn kho — chặn đặt hàng vượt kho.
 * Chạy: node stock-logic-test.mjs
 */
const BASE = 'http://localhost:8080/api/v1';
let pass = 0, fail = 0;
const results = [];

function check(name, cond, detail = '') {
  if (cond) { pass++; results.push(`  PASS ${name}`); }
  else { fail++; results.push(`  FAIL ${name} ${detail}`); }
}

async function login(email, password, role) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login thất bại: ${res.status}`);
  return data.accessToken;
}

async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

async function main() {
  const adminToken = await login('admin@routine.vn', '123456', 'ADMIN');
  const custRes = await fetch(`${BASE}/auth/customer-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'khach@routine.vn', password: '123456' }),
  });
  const custToken = (await custRes.json()).accessToken;

  // ===== CHUẨN BỊ: tạo SP test với tồn kho thấp = 3 =====
  const suffix = Date.now().toString().slice(-6);
  const cat = await req('GET', '/categories', null, adminToken);
  const catId = cat.data[0].id;

  const create = await req('POST', '/products', {
    code: `TEST${suffix}`, name: `SP Test Tồn Kho ${suffix}`,
    categoryId: catId, price: 100000, description: 'SP kiểm thử logic tồn kho',
    stock: 3, minStock: 1,
    variants: [
      { size: 'M', color: 'Đen', stock: 2 },
      { size: 'L', color: 'Đen', stock: 1 },
    ],
  }, adminToken);
  check('Tạo SP test có tồn=3', create.status === 201 || create.status === 200);
  const productId = create.data.id;
  console.log(`\n[SP test #${productId}] ${create.data?.name} - tổng tồn: 3 (M/Đen=2, L/Đen=1)`);

  const orderBody = (quantity, size = 'M', color = 'Đen', extra = {}) => ({
    items: [{ productId, size, color, quantity }],
    paymentMethod: 'COD', channel: 'ONLINE', ...extra,
  });

  // ===== NHÓM 1: ĐẶT HÀNG VƯỢT TỒN =====
  console.log('\n== 1. Chặn đặt hàng vượt tồn ==');
  let r = await req('POST', '/orders', orderBody(100), custToken);
  check('Đặt 100 khi kho có 3 → bị chặn 400',
    r.status === 400 && /chỉ còn|không đủ/i.test(r.data?.message || ''),
    `status=${r.status} msg=${r.data?.message}`);

  r = await req('POST', '/orders', orderBody(4), custToken);
  check('Đặt 4 khi kho có 3 → bị chặn 400', r.status === 400,
    `status=${r.status} msg=${r.data?.message}`);

  r = await req('POST', '/orders', orderBody(3, 'M'), custToken);
  check('Đặt 3 của biến thể M (chỉ có 2) → bị chặn theo biến thể', r.status === 400,
    `status=${r.status} msg=${r.data?.message}`);

  // ===== NHÓM 2: SỐ LƯỢNG PHI LÝ =====
  console.log('\n== 2. Số lượng phi lý ==');
  r = await req('POST', '/orders', orderBody(0), custToken);
  check('Số lượng 0 → bị chặn 400', r.status === 400, `status=${r.status}`);
  r = await req('POST', '/orders', orderBody(-5), custToken);
  check('Số lượng âm -5 → bị chặn 400', r.status === 400, `status=${r.status}`);
  r = await req('POST', '/orders', { items: [{ productId, size: 'M', color: 'Đen' }], paymentMethod: 'COD', channel: 'ONLINE' }, custToken);
  check('Thiếu quantity (null) → bị chặn 400', r.status === 400, `status=${r.status}`);

  // ===== NHÓM 3: BIẾN THỂ KHÔNG TỒN TẠI / SP LẠ =====
  console.log('\n== 3. Biến thể & sản phẩm ==');
  r = await req('POST', '/orders', orderBody(1, 'XXL', 'Vàng'), custToken);
  check('Size/màu không tồn tại → bị chặn 400', r.status === 400,
    `status=${r.status} msg=${r.data?.message}`);

  r = await req('POST', '/orders', { items: [{ productId: 99999999, size: 'M', color: 'Đen', quantity: 1 }], paymentMethod: 'COD', channel: 'ONLINE' }, custToken);
  check('SP không tồn tại → 404', r.status === 404, `status=${r.status}`);

  // ===== NHÓM 4: ĐƠN HỢP LỆ + TRỪ ĐÚNG TỒN =====
  console.log('\n== 4. Đơn hợp lệ trừ đúng tồn ==');
  const before = (await req('GET', `/products/${productId}`, null, adminToken)).data;
  r = await req('POST', '/orders', orderBody(2, 'M'), custToken);
  const okOrderId = r.data?.id;
  check('Đặt 2 của M (có 2) → thành công 201', r.status === 201,
    `status=${r.status} msg=${r.data?.message}`);

  const after = (await req('GET', `/products/${productId}`, null, adminToken)).data;
  check(`Tồn giảm đúng 3→${before.stock - 2} (thực tế ${after.stock})`,
    after.stock === before.stock - 2);

  // Giờ M đã hết (2-2=0): đặt thêm 1 của M phải chặn
  r = await req('POST', '/orders', orderBody(1, 'M'), custToken);
  check('Đặt tiếp M sau khi hết → bị chặn', r.status === 400,
    `status=${r.status} msg=${r.data?.message}`);

  // ===== NHÓM 5: HUỶ ĐƠN HOÀN LẠI TỒN =====
  console.log('\n== 5. Huỷ đơn hoàn lại tồn ==');
  r = await req('PUT', `/orders/${okOrderId}/status`, { status: 'CANCELLED' }, adminToken);
  check('Huỷ đơn → OK', r.status === 200, `status=${r.status}`);
  const restored = (await req('GET', `/products/${productId}`, null, adminToken)).data;
  check(`Huỷ xong tồn phục hồi về 3 (thực tế ${restored.stock})`, restored.stock === 3);

  // Huỷ lần nữa không hoàn thêm
  r = await req('PUT', `/orders/${okOrderId}/status`, { status: 'CANCELLED' }, adminToken);
  const doubleRestore = (await req('GET', `/products/${productId}`, null, adminToken)).data;
  check('Huỷ đơn đã-huỷ không hoàn thêm tồn (vẫn 3)', doubleRestore.stock === 3,
    `status=${r.status} stock=${doubleRestore.stock}`);

  // ===== NHÓM 6: LUỒNG TRẠNG THÁI HỢP LÝ =====
  console.log('\n== 6. Luồng trạng thái ==');
  // Tạo đơn mới để test luồng
  r = await req('POST', '/orders', orderBody(1, 'L'), custToken);
  const flowOrderId = r.data.id;
  check('Đặt 1 của L → 201', r.status === 201);

  r = await req('PUT', `/orders/${flowOrderId}/status`, { status: 'COMPLETED' }, adminToken);
  check('Hoàn tất đơn PENDING trực tiếp → cho phép', r.status === 200, `status=${r.status}`);

  r = await req('PUT', `/orders/${flowOrderId}/status`, { status: 'CANCELLED' }, adminToken);
  check('Huỷ đơn ĐÃ HOÀN TẤT → bị chặn 400', r.status === 400,
    `status=${r.status} msg=${r.data?.message}`);

  // Đơn đã huỷ không chuyển tiếp được
  r = await req('POST', '/orders', orderBody(1, 'L'), custToken);
  const cxlId = r.data.id;
  await req('PUT', `/orders/${cxlId}/status`, { status: 'CANCELLED' }, adminToken);
  r = await req('PUT', `/orders/${cxlId}/status`, { status: 'CONFIRMED' }, adminToken);
  check('Đơn đã huỷ chuyển sang CONFIRMED → bị chặn 400', r.status === 400,
    `status=${r.status} msg=${r.data?.message}`);

  // ===== NHÓM 7: GIỎ HÀNG KHÔNG VƯỢT TỒN =====
  console.log('\n== 7. Giỏ hàng ==');
  // Xoá sạch giỏ trước
  const cartNow = (await req('GET', '/cart-items', null, custToken)).data;
  for (const it of cartNow.filter(i => i.productId === productId)) {
    await req('DELETE', `/cart-items/${it.id}`, null, custToken);
  }
  r = await req('POST', '/cart-items', { productId, size: 'M', color: 'Đen', quantity: 50 }, custToken);
  check('Thêm 50 vào giỏ khi kho M còn 0 → bị chặn', r.status === 400,
    `status=${r.status} msg=${r.data?.message}`);

  r = await req('POST', '/cart-items', { productId, size: 'L', color: 'Đen', quantity: 1 }, custToken);
  // L đã bị trừ 1 (đơn flowOrderId COMPLETED không hoàn kho) → kho L = 0 → phải bị chặn
  check('Thêm 1 vào giỏ khi kho L = 0 → bị chặn', r.status === 400,
    `status=${r.status} msg=${r.data?.message}`);

  // Dọn dẹp: huỷ mọi đơn test chưa huỷ + xoá mềm SP test
  const myOrders = (await req('GET', '/orders/my', null, custToken)).data;
  for (const o of (myOrders.content || []).filter(o => o.items.some(i => i.productId === productId) && o.status !== 'CANCELLED')) {
    await req('PUT', `/orders/${o.id}/status`, { status: 'CANCELLED' }, adminToken);
  }
  await req('DELETE', `/products/${productId}`, null, adminToken);
  console.log('\n[dọn dẹp] Đã huỷ đơn test và xoá mềm SP test');

  console.log('\n==========================================');
  results.forEach(l => console.log(l));
  console.log(`\nKET QUA: ${pass} PASS / ${fail} FAIL`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error('LỖI:', e.message); process.exit(1); });
