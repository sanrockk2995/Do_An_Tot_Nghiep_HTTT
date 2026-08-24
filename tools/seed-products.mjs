// ============================================================
// Routine — Seed ~1000 sản phẩm thời trang có ảnh thật (Unsplash)
// Chạy: node seed-products.mjs [--fresh]
//   --fresh: xoá sạch products + product_variants trước khi seed
// Ghi qua REST API (bám sát đặc tả, không đụng schema DB).
// ============================================================

const BASE = 'http://localhost:8080/api/v1';

// ---------- Tiện ích ----------
const rnd = (() => {
  let s = 42;
  return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
})();
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const int = (min, max) => min + Math.floor(rnd() * (max - min + 1));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function req(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

// ---------- Dữ liệu nguồn ----------
const BRANDS = [
  'Uniqlo', 'Zara', 'H&M', 'Muji', 'COS', 'Mango', 'Pull&Bear', 'Bershka',
  'Nike', 'Adidas', 'Puma', 'New Balance', 'Converse', 'Vans',
  'MLB', 'Stussy', 'Carhartt WIP', 'The North Face', 'Columbia', 'Levi\'s',
  'Lacoste', 'Ralph Lauren', 'Tommy Hilfiger', 'Calvin Klein', 'Gap',
  'Charles & Keith', 'Pedro', 'Birkenstock', 'Crocs', ' Melissa',
];

const COLORS_VN = ['Đen', 'Trắng', 'Be', 'Xám', 'Xanh navy', 'Xanh dương', 'Nâu', 'Kem',
  'Xanh olive', 'Hồng phấn', 'Đỏ đô', 'Xanh rêu', 'Tím lavender', 'Vàng mustard', 'Xanh jean'];

const MATERIALS = ['Cotton 100%', 'Cotton spandex', 'Polyester recycled', 'Lụa satin', 'Len merino',
  'Denim cotton', 'Linen (két)', 'Da tổng hợp PU', 'Canvas', 'Nỉ bông Fleece', 'Chiffon', 'Viscose'];
const FITS = ['Regular', 'Slim', 'Oversize', 'Loose', 'Relaxed', 'Straight', 'A-line', 'Crop'];
const SEASONS = ['All Season', 'Spring', 'Summer', 'Fall', 'Winter'];
const CARE = 'Gi máy ở nhiệt độ thường, không dùng chất tẩy, ủi ở nhiệt độ thấp.';

// Unsplash ảnh thật — mỗi nhóm dùng bộ ảnh riêng theo slug
const U = (slug, w = 800) => `https://images.unsplash.com/${slug}?auto=format&fit=crop&w=${w}&q=70`;

// Bộ ảnh thật theo từng loại hàng (mỗi loại ~10-20 ảnh khác nhau)
const IMG = {
  shirt: [
    'photo-1596755094514-f87e34085b2c', 'photo-1602810318383-e386cc2a3ccf', 'photo-1620012253295-c15cc3e65df4',
    'photo-1594938298603-c8148c4dae35', 'photo-1621072156002-e2fccdc0b176', 'photo-1611312449408-fcece27cdbb7',
    'photo-1521572163474-6864f9cf17ab', 'photo-1602810316498-ab67cf68c15e', 'photo-1589310243389-96a5483213a8',
    'photo-1516257984-b1b4d707412e', 'photo-1564859228273-274232fdb516', 'photo-1598033129183-c4f50c736f10',
    'photo-1507003211169-0a1dd7228f2d', 'photo-1490114538077-0a7f8cb49891', 'photo-1553143820-6bb68bc34679',
    'photo-1603252109303-2751441dd157', 'photo-1593032465175-481ac7f401a0', 'photo-1592878940526-0214b0f374f6',
  ],
  tshirt: [
    'photo-1521572163474-6864f9cf17ab', 'photo-1581655353564-df123a1eb820', 'photo-1576566588028-4147f3842f27',
    'photo-1503341504253-dff4815485f1', 'photo-1618354691373-d851c5c3a990', 'photo-1620799140408-edc6dcb6d633',
    'photo-1562157873-818bc0726f68', 'photo-1618354691229-88d47f285158', 'photo-1659072094626-71d56fb5a069',
    'photo-1544441893-675973e31985', 'photo-1583743814966-8936f5b7be1a', 'photo-1554568218-0f1715e72254',
  ],
  jacket: [
    'photo-1551028719-00167b16eac5', 'photo-1551537482-f2075a1d41f2', 'photo-1591047139829-d91aecb6caea',
    'photo-1548883354-94bcfe321cbb', 'photo-1520975954732-35dd22299614', 'photo-1495105787522-5334e3ffa0ef',
    'photo-1591195853828-11db59a44f6b', 'photo-1544022613-e87ca75a784a', 'photo-1548126032-079a0fb0099d',
    'photo-1617137968427-85924c800a22', 'photo-1592878904946-b3cd8ae243d0', 'photo-1614093302611-8efc4de12547',
    'photo-1592842232655-e5d345cbc2d0', 'photo-1608063615781-e2ef8c73d114', 'photo-1523208420204-53aa907da9a8',
    'photo-1611312449408-fcece27cdbb7', 'photo-1547949003-9792a18a2601', 'photo-1596609548086-85bbf8ddb6b9',
  ],
  jeans: [
    'photo-1541099649105-f69ad21f3246', 'photo-1542272604-787c3835535d', 'photo-1584370848010-d7fe6bc767ec',
    'photo-1473966968600-fa801b869a1a', 'photo-1541840032006-4c676e120c68', 'photo-1565084888279-aca607ecce0c',
    'photo-1584862637990-92d51cdf6bb8', 'photo-1604176354204-9268737828e4', 'photo-1605518216938-7c31b7b14ad0',
    'photo-1610136649349-0f646f318053', 'photo-1555689502-c4b22d76c56f', 'photo-1475178626620-a4d074967452',
  ],
  trousers: [
    'photo-1594633312681-425c7b97ccd1', 'photo-1592878904946-b3cd8ae243d0', 'photo-1624378439575-d8705ad7ae80',
    'photo-1509937528035-ad76254b0356', 'photo-1620799140188-3b2a02fd9a77', 'photo-1552902865-b72c031ac5ea',
    'photo-1617127365659-c47fa864d8bc', 'photo-1610652492500-ded49ceeb378', 'photo-1564859228273-274232fdb516',
  ],
  dress: [
    'photo-1595777457583-95e059d581b8', 'photo-1572804013309-59a88b7e92f1', 'photo-1585487000160-6ebcfceb0d03',
    'photo-1566479179817-c0ae8b9d41c7', 'photo-1496737631176-843222e1e57c', 'photo-1539008835657-9e8e9680c956',
    'photo-1515372039744-b8f02a3ae446', 'photo-1554568218-0f1715e72254', 'photo-1583496661160-fb5886a13d44',
    'photo-1596783074918-c84cb06531ca', 'photo-1591369822096-ffd140ec948f', 'photo-1583744946564-b52ac1c389c8',
    'photo-1571902993206-82bd0eb7b86b', 'photo-1612336307429-8a898d10e223', 'photo-1591958911259-bee2173bdccc',
  ],
  shoes: [
    'photo-1549298916-b41d501d3772', 'photo-1595950653106-6c9ebd614d3a', 'photo-1542291026-7eec264c27ff',
    'photo-1600185365483-26d7a4cc7519', 'photo-1606107557195-0e29a4b5b4aa', 'photo-1560769629-975ec94e6a86',
    'photo-1608231387042-66d1773070a5', 'photo-1605348532760-6753d2c43329', 'photo-1607522370275-f14206abe5d3',
    'photo-1595341888016-a392ef81b7de', 'photo-1552067663-9e64b8ba121f', 'photo-1603808033192-082d6919d3e1',
    'photo-1463100099107-aa0980c362e6', 'photo-1584735175315-9d5df23860e6', 'photo-1539185441755-769473a23570',
    'photo-1525966222134-fcfa99b8ae77', 'photo-1514989940723-e8e51635b782', 'photo-1605408499391-4be3fe4432f5',
  ],
  sandal: [
    'photo-1603487742131-4160ec999306', 'photo-1562273138-f46be4ebdf33', 'photo-1635309327438-e6ee3617ad40',
    'photo-1603808033409-95c9ece016bd', 'photo-1533867617858-e7b97e060509', 'photo-1565820400-6b4b6f0b7cd0',
    'photo-1605733513597-a8f8341084e6', 'photo-1610462934136-ac8ea67d2355', 'photo-1595950653106-6c9ebd614d3a',
    'photo-1591375275624-c2f9ce63fdf1', 'photo-1591375276107-34ab949c4c71', 'photo-1560343090-f0409e92791a',
  ],
  hat: [
    'photo-1585129777188-94600bc7b4b3', 'photo-1521369909029-2afed882baee', 'photo-1575428652377-a2d80e2277fc',
    'photo-1534215754734-18e55d13e346', 'photo-1514327605112-b887c0e61c0a', 'photo-1556306535-0f09a537f0a3',
    'photo-1588850561407-ed78c282e89b', 'photo-1565538505365-1fdbc75a7e00', 'photo-1517940310602-26535839fe84',
    'photo-1572307480813-ceb0e59d8325', 'photo-1614179361643-6cea3a12a15c', 'photo-1603542914955-64dc02893662',
  ],
  bag: [
    'photo-1553062407-98eeb64c6a62', 'photo-1590874103328-eac38a683ce7', 'photo-1594633312681-425c7b97ccd1',
    'photo-1548036328-c9fa89d128fa', 'photo-1584917865442-de89df76afd3', 'photo-1566150905458-1bf1fc113f0d',
    'photo-1559563458-527698bf5295', 'photo-1596149615493-f0739de31c2d', 'photo-1544816155-12df9643f363',
    'photo-1590739225287-bd31519780c3', 'photo-1564422170194-8958ffb93a83', 'photo-1548863227-3af567fc3b27',
  ],
  scarf: [
    'photo-1601924994987-69e26d50dc26', 'photo-1520903920243-00d872a2d1c9', 'photo-1457545195570-67f207084966',
    'photo-1517940104805-b6b0ae081f42', 'photo-1544441893-675973e31985', 'photo-1602810316498-ab67cf68c15e',
    'photo-1608748010899-18f300247112', 'photo-1611601322175-ef8ec8c85f01', 'photo-1601333144130-8cbb312386b6',
  ],
};

// Danh mục: [slug hiện có trong DB] → cấu hình sinh
// Các danh mục mới sẽ tạo qua API.
const CAT_CONFIG = [
  { slug: 'ao-so-mi',  name: 'Áo sơ mi',   icon: 'shirt',    desc: 'Áo sơ mi nam/nữ công sở và thời trang', img: 'shirt',   n: 130, price: [249000, 1290000], sizes: ['S','M','L','XL'], genders: ['MALE','FEMALE','UNISEX'] },
  { slug: 'ao-thun',   name: 'Áo thun',    icon: 'tshirt',   desc: 'Áo thun cổ tròn, polo chất cotton',     img: 'tshirt',  n: 140, price: [149000, 890000],  sizes: ['S','M','L','XL','XXL'], genders: ['MALE','FEMALE','UNISEX'] },
  { slug: 'ao-khoac',  name: 'Áo khoác',   icon: 'coat',     desc: 'Áo khoác jacket, blazer, hoodie',       img: 'jacket',  n: 120, price: [399000, 2590000], sizes: ['S','M','L','XL'], genders: ['MALE','FEMALE','UNISEX'] },
  { slug: 'quan-jean', name: 'Quần jean',  icon: 'jeans',    desc: 'Quần jean nam/nữ các kiểu dáng',        img: 'jeans',   n: 100, price: [349000, 1590000], sizes: ['28','29','30','31','32','33','34'], genders: ['MALE','FEMALE'] },
  { slug: 'quan-kaki', name: 'Quần kaki',  icon: 'trousers', desc: 'Quần kaki, quần vải công sở và casual', img: 'trousers',n: 90,  price: [299000, 990000],  sizes: ['28','29','30','31','32','33','34'], genders: ['MALE','FEMALE','UNISEX'] },
  { slug: 'vay-dam',   name: 'Váy/Đầm',    icon: 'dress',    desc: 'Váy đầm nữ thời trang',                 img: 'dress',   n: 110, price: [329000, 1890000], sizes: ['S','M','L','XL'], genders: ['FEMALE'] },
  // Danh mục mới — tạo nếu chưa có:
  { slug: 'giay',      name: 'Giày',       icon: 'shoe',     desc: 'Giày sneaker, da, thể thao các thương hiệu', img: 'shoes',  n: 110, price: [399000, 3590000], sizes: ['38','39','40','41','42','43'], genders: ['MALE','FEMALE','UNISEX'] },
  { slug: 'dep-sandal',name: 'Dép/Sandal', icon: 'sandal',   desc: 'Dép sandal, slide, guốc mộc',                img: 'sandal', n: 60,  price: [149000, 1290000], sizes: ['38','39','40','41','42'], genders: ['UNISEX'] },
  { slug: 'mu-non',    name: 'Mũ/Nón',     icon: 'hat',      desc: 'Mũ lưỡi trai, beanie, nón beret',            img: 'hat',    n: 60,  price: [129000, 890000],  sizes: ['Free size'], genders: ['UNISEX'] },
  { slug: 'tui-xach',  name: 'Túi/Xách',   icon: 'bag',      desc: 'Túi xách, túi canvas, balo thời trang',      img: 'bag',    n: 50,  price: [199000, 1990000], sizes: ['Free size'], genders: ['FEMALE','UNISEX'] },
  { slug: 'khau-trang',name: 'Khăn/Găng',  icon: 'scarf',    desc: 'Khăn len, khăn lụa, phụ kiện giữ ấm',        img: 'scarf',  n: 30,  price: [99000, 690000],   sizes: ['Free size'], genders: ['UNISEX'] },
];
// Tổng: 130+140+120+100+90+110+110+60+60+50+30 = 1000

const STYLE_ADJ = ['Basic', 'Classic', 'Modern', 'Vintage', 'Minimal', 'Premium', 'Signature',
  'Essential', 'Heritage', 'Street', 'Casual', 'Formal', 'Retro', 'Utility', 'Soft', 'Airy'];
const STYLE_NOUN = {
  'ao-so-mi': ['sơ mi dài tay', 'sơ mi ngắn tay', 'sơ mi kẻ sọc', 'sơ mi caro', 'sơ mi cổ đức', 'sơ mi lụa'],
  'ao-thun': ['thun cổ tròn', 'thun polo', 'thun tay raglan', 'thun in hình', 'thun croptop', 'thun nỉ'],
  'ao-khoac': ['khoác blazer', 'khoác jean', 'hoodie nỉ', 'áo bomber', 'áo cardigan', 'khoác gió', 'áo vest nữ'],
  'quan-jean': ['jean ống đứng', 'jean ống loe', 'jean ráu gối', 'jean ống rộng', 'short jean', 'jean suông'],
  'quan-kaki': ['kaki ống đứng', 'kaki short', 'quần vải âu', 'kaki jogger', 'quần cargo'],
  'vay-dam': ['váy xòe hoa nhí', 'đầm maxi', 'đầm ôm dạ hội', 'váy hai dây', 'đầm sơ mi', 'váy midi buộc nơ'],
  'giay': ['sneaker da thấp cổ', 'sneaker cao cổ', 'giày chạy bộ', 'giày da công sở', 'sneaker chunky', 'giày tennis'],
  'dep-sandal': ['dép slide', 'sandal quai ngang', 'guốc mộc', 'dép cá kèo', 'sandal dây chéo'],
  'mu-non': ['mũ lưỡi trai', 'beanie len', 'nón bucket', 'mũ beret', 'nón fedora'],
  'tui-xach': ['túi tote canvas', 'túi xách da', 'balo mini', 'clutch dạ hội', 'túi đeo chéo'],
  'khau-trang': ['khăn len cổ', 'khăn lụa họa tiết', 'khăn twill', 'khăn choàng mùa đông'],
};
const BADGES = [null, null, null, null, null, 'NEW', 'SALE', 'BESTSELLER', 'HOT'];

// ---------- Đăng nhập ----------
async function login() {
  const r = await req('POST', '/auth/login', { body: { email: 'admin@routine.vn', password: '123456', role: 'ADMIN' } });
  if (r.status !== 200 || !r.data?.accessToken) {
    console.error('❌ Login ADMIN thất bại:', r.status, r.data);
    process.exit(1);
  }
  console.log('✅ Đã đăng nhập ADMIN');
  return r.data.accessToken;
}

// ---------- Đảm bảo danh mục ----------
async function ensureCategories(token) {
  const existing = await req('GET', '/categories');
  const bySlug = new Map((existing.data || []).map((c) => [c.slug, c]));
  const result = [];
  for (const cfg of CAT_CONFIG) {
    if (bySlug.has(cfg.slug)) {
      result.push({ id: bySlug.get(cfg.slug).id, ...cfg });
    } else {
      const created = await req('POST', '/categories', {
        token,
        body: { name: cfg.name, slug: cfg.slug, description: cfg.desc, icon: cfg.icon, displayOrder: 10 },
      });
      if (created.status !== 201 && created.status !== 200) {
        console.error(`❌ Tạo danh mục ${cfg.slug} lỗi:`, created.status, created.data);
        process.exit(1);
      }
      console.log(`➕ Danh mục mới: ${cfg.name} (#${created.data.id})`);
      result.push({ id: created.data.id, ...cfg });
    }
  }
  return result;
}

// ---------- Sinh + tạo sản phẩm ----------
function buildProduct(cat, seq) {
  const brand = pick(BRANDS);
  const styleAdj = pick(STYLE_ADJ);
  const noun = pick(STYLE_NOUN[cat.slug]);
  const colorMain = pick(COLORS_VN);
  const material = pick(MATERIALS);
  const fit = pick(FITS);
  const season = pick(SEASONS);

  const prefix = cat.slug.split('-').map((w) => w[0].toUpperCase()).join('');
  const code = `${prefix}${brand.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()}${String(seq).padStart(4, '0')}`;
  const name = `${noun.charAt(0).toUpperCase() + noun.slice(1)} ${brand} ${styleAdj}`;

  const basePrice = int(cat.price[0], cat.price[1]);
  // làm tròn đẹp: gần nhất × 10.000đ
  const price = Math.round(basePrice / 10000) * 10000;
  const costRatio = 0.45 + rnd() * 0.2;
  const costPrice = Math.round((price * costRatio) / 5000) * 5000;
  const hasOld = rnd() < 0.3;
  const oldPrice = hasOld ? Math.round(price * (1.1 + rnd() * 0.3) / 10000) * 10000 : null;

  const nColors = int(1, 3);
  const colors = [...new Set(Array.from({ length: nColors }, () => pick(COLORS_VN)))];
  const sizes = cat.sizes.length > 1 ? cat.sizes : ['Free size'];

  const variants = [];
  for (const c of colors) {
    for (const s of sizes) {
      variants.push({
        size: s,
        color: c,
        stock: int(3, 60),
        sku: `${code}-${s}-${c.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 8)}`,
      });
    }
  }

  const totalStock = variants.reduce((s, v) => s + v.stock, 0);
  const imgUrl = U(pick(IMG[cat.img]));

  return {
    code,
    name,
    categoryId: cat.id,
    description: `${name} — ${noun} chính hãng ${brand}. Chất liệu ${material.toLowerCase()}, dáng ${fit.toLowerCase()} thoải mái mọi hoạt động. Thiết kế tối giản dễ phối đồ, phù hợp cả đi làm lẫn dạo phố. Màu chủ đạo: ${colorMain.toLowerCase()}.`,
    price,
    costPrice,
    oldPrice,
    stock: totalStock,
    minStock: int(5, 15),
    imageUrl: imgUrl,
    sku: code,
    material,
    fit,
    season,
    careInstructions: CARE,
    badge: pick(BADGES),
    targetGender: pick(cat.genders),
    variants,
  };
}

async function main() {
  const fresh = process.argv.includes('--fresh');
  const token = await login();

  // --fresh: xoá mềm toàn bộ sản phẩm cũ rồi tạo lại từ đầu
  if (fresh) {
    console.log('🧹 --fresh: xoá mềm toàn bộ sản phẩm hiện có...');
    const all = await req('GET', '/admin/products?size=1&page=0', { token });
    const total = all.data?.totalElements || 0;
    let deleted = 0;
    for (let p = 0; p * 100 < total; p++) {
      const page = await req('GET', `/admin/products?size=100&page=${p}`, { token });
      for (const prod of page.data?.content || []) {
        await req('DELETE', `/products/${prod.id}`, { token });
        deleted++;
        if (deleted % 50 === 0) console.log(`   ... đã xoá ${deleted}/${total}`);
      }
    }
    console.log(`🧹 Đã xoá mềm ${deleted} sản phẩm cũ.`);
  }

  const cats = await ensureCategories(token);
  const TOTAL = CAT_CONFIG.reduce((s, c) => s + c.n, 0);
  console.log(`\n🎯 Bắt đầu tạo ${TOTAL} sản phẩm...\n`);

  let ok = 0, fail = 0;
  const t0 = Date.now();
  let seqGlobal = 1;

  for (const cat of cats) {
    let catOk = 0;
    for (let i = 0; i < cat.n; i++) {
      const payload = buildProduct(cat, seqGlobal++);
      const r = await req('POST', '/products', { token, body: payload });
      if (r.status === 201 || r.status === 200) {
        ok++; catOk++;
      } else {
        fail++;
        if (fail <= 5) console.error(`⚠️ Lỗi tạo ${payload.code}:`, r.status, JSON.stringify(r.data).slice(0, 200));
        // trùng mã → thử lại với hậu tố
        const retry = await req('POST', '/products', { token, body: { ...payload, code: payload.code + 'X' } });
        if (retry.status === 201 || retry.status === 200) { ok++; fail--; catOk++; }
      }
      if ((ok + fail) % 100 === 0) {
        const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
        console.log(`⏳ ${ok + fail}/${TOTAL} (${ok} ok, ${fail} lỗi) — ${elapsed}s`);
      }
    }
    console.log(`✅ ${cat.name}: ${catOk}/${cat.n}`);
    await sleep(100); // nhịp nhẹ giữa các danh mục
  }

  console.log(`\n🎉 HOÀN THÀNH: ${ok}/${TOTAL} sản phẩm, ${fail} lỗi — ${(Date.now() - t0) / 1000}s`);
  console.log('💡 Kiểm tra: GET /api/v1/products?page=0&size=12');
}

main().catch((e) => { console.error(e); process.exit(1); });
