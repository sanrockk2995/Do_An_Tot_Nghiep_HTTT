import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  formatVNDText, formatDateTime,
  ORDER_STATUS_LABELS, ORDER_STATUS_BADGES, PAYMENT_METHOD_LABELS,
} from '../../utils/format';

const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'];

/** Quản lý đơn hàng online (ADMIN/SALES_STAFF): lọc trạng thái + cập nhật + chi tiết. */
export default function OnlineOrdersPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    api
      .get('/orders', { params: { status: statusFilter || undefined, page: 0, size: 20 } })
      .then((res) => {
        if (!alive) return;
        setItems(res.data?.content || res.data || []);
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Không tải được đơn hàng.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function openDetail(id) {
    try {
      const res = await api.get(`/orders/${id}`);
      setDetail(res.data);
    } catch (err) {
      toast.error(err.message || 'Không tải được chi tiết đơn hàng.');
    }
  }

  async function changeStatus(id, newStatus) {
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus });
      toast.success('Đã cập nhật trạng thái đơn hàng.');
      setDetail(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại.');
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Đơn hàng online</h1>
        <p className="muted-text">Xử lý đơn từ website: xác nhận → đóng gói → giao → hoàn tất.</p>
      </header>

      <section className="admin-toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {STATUS_FLOW.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </section>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã ĐH</th><th>Ngày đặt</th><th>Khách hàng</th><th>Tổng tiền</th>
              <th>Thanh toán</th><th>Trạng thái</th><th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.id}>
                <td>{o.orderNumber}</td>
                <td>{formatDateTime(o.createdAt)}</td>
                <td>{o.customerName || o.customerPhone || '—'}</td>
                <td>{formatVNDText(o.total)}</td>
                <td>{PAYMENT_METHOD_LABELS[o.paymentMethod] || o.paymentMethod}</td>
                <td>
                  <span className={`badge ${ORDER_STATUS_BADGES[o.status] || ''}`}>
                    {ORDER_STATUS_LABELS[o.status] || o.status}
                  </span>
                </td>
                <td className="row-actions">
                  <button className="btn btn-outline" onClick={() => openDetail(o.id)}>Chi tiết</button>
                  {o.status === 'PENDING' && (
                    <button className="btn btn-primary" onClick={() => changeStatus(o.id, 'CONFIRMED')}>
                      Xác nhận
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={7} className="muted-text">Không có đơn hàng.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {detail && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card">
            <h2>Đơn {detail.orderNumber}</h2>
            <dl className="detail-list">
              <dt>Mã đơn</dt><dd>{detail.orderNumber}</dd>
              <dt>Khách hàng</dt><dd>{detail.customerName || 'Khách lẻ'}</dd>
              <dt>Số điện thoại</dt><dd>{detail.customerPhone || '—'}</dd>
              <dt>Kênh bán</dt><dd>{detail.channel === 'ONLINE' ? 'Online (website)' : 'Tại quầy'}</dd>
              <dt>Thanh toán</dt><dd>{PAYMENT_METHOD_LABELS[detail.paymentMethod] || detail.paymentMethod}</dd>
              <dt>Nhân viên tạo</dt><dd>{detail.createdBy || '—'}</dd>
              <dt>Ngày tạo</dt><dd>{formatDateTime(detail.createdAt)}</dd>
              <dt>Hoàn tất</dt><dd>{detail.deliveredAt ? formatDateTime(detail.deliveredAt) : '—'}</dd>
              <dt>Ghi chú</dt><dd>{detail.notes || '—'}</dd>
              <dt>Tạm tính</dt><dd>{formatVNDText(detail.subtotal)}</dd>
              <dt>Giảm giá</dt><dd>-{formatVNDText(detail.discount)}</dd>
              <dt>Tổng cộng</dt><dd><strong>{formatVNDText(detail.total)}</strong></dd>
            </dl>

            <h3 style={{ marginTop: 16 }}>Chi tiết sản phẩm</h3>
            <table className="data-table compact">
              <thead>
                <tr><th>Sản phẩm</th><th>Size</th><th>Màu</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr>
              </thead>
              <tbody>
                {(detail.items || []).map((it) => (
                  <tr key={it.id}>
                    <td>{it.productName} ({it.productCode})</td>
                    <td>{it.size}</td>
                    <td>{it.color}</td>
                    <td>{it.quantity}</td>
                    <td>{formatVNDText(it.price)}</td>
                    <td>{formatVNDText(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ marginTop: 16 }}>Chuyển trạng thái</h3>
            <div className="status-flow">
              {STATUS_FLOW.filter((s) => s !== detail.status).map((s) => (
                <button
                  key={s}
                  className="btn btn-outline"
                  onClick={() => changeStatus(detail.id, s)}
                >
                  → {ORDER_STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setDetail(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
