import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import { IconAlertCircle, IconX } from '../../components/Icons';

/** Trang đăng ký tài khoản khách hàng. */
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!form.name.trim()) return 'Vui lòng nhập họ tên.';
    if (!form.email.trim()) return 'Vui lòng nhập email.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Email không hợp lệ.';
    if (form.phone.trim() && !/^0\d{9,10}$/.test(form.phone.trim())) {
      return 'Số điện thoại không hợp lệ (bắt đầu bằng 0, 10–11 số).';
    }
    if (form.password.length < 8) return 'Mật khẩu phải từ 8 ký tự trở lên.';
    if (form.password !== form.confirm) return 'Xác nhận mật khẩu không khớp.';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const msg = validate();
    setError(msg);
    if (msg) return;

    setLoading(true);
    try {
      await register({
        fullName: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err, 'Đăng ký thất bại. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="store-auth-page">
      <Link to="/" className="brand auth-brand-link" aria-label="Về trang chủ Routine">
        <span className="brand-mark">R</span> ROUTINE
      </Link>
      <div className="auth-card">
        <h1>Tạo tài khoản</h1>
        <p className="muted-text">Gia nhập Routine — lưu sản phẩm yêu thích, theo dõi đơn hàng, tích điểm thành viên.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="reg-name">Họ và tên *</label>
            <input id="reg-name" type="text" value={form.name} onChange={set('name')}
              placeholder="Nguyễn Văn A" autoComplete="name" required />
          </div>
          <div className="field">
            <label htmlFor="reg-email">Email *</label>
            <input id="reg-email" type="email" value={form.email} onChange={set('email')}
              placeholder="ban@email.com" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="reg-phone">Số điện thoại</label>
            <input id="reg-phone" type="tel" value={form.phone} onChange={set('phone')}
              placeholder="0901234567" autoComplete="tel" />
          </div>
          <div className="field">
            <label htmlFor="reg-password">Mật khẩu * <span className="muted-text">(tối thiểu 8 ký tự)</span></label>
            <input id="reg-password" type="password" value={form.password} onChange={set('password')}
              placeholder="Từ 8 ký tự trở lên" autoComplete="new-password" required minLength={8} />
          </div>
          <div className="field">
            <label htmlFor="reg-confirm">Xác nhận mật khẩu *</label>
            <input id="reg-confirm" type="password" value={form.confirm} onChange={set('confirm')}
              placeholder="••••••" autoComplete="new-password" required />
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

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>

        <p className="auth-alt-link">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
