import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../utils/format';

const STAFF_ROLES = ['ADMIN', 'SALES_STAFF', 'WAREHOUSE_STAFF', 'ACCOUNTANT'];

/** Trang đăng nhập nhân viên — bắt buộc chọn vai trò, sai vai trò với DB sẽ bị từ chối. */
export default function StaffLoginPage() {
  const { staffLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', role: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const homeByRole = {
    ADMIN: '/quan-ly',
    SALES_STAFF: '/ban-hang',
    WAREHOUSE_STAFF: '/kho-hang',
    ACCOUNTANT: '/ke-toan',
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }
    if (!form.role) {
      setError('Vui lòng chọn vai trò trước khi đăng nhập.');
      return;
    }

    setLoading(true);
    try {
      const data = await staffLogin(form.email.trim(), form.password, form.role);
      navigate(homeByRole[data?.role] || '/');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="staff-login-page">
      <Link to="/" className="brand" style={{ justifyContent: 'center', marginBottom: 24 }}>
        <span className="brand-mark">R</span> ROUTINE
      </Link>

      <div className="auth-card">
        <h1>Đăng nhập hệ thống nội bộ</h1>
        <p className="muted-text">Dành cho nhân viên Routine. Chọn đúng vai trò của bạn.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="staff-role">Vai trò <span aria-hidden="true">*</span></label>
            <select
              id="staff-role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
            >
              <option value="">— Chọn vai trò —</option>
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="staff-email">Email</label>
            <input
              id="staff-email"
              type="email"
              autoComplete="username"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ten@routine.vn"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="staff-password">Mật khẩu</label>
            <input
              id="staff-password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••"
              required
            />
          </div>

          {error && (
            <div className="alert alert-error" role="alert">{error}</div>
          )}

          <button
            type="submit"
            className={`btn btn-primary btn-block${loading ? ' loading' : ''}`}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="auth-alt-link">
          Là khách hàng? <Link to="/dang-nhap">Đăng nhập mua sắm</Link> · <Link to="/">Về trang chủ</Link>
        </p>
      </div>
    </div>
  );
}
