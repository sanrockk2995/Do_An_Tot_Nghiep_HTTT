import { createContext, useContext, useEffect, useState } from 'react';
import { api, setAccessToken, getErrorMessage } from '../services/api';

const AuthContext = createContext(null);

/** Quản lý đăng nhập: user hiện tại + login/logout theo vai trò. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khôi phục phiên khi mở lại trang (qua refresh token cookie)
  useEffect(() => {
    api.post('/auth/refresh-token')
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        setUser(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Lắng nghe sự kiện logout do interceptor phát khi refresh thất bại
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  /** Đăng nhập nhân viên nội bộ (chọn vai trò). */
  async function staffLogin(email, password, role) {
    try {
      const { data } = await api.post('/auth/login', { email, password, role });
      setAccessToken(data.accessToken);
      setUser(data);
      return data;
    } catch (err) {
      // Lỗi CORS của Spring không có body JSON → tự diễn giải thay vì "Request failed..."
      throw new Error(getErrorMessage(err,
        err.response?.status === 403
          ? 'Truy cập bị từ chối: địa chỉ/IP của bạn chưa được phép đăng nhập hệ thống nội bộ.'
          : 'Email hoặc mật khẩu hoặc vai trò không chính xác.'));
    }
  }

  /** Đăng nhập khách hàng. */
  async function customerLogin(email, password) {
    try {
      const { data } = await api.post('/auth/customer-login', { email, password });
      setAccessToken(data.accessToken);
      setUser(data);
      return data;
    } catch (err) {
      const msg = getErrorMessage(err);
      // Với khách hàng: loại bỏ chữ "vai trò" nếu backend trả về chung
      const cleanMsg =
        msg && msg.includes('vai trò') ? 'Email hoặc mật khẩu không chính xác.' : msg;
      throw new Error(cleanMsg || 'Email hoặc mật khẩu không chính xác.');
    }
  }

  /** Khách tự đăng ký. */
  async function register(payload) {
    try {
      const { data } = await api.post('/auth/register', payload);
      setAccessToken(data.accessToken);
      setUser(data);
      return data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }

  function logout() {
    api.post('/auth/logout').catch(() => {});
    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, staffLogin, customerLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
