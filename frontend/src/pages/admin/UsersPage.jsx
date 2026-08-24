import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { formatDateTime, ROLE_LABELS } from '../../utils/format';

/** Quản lý tài khoản nhân viên (ADMIN): bật/tắt hoạt động. */
export default function UsersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {message && <div className="alert alert-success" role="status">{message}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Ngày tạo</th><th>Trạng thái</th><th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName || u.name || '—'}</td>
                <td>{u.email}</td>
                <td><span className="badge badge-pink">{ROLE_LABELS[u.role] || u.role}</span></td>
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
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
