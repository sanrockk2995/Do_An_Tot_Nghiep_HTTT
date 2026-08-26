import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { formatDateTime, ROLE_LABELS } from '../../utils/format';

const EMPTY_FORM = { fullName: '', email: '', password: '', role: 'SALES_STAFF', branch: '', phone: '' };

/** Quản lý nhân viên (ADMIN): thêm / sửa / vô hiệu hoá — theo SRS UC "Quản lý nhân viên". */
export default function UsersPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null); // null | {} (thêm mới) | StaffResponse (sửa)
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    api.get('/users')
      .then((res) => {
        if (alive) setItems(res.data?.content || res.data || []);
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Không tải được danh sách nhân viên.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => { load(); }, [load]);

  /** Lọc theo từ khoá (tên / email) ngay phía client — danh sách nhân viên thường ngắn. */
  const filtered = items.filter((u) => {
    if (!q.trim()) return true;
    const kw = q.trim().toLowerCase();
    return (
      (u.fullName || u.name || '').toLowerCase().includes(kw)
      || (u.email || '').toLowerCase().includes(kw)
    );
  });

  function openCreate() {
    setMessage('');
    setError('');
    setForm({ ...EMPTY_FORM });
    setEditing({});
  }

  function openEdit(u) {
    setMessage('');
    setError('');
    setForm({
      fullName: u.fullName || u.name || '',
      email: u.email || '',
      password: '', // bỏ trống = giữ mật khẩu cũ
      role: u.role || 'SALES_STAFF',
      branch: u.branch || '',
      phone: u.phone || '',
    });
    setEditing(u);
  }

  function setField(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  /** UC "Thêm nhân viên" → POST /users ; UC "Sửa nhân viên" → PUT /users/{id}. */
  async function handleSave(e) {
    e.preventDefault();
    if (!form.fullName.trim()) return setError('Vui lòng nhập họ tên nhân viên.');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Email không hợp lệ.');
    if (!editing.id && !form.password) return setError('Vui lòng nhập mật khẩu cho tài khoản mới.');
    if (form.password && form.password.length < 8) {
      return setError('Mật khẩu phải từ 8 ký tự trở lên.');
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        branch: form.branch.trim(),
        role: form.role,
        password: form.password || undefined,
      };
      if (editing.id) {
        await api.put(`/users/${editing.id}`, payload);
        setMessage('Cập nhật nhân viên thành công.');
      } else {
        await api.post('/users', payload);
        setMessage('Thêm nhân viên thành công.');
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u) {
    const action = u.isActive ? 'vô hiệu hoá' : 'kích hoạt';
    if (!window.confirm(`Bạn chắc chắn muốn ${action} tài khoản ${u.email}?`)) return;
    try {
      await api.put(`/users/${u.id}/active`, { isActive: !u.isActive });
      setMessage(`Đã ${action} tài khoản ${u.email}.`);
      load();
    } catch (err) {
      setError(err.message || 'Thao tác thất bại.');
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Nhân viên</h1>
        <p className="muted-text">Tài khoản nội bộ — vô hiệu hoá sẽ chặn đăng nhập ngay lập tức.</p>
      </header>

      <section className="admin-toolbar">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên hoặc email..."
          aria-label="Tìm kiếm nhân viên"
        />
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Thêm nhân viên
        </button>
      </section>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {message && <div className="alert alert-success" role="status">{message}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Họ tên</th><th>Email</th><th>SĐT</th><th>Vai trò</th><th>Chi nhánh</th><th>Ngày tạo</th><th>Trạng thái</th><th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName || u.name || '—'}</td>
                <td>{u.email}</td>
                <td>{u.phone || '—'}</td>
                <td><span className="badge badge-pink">{ROLE_LABELS[u.role] || u.role}</span></td>
                <td>{u.branch || '—'}</td>
                <td>{formatDateTime(u.createdAt)}</td>
                <td>
                  <span className={`badge ${u.isActive ? 'badge-green' : 'badge-gray'}`}>
                    {u.isActive ? 'Hoạt động' : 'Vô hiệu'}
                  </span>
                </td>
                <td>
                  <button
                    className={`btn ${u.isActive ? 'btn-ghost text-danger' : 'btn-outline'}`}
                    onClick={() => toggleActive(u)}
                  >
                    {u.isActive ? 'Vô hiệu hoá' : 'Kích hoạt'}
                  </button>{' '}
                  <button className="btn btn-outline" onClick={() => openEdit(u)}>
                    Sửa
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="muted-text">Không có dữ liệu.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {editing !== null && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card">
            <h2>{editing.id ? 'Sửa nhân viên' : 'Thêm nhân viên'}</h2>
            <form onSubmit={handleSave} noValidate>
              <div className="field">
                <label htmlFor="st-name">Họ và tên *</label>
                <input id="st-name" value={form.fullName} onChange={setField('fullName')} required />
              </div>
              <div className="field">
                <label htmlFor="st-email">Email *</label>
                <input id="st-email" type="email" value={form.email} onChange={setField('email')}
                  disabled={Boolean(editing.id)} required />
              </div>
              <div className="field-row" style={{ display: 'flex', gap: 12 }}>
                <div className="field" style={{ flex: 1 }}>
                  <label htmlFor="st-phone">Số điện thoại</label>
                  <input id="st-phone" type="tel" value={form.phone} onChange={setField('phone')} />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label htmlFor="st-branch">Chi nhánh</label>
                  <input id="st-branch" value={form.branch} onChange={setField('branch')}
                    placeholder="VD: Cầu Giấy" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="st-role">Chức vụ (vai trò) *</label>
                <select id="st-role" value={form.role} onChange={setField('role')} required>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="st-password">
                  Mật khẩu * {editing.id && <span className="muted-text">(bỏ trống để giữ mật khẩu cũ)</span>}
                </label>
                <input id="st-password" type="password" value={form.password}
                  onChange={setField('password')} minLength={8}
                  placeholder={editing.id ? '••••••••' : 'Từ 8 ký tự trở lên'}
                  autoComplete="new-password"
                  required={!editing.id} />
              </div>

              {error && <div className="alert alert-error" role="alert">{error}</div>}

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                  Huỷ
                </button>
                <button type="submit" className={`btn btn-primary${saving ? ' loading' : ''}`} disabled={saving}>
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
