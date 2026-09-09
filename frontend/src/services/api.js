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

/**
 * Lấy message lỗi tiếng Việt chuẩn từ response của backend hoặc mã trạng thái HTTP.
 * Chặn hoàn toàn các lỗi kỹ thuật thô tiếng Anh như "Request failed with status code 403".
 */
export function getErrorMessage(error, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.') {
  if (!error) return fallback;

  // 0. Nếu error là chuỗi thông báo thuần túy
  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  // 1. Message chi tiết từ backend JSON ({ message: "..." })
  const backendMsg = error.response?.data?.message;
  if (backendMsg && typeof backendMsg === 'string' && backendMsg.trim()) {
    return backendMsg.trim();
  }

  // 2. Field errors nếu có ({ fieldErrors: { field: "..." } })
  const fieldErrors = error.response?.data?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === 'object') {
    const firstKey = Object.keys(fieldErrors)[0];
    if (firstKey && fieldErrors[firstKey]) {
      return fieldErrors[firstKey];
    }
  }

  // 3. Nếu error là Error instance mang thông báo có nghĩa (từ AuthContext hoặc throw new Error)
  const rawMsg = error.message;
  const isAxiosTechnicalMsg =
    typeof rawMsg === 'string' &&
    (rawMsg.startsWith('Request failed with status code') ||
      rawMsg.includes('status code') ||
      rawMsg === 'Network Error');

  if (rawMsg && typeof rawMsg === 'string' && !isAxiosTechnicalMsg && rawMsg.trim()) {
    return rawMsg.trim();
  }

  // 4. Phân loại theo mã trạng thái HTTP từ response
  const status = error.response?.status;
  const isAuthUrl = error.config?.url?.includes('/auth/');

  if (status === 401) {
    if (isAuthUrl) {
      return fallback !== 'Đã xảy ra lỗi. Vui lòng thử lại.'
        ? fallback
        : 'Email hoặc mật khẩu không chính xác.';
    }
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }
  if (status === 403) {
    return 'Bạn không có quyền thực hiện thao tác này.';
  }
  if (status === 404) {
    return 'Không tìm thấy dữ liệu yêu cầu.';
  }
  if (status === 400) {
    return 'Dữ liệu yêu cầu không hợp lệ. Vui lòng kiểm tra lại.';
  }
  if (status === 409) {
    return 'Dữ liệu bị trùng lặp hoặc xung đột với hệ thống.';
  }
  if (status >= 500) {
    return 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';
  }

  // 5. Lỗi mất kết nối mạng hoặc timeout (chỉ khi thực sự là lỗi Axios network không nhận được response)
  if (error.code === 'ECONNABORTED' || (typeof rawMsg === 'string' && rawMsg.includes('timeout'))) {
    return 'Yêu cầu quá thời gian chờ (timeout). Vui lòng thử lại.';
  }
  if (error.code === 'ERR_NETWORK' || (error.isAxiosError && error.request && !error.response)) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
  }

  return fallback;
}

