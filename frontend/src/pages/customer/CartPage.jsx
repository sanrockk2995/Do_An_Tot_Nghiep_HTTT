import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { formatVNDText } from '../../utils/format';
import { IconX } from '../../components/Icons';
import { VN_PROVINCES, stripProvinceName } from '../../data/vnLocations';

/** Giỏ hàng: xem, sửa số lượng, nhập mã giảm giá, đặt hàng online. */
export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, refreshCart, updateQuantity, removeItem } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [prefilledNote, setPrefilledNote] = useState('');
  const [form, setForm] = useState({ receiverName: '', phone: '', address: '', city: '', district: '', notes: '' });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  // Chọn mặt hàng để thanh toán: mặc định chọn tất cả
  const [selectedIds, setSelectedIds] = useState(null); // null = chưa đụng tới → coi như chọn hết

  /** Tỉnh/TP đang chọn (34 tỉnh/thành mới) → suy ra danh sách phường/xã. */
  const wardOptions = useMemo(() => {
    const p = VN_PROVINCES.find((x) => stripProvinceName(x.name) === form.city);
    return p ? p.wards : [];
  }, [form.city]);

  const selectedSet = useMemo(
    () => (selectedIds == null ? new Set(cart.map((i) => i.id)) : selectedIds),
    [selectedIds, cart]
  );
  const selectedItems = cart.filter((i) => selectedSet.has(i.id));
  const allSelected = cart.length > 0 && selectedItems.length === cart.length;

  function toggleItem(id) {
    setSelectedIds((prev) => {
      const base = prev == null ? new Set(cart.map((i) => i.id)) : new Set(prev);
      if (base.has(id)) base.delete(id);
      else base.add(id);
      return base;
    });
    setAppliedPromo(null); // tổng thay đổi → yêu cầu áp dụng lại mã giảm giá
    setDiscount(0);
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(cart.map((i) => i.id)));
    setAppliedPromo(null);
    setDiscount(0);
  }

  // Tự điền thông tin giao hàng từ hồ sơ khách (GET /me) — khách đã cập nhật thì khỏi nhập lại.
  // Chạy sau khi AuthContext khôi phục phiên xong (phụ thuộc user) để token kịp gắn vào request.
  useEffect(() => {
    if (!user || user.role !== 'CUSTOMER') return;
    let alive = true;
    api.get('/me')
      .then((res) => {
        if (!alive) return;
        const p = res.data || {};
        if (p.fullName || p.phone || p.address || p.city) {
          setForm((f) => ({
            ...f,
            receiverName: f.receiverName || p.fullName || '',
            phone: f.phone || p.phone || '',
            address: f.address || p.address || '',
            city: f.city || p.city || '',
            district: f.district || p.district || '',
          }));
          setPrefilledNote('Đã tự điền từ hồ sơ của bạn.');
        }
      })
      .catch(() => {}); // chưa có hồ sơ thì để khách nhập tay
    return () => { alive = false; };
  }, [user?.id]);

  async function handleApplyPromo() {
    setError('');
    setMessage('');
    if (!promoCode.trim()) return;
    try {
      const res = await api.post('/promotions/apply', {
        code: promoCode.trim(),
        orderAmount: subtotal,
      });
      if (!res.data.valid) {
        setAppliedPromo(null);
        setDiscount(0);
        setError(res.data.message || 'Mã giảm giá không hợp lệ.');
        return;
      }
      setAppliedPromo(res.data);
      setDiscount(Number(res.data.discountAmount || 0));
      setMessage(`Áp dụng mã ${res.data.promotionCode} thành công!`);
    } catch (err) {
      setAppliedPromo(null);
      setDiscount(0);
      setError(err.message || 'Mã không hợp lệ.');
    }
  }

  async function handleSubmitOrder(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (cart.length === 0) {
      setError('Giỏ hàng đang trống.');
      return;
    }
    if (selectedItems.length === 0) {
      setError('Vui lòng chọn ít nhất một sản phẩm để thanh toán.');
      return;
    }
    if (!form.city || !form.district) {
      setError('Vui lòng chọn Tỉnh/Thành phố và Phường/Xã giao hàng.');
      return;
    }
    setSubmitting(true);
    try {
      // Đơn online lấy địa chỉ giao từ hồ sơ khách → đồng bộ lựa chọn mới về hồ sơ trước
      await api.put('/me/profile', {
        fullName: form.receiverName.trim() || user?.fullName || '',
        phone: form.phone.trim(),
        address: form.address.trim(),
        district: form.district,
        city: form.city,
      });
      await api.post('/orders', {
        customerId: user?.customerId ?? user?.id,
        items: selectedItems.map((i) => ({
          productId: i.productId,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
        })),
        paymentMethod,
        channel: 'ONLINE',
        promotionCode: appliedPromo ? appliedPromo.promotionCode : undefined,
        notes: form.notes,
      });
      // Xoá những SP đã đặt khỏi giỏ, giữ lại SP chưa chọn
      for (const item of selectedItems) {
        await removeItem(item.id);
      }
      refreshCart();
      const kept = cart.length - selectedItems.length;
      setMessage(kept > 0
        ? 'Đặt hàng thành công! Các sản phẩm chưa chọn vẫn được giữ trong giỏ...'
        : 'Đặt hàng thành công! Đang chuyển đến trang đơn hàng của tôi...');
      setTimeout(() => navigate(kept > 0 ? '/cart' : '/my-orders'), 1500);
    } catch (err) {
      setError(err.message || 'Đặt hàng thất bại.');
    } finally {
      setSubmitting(false);
    }
  }

  const subtotal = selectedItems.reduce((sum, i) => sum + Number(i.price || 0) * i.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  if (!user || user.role !== 'CUSTOMER') {
    return (
      <div className="container section empty-state">
        <p>Vui lòng đăng nhập để xem giỏ hàng.</p>
        <Link to="/login" className="btn btn-primary">Đăng nhập</Link>
      </div>
    );
  }

  return (
    <div className="container section cart-page">
      <h1>Giỏ hàng của bạn</h1>

      {cart.length === 0 ? (
        <div className="empty-state">
          <p>Giỏ hàng đang trống.</p>
          <Link to="/products" className="btn btn-primary">Tiếp tục mua sắm</Link>
        </div>
      ) : (
        <div className="cart-grid">
          <div className="cart-list">
            <label className="cart-select-all">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Chọn tất cả sản phẩm"
              />
              Chọn tất cả ({cart.length})
            </label>
            {cart.map((item) => (
              <div key={item.id} className={`cart-item card${selectedSet.has(item.id) ? '' : ' cart-item-unselected'}`}>
                <input
                  type="checkbox"
                  className="cart-item-check"
                  checked={selectedSet.has(item.id)}
                  onChange={() => toggleItem(item.id)}
                  aria-label={`Chọn ${item.name}`}
                />
                <div className="cart-item-info">
                  <strong>{item.name}</strong>
                  <span className="muted-text">Size {item.size} · Màu {item.color}</span>
                  <span>{formatVNDText(item.price)}</span>
                </div>
                <div className="qty-stepper">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label="Giảm"
                  >−</button>
                  <input value={item.quantity} readOnly aria-label="Số lượng" />
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.stock != null && item.quantity >= item.stock}
                    title={item.stock != null && item.quantity >= item.stock
                      ? 'Đã đạt số lượng còn lại trong kho' : undefined}
                    aria-label="Tăng"
                  >+</button>
                </div>
                {item.stock != null && item.quantity >= item.stock && (
                  <span className="muted-text" style={{ fontSize: 12 }}>Chỉ còn {item.stock}</span>
                )}
                <strong>{formatVNDText(item.price * item.quantity)}</strong>
                <button
                  className="btn btn-ghost"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Xóa ${item.name}`}
                >
                  <IconX size={16} />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmitOrder} className="checkout-panel card">
            <h2>Thông tin đặt hàng</h2>
            {prefilledNote && (
              <p className="muted-text" style={{ fontSize: 12.5, marginTop: -6 }}>
                ✓ {prefilledNote}
              </p>
            )}

            <div className="field">
              <label htmlFor="receiverName">Người nhận *</label>
              <input
                id="receiverName"
                required
                value={form.receiverName}
                onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="phone">Số điện thoại *</label>
              <input
                id="phone"
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="city">Tỉnh/Thành phố *</label>
                <select
                  id="city"
                  required
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value, district: '' }))}
                >
                  <option value="">— Chọn tỉnh/thành phố —</option>
                  {VN_PROVINCES.map((p) => (
                    <option key={p.name} value={stripProvinceName(p.name)}>{p.name}</option>
                  ))}
                  {form.city && !VN_PROVINCES.some((p) => stripProvinceName(p.name) === form.city) && (
                    <option value={form.city}>{form.city} (đơn vị cũ)</option>
                  )}
                </select>
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="district">Phường/Xã *</label>
                <select
                  id="district"
                  required
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  disabled={wardOptions.length === 0 && !form.district}
                >
                  <option value="">
                    {wardOptions.length === 0 ? '— Chọn tỉnh/thành phố trước —' : '— Chọn phường/xã —'}
                  </option>
                  {wardOptions.map((w) => (
                    <option key={`${w.n}|${w.t}`} value={w.n}>
                      {w.t === 'Xã' ? w.n : `${w.n} (${w.t})`}
                    </option>
                  ))}
                  {form.district && !wardOptions.some((w) => w.n === form.district) && (
                    <option value={form.district}>{form.district} (đơn vị cũ)</option>
                  )}
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="address">Địa chỉ giao hàng * <span className="muted-text">(số nhà, tên đường)</span></label>
              <input
                id="address"
                required
                placeholder="VD: 123 Nguyễn Trãi"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="paymentMethod">Phương thức thanh toán</label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                <option value="CARD">Thẻ tín dụng / ghi nợ</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="notes">Ghi chú</label>
              <textarea
                id="notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="field">
              <label htmlFor="promoCode">Mã giảm giá</label>
              <div className="field-inline">
                <input
                  id="promoCode"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="VD: SALE10"
                />
                <button type="button" className="btn btn-outline" onClick={handleApplyPromo}>
                  Áp dụng
                </button>
              </div>
            </div>

            <dl className="cart-summary">
              <dt>Tạm tính</dt>
              <dd>{formatVNDText(subtotal)}</dd>
              <dt>Giảm giá</dt>
              <dd>-{formatVNDText(discount)}</dd>
              <dt>Tổng cộng</dt>
              <dd><strong>{formatVNDText(total)}</strong></dd>
            </dl>

            {error && <div className="alert alert-error" role="alert">{error}</div>}
            {message && <div className="alert alert-success" role="status">{message}</div>}

            <button
              type="submit"
              className={`btn btn-primary btn-block btn-lg${submitting ? ' loading' : ''}`}
              disabled={submitting || selectedItems.length === 0}
              aria-busy={submitting}
            >
              {submitting
                ? 'Đang xử lý...'
                : selectedItems.length === cart.length
                  ? `Đặt hàng (${cart.length} sản phẩm)`
                  : `Đặt hàng (${selectedItems.length}/${cart.length} đã chọn)`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
