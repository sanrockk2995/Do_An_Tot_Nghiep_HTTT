import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatVNDText, TIER_LABELS } from '../../utils/format';
import { IconX, IconSearch, IconChevronDown, IconUsers } from '../../components/Icons';
import { VN_PROVINCES } from '../../data/vnLocations';

/**
 * POS bán hàng tại quầy (ADMIN/SALES_STAFF):
 * trái = lưới sản phẩm + tìm kiếm; phải = hóa đơn mới.
 */
export default function PosPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [walkInName, setWalkInName] = useState('');

  // Tìm kiếm & chọn khách hàng nhanh tại quầy
  const [custSearch, setCustSearch] = useState('');
  const [custDropdownOpen, setCustDropdownOpen] = useState(false);
  const [highlightCustIdx, setHighlightCustIdx] = useState(0);
  const custComboboxRef = useRef(null);

  const selectedCustomer = useMemo(
    () => customers.find((c) => String(c.id) === String(customerId)),
    [customers, customerId],
  );

  const filteredCustomers = useMemo(() => {
    const q = custSearch.trim().toLowerCase();
    if (!q) return customers.slice(0, 40);
    const cleanDigits = q.replace(/[\s.-]/g, '');
    return customers.filter((c) => {
      const nameMatch = c.fullName && c.fullName.toLowerCase().includes(q);
      const phoneMatch = c.phone && (c.phone.includes(cleanDigits) || c.phone.includes(q));
      const emailMatch = c.email && c.email.toLowerCase().includes(q);
      return nameMatch || phoneMatch || emailMatch;
    }).slice(0, 40);
  }, [customers, custSearch]);

  // Tìm kiếm ngầm mở rộng từ API khi gõ từ khóa
  useEffect(() => {
    if (!custSearch.trim()) return;
    const timer = setTimeout(() => {
      api
        .get('/customers', { params: { q: custSearch.trim(), page: 0, size: 20 } })
        .then((res) => {
          const remoteList = res.data.content || [];
          if (remoteList.length > 0) {
            setCustomers((prev) => {
              const map = new Map();
              prev.forEach((c) => map.set(c.id, c));
              remoteList.forEach((c) => map.set(c.id, c));
              return Array.from(map.values());
            });
          }
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [custSearch]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e) {
      if (custComboboxRef.current && !custComboboxRef.current.contains(e.target)) {
        setCustDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectCustomer(cust) {
    if (!cust) {
      setCustomerId('');
      setCustSearch('');
    } else {
      setCustomerId(String(cust.id));
      setCustSearch('');
    }
    setCustDropdownOpen(false);
  }

  function clearCustomer() {
    setCustomerId('');
    setCustSearch('');
    setCustDropdownOpen(true);
  }

  function handleCustKeyDown(e) {
    const totalItems = filteredCustomers.length + 1; // +1 cho dòng Khách lẻ
    if (!custDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setCustDropdownOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightCustIdx((prev) => (prev + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightCustIdx((prev) => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightCustIdx === 0) {
        selectCustomer(null);
      } else if (filteredCustomers[highlightCustIdx - 1]) {
        selectCustomer(filteredCustomers[highlightCustIdx - 1]);
      }
    } else if (e.key === 'Escape') {
      setCustDropdownOpen(false);
    }
  }

  // Modal thêm nhanh khách hàng mới tại quầy
  const [addCustomerModal, setAddCustomerModal] = useState(false);
  const [custForm, setCustForm] = useState({ fullName: '', phone: '', email: '', address: '', district: '', city: '' });
  const [custSaving, setCustSaving] = useState(false);
  const [custNotice, setCustNotice] = useState('');

  const selectedProvince = useMemo(
    () => VN_PROVINCES.find((p) => stripPrefix(p.name) === custForm.city),
    [custForm.city],
  );
  const wardOptions = selectedProvince ? selectedProvince.wards : [];

  function openAddCustomer() {
    setCustNotice('');
    const query = custSearch.trim();
    const isPhone = /^[0-9+]+$/.test(query);
    setCustForm({
      fullName: !isPhone ? query : '',
      phone: isPhone ? query : '',
      email: '',
      address: '',
      district: '',
      city: '',
    });
    setCustDropdownOpen(false);
    setAddCustomerModal(true);
  }

  function handleCustProvinceChange(e) {
    const name = e.target.value;
    setCustForm((f) => ({ ...f, city: name, district: '' }));
  }

  async function handleSaveNewCustomer(e) {
    e.preventDefault();
    setCustNotice('');

    const fullName = custForm.fullName.trim();
    if (!fullName) {
      setCustNotice('Vui lòng nhập họ tên khách hàng.');
      return;
    }

    const cleanPhone = custForm.phone.trim().replace(/[\s.-]/g, '');
    if (!cleanPhone) {
      setCustNotice('Vui lòng nhập số điện thoại.');
      return;
    }

    if (!/^(0|\+84)[0-9]{9}$/.test(cleanPhone)) {
      setCustNotice('Số điện thoại không đúng định dạng hoặc độ dài (yêu cầu 10 chữ số, ví dụ 0912345678).');
      return;
    }

    const email = custForm.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) {
      setCustNotice('Email không đúng định dạng (ví dụ: khachhang@example.com).');
      return;
    }

    setCustSaving(true);
    try {
      const res = await api.post('/customers', {
        fullName,
        phone: cleanPhone,
        email: email || null,
        address: custForm.address.trim() || null,
        district: custForm.district.trim() || null,
        city: custForm.city.trim() || null,
      });
      const created = res.data;
      setCustomers((prev) => [created, ...prev]);
      setCustomerId(String(created.id));
      setCustSearch('');
      setCustDropdownOpen(false);
      setAddCustomerModal(false);
      toast.success('Thêm khách hàng thành công');
    } catch (err) {
      const resp = err.response?.data;
      const status = err.response?.status;
      const message = resp?.message || resp?.fieldErrors?.email || resp?.fieldErrors?.phone || err.message;

      if (message && (message.includes('đã tồn tại') || message.includes('đã có trong hệ thống') || message.includes('đã được sử dụng'))) {
        setCustNotice(message || 'Khách hàng đã tồn tại.');
      } else if (!status || status >= 500) {
        setCustNotice('Lỗi kết nối hoặc lỗi hệ thống. Vui lòng thử lại.');
        toast.error('Lỗi kết nối hoặc lỗi hệ thống. Vui lòng thử lại.');
      } else {
        setCustNotice(message || 'Thông tin không hợp lệ. Vui lòng nhập lại.');
      }
    } finally {
      setCustSaving(false);
    }
  }

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
      toast.warning(`Sản phẩm "${product.name}" đã ngừng bán.`);
      return;
    }
    const stock = Number(product.stock ?? 0);
    if (stock <= 0) {
      toast.warning(`Sản phẩm "${product.name}" đã hết hàng.`);
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
          toast.warning(`Sản phẩm "${product.name}" (${initialSize} - ${initialColor}) chỉ còn ${initialStock} trong kho.`);
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
        toast.warning(`Sản phẩm "${item.productName}" chỉ còn ${item.stock} trong kho.`);
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
        toast.error(res.data.message || 'Mã giảm giá không hợp lệ.');
        return;
      }
      setAppliedPromo(res.data);
      setDiscount(Number(res.data.discountAmount || 0));
      toast.success(`Áp dụng mã ${res.data.promotionCode}: giảm ${formatVNDText(res.data.discountAmount)}`);
    } catch (err) {
      setAppliedPromo(null);
      setDiscount(0);
      toast.error(err.response?.data?.message || err.message || 'Mã không hợp lệ.');
    }
  }

  async function handleCheckout() {
    if (cartItems.length === 0) {
      toast.warning('Chưa chọn sản phẩm nào.');
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
      toast.success('Tạo hóa đơn thành công!');
      resetSale();
      loadProducts(q);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Tạo hóa đơn thất bại.');
    } finally {
      setCheckingOut(false);
    }
  }

  function resetSale() {
    setCartItems([]);
    setCustomerId('');
    setWalkInName('');
    setCustSearch('');
    setCustDropdownOpen(false);
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

          <div className="field" ref={custComboboxRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label htmlFor="pos-cust-search" style={{ margin: 0 }}>Khách hàng</label>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: 13, padding: '2px 8px', color: 'var(--primary, #000)' }}
                onClick={openAddCustomer}
              >
                + Thêm khách mới
              </button>
            </div>

            {selectedCustomer ? (
              <div className="pos-customer-selected-card">
                <div className="cust-info">
                  <div className="cust-icon">
                    <IconUsers size={16} />
                  </div>
                  <div className="cust-text">
                    <strong>{selectedCustomer.fullName}</strong>
                    <span>· {selectedCustomer.phone || selectedCustomer.email || 'Thành viên'}</span>
                  </div>
                  <span className={`badge ${tierBadge(selectedCustomer.tier)} cust-badge`}>
                    {TIER_LABELS[selectedCustomer.tier] || selectedCustomer.tier}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-change-cust"
                  onClick={clearCustomer}
                  title="Chọn khách khác hoặc chuyển sang khách lẻ"
                >
                  Đổi
                </button>
              </div>
            ) : (
              <div className="pos-customer-combobox">
                <div className="pos-customer-input-wrap">
                  <span className="search-icon">
                    <IconSearch size={16} />
                  </span>
                  <input
                    id="pos-cust-search"
                    type="search"
                    value={custSearch}
                    onChange={(e) => {
                      setCustSearch(e.target.value);
                      setCustDropdownOpen(true);
                      setHighlightCustIdx(0);
                    }}
                    onFocus={() => {
                      setCustDropdownOpen(true);
                      setHighlightCustIdx(0);
                    }}
                    onKeyDown={handleCustKeyDown}
                    placeholder="Tìm theo tên, SĐT hoặc chọn khách..."
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="chevron-btn"
                    onClick={() => setCustDropdownOpen((v) => !v)}
                    title="Mở danh sách khách hàng"
                    tabIndex={-1}
                  >
                    <IconChevronDown size={16} />
                  </button>
                </div>

                {custDropdownOpen && (
                  <ul className="pos-customer-dropdown" role="listbox">
                    <li
                      className={`pos-customer-item special-walkin ${highlightCustIdx === 0 ? 'active' : ''}`}
                      onMouseDown={() => selectCustomer(null)}
                    >
                      <div className="cust-main">
                        <span className="cust-name">— Khách lẻ (không tích điểm) —</span>
                        <span className="cust-sub">Khách mua trực tiếp tại quầy</span>
                      </div>
                      <span className="badge badge-gray cust-badge">Mặc định</span>
                    </li>

                    {filteredCustomers.map((c, idx) => {
                      const itemIdx = idx + 1;
                      return (
                        <li
                          key={c.id}
                          className={`pos-customer-item ${itemIdx === highlightCustIdx ? 'active' : ''}`}
                          onMouseDown={() => selectCustomer(c)}
                        >
                          <div className="cust-main">
                            <span className="cust-name">{c.fullName}</span>
                            <span className="cust-sub">{c.phone || c.email}</span>
                          </div>
                          <span className={`badge ${tierBadge(c.tier)} cust-badge`}>
                            {TIER_LABELS[c.tier] || c.tier}
                          </span>
                        </li>
                      );
                    })}

                    {filteredCustomers.length === 0 && (
                      <li className="pos-customer-empty">
                        <p style={{ margin: '0 0 6px 0' }}>Không tìm thấy khách hàng "{custSearch}".</p>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ fontSize: 12, padding: '4px 10px' }}
                          onMouseDown={openAddCustomer}
                        >
                          + Tạo mới khách này
                        </button>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}
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

      {addCustomerModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card">
            <h2>Thêm khách hàng mới</h2>
            <form onSubmit={handleSaveNewCustomer} noValidate>
              <div className="field">
                <label htmlFor="pos-cust-fullname">Họ tên *</label>
                <input
                  id="pos-cust-fullname"
                  value={custForm.fullName}
                  onChange={(e) => setCustForm({ ...custForm, fullName: e.target.value })}
                  placeholder="Nhập họ và tên khách hàng..."
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="pos-cust-phone">Số điện thoại *</label>
                <input
                  id="pos-cust-phone"
                  value={custForm.phone}
                  onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
                  placeholder="Ví dụ: 0912345678 (10 chữ số)"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="pos-cust-email">Email</label>
                <input
                  id="pos-cust-email"
                  type="email"
                  value={custForm.email}
                  onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                  placeholder="Ví dụ: khachhang@example.com (tùy chọn)"
                />
              </div>
              <div className="field">
                <label htmlFor="pos-cust-address">Địa chỉ</label>
                <input
                  id="pos-cust-address"
                  value={custForm.address}
                  onChange={(e) => setCustForm({ ...custForm, address: e.target.value })}
                  placeholder="Số nhà, tên đường..."
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="field" style={{ flex: 1 }}>
                  <label htmlFor="pos-cust-city">Tỉnh/Thành phố</label>
                  <select
                    id="pos-cust-city"
                    value={custForm.city}
                    onChange={handleCustProvinceChange}
                  >
                    <option value="">— Chọn tỉnh/thành phố —</option>
                    {VN_PROVINCES.map((p) => (
                      <option key={p.name} value={stripPrefix(p.name)}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label htmlFor="pos-cust-ward">Phường/Xã</label>
                  <select
                    id="pos-cust-ward"
                    value={custForm.district}
                    onChange={(e) => setCustForm({ ...custForm, district: e.target.value })}
                    disabled={wardOptions.length === 0}
                  >
                    <option value="">
                      {wardOptions.length === 0 ? '— Chọn tỉnh/thành trước —' : '— Chọn phường/xã —'}
                    </option>
                    {wardOptions.map((w) => (
                      <option key={`${w.n}|${w.t}`} value={w.n}>
                        {w.t === 'Xã' ? w.n : `${w.n} (${w.t})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {custNotice && <div className="alert alert-error" role="alert">{custNotice}</div>}

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setAddCustomerModal(false)}>
                  Huỷ
                </button>
                <button type="submit" className={`btn btn-primary${custSaving ? ' loading' : ''}`} disabled={custSaving}>
                  {custSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function stripPrefix(name) {
  return name ? name.replace(/^(Thành phố|Tỉnh) /, '') : '';
}

function tierBadge(tier) {
  switch (tier) {
    case 'VIP':
      return 'badge-pink';
    case 'GOLD':
      return 'badge-yellow';
    case 'SILVER':
      return 'badge-blue';
    default:
      return 'badge-gray';
  }
}
