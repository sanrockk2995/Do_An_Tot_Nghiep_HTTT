import { useCallback, useEffect, useState } from 'react';
import { api, getErrorMessage } from '../../services/api';
import { formatVNDText, formatDateTime } from '../../utils/format';
import { IconAlertCircle, IconCheckCircle, IconX } from '../../components/Icons';

/** Quản lý khuyến mãi (ADMIN CRUD; SALES/ACCOUNTANT xem). */
export default function PromotionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

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
  }, [load]);

  function openCreate() {
    setError('');
    setMessage('');
    setEditing({
      code: '', name: '', description: '', type: 'PERCENT', discountValue: '',
      minOrderAmount: '', maxDiscountAmount: '', startDate: '', endDate: '',
      usageLimit: '', status: 'ACTIVE',
    });
  }

  function openEdit(p) {
    setError('');
    setMessage('');
    setEditing({
      ...p,
      startDate: (p.startDate || '').substring(0, 10),
      endDate: (p.endDate || '').substring(0, 10),
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
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
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã</th><th>Mô tả</th><th>Kiểu giảm</th><th>Giá trị</th>
              <th>Thời gian</th><th>Lượt dùng</th><th>Trạng thái</th><th>Hành động</th>
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
              <tr><td colSpan={8} className="muted-text">Chưa có chương trình nào.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {editing !== null && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card">
            <h2>{editing.id ? 'Cập nhật khuyến mãi' : 'Thêm khuyến mãi'}</h2>
            <form onSubmit={handleSave}>
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
                <div className="field span-2">
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
                <div className="field">
                  <label htmlFor="pm-limit">Giới hạn lượt dùng</label>
                  <input id="pm-limit" type="number" min="0" value={editing.usageLimit ?? ''}
                    onChange={(e) => setEditing({ ...editing, usageLimit: e.target.value })} />
                </div>
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
