import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatVNDText } from '../../utils/format';
import { IconX } from '../../components/Icons';

/**
 * POS bán hàng tại quầy (ADMIN/SALES_STAFF):
 * trái = lưới sản phẩm + tìm kiếm; phải = hóa đơn mới.
 */
export default function PosPage() {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [walkInName, setWalkInName] = useState('');

  const [cartItems, setCartItems] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [checkingOut, setCheckingOut] = useState(false);

  async function loadProducts(searchText) {
    setLoadingProducts(true);
    try {
      // Chỉ tải các sản phẩm đang kinh doanh (ACTIVE) để bán tại quầy
      const res = await api.get('/admin/products', {
        params: { page: 0, size: 60, q: searchText, status: 'ACTIVE' },
      });
      const activeItems = (res.data.content || []).filter((p) => !p.status || p.status === 'ACTIVE');
      setProducts(activeItems);
    } catch {
      try {
        const res = await api.get('/products', { params: { page: 0, size: 60 } });
        const activeItems = (res.data.content || []).filter((p) => !p.status || p.status === 'ACTIVE');
        setProducts(activeItems);
      } catch {
        setProducts([]);
      }
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    loadProducts('');
    api
      .get('/customers', { params: { page: 0, size: 100 } })
      .then((res) => setCustomers(res.data.content || []))
      .catch(() => {});
  }, []);

  function addLine(product) {
    if (product.status && product.status !== 'ACTIVE') {
      alert(`Sản phẩm "${product.name}" đã ngừng bán.`);
      return;
    }
    const stock = Number(product.stock ?? 0);
    if (stock <= 0) {
      alert(`Sản phẩm "${product.name}" đã hết hàng.`);
      return;
    }

    const variants = product.variants || [];
    // Ưu tiên chọn biến thể còn tồn kho
    const availableVariant = variants.find((v) => Number(v.stock ?? 0) > 0) || variants[0];
    const initialSize = availableVariant?.size || 'Freesize';
    const initialColor = availableVariant?.color || 'Tiêu chuẩn';
    const initialStock = availableVariant && availableVariant.stock != null ? Number(availableVariant.stock) : stock;

    setCartItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === product.id && i.size === initialSize && i.color === initialColor);
      if (idx >= 0) {
        if (prev[idx].quantity >= initialStock) {
          alert(`Sản phẩm "${product.name}" (${initialSize} - ${initialColor}) chỉ còn ${initialStock} trong kho.`);
          return prev;
        }
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        price: Number(product.price || 0),
        quantity: 1,
        size: initialSize,
        color: initialColor,
        stock: initialStock,
        variants,
      }];
    });
  }

  function updateLine(idx, patch) {
    setCartItems((prev) => prev.map((item, i) => {
      if (i !== idx) return item;
      const next = { ...item, ...patch };
      // Chặn số lượng vượt tồn kho của sản phẩm
      if (patch.quantity != null && item.stock != null && patch.quantity > item.stock) {
        alert(`Sản phẩm "${item.productName}" chỉ còn ${item.stock} trong kho.`);
        return item;
      }
      return next;
    }));
  }

  function removeLine(idx) {
    setCartItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleApplyPromo() {
    if (!promoCode.trim()) return;
    try {
      const res = await api.post('/promotions/apply', { code: promoCode.trim(), orderAmount: subtotal });
      if (!res.data.valid) {
        setAppliedPromo(null);
        setDiscount(0);
        alert(res.data.message || 'Mã giảm giá không hợp lệ.');
        return;
      }
      setAppliedPromo(res.data);
      setDiscount(Number(res.data.discountAmount || 0));
      alert(`Áp dụng mã ${res.data.promotionCode}: giảm ${formatVNDText(res.data.discountAmount)}`);
    } catch (err) {
      setAppliedPromo(null);
      setDiscount(0);
      alert(err.response?.data?.message || err.message || 'Mã không hợp lệ.');
    }
  }

  async function handleCheckout() {
    if (cartItems.length === 0) {
      alert('Chưa chọn sản phẩm nào.');
      return;
    }
    if (checkingOut) return;
    const payload = {
      customerId: customerId ? Number(customerId) : null,
      items: cartItems.map((i) => ({
        productId: i.productId,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
      })),
      paymentMethod,
      channel: 'OFFLINE',
      promotionCode: appliedPromo ? appliedPromo.promotionCode : undefined,
      notes: walkInName.trim()
        ? `Khách lẻ: ${walkInName.trim()}`
        : undefined,
    };

    setCheckingOut(true);
    try {
      await api.post('/orders', payload);
      alert('Tạo hóa đơn thành công!');
      resetSale();
      loadProducts(q);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Tạo hóa đơn thất bại.');
    } finally {
      setCheckingOut(false);
    }
  }

  function resetSale() {
    setCartItems([]);
    setCustomerId('');
    setWalkInName('');
    setPromoCode('');
    setAppliedPromo(null);
    setDiscount(0);
  }

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  return (
    <div className="admin-page pos-page">
      <header className="admin-page-head">
        <h1>Bán hàng tại quầy</h1>
        <p className="muted-text">Tạo hóa đơn nhanh cho khách mua trực tiếp tại cửa hàng.</p>
      </header>

      <div className="pos-grid">
        <section className="pos-products" aria-label="Danh sách sản phẩm">
          <div className="field-inline pos-search">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadProducts(q)}
              placeholder="Tìm theo tên hoặc mã sản phẩm..."
              aria-label="Tìm sản phẩm"
            />
            <button className="btn btn-outline" onClick={() => loadProducts(q)}>Tìm</button>
          </div>

          {loadingProducts ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}><div className="spinner" /></div>
          ) : (
            <div className="pos-product-grid">
              {products.map((p) => (
                <button key={p.id} className="pos-product-card card" onClick={() => addLine(p)}>
                  <strong>{p.name}</strong>
                  <span className="muted-text">{p.code}</span>
                  <span>{formatVNDText(p.price)}</span>
                  <span className={p.stock > 0 ? 'badge badge-green' : 'badge badge-red'}>
                    Tồn: {p.stock}
                  </span>
                  <span className="muted-text">{p.categoryName}</span>
                </button>
              ))}
              {products.length === 0 && <p className="muted-text">Không có sản phẩm.</p>}
            </div>
          )}
