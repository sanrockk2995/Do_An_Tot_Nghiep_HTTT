import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, getErrorMessage } from '../../services/api';
import { formatVNDText } from '../../utils/format';
import { IconAlertCircle, IconBox, IconCheckCircle, IconSearch, IconStore, IconX } from '../../components/Icons';

/** Quản lý khuyến mãi (ADMIN CRUD; SALES/ACCOUNTANT xem). */
export default function PromotionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // Danh sách sản phẩm & danh mục để chọn trong modal
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Bộ lọc sản phẩm trong modal
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productTab, setProductTab] = useState('all'); // 'all' | 'selected'

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    api
      .get('/promotions', { params: { page: 0, size: 50 } })
      .then((res) => {
        if (!alive) return;
        setItems(res.data?.content || res.data || []);
      })
      .catch((err) => {
        if (alive) setError(getErrorMessage(err, 'Không tải được khuyến mãi.'));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    load();

    // Tải danh mục và sản phẩm cho modal chọn
    api.get('/categories')
      .then((res) => setCategories(res.data || []))
      .catch(() => {});

    setLoadingProducts(true);
    api.get('/admin/products', { params: { size: 300 } })
      .then((res) => setProducts(res.data?.content || res.data || []))
      .catch(() => {
        api.get('/products', { params: { size: 300 } })
          .then((res) => setProducts(res.data?.content || res.data || []))
          .catch(() => {});
      })
      .finally(() => setLoadingProducts(false));
  }, [load]);

  function openCreate() {
    setError('');
    setMessage('');
    setProductSearch('');
    setSelectedCategory('');
    setProductTab('all');
    setEditing({
      code: '', name: '', description: '', type: 'PERCENT', discountValue: '',
      minOrderAmount: '', maxDiscountAmount: '', startDate: '', endDate: '',
      usageLimit: '', status: 'ACTIVE',
      applyToAllProducts: true,
      productIds: [],
    });
  }

  function openEdit(p) {
    setError('');
    setMessage('');
    setProductSearch('');
    setSelectedCategory('');
    setProductTab('all');
    setEditing({
      ...p,
      applyToAllProducts: p.applyToAllProducts !== false,
      productIds: Array.isArray(p.productIds) ? [...p.productIds] : [],
      startDate: (p.startDate || '').substring(0, 10),
      endDate: (p.endDate || '').substring(0, 10),
    });
  }

  function toggleProduct(productId) {
    setEditing((prev) => {
      if (!prev) return prev;
      const current = prev.productIds || [];
      const next = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId];
      return { ...prev, productIds: next };
    });
  }

  function selectAllFiltered(filteredList) {
    setEditing((prev) => {
      if (!prev) return prev;
      const set = new Set(prev.productIds || []);
      filteredList.forEach((p) => set.add(p.id));
      return { ...prev, productIds: Array.from(set) };
    });
  }

  function deselectAllFiltered(filteredList) {
    setEditing((prev) => {
      if (!prev) return prev;
      const filterSet = new Set(filteredList.map((p) => p.id));
      const next = (prev.productIds || []).filter((id) => !filterSet.has(id));
      return { ...prev, productIds: next };
    });
  }

  function clearAllSelected() {
    setEditing((prev) => (prev ? { ...prev, productIds: [] } : prev));
  }

  // Danh sách sản phẩm sau khi lọc
  const filteredProducts = useMemo(() => {
    let list = products;
    if (productTab === 'selected') {
      const selSet = new Set(editing?.productIds || []);
      list = list.filter((p) => selSet.has(p.id));
    }
    if (selectedCategory) {
      list = list.filter((p) => String(p.categoryId) === String(selectedCategory));
    }
    if (productSearch.trim()) {
      const term = productSearch.trim().toLowerCase();
      list = list.filter((p) =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.code && p.code.toLowerCase().includes(term))
      );
    }
    return list;
  }, [products, editing?.productIds, productTab, selectedCategory, productSearch]);

  async function handleSave(e) {
    e.preventDefault();
    setError('');

    // Ràng buộc nếu chọn áp dụng cho sản phẩm cụ thể
    if (!editing.applyToAllProducts && (!editing.productIds || editing.productIds.length === 0)) {
      setError('Vui lòng chọn ít nhất một sản phẩm khi không áp dụng cho tất cả sản phẩm.');
      return;
    }

    setSaving(true);
    try {
      // Backend nhận type/name và LocalDateTime đầy đủ giờ
      const payload = {
        code: editing.code.toUpperCase(),
        name: editing.name?.trim() || editing.description?.trim() || editing.code.toUpperCase(),
        description: editing.description,
        type: editing.type,
        discountValue: Number(editing.discountValue),
        minOrderAmount: editing.minOrderAmount ? Number(editing.minOrderAmount) : null,
        maxDiscountAmount: editing.type === 'PERCENT'
          ? (editing.maxDiscountAmount ? Number(editing.maxDiscountAmount) : null)
          : null,
        startDate: editing.startDate ? `${editing.startDate}T00:00:00` : null,
        endDate: editing.endDate ? `${editing.endDate}T23:59:59` : null,
        usageLimit: editing.usageLimit ? Number(editing.usageLimit) : null,
        status: editing.status,
        applyToAllProducts: editing.applyToAllProducts,
        productIds: editing.applyToAllProducts ? [] : (editing.productIds || []),
      };
      if (editing.id) {
        await api.put(`/promotions/${editing.id}`, payload);
        setMessage('Đã cập nhật khuyến mãi.');
      } else {
        await api.post('/promotions', payload);
        setMessage('Đã tạo khuyến mãi.');
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'Lưu thất bại.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Xoá chương trình khuyến mãi này?')) return;
    setError('');
    try {
      await api.delete(`/promotions/${id}`);
      setMessage('Đã xoá khuyến mãi.');
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'Xoá thất bại.'));
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Khuyến mãi</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm chương trình</button>
      </header>

      {error && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon"><IconAlertCircle size={18} /></span>
          <span className="alert-content">{error}</span>
          <button
            type="button"
            className="alert-close"
            onClick={() => setError('')}
            aria-label="Đóng thông báo"
          >
            <IconX size={15} />
          </button>
        </div>
      )}
      {message && (
        <div className="alert alert-success" role="status">
          <span className="alert-icon"><IconCheckCircle size={18} /></span>
          <span className="alert-content">{message}</span>
          <button
            type="button"
            className="alert-close"
            onClick={() => setMessage('')}
            aria-label="Đóng thông báo"
          >
            <IconX size={15} />
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Mô tả</th>
                <th>Kiểu giảm</th>
                <th>Giá trị</th>
                <th>Phạm vi</th>
                <th>Thời gian</th>
                <th>Lượt dùng</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td><code>{p.code}</code></td>
                  <td>{p.name || p.description}</td>
                  <td>{p.type === 'PERCENT' ? 'Phần trăm (%)' : 'Số tiền cố định'}</td>
                  <td>
                    {p.type === 'PERCENT'
                      ? `${p.discountValue}%`
                      : formatVNDText(p.discountValue)}
                    {p.maxDiscountAmount ? (
                      <span className="muted-text"> · tối đa {formatVNDText(p.maxDiscountAmount)}</span>
                    ) : null}
                  </td>
                  <td>
                    {p.applyToAllProducts !== false ? (
                      <span className="badge badge-blue">Tất cả sản phẩm</span>
                    ) : (
                      <span className="badge badge-orange" title={`${p.productIds?.length || 0} sản phẩm được chọn`}>
                        {p.productIds?.length || 0} SP cụ thể
                      </span>
                    )}
                  </td>
                  <td>
                    {(p.startDate || '').substring(0, 10)} → {(p.endDate || '').substring(0, 10)}
                  </td>
                  <td>{p.usageCount ?? 0}{p.usageLimit ? ` / ${p.usageLimit}` : ''}</td>
                  <td>
                    <span className={`badge ${p.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>
                      {p.status === 'ACTIVE' ? 'Đang chạy' : 'Tắt'}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button className="btn btn-outline" onClick={() => openEdit(p)}>Sửa</button>
                    <button className="btn btn-ghost text-danger" onClick={() => handleDelete(p.id)}>Xoá</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={9} className="muted-text">Chưa có chương trình nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing !== null && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card modal-wide" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <h2>{editing.id ? 'Cập nhật khuyến mãi' : 'Thêm khuyến mãi'}</h2>
            <form onSubmit={handleSave} style={{ overflowY: 'auto', paddingRight: 4, flex: 1 }}>
              <div className="form-grid-2col">
                <div className="field">
                  <label htmlFor="pm-code">Mã *</label>
                  <input id="pm-code" required value={editing.code}
                    onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} />
                </div>
                <div className="field">
                  <label htmlFor="pm-name">Tên chương trình *</label>
                  <input id="pm-name" required value={editing.name || ''}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor="pm-status">Trạng thái</label>
                  <select id="pm-status" value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                    <option value="ACTIVE">Đang chạy</option>
                    <option value="INACTIVE">Tạm tắt</option>
                    <option value="EXPIRED">Hết hạn</option>
                    <option value="OUT_OF_STOCK">Hết lượt</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="pm-desc">Mô tả</label>
                  <input id="pm-desc" value={editing.description || ''}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor="pm-type">Kiểu giảm giá *</label>
                  <select id="pm-type" value={editing.type}
                    onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số tiền cố định</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="pm-value">Giá trị * {editing.type === 'PERCENT' ? '(%)' : '(₫)'}</label>
                  <input id="pm-value" type="number" required min="0"
                    max={editing.type === 'PERCENT' ? 100 : undefined}
                    value={editing.discountValue}
                    onChange={(e) => setEditing({ ...editing, discountValue: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor="pm-min">Giá trị đơn tối thiểu (₫)</label>
                  <input id="pm-min" type="number" min="0" value={editing.minOrderAmount ?? ''}
                    onChange={(e) => setEditing({ ...editing, minOrderAmount: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor="pm-max">Giảm tối đa (₫, cho %)</label>
                  <input id="pm-max" type="number" min="0" value={editing.maxDiscountAmount ?? ''}
                    disabled={editing.type !== 'PERCENT'}
                    onChange={(e) => setEditing({ ...editing, maxDiscountAmount: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor="pm-start">Ngày bắt đầu *</label>
                  <input id="pm-start" type="date" required value={editing.startDate}
                    onChange={(e) => setEditing({ ...editing, startDate: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor="pm-end">Ngày kết thúc *</label>
                  <input id="pm-end" type="date" required value={editing.endDate}
                    onChange={(e) => setEditing({ ...editing, endDate: e.target.value })} />
                </div>
                <div className="field span-2">
                  <label htmlFor="pm-limit">Giới hạn lượt dùng</label>
                  <input id="pm-limit" type="number" min="0" value={editing.usageLimit ?? ''}
                    onChange={(e) => setEditing({ ...editing, usageLimit: e.target.value })} />
                </div>

                {/* Chọn phạm vi áp dụng sản phẩm */}
                <div className="field span-2" style={{ marginTop: 4, marginBottom: 12 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#0f172a',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span>Phạm vi áp dụng sản phẩm</span>
                    <span style={{ color: '#dc2626' }}>*</span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 12
                  }}>
                    {/* Thẻ 1: Tất cả sản phẩm */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setEditing({ ...editing, applyToAllProducts: true })}
                      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setEditing({ ...editing, applyToAllProducts: true }); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '14px 16px',
                        borderRadius: 10,
                        border: editing.applyToAllProducts
                          ? '2px solid #1c1917'
                          : '1px solid #e2e8f0',
                        background: editing.applyToAllProducts ? '#fafaf9' : '#ffffff',
                        cursor: 'pointer',
                        boxShadow: editing.applyToAllProducts ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: editing.applyToAllProducts ? '#1c1917' : '#f1f5f9',
                        color: editing.applyToAllProducts ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s ease'
                      }}>
                        <IconStore size={20} />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: editing.applyToAllProducts ? '#1c1917' : '#334155',
                          marginBottom: 2
                        }}>
                          Tất cả sản phẩm
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: '#64748b',
                          lineHeight: 1.3
                        }}>
                          Áp dụng giảm giá cho toàn bộ mặt hàng
                        </div>
                      </div>

                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: editing.applyToAllProducts ? '6px solid #1c1917' : '2px solid #cbd5e1',
                        background: '#ffffff',
                        flexShrink: 0,
                        transition: 'all 0.15s ease'
                      }} />
                    </div>

                    {/* Thẻ 2: Sản phẩm cụ thể */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setEditing({ ...editing, applyToAllProducts: false })}
                      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setEditing({ ...editing, applyToAllProducts: false }); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '14px 16px',
                        borderRadius: 10,
                        border: !editing.applyToAllProducts
                          ? '2px solid #b45309'
                          : '1px solid #e2e8f0',
                        background: !editing.applyToAllProducts ? '#fffbeb' : '#ffffff',
                        cursor: 'pointer',
                        boxShadow: !editing.applyToAllProducts ? '0 2px 8px rgba(180,83,9,0.08)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: !editing.applyToAllProducts ? '#b45309' : '#f1f5f9',
                        color: !editing.applyToAllProducts ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s ease'
                      }}>
                        <IconBox size={20} />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 2
                        }}>
                          <span style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: !editing.applyToAllProducts ? '#92400e' : '#334155'
                          }}>
                            Sản phẩm cụ thể
                          </span>
                          {!editing.applyToAllProducts && editing.productIds?.length > 0 && (
                            <span className="badge badge-amber" style={{ fontSize: 11, padding: '1px 6px' }}>
                              {editing.productIds.length} SP
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: '#64748b',
                          lineHeight: 1.3
                        }}>
                          Chỉ áp dụng cho các sản phẩm được chọn
                        </div>
                      </div>

                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: !editing.applyToAllProducts ? '6px solid #b45309' : '2px solid #cbd5e1',
                        background: '#ffffff',
                        flexShrink: 0,
                        transition: 'all 0.15s ease'
                      }} />
                    </div>
                  </div>
                </div>

                {/* Khu vực chọn sản phẩm cụ thể */}
                {!editing.applyToAllProducts && (
                  <div className="field span-2" style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, background: '#ffffff', marginTop: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                    {/* Header & thống kê */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Danh sách sản phẩm áp dụng</span>
                        <span className={`badge ${editing.productIds?.length > 0 ? 'badge-blue' : 'badge-gray'}`} style={{ fontSize: 12, padding: '3px 9px' }}>
                          Đã chọn: {editing.productIds?.length || 0} sản phẩm
                        </span>
                        {(!editing.productIds || editing.productIds.length === 0) && (
                          <span style={{ color: '#dc2626', fontSize: 12, fontWeight: 500 }}>* Vui lòng chọn ít nhất 1 sản phẩm</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ minHeight: 32, height: 32, padding: '0 12px', fontSize: 12 }}
                          onClick={() => selectAllFiltered(filteredProducts)}
                          disabled={filteredProducts.length === 0}
                        >
                          Chọn tất cả đang lọc ({filteredProducts.length})
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ minHeight: 32, height: 32, padding: '0 10px', fontSize: 12 }}
                          onClick={clearAllSelected}
                          disabled={!editing.productIds || editing.productIds.length === 0}
                        >
                          Bỏ chọn tất cả
                        </button>
                      </div>
                    </div>

                    {/* Danh sách chip sản phẩm đã chọn */}
                    {editing.productIds?.length > 0 && (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                        padding: '8px 10px',
                        background: '#f8fafc',
                        borderRadius: 8,
                        border: '1px solid #f1f5f9',
                        marginBottom: 12,
                        maxHeight: 90,
                        overflowY: 'auto'
                      }}>
                        {editing.productIds.map((pid) => {
                          const prod = products.find((p) => p.id === pid);
                          return (
                            <span
                              key={pid}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: 16,
                                padding: '3px 8px',
                                fontSize: 12
                              }}
                            >
                              <strong style={{ color: '#0f172a' }}>{prod?.code || `#${pid}`}</strong>
                              <span style={{ maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#475569' }}>
                                {prod?.name || 'Sản phẩm'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleProduct(pid)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', color: '#94a3b8' }}
                                title="Bỏ chọn"
                              >
                                <IconX size={13} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Thanh công cụ tìm kiếm và lọc */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 2, minWidth: 200, position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Tìm theo tên hoặc mã sản phẩm..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          style={{ width: '100%', paddingLeft: 34, height: 38, minHeight: 38, fontSize: 13 }}
                        />
                        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                          <IconSearch size={16} />
                        </span>
                      </div>

                      <div style={{ flex: 1, minWidth: 160 }}>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          style={{ width: '100%', height: 38, minHeight: 38, fontSize: 13 }}
                        >
                          <option value="">— Tất cả danh mục —</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', height: 38 }}>
                        <button
                          type="button"
                          onClick={() => setProductTab('all')}
                          style={{
                            border: 'none',
                            padding: '0 14px',
                            fontSize: 12,
                            fontWeight: 500,
                            background: productTab === 'all' ? '#1c1917' : '#f8fafc',
                            color: productTab === 'all' ? '#ffffff' : '#475569',
                            cursor: 'pointer'
                          }}
                        >
                          Tất cả ({products.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductTab('selected')}
                          style={{
                            border: 'none',
                            padding: '0 14px',
                            fontSize: 12,
                            fontWeight: 500,
                            background: productTab === 'selected' ? '#1c1917' : '#f8fafc',
                            color: productTab === 'selected' ? '#ffffff' : '#475569',
                            cursor: 'pointer'
                          }}
                        >
                          Đã chọn ({editing.productIds?.length || 0})
                        </button>
                      </div>
                    </div>

                    {/* Bảng sản phẩm có thanh cuộn */}
                    <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                      {loadingProducts ? (
                        <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></div>
                      ) : filteredProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 13 }}>
                          Không tìm thấy sản phẩm nào phù hợp.
                        </div>
                      ) : (
                        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1, borderBottom: '1px solid #e2e8f0' }}>
                              <th style={{ width: 44, textAlign: 'center', padding: '10px 8px' }}>
                                <input
                                  type="checkbox"
                                  checked={filteredProducts.length > 0 && filteredProducts.every((p) => editing.productIds?.includes(p.id))}
                                  onChange={(e) => {
                                    if (e.target.checked) selectAllFiltered(filteredProducts);
                                    else deselectAllFiltered(filteredProducts);
                                  }}
                                />
                              </th>
                              <th style={{ textAlign: 'left', padding: '10px 10px', fontWeight: 600, color: '#475569' }}>Mã SP</th>
                              <th style={{ textAlign: 'left', padding: '10px 10px', fontWeight: 600, color: '#475569' }}>Tên sản phẩm</th>
                              <th style={{ textAlign: 'left', padding: '10px 10px', fontWeight: 600, color: '#475569' }}>Danh mục</th>
                              <th style={{ textAlign: 'right', padding: '10px 10px', fontWeight: 600, color: '#475569' }}>Giá bán</th>
                              <th style={{ textAlign: 'center', padding: '10px 10px', fontWeight: 600, color: '#475569' }}>Tồn kho</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredProducts.map((p) => {
                              const isSelected = editing.productIds?.includes(p.id);
                              const cat = categories.find((c) => c.id === p.categoryId);
                              return (
                                <tr
                                  key={p.id}
                                  onClick={() => toggleProduct(p.id)}
                                  style={{
                                    cursor: 'pointer',
                                    background: isSelected ? '#fefce8' : 'transparent',
                                    borderBottom: '1px solid #f1f5f9',
                                    transition: 'background 0.1s ease'
                                  }}
                                >
                                  <td style={{ textAlign: 'center', padding: '9px 8px' }} onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleProduct(p.id)}
                                    />
                                  </td>
                                  <td style={{ padding: '9px 10px' }}><code>{p.code}</code></td>
                                  <td style={{ padding: '9px 10px', fontWeight: 500, color: isSelected ? '#854d0e' : '#1e293b' }}>{p.name}</td>
                                  <td style={{ padding: '9px 10px', color: '#64748b' }}>{cat?.name || p.categoryName || '—'}</td>
                                  <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 500 }}>{formatVNDText(p.price)}</td>
                                  <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                                    <span className={`badge ${p.stock > 0 ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 11 }}>
                                      {p.stock ?? 0}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Huỷ</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
