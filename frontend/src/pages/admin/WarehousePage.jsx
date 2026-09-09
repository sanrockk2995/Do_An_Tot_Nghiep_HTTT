import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatVNDText, formatDateTime } from '../../utils/format';
import { IconX, IconSearch, IconAlertCircle } from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';

/** Kho hàng: tab phiếu nhập / phiếu xuất. */
export default function WarehousePage() {
  const [tab, setTab] = useState('nhap');

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Kho hàng</h1>
      </header>

      <div className="tab-bar" role="tablist" aria-label="Chức năng kho">
        <button
          role="tab"
          aria-selected={tab === 'nhap'}
          className={`tab ${tab === 'nhap' ? 'active' : ''}`}
          onClick={() => setTab('nhap')}
        >
          Phiếu nhập kho
        </button>
        <button
          role="tab"
          aria-selected={tab === 'xuat'}
          className={`tab ${tab === 'xuat' ? 'active' : ''}`}
          onClick={() => setTab('xuat')}
        >
          Phiếu xuất kho
        </button>
      </div>

      {tab === 'nhap' && <PhieuNhapList />}
      {tab === 'xuat' && <PhieuXuatList />}
    </div>
  );
}

// ================= Phiếu nhập =================

function PhieuNhapList() {
  const { user } = useAuth();
  const toast = useToast();
  const isWarehouseStaff = user?.role === 'WAREHOUSE_STAFF';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    api.get('/goods-receipts', { params: { page: 0, size: 20 } })
      .then((res) => {
        if (alive) setItems(res.data?.content || res.data || []);
      })
      .catch((err) => {
        if (alive) setError(getErrorMessage(err, 'Lỗi tải phiếu nhập.'));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDuyet(id) {
    if (!window.confirm('Duyệt phiếu nhập? Tồn kho sẽ được cộng sau khi duyệt.')) return;
    try {
      await api.put(`/goods-receipts/${id}/approve`);
      toast.success('Đã duyệt phiếu nhập — tồn kho đã được cập nhật.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Duyệt thất bại.'));
    }
  }

  /** In / tải Excel phiếu nhập. */
  async function handleExport(id, maPhieu) {
    try {
      const res = await api.get(`/goods-receipts/${id}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phieu-nhap-${maPhieu}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Không xuất được file Excel.');
    }
  }

  return (
    <section aria-label="Phiếu nhập kho">
      <div className="admin-toolbar">
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Tạo phiếu nhập</button>
      </div>

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

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã phiếu</th>
              <th>Nhà cung cấp</th>
              <th>Ngày nhập</th>
              {!isWarehouseStaff && <th>Tổng tiền</th>}
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.maPhieuNhap}</td>
                <td>{p.tenNhaCungCap}</td>
                <td>{formatDateTime(p.ngayNhap)}</td>
                {!isWarehouseStaff && <td>{formatVNDText(p.tongTien)}</td>}
                <td>
                  <span className={`badge ${p.trangThai === 'APPROVED' ? 'badge-green' : p.trangThai === 'CHO_DUYET' || p.trangThai === 'DRAFT' ? 'badge-orange' : 'badge-red'}`}>
                    {p.trangThai === 'APPROVED' ? 'Đã duyệt'
                      : p.trangThai === 'CHO_DUYET' || p.trangThai === 'DRAFT' ? 'Chờ duyệt'
                      : p.trangThai}
                  </span>
                </td>
                <td>
                  {(p.trangThai === 'CHO_DUYET' || p.trangThai === 'DRAFT') && (
                    <button className="btn btn-primary" onClick={() => handleDuyet(p.id)}>Duyệt phiếu</button>
                  )}{' '}
                  <button className="btn btn-ghost" onClick={() => handleExport(p.id, p.maPhieuNhap)}>
                    Xuất Excel
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={isWarehouseStaff ? 5 : 6} className="muted-text">Chưa có phiếu nhập nào.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {showForm && (
        <PhieuNhapForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </section>
  );
}

/** Component tìm kiếm nhanh sản phẩm theo mã hoặc tên để thêm vào phiếu. */
function ProductQuickSearch({ products, onSelectProduct, placeholder }) {
  const { user } = useAuth();
  const isWarehouseStaff = user?.role === 'WAREHOUSE_STAFF';
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) =>
      (p.code && p.code.toLowerCase().includes(q)) ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [products, query]);

  function handleSelect(p) {
    onSelectProduct(p);
    setQuery('');
    setOpen(false);
    setHighlightIdx(0);
  }

  function handleKeyDown(e) {
    if (!open || filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlightIdx]) {
        handleSelect(filtered[highlightIdx]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="warehouse-quick-search">
      <div style={{ position: 'relative' }}>
        <span className="search-icon">
          <IconSearch size={16} />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlightIdx(0);
          }}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          onBlur={() => { setTimeout(() => setOpen(false), 200); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Tìm kiếm theo mã SP hoặc tên SP..."}
        />
      </div>
      {open && filtered.length > 0 && (
        <ul className="warehouse-search-dropdown" role="listbox">
          {filtered.map((p, idx) => (
            <li
              key={p.id}
              className={`warehouse-search-item ${idx === highlightIdx ? 'active' : ''}`}
              onMouseDown={() => handleSelect(p)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="item-code">{p.code}</span>
                <span className="item-name" style={{ fontWeight: 500 }}>{p.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--admin-text-muted)' }}>
                <span>Tồn: <strong style={{ color: p.stock > 0 ? '#16a34a' : '#dc2626' }}>{p.stock}</strong></span>
                {!isWarehouseStaff && p.costPrice != null && <span>Vốn: {formatVNDText(p.costPrice)}</span>}
                <button type="button" className="btn btn-outline" style={{ padding: '3px 8px', minHeight: 26, fontSize: 11 }}>+ Thêm</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PhieuNhapForm({ onClose, onSaved }) {
  const toast = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [nhaCungCapId, setNhaCungCapId] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const [chiTiet, setChiTiet] = useState([{ productId: '', soLuongNhap: 1, giaNhap: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/suppliers', { params: { page: 0, size: 100 } })
      .then((res) => setSuppliers(res.data?.content || res.data || []))
      .catch(() => {});
    api.get('/admin/products', { params: { page: 0, size: 500 } })
      .then((res) => setProducts(res.data?.content || []))
      .catch(() => {});
  }, []);

  function updateLine(idx, patch) {
    setChiTiet(chiTiet.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function handleSelectProductInLine(idx, prodId) {
    const p = products.find((x) => Number(x.id) === Number(prodId));
    const currentGiaNhap = chiTiet[idx].giaNhap;
    updateLine(idx, {
      productId: prodId,
      // Tự động điền giá vốn/giá sản phẩm nếu người dùng chưa nhập
      giaNhap: currentGiaNhap !== '' ? currentGiaNhap : (p?.costPrice != null ? p.costPrice : p?.price || ''),
    });
  }

  function handleQuickAdd(p) {
    const existingIdx = chiTiet.findIndex((item) => Number(item.productId) === Number(p.id));
    if (existingIdx >= 0) {
      updateLine(existingIdx, { soLuongNhap: Number(chiTiet[existingIdx].soLuongNhap || 0) + 1 });
    } else {
      if (chiTiet.length === 1 && !chiTiet[0].productId) {
        updateLine(0, {
          productId: p.id,
          soLuongNhap: 1,
          giaNhap: p.costPrice != null ? p.costPrice : p.price || '',
        });
      } else {
        setChiTiet([
          ...chiTiet,
          {
            productId: p.id,
            soLuongNhap: 1,
            giaNhap: p.costPrice != null ? p.costPrice : p.price || '',
          },
        ]);
      }
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');

    if (chiTiet.some((l) => !l.productId)) {
      setError('Vui lòng chọn sản phẩm cho tất cả các dòng hàng nhập.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/goods-receipts', {
        nhaCungCapId: Number(nhaCungCapId),
        ghiChu,
        chiTiet: chiTiet.map((l) => ({
          productId: Number(l.productId),
          soLuongNhap: Number(l.soLuongNhap),
          giaNhap: Number(l.giaNhap),
        })),
      });
      toast.success('Tạo phiếu nhập thành công. Nhấn "Duyệt phiếu" để cộng tồn kho.');
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, 'Tạo phiếu thất bại.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal card modal-wide">
        <h2>Tạo phiếu nhập kho</h2>
        <form onSubmit={handleSave}>
          <div className="form-grid-2col">
            <div className="field">
              <label htmlFor="pn-supplier">Nhà cung cấp *</label>
              <select
                id="pn-supplier"
                required
                value={nhaCungCapId}
                onChange={(e) => setNhaCungCapId(e.target.value)}
              >
                <option value="">— Chọn NCC —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.tenNcc}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pn-notes">Ghi chú</label>
              <input
                id="pn-notes"
                value={ghiChu}
                onChange={(e) => setGhiChu(e.target.value)}
                placeholder="VD: Nhập hàng đợt 1 / đơn đặt tháng 9..."
              />
            </div>
          </div>

          <div className="field" style={{ marginTop: 12 }}>
            <label style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: 8, display: 'block' }}>
              Danh sách hàng nhập
            </label>

            <ProductQuickSearch
              products={products}
              onSelectProduct={handleQuickAdd}
              placeholder="🔍 Tìm / quét theo mã SP hoặc tên SP để thêm nhanh vào danh sách nhập..."
            />

            <div className="warehouse-items-container">
              <table className="warehouse-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '50%' }}>Mã & Tên sản phẩm</th>
                    <th style={{ width: '20%' }}>Số lượng</th>
                    <th style={{ width: '25%' }}>Đơn giá nhập (₫)</th>
                    <th style={{ width: '5%', textAlign: 'center' }}>Xoá</th>
                  </tr>
                </thead>
                <tbody>
                  {chiTiet.map((l, idx) => {
                    return (
                      <tr key={idx}>
                        <td>
                          <select
                            required
                            value={l.productId}
                            onChange={(e) => handleSelectProductInLine(idx, e.target.value)}
                            aria-label="Sản phẩm"
                          >
                            <option value="">— Chọn sản phẩm —</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                [{p.code}] {p.name} (Tồn: {p.stock})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            required
                            placeholder="Số lượng"
                            value={l.soLuongNhap}
                            onChange={(e) => updateLine(idx, { soLuongNhap: e.target.value })}
                            aria-label="Số lượng nhập"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            required
                            placeholder="Giá nhập"
                            value={l.giaNhap}
                            onChange={(e) => updateLine(idx, { giaNhap: e.target.value })}
                            aria-label="Giá nhập"
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-ghost text-danger"
                            style={{ padding: '6px', minHeight: 32 }}
                            onClick={() => {
                              if (chiTiet.length === 1) {
                                setChiTiet([{ productId: '', soLuongNhap: 1, giaNhap: '' }]);
                              } else {
                                setChiTiet(chiTiet.filter((_, i) => i !== idx));
                              }
                            }}
                            aria-label="Xóa dòng"
                          >
                            <IconX size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: 13, minHeight: 36, padding: '7px 14px' }}
                onClick={() => setChiTiet([...chiTiet, { productId: '', soLuongNhap: 1, giaNhap: '' }])}
              >
                + Thêm dòng trống
              </button>
              <div style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
                Tổng mặt hàng: <strong>{chiTiet.filter((x) => x.productId).length}</strong> | Tổng SL nhập: <strong>{chiTiet.reduce((s, x) => s + (Number(x.soLuongNhap) || 0), 0)}</strong>
              </div>
            </div>
          </div>

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

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Huỷ</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Đang tạo...' : 'Tạo phiếu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ================= Phiếu xuất =================

function PhieuXuatList() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    api.get('/goods-issues', { params: { page: 0, size: 20 } })
      .then((res) => {
        if (alive) setItems(res.data?.content || res.data || []);
      })
      .catch((err) => {
        if (alive) setError(getErrorMessage(err, 'Lỗi tải phiếu xuất.'));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDuyet(id) {
    if (!window.confirm('Duyệt phiếu xuất? Tồn kho sẽ bị trừ sau khi duyệt.')) return;
    try {
      await api.put(`/goods-issues/${id}/approve`);
      toast.success('Đã duyệt phiếu xuất.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Duyệt thất bại (có thể do tồn kho không đủ).'));
    }
  }

  /** In / tải Excel phiếu xuất. */
  async function handleExport(id, maPhieu) {
    try {
      const res = await api.get(`/goods-issues/${id}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phieu-xuat-${maPhieu}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Không xuất được file Excel.');
    }
  }

  return (
    <section aria-label="Phiếu xuất kho">
      <div className="admin-toolbar">
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Tạo phiếu xuất</button>
      </div>

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

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã phiếu</th><th>Lý do xuất</th><th>Ngày xuất</th><th>Trạng thái</th><th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.maPhieuXuat}</td>
                <td>{p.lyDoXuat || '—'}</td>
                <td>{formatDateTime(p.ngayXuat)}</td>
                <td>
                  <span className={`badge ${p.trangThai === 'APPROVED' ? 'badge-green' : p.trangThai === 'CHO_DUYET' || p.trangThai === 'DRAFT' ? 'badge-orange' : 'badge-red'}`}>
                    {p.trangThai === 'APPROVED' ? 'Đã duyệt'
                      : p.trangThai === 'CHO_DUYET' || p.trangThai === 'DRAFT' ? 'Chờ duyệt'
                      : p.trangThai}
                  </span>
                </td>
                <td>
                  {(p.trangThai === 'CHO_DUYET' || p.trangThai === 'DRAFT') && (
                    <button className="btn btn-primary" onClick={() => handleDuyet(p.id)}>Duyệt phiếu</button>
                  )}{' '}
                  <button className="btn btn-ghost" onClick={() => handleExport(p.id, p.maPhieuXuat)}>
                    Xuất Excel
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="muted-text">Chưa có phiếu xuất nào.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {showForm && (
        <PhieuXuatForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </section>
  );
}

function PhieuXuatForm({ onClose, onSaved }) {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [lyDoXuat, setLyDoXuat] = useState('');
  const [chiTiet, setChiTiet] = useState([{ productId: '', soLuongXuat: 1 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/products', { params: { page: 0, size: 500 } })
      .then((res) => setProducts(res.data?.content || []))
      .catch(() => {});
  }, []);

  function updateLine(idx, patch) {
    setChiTiet(chiTiet.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function handleQuickAdd(p) {
    const existingIdx = chiTiet.findIndex((item) => Number(item.productId) === Number(p.id));
    if (existingIdx >= 0) {
      updateLine(existingIdx, { soLuongXuat: Number(chiTiet[existingIdx].soLuongXuat || 0) + 1 });
    } else {
      if (chiTiet.length === 1 && !chiTiet[0].productId) {
        updateLine(0, { productId: p.id, soLuongXuat: 1 });
      } else {
        setChiTiet([...chiTiet, { productId: p.id, soLuongXuat: 1 }]);
      }
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');

    if (chiTiet.some((l) => !l.productId)) {
      setError('Vui lòng chọn sản phẩm cho tất cả các dòng hàng xuất.');
      return;
    }

    for (const line of chiTiet) {
      const p = products.find((x) => Number(x.id) === Number(line.productId));
      if (p && Number(line.soLuongXuat) > Number(p.stock)) {
        if (!window.confirm(`Sản phẩm "${p.name}" (Mã: ${p.code}) có số lượng xuất (${line.soLuongXuat}) lớn hơn tồn kho hiện tại (${p.stock}). Bạn có chắc chắn muốn tiếp tục tạo phiếu?`)) {
          return;
        }
      }
    }

    setSaving(true);
    try {
      await api.post('/goods-issues', {
        lyDoXuat,
        chiTiet: chiTiet.map((l) => ({
          productId: Number(l.productId),
          soLuongXuat: Number(l.soLuongXuat),
        })),
      });
      toast.success('Tạo phiếu xuất thành công. Nhấn "Duyệt phiếu" để trừ tồn kho.');
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, 'Tạo phiếu thất bại.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal card modal-wide">
        <h2>Tạo phiếu xuất kho</h2>
        <form onSubmit={handleSave}>
          <div className="field">
            <label htmlFor="px-reason">Lý do xuất *</label>
            <input
              id="px-reason"
              required
              value={lyDoXuat}
              onChange={(e) => setLyDoXuat(e.target.value)}
              placeholder="VD: Hàng hỏng / Trưng bày cửa hàng / Xuất trả nhà cung cấp / Điều chuyển..."
            />
          </div>

          <div className="field" style={{ marginTop: 12 }}>
            <label style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: 8, display: 'block' }}>
              Danh sách hàng xuất
            </label>

            <ProductQuickSearch
              products={products}
              onSelectProduct={handleQuickAdd}
              placeholder="🔍 Tìm / quét theo mã SP hoặc tên SP để thêm nhanh vào danh sách xuất..."
            />

            <div className="warehouse-items-container">
              <table className="warehouse-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '55%' }}>Mã & Tên sản phẩm</th>
                    <th style={{ width: '20%' }}>Tồn kho hiện tại</th>
                    <th style={{ width: '20%' }}>Số lượng xuất</th>
                    <th style={{ width: '5%', textAlign: 'center' }}>Xoá</th>
                  </tr>
                </thead>
                <tbody>
                  {chiTiet.map((l, idx) => {
                    const selectedProd = products.find((x) => Number(x.id) === Number(l.productId));
                    const isExceed = selectedProd && Number(l.soLuongXuat) > Number(selectedProd.stock);
                    return (
                      <tr key={idx}>
                        <td>
                          <select
                            required
                            value={l.productId}
                            onChange={(e) => updateLine(idx, { productId: e.target.value })}
                            aria-label="Sản phẩm"
                          >
                            <option value="">— Chọn sản phẩm —</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                [{p.code}] {p.name} (Tồn: {p.stock})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          {selectedProd ? (
                            <span className={`badge ${selectedProd.stock > 10 ? 'badge-green' : selectedProd.stock > 0 ? 'badge-orange' : 'badge-red'}`}>
                              Tồn: {selectedProd.stock}
                            </span>
                          ) : (
                            <span className="muted-text">—</span>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            required
                            placeholder="Số lượng"
                            value={l.soLuongXuat}
                            onChange={(e) => updateLine(idx, { soLuongXuat: e.target.value })}
                            aria-label="Số lượng xuất"
                            style={isExceed ? { borderColor: '#dc2626', background: '#fef2f2' } : {}}
                          />
                          {isExceed && (
                            <div style={{ color: '#dc2626', fontSize: 11, marginTop: 2 }}>
                              Vượt tồn kho ({selectedProd.stock})
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-ghost text-danger"
                            style={{ padding: '6px', minHeight: 32 }}
                            onClick={() => {
                              if (chiTiet.length === 1) {
                                setChiTiet([{ productId: '', soLuongXuat: 1 }]);
                              } else {
                                setChiTiet(chiTiet.filter((_, i) => i !== idx));
                              }
                            }}
                            aria-label="Xóa dòng"
                          >
                            <IconX size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: 13, minHeight: 36, padding: '7px 14px' }}
                onClick={() => setChiTiet([...chiTiet, { productId: '', soLuongXuat: 1 }])}
              >
                + Thêm dòng trống
              </button>
              <div style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
                Tổng mặt hàng: <strong>{chiTiet.filter((x) => x.productId).length}</strong> | Tổng SL xuất: <strong>{chiTiet.reduce((s, x) => s + (Number(x.soLuongXuat) || 0), 0)}</strong>
              </div>
            </div>
          </div>

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

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Huỷ</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Đang tạo...' : 'Tạo phiếu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

