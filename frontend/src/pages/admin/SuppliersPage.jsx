import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';

/** Quản lý nhà cung cấp (ADMIN): CRUD + xoá mềm (ngừng hợp tác). */
export default function SuppliersPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    api
      .get('/suppliers', { params: { q, page: 0, size: 50 } })
      .then((res) => {
        if (!alive) return;
        setItems(res.data?.content || res.data || []);
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Không tải được nhà cung cấp.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing({
      maNcc: '',
      tenNcc: '',
      diaChi: '',
      soDienThoai: '',
      email: '',
      nguoiLienHe: '',
      trangThai: 'ACTIVE',
    });
  }

  function openEdit(s) {
    setEditing({ ...s, soDienThoai: s.soDienThoai ?? '', nguoiLienHe: s.nguoiLienHe ?? '' });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing.id) {
        await api.put(`/suppliers/${editing.id}`, editing);
        setMessage('Đã cập nhật nhà cung cấp.');
      } else {
        await api.post('/suppliers', editing);
        setMessage('Đã tạo nhà cung cấp.');
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Ngừng hợp tác với nhà cung cấp này?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      setMessage('Đã chuyển nhà cung cấp sang ngừng hợp tác.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Xoá thất bại.');
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Nhà cung cấp</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm NCC</button>
      </header>

      <section className="admin-toolbar">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên hoặc mã NCC..."
          aria-label="Tìm nhà cung cấp"
        />
      </section>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {message && <div className="alert alert-success" role="status">{message}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã NCC</th>
              <th>Tên NCC</th>
              <th>Số điện thoại</th>
              <th>Email</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id}>
                <td>{s.maNcc}</td>
                <td>{s.tenNcc}</td>
                <td>{s.soDienThoai || '—'}</td>
                <td>{s.email || '—'}</td>
                <td>
                  <span className={`badge ${s.trangThai === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>
                    {s.trangThai === 'ACTIVE' ? 'Đang hợp tác' : 'Ngừng hợp tác'}
                  </span>
                </td>
                <td className="row-actions">
                  <button className="btn btn-outline" onClick={() => openEdit(s)}>Sửa</button>
                  {s.trangThai === 'ACTIVE' && (
                    <button className="btn btn-ghost text-danger" onClick={() => handleDelete(s.id)}>
                      Ngừng hợp tác
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="muted-text">Không có dữ liệu.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {editing !== null && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card">
            <h2>{editing.id ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-grid-2col">
                <div className="field">
                  <label htmlFor="sp-code">Mã NCC *</label>
                  <input
                    id="sp-code"
                    required
                    value={editing.maNcc}
                    onChange={(e) => setEditing({ ...editing, maNcc: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="sp-name">Tên NCC *</label>
                  <input
                    id="sp-name"
                    required
                    value={editing.tenNcc}
                    onChange={(e) => setEditing({ ...editing, tenNcc: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="sp-contact">Người liên hệ</label>
                  <input
                    id="sp-contact"
                    value={editing.nguoiLienHe ?? ''}
                    onChange={(e) => setEditing({ ...editing, nguoiLienHe: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="sp-phone">Số điện thoại</label>
                  <input
                    id="sp-phone"
                    value={editing.soDienThoai ?? ''}
                    onChange={(e) => setEditing({ ...editing, soDienThoai: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="sp-email">Email</label>
                  <input
                    id="sp-email"
                    type="email"
                    value={editing.email ?? ''}
                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="sp-status">Trạng thái</label>
                  <select
                    id="sp-status"
                    value={editing.trangThai || 'ACTIVE'}
                    onChange={(e) => setEditing({ ...editing, trangThai: e.target.value })}
                  >
                    <option value="ACTIVE">Đang hợp tác</option>
                    <option value="INACTIVE">Ngừng hợp tác</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="sp-address">Địa chỉ</label>
                <textarea
                  id="sp-address"
                  rows={2}
                  value={editing.diaChi ?? ''}
                  onChange={(e) => setEditing({ ...editing, diaChi: e.target.value })}
                />
              </div>

              <div className="modal-actions">
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