</section>

        <section className="pos-panel card" aria-label="Hóa đơn mới">
          <h2>Hóa đơn mới</h2>

          <div className="field">
            <label htmlFor="pos-customer">Khách hàng</label>
            <select
              id="pos-customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">— Khách lẻ (không tích điểm) —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} · {c.phone || c.email}
                </option>
              ))}
            </select>
          </div>

          {!customerId && (
            <div className="field">
              <label htmlFor="walkin-name">Tên khách lẻ (tùy chọn)</label>
              <input
                id="walkin-name"
                value={walkInName}
                onChange={(e) => setWalkInName(e.target.value)}
                placeholder="VD: Chị Hòa"
              />
            </div>
          )}

          <ul className="pos-lines">
            {cartItems.map((item, idx) => (
              <li key={`${item.productId}-${idx}`}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.productName}
                  </strong>
                  {item.variants && item.variants.length > 1 ? (
                    <div style={{ margin: '3px 0' }}>
                      <select
                        style={{ fontSize: 12, padding: '2px 4px', maxWidth: 170 }}
                        value={`${item.size}|${item.color}`}
                        onChange={(e) => {
                          const [newSize, newColor] = e.target.value.split('|');
                          const v = item.variants.find((x) => x.size === newSize && x.color === newColor);
                          updateLine(idx, {
                            size: newSize,
                            color: newColor,
                            stock: v && v.stock != null ? Number(v.stock) : item.stock,
                          });
                        }}
                      >
                        {item.variants.map((v) => (
                          <option key={v.id || `${v.size}-${v.color}`} value={`${v.size}|${v.color}`}>
                            {v.size} - {v.color} (Còn {v.stock ?? 0})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="muted-text" style={{ fontSize: 12 }}>
                      {item.size && item.size !== 'Freesize' && item.color && item.color !== 'Tiêu chuẩn'
                        ? `${item.size} · ${item.color} · `
                        : ''}
                      {formatVNDText(item.price)} × {item.quantity}
                    </div>
                  )}
                </div>
                <div className="qty-stepper">
                  <button
                    onClick={() => updateLine(idx, { quantity: Math.max(1, item.quantity - 1) })}
                    disabled={item.quantity <= 1}
                  >−</button>
                  <input value={item.quantity} readOnly aria-label="Số lượng" />
                  <button
                    onClick={() => updateLine(idx, { quantity: item.quantity + 1 })}
                    disabled={item.stock != null && item.quantity >= item.stock}
                    title={item.stock != null && item.quantity >= item.stock
                      ? 'Đã đạt số lượng còn lại trong kho' : undefined}
                  >+</button>
                </div>
                <strong>{formatVNDText(item.price * item.quantity)}</strong>
                <button className="btn btn-ghost" onClick={() => removeLine(idx)} aria-label="Xóa dòng"><IconX size={15} /></button>
              </li>
            ))}
            {cartItems.length === 0 && <li className="muted-text">Chưa chọn sản phẩm.</li>}
          </ul>

          <div className="field">
            <label htmlFor="pos-promo">Mã giảm giá</label>
            <div className="field-inline">
              <input
                id="pos-promo"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="SALE10"
              />
              <button type="button" className="btn btn-outline" onClick={handleApplyPromo}>Áp dụng</button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="pos-payment">Thanh toán</label>
            <select
              id="pos-payment"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="CASH">Tiền mặt</option>
              <option value="CARD">Thẻ</option>
              <option value="BANK_TRANSFER">Chuyển khoản</option>
            </select>
          </div>

          <dl className="cart-summary">
            <dt>Tổng tiền hàng</dt><dd>{formatVNDText(subtotal)}</dd>
            <dt>Giảm giá</dt><dd>-{formatVNDText(discount)}</dd>
            <dt>Khách phải trả</dt><dd><strong>{formatVNDText(total)}</strong></dd>
          </dl>

          <button
            className={`btn btn-primary btn-block btn-lg${checkingOut ? ' loading' : ''}`}
            onClick={handleCheckout}
            disabled={checkingOut}
            aria-busy={checkingOut}
          >
            {checkingOut ? 'Đang tạo hóa đơn...' : 'Thanh toán & tạo hóa đơn'}
          </button>
        </section>
      </div>
    </div>
  );
}
