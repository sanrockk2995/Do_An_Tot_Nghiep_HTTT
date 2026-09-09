import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { IconCheckCircle, IconAlert, IconAlertCircle, IconInfo, IconX } from '../components/Icons';

const ToastContext = createContext(null);

let toastCount = 0;

/**
 * Toast Notification Context cho Routine E-Commerce & Admin
 * Cung cấp toast.success, toast.error, toast.warning, toast.info
 * Kèm cơ chế tự động ghi đè window.alert để chuyển đổi toàn bộ thông báo hệ thống sang toast đẹp mắt.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastsRef = useRef(toasts);
  toastsRef.current = toasts;

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  const addToast = useCallback((message, options = {}) => {
    const id = ++toastCount;
    const type = options.type || 'info';
    const duration = options.duration ?? (type === 'error' ? 4500 : 3500);
    const title = options.title || getDefaultTitle(type, message);

    const newToast = {
      id,
      message,
      type,
      title,
      duration,
      exiting: false,
    };

    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Tối đa 5 toast cùng lúc

    return id;
  }, []);

  const toast = useCallback(
    (message, options) => addToast(message, options),
    [addToast]
  );

  toast.success = useCallback(
    (msg, titleOrOpts) => {
      const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : (titleOrOpts || {});
      return addToast(msg, { ...opts, type: 'success' });
    },
    [addToast]
  );

  toast.error = useCallback(
    (msg, titleOrOpts) => {
      const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : (titleOrOpts || {});
      return addToast(msg, { ...opts, type: 'error' });
    },
    [addToast]
  );

  toast.warning = useCallback(
    (msg, titleOrOpts) => {
      const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : (titleOrOpts || {});
      return addToast(msg, { ...opts, type: 'warning' });
    },
    [addToast]
  );

  toast.info = useCallback(
    (msg, titleOrOpts) => {
      const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : (titleOrOpts || {});
      return addToast(msg, { ...opts, type: 'info' });
    },
    [addToast]
  );

  toast.dismiss = removeToast;

  // Intercept window.alert để các thông báo cũ lập tức biến thành Toast đẹp
  useEffect(() => {
    const originalAlert = window.alert;

    window.alert = (msg) => {
      const text = String(msg ?? '');
      // Tự động phân loại sắc thái thông báo theo từ khóa
      if (
        /thành công|hoàn thành|áp dụng|đã duyệt|đã lưu|đã chốt/i.test(text) &&
        !/không|thất bại|chưa/i.test(text)
      ) {
        toast.success(text);
      } else if (
        /thất bại|lỗi|không thể|không tải|không xuất|hết hàng|ngừng bán|chưa chọn|chọn ít nhất|không hợp lệ|tối đa|vượt/i.test(text)
      ) {
        toast.error(text);
      } else if (/cảnh báo|chú ý|lưu ý|yêu cầu/i.test(text)) {
        toast.warning(text);
      } else {
        toast.info(text);
      }
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [toast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

function getDefaultTitle(type, message) {
  if (type === 'success') return 'Thành công';
  if (type === 'error') return 'Thông báo';
  if (type === 'warning') return 'Cảnh báo';
  return 'Thông tin';
}

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <aside
      className="routine-toast-container"
      aria-label="Thông báo hệ thống"
      role="region"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </aside>
  );
}

function ToastItem({ toast, onDismiss }) {
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef(Date.now());
  const remainingRef = useRef(toast.duration);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    if (toast.duration <= 0) return;
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss();
    }, remainingRef.current);
  }, [toast.duration, onDismiss]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const elapsed = Date.now() - startTimeRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startTimer]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    pauseTimer();
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    startTimer();
  };

  const icons = {
    success: <IconCheckCircle size={20} />,
    error: <IconAlertCircle size={20} />,
    warning: <IconAlert size={20} />,
    info: <IconInfo size={20} />,
  };

  return (
    <div
      className={`routine-toast routine-toast--${toast.type} ${toast.exiting ? 'routine-toast--exiting' : ''}`}
      role="alert"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="routine-toast-icon-wrap" aria-hidden="true">
        {icons[toast.type] || icons.info}
      </div>

      <div className="routine-toast-body">
        {toast.title && <div className="routine-toast-title">{toast.title}</div>}
        <div className="routine-toast-message">{toast.message}</div>
      </div>

      <button
        type="button"
        className="routine-toast-close"
        onClick={onDismiss}
        aria-label="Đóng thông báo"
      >
        <IconX size={15} />
      </button>

      {toast.duration > 0 && (
        <div
          className={`routine-toast-progress ${isPaused ? 'routine-toast-progress--paused' : ''}`}
          style={{ animationDuration: `${toast.duration}ms` }}
        />
      )}
    </div>
  );
}
