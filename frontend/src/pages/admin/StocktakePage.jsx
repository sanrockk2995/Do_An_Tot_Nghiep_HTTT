import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../utils/format';

/** Kiểm kê kho: tạo kỳ kiểm kê (chốt tồn hệ thống) → nhập thực tế → hoàn thành điều chỉnh. */
export default function StocktakePage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState(null);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    api.get('/stocktakes', { params: { page: 0, size: 20 } })
      .then((res) => {
        if (alive) setItems(res.data?.content || res.data || []);
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Lỗi tải danh sách kiểm kê.');
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

  async function openDetail(id) {
    try {
      const res = await api.get(`/stocktakes/${id}`);
      setDetail(res.data);
    } catch (err) {
      toast.error(err.message || 'Không tải được chi tiết kiểm kê.');
    }
  }

  async function handleHoanThanh() {
    if (!window.confirm('Hoàn thành kỳ kiểm kê? Tồn kho sẽ được điều chỉnh theo số thực tế đã nhập.')) return;
    try {
      await api.put(`/stocktakes/${detail.id}/complete`, {
        chiTiet: (detail.chiTiet || []).map((it) => ({
          productId: it.productId,
          soLuongThucTe: it.soLuongThucTe != null ? Number(it.soLuongThucTe) : null,
          ghiChu: it.ghiChu ?? null,
        })),
      });
      toast.success('Đã hoàn thành kiểm kê — tồn kho đã được điều chỉnh theo số thực tế.');
      setDetail(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Thao tác thất bại.');
    }
  }

  /** Cập nhật số thực tế / ghi chú trong state khi đang DANG_KIEM. */
  function updateChiTiet(idx, patch) {
    setDetail({
      ...detail,
      chiTiet: detail.chiTiet.map((x, i) => (i === idx ? { ...x, ...patch } : x)),
    });
  }

  const isDraft = detail?.trangThai === 'DANG_KIEM';

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Kiểm kê kho</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Tạo kỳ kiểm kê</button>
      </header>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã kiểm kê</th>
              <th>Ngày kiểm</th>
              <th>Người kiểm</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((k) => (
              <tr key={k.id}>
                <td>{k.maKiemKe}</td>
                <td>{formatDateTime(k.ngayKiemKe)}</td>
                <td>{k.nguoiKiem || '—'}</td>
                <td>
                  <span className={`badge ${k.trangThai === 'HOAN_THANH' ? 'badge-green' : 'badge-orange'}`}>
                    {k.trangThai === 'HOAN_THANH' ? 'Hoàn thành' : 'Đang kiểm'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-outline" onClick={() => openDetail(k.id)}>Chi tiết</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="muted-text">Chưa có kỳ kiểm kê nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showForm && (
        <KiemKeForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {detail && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card modal-wide">
            <h2>
              Kỳ kiểm kê {detail.maKiemKe} —{' '}
              {isDraft ? 'đang kiểm' : 'đã hoàn thành'}
            </h2>

            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Tồn hệ thống</th>
                  <th>{isDraft ? 'Số thực tế *' : 'Số thực tế'}</th>
                  <th>{isDraft ? 'Ghi chú' : 'Chênh lệch'}</th>
                </tr>
              </thead>
              <tbody>
                {(detail.chiTiet || []).map((it, idx) => (
                  <tr key={it.id ?? it.productId}>
                    <td>{it.productName} ({it.productCode})</td>
                    <td>{it.soLuongHeThong}</td>
                    {isDraft ? (
                      <>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={it.soLuongThucTe ?? ''}
                            onChange={(e) => updateChiTiet(idx, { soLuongThucTe: e.target.value })}
                            style={{ width: 90 }}
                            aria-label={`Số thực tế ${it.productName}`}
                          />
                        </td>
                        <td>
                          <input
                            value={it.ghiChu ?? ''}
                            onChange={(e) => updateChiTiet(idx, { ghiChu: e.target.value })}
                            style={{ width: 140 }}
                            aria-label={`Ghi chú ${it.productName}`}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{it.soLuongThucTe}</td>
                        <td className={it.chenhLech !== 0 ? 'text-warn' : ''}>
                          {it.chenhLech > 0 ? `+${it.chenhLech}` : it.chenhLech}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>Đóng</button>
              {isDraft && (
                <button className="btn btn-primary" onClick={handleHoanThanh}>
                  Hoàn thành &amp; điều chỉnh tồn kho
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= Form tạo kỳ kiểm kê =================

function KiemKeForm({ onClose, onSaved }) {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [ghiChu, setGhiChu] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/products', { params: { page: 0, size: 200 } })
      .then((res) => setProducts(res.data?.content || []))
      .catch(() => {});
  }, []);

  function toggleProduct(p) {
    setSelected((prev) =>
      prev.some((x) => x.productId === p.id)
        ? prev.filter((x) => x.productId !== p.id)
        : [...prev, { productId: p.id, label: `${p.code} · ${p.name} (tồn hệ thống: ${p.stock})` }]
    );
  }

  async function handleSave() {
    if (selected.length === 0) {
      toast.warning('Chọn ít nhất một sản phẩm để kiểm kê.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/stocktakes', {
        ngayKiemKe: null,
        ghiChu,
        chiTiet: selected.map((s) => ({ productId: s.productId })),
      });
      toast.success('Tạo kỳ kiểm kê thành công — hệ thống đã chốt số tồn tại thời điểm tạo.');
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Tạo thất bại.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal card modal-wide">
        <h2>Tạo kỳ kiểm kê</h2>
        <p className="muted-text">
          Chọn sản phẩm cần kiểm. Hệ thống chốt "tồn hệ thống" ngay lúc tạo phiếu;
          sau đó bạn mở "Chi tiết", nhập số thực tế và nhấn hoàn thành để điều chỉnh tồn kho.
        </p>

        <div className="field">
          <label htmlFor="kk-search">Thêm sản phẩm vào kỳ kiểm kê</label>
          <select
            id="kk-search"
            value=""
            onChange={(e) => {
              const p = products.find((x) => x.id === Number(e.target.value));
              if (p) toggleProduct(p);
            }}
          >
            <option value="">— Chọn sản phẩm —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.name} (tồn: {p.stock})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="kk-note">Ghi chú</label>
          <input id="kk-note" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
        </div>

        {selected.length > 0 && (
          <ul className="ranking-list">
            {selected.map((s) => (
              <li key={s.productId}>
                <span>{s.label}</span>
                <button
                  type="button"
                  className="btn btn-ghost text-danger"
                  onClick={() => setSelected(selected.filter((x) => x.productId !== s.productId))}
                >
                  Bỏ
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Huỷ</button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang tạo...' : 'Tạo kỳ kiểm kê'}
          </button>
        </div>
      </div>
    </div>
  );
}
