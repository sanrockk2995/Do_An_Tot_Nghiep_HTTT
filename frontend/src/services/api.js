import axios from 'axios';

/**
 * Axios instance gắn Bearer token và tự refresh khi hết hạn.
 * Access token giữ trong bộ nhớ (biến module); refresh token nằm trong
 * httpOnly cookie do backend đặt.
 */
export const api = axios.create({
  baseURL: '/api/v1',
});

let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token;
}

// ---- Request interceptor: gắn token ----
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ---- Response interceptor: tự refresh một lần khi 401 ----
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isRefreshCall = original?.url?.includes('/auth/refresh-token');
    const isLoginCall = original?.url?.includes('/auth/');

    if (error.response?.status === 401 && !original._retried && !isRefreshCall && !isLoginCall) {
      original._retried = true;
      try {
        refreshPromise = refreshPromise || api.post('/auth/refresh-token');
        const { data } = await refreshPromise;
        refreshPromise = null;
        setAccessToken(data.accessToken);
        window.dispatchEvent(new CustomEvent('auth:refreshed', { detail: data }));
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        refreshPromise = null;
        setAccessToken(null);
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

/** Lấy message lỗi tiếng Việt từ response của backend. */
export function getErrorMessage(error, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại') {
  return error?.response?.data?.message || fallback;
}
