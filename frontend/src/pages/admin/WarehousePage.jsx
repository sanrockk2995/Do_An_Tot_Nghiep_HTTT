import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { formatVNDText, formatDateTime } from '../../utils/format';
import { IconX } from '../../components/Icons';

/** Kho hàng: tab phiếu nhập / phiếu xuất / báo cáo tồn kho. */
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
        <button
          role="tab"
          aria-selected={tab === 'tonkho'}
          className={`tab ${tab === 'tonkho' ? 'active' : ''}`}
          onClick={() => setTab('tonkho')}
        >
          Báo cáo tồn kho
        </button>
      </div>

      {tab === 'nhap' && <PhieuNhapList />}
      {tab === 'xuat' && <PhieuXuatList />}
      {tab === 'tonkho' && <InventoryReport />}
    </div>
  );
}

// ================= Phiếu nhập =================

function PhieuNhapList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    api.get('/phieu-nhap-kho', { params: { page: 0, size: 20 } })
      .then((res) => {
        if (alive) setItems(res.data?.content || res.data || []);
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Lỗi tải phiếu nhập.');
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
      await api.put(`/phieu-nhap-kho/${id}/duyet`);
      alert('Đã duyệt phiếu nhập — tồn kho đã được cập nhật.');
      load();
    } catch (err) {
      alert(err.message || 'Duyệt thất bại.');
    }
  }

  /** In / tải Excel phiếu nhập. */
  async function handleExport(id, maPhieu) {
    try {
      const res = await api.get(`/phieu-nhap-kho/${id}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phieu-nhap-${maPhieu}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Không xuất được file Excel.');
    }
  }

  return (
    <section aria-label="Phiếu nhập kho">
      <div className="admin-toolbar">
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Tạo phiếu nhập</button>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã phiếu</th><th>Nhà cung cấp</th><th>Ngày nhập</th>
              <th>Tổng tiền</th><th>Trạng thái</th><th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.maPhieuNhap}</td>
                <td>{p.tenNhaCungCap}</td>
                <td>{formatDateTime(p.ngayNhap)}</td>
                <td>{formatVNDText(p.tongTien)}</td>
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
              <tr><td colSpan={6} className="muted-text">Chưa có phiếu nhập nào.</td></tr>
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

function PhieuNhapForm({ onClose, onSaved }) {
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
    api.get('/admin/products', { params: { page: 0, size: 200 } })
      .then((res) => setProducts(res.data?.content || []))
      .catch(() => {});
  }, []);

  function updateLine(idx, patch) {
    setChiTiet(chiTiet.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/phieu-nhap-kho', {
        nhaCungCapId: Number(nhaCungCapId),
        ghiChu,
        chiTiet: chiTiet.map((l) => ({
          productId: Number(l.productId),
          soLuongNhap: Number(l.soLuongNhap),
          giaNhap: Number(l.giaNhap),
        })),
      });
      alert('Tạo phiếu nhập thành công. Nhấn "Duyệt phiếu" để cộng tồn kho.');
      onSaved();
    } catch (err) {
      setError(err.message || 'Tạo phiếu thất bại.');
    }
  }

  const total = chiTiet.reduce(
    (s, l) => s + (Number(l.giaNhap) || 0) * (Number(l.soLuongNhap) || 0),
    0
  );

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
              <input id="pn-notes" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
            </div>
          </div>

          <fieldset className="variants-fieldset">
            <legend>Danh sách hàng nhập</legend>
            {chiTiet.map((l, idx) => (
              <div key={idx} className="variant-row variant-row-4col">
                <select
                  required
                  value={l.productId}
                  onChange={(e) => updateLine(idx, { productId: e.target.value })}
                  aria-label="Sản phẩm"
                >
                  <option value="">— Sản phẩm —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
                  ))}
                </select>
                <input
                  type="number" min="1" required placeholder="Số lượng"
                  value={l.soLuongNhap}
                  onChange={(e) => updateLine(idx, { soLuongNhap: e.target.value })}
                  aria-label="Số lượng nhập"
                />
                <input
                  type="number" min="0" required placeholder="Giá nhập"
                  value={l.giaNhap}
                  onChange={(e) => updateLine(idx, { giaNhap: e.target.value })}
                  aria-label="Giá nhập"
                />
                <button
                  type="button"
                  className="btn btn-ghost text-danger"
                  onClick={() => setChiTiet(chiTiet.filter((_, i) => i !== idx))}
                  aria-label="Xóa dòng"
                ><IconX size={15} /></button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setChiTiet([...chiTiet, { productId: '', soLuongNhap: 1, giaNhap: '' }])}
            >
              + Thêm dòng
            </button>
            <p style={{ marginTop: 8 }}>
              Tổng tiền: <strong>{formatVNDText(total)}</strong>
            </p>
          </fieldset>

          {error && <div className="alert alert-error" role="alert">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Huỷ</button>
            <button type="submit" className="btn btn-primary">Tạo phiếu</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ================= Phiếu xuất =================

function PhieuXuatList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    api.get('/phieu-xuat-kho', { params: { page: 0, size: 20 } })
      .then((res) => {
        if (alive) setItems(res.data?.content || res.data || []);
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Lỗi tải phiếu xuất.');
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
      await api.put(`/phieu-xuat-kho/${id}/duyet`);
      alert('Đã duyệt phiếu xuất.');
      load();
    } catch (err) {
      alert(err.message || 'Duyệt thất bại (có thể do tồn kho không đủ).');
    }
  }

  /** In / tải Excel phiếu xuất. */
  async function handleExport(id, maPhieu) {
    try {
      const res = await api.get(`/phieu-xuat-kho/${id}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phieu-xuat-${maPhieu}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Không xuất được file Excel.');
    }
  }

  return (
    <section aria-label="Phiếu xuất kho">
      <div className="admin-toolbar">
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Tạo phiếu xuất</button>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

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
  const [products, setProducts] = useState([]);
  const [lyDoXuat, setLyDoXuat] = useState('');
  const [chiTiet, setChiTiet] = useState([{ productId: '', soLuongXuat: 1 }]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/products', { params: { page: 0, size: 200 } })
      .then((res) => setProducts(res.data?.content || []))
      .catch(() => {});
  }, []);

  function updateLine(idx, patch) {
    setChiTiet(chiTiet.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/phieu-xuat-kho', {
        lyDoXuat,
        chiTiet: chiTiet.map((l) => ({
          productId: Number(l.productId),
          soLuongXuat: Number(l.soLuongXuat),
        })),
      });
      alert('Tạo phiếu xuất thành công. Nhấn "Duyệt phiếu" để trừ tồn kho.');
      onSaved();
    } catch (err) {
      setError(err.message || 'Tạo phiếu thất bại.');
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
              placeholder="VD: Hàng hỏng / trưng bày / điều chuyển..."
            />
          </div>

          <fieldset className="variants-fieldset">
            <legend>Danh sách hàng xuất</legend>
            {chiTiet.map((l, idx) => (
              <div key={idx} className="variant-row variant-row-4col">
                <select
                  required
                  value={l.productId}
                  onChange={(e) => updateLine(idx, { productId: e.target.value })}
                  aria-label="Sản phẩm"
                >
                  <option value="">— Sản phẩm —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.code} · {p.name} (tồn: {p.stock})</option>
                  ))}
                </select>
                <input
                  type="number" min="1" required placeholder="Số lượng"
                  value={l.soLuongXuat}
                  onChange={(e) => updateLine(idx, { soLuongXuat: e.target.value })}
                  aria-label="Số lượng xuất"
                />
                <span />
                <button
                  type="button"
                  className="btn btn-ghost text-danger"
                  onClick={() => setChiTiet(chiTiet.filter((_, i) => i !== idx))}
                  aria-label="Xóa dòng"
                ><IconX size={15} /></button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setChiTiet([...chiTiet, { productId: '', soLuongXuat: 1 }])}
            >
              + Thêm dòng
            </button>
          </fieldset>

          {error && <div className="alert alert-error" role="alert">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Huỷ</button>
            <button type="submit" className="btn btn-primary">Tạo phiếu</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ================= Báo cáo tồn kho =================

function InventoryReport() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get('/reports/inventory', {
      params: { q: q || undefined, onlyLowStock: onlyLowStock || undefined },
    })
      .then((res) => {
        if (alive) setRows(res.data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [q, onlyLowStock]);

  return (
    <section aria-label="Báo cáo tồn kho">
      <div className="admin-toolbar">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm sản phẩm..."
          aria-label="Tìm trong báo cáo tồn"
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={onlyLowStock}
            onChange={(e) => setOnlyLowStock(e.target.checked)}
          />
          Chỉ hiện sắp hết hàng
        </label>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã SP</th><th>Tên sản phẩm</th><th>Tồn</th><th>Giá vốn</th><th>Giá trị tồn</th><th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.productId}>
                <td>{r.code}</td>
                <td>{r.name}{r.categoryName ? ` — ${r.categoryName}` : ''}</td>
                <td className={r.lowStock ? 'text-warn' : ''}>{r.stock}</td>
                <td>{formatVNDText(r.costPrice)}</td>
                <td>{formatVNDText(r.inventoryValue)}</td>
                <td>
                  {r.lowStock
                    ? <span className="badge badge-red">Sắp hết</span>
                    : <span className="badge badge-green">Bình thường</span>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="muted-text">Không có dữ liệu.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
