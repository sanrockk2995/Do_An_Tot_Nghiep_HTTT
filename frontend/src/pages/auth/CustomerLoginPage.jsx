import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/** Trang đăng nhập dành cho khách hàng. */
export default function CustomerLoginPage() {
  const { customerLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      await customerLogin(form.email.trim(), form.password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="store-auth-page">
      <div className="auth-card">
        <h1>Chào mừng trở lại</h1>
        <p className="muted-text">Đăng nhập để mua sắm và theo dõi đơn hàng.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="cust-email">Email</label>
            <input
              id="cust-email"
              type="email"
              autoComplete="username"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ban@email.com"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="cust-password">Mật khẩu</label>
            <input
              id="cust-password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••"
              required
            />
          </div>

          {error && <div className="alert alert-error" role="alert">{error}</div>}

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
          Chưa có tài khoản? <Link to="/dang-ky">Đăng ký ngay</Link>
          {' · '}
          Là nhân viên? <Link to="/dang-nhap-nhan-vien">Vào đây</Link>
        </p>
      </div>
    </div>
  );
}
