/** Định dạng tiền tệ Việt Nam: 350000 → "350.000" */
export function formatVND(amount) {
  if (amount == null) return '0';
  return Number(amount).toLocaleString('vi-VN');
}

export function formatVNDText(amount) {
  return `${formatVND(amount)} đ`;
}

/** Định dạng ngày giờ: "24/08/2025 14:30" */
export function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Nhãn tiếng Việt cho trạng thái đơn hàng. */
export const ORDER_STATUS_LABELS = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  PAID: 'Đã thanh toán',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã huỷ',
};

export const ORDER_STATUS_BADGES = {
  PENDING: 'badge-yellow',
  CONFIRMED: 'badge-blue',
  SHIPPING: 'badge-pink',
  PAID: 'badge-blue',
  COMPLETED: 'badge-green',
  CANCELLED: 'badge-red',
};

export const PAYMENT_METHOD_LABELS = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  CARD: 'Thẻ',
  COD: 'COD',
};

export const ROLE_LABELS = {
  ADMIN: 'Quản lý',
  SALES_STAFF: 'NV bán hàng',
  WAREHOUSE_STAFF: 'NV kho',
  ACCOUNTANT: 'Kế toán',
};

export const TIER_LABELS = {
  REGULAR: 'Thường',
  SILVER: 'Bạc',
  GOLD: 'Vàng',
  VIP: 'VIP',
};

export const GENDER_LABELS = {
  MALE: 'Đồ nam',
  FEMALE: 'Đồ nữ',
  UNISEX: 'Unisex',
};
