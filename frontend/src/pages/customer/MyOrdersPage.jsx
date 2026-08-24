import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  formatVNDText,
  formatDateTime,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_BADGES,
  PAYMENT_METHOD_LABELS,
} from '../../utils/format';

/** Lịch sử mua hàng: thống kê chi tiêu + danh sách đơn + chi tiết sản phẩm từng đơn. */
export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let alive = true;
    api
      .get('/orders/my-orders', { params: { page: 0, size: 50 } })
      .then((res) => {
        if (!alive) return;
        setOrders(res.data?.content || res.data || []);
      })
      .catch(() => {
        if (alive) setError('Không tải được đơn hàng. Vui lòng thử lại.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    const done = orders.filter((o) => o.status === 'COMPLETED');
    const processing = orders.filter(
      (o) => !['COMPLETED', 'CANCELLED'].includes(o.status)
    );
    const spent = done.reduce((sum, o) => sum + Number(o.total || 0), 0);
    return { total: orders.length, processing: processing.length, done: done.length, spent };
  }, [orders]);

  return (
    <div className="container section">
      <h1>Lịch sử mua hàng</h1>
      <p className="muted-text">
        Xem lại toàn bộ đơn hàng đã đặt, trạng thái giao/nhận và chi tiết sản phẩm.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" />
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <p>Bạn chưa có đơn hàng nào.</p>
          <Link to="/san-pham" className="btn btn-primary">Mua sắm ngay</Link>
        </div>
      ) : (
        <>
          {/* Thẻ thống kê */}
          <div className="stat-tiles" style={{ marginBottom: 24 }}>
            <div className="card stat-tile">
              <span className="stat-label">Tổng đơn hàng</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="card stat-tile">
              <span className="stat-label">Đang xử lý</span>
              <span className="stat-value">{stats.processing}</span>
            </div>
            <div className="card stat-tile">
              <span className="stat-label">Hoàn tất</span>
              <span className="stat-value">{stats.done}</span>
            </div>
            <div className="card stat-tile">
              <span className="stat-label">Đã chi tiêu (đơn hoàn tất)</span>
              <span className="stat-value">{formatVNDText(stats.spent)}</span>
            </div>
          </div>

          {/* Danh sách đơn */}
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã ĐH</th><th>Ngày đặt</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><code>{o.orderNumber}</code></td>
                  <td>{formatDateTime(o.createdAt)}</td>
                  <td>{(o.items || []).length} mặt hàng</td>
                  <td>{formatVNDText(o.total)}</td>
                  <td>{PAYMENT_METHOD_LABELS[o.paymentMethod] || o.paymentMethod}</td>
                  <td>
                    <span className={`badge ${ORDER_STATUS_BADGES[o.status] || ''}`}>
                      {ORDER_STATUS_LABELS[o.status] || o.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-outline"
                      onClick={() => setDetail(o)}
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Modal chi tiết đơn */}
      {detail && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setDetail(null)}>
          <div className="modal card modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>Đơn {detail.orderNumber}</h2>
            <div className="order-detail-meta">
              <p><strong>Ngày đặt:</strong> {formatDateTime(detail.createdAt)}</p>
              <p><strong>Thanh toán:</strong> {PAYMENT_METHOD_LABELS[detail.paymentMethod] || detail.paymentMethod}</p>
              <p>
                <strong>Trạng thái:</strong>{' '}
                <span className={`badge ${ORDER_STATUS_BADGES[detail.status] || ''}`}>
                  {ORDER_STATUS_LABELS[detail.status] || detail.status}
                </span>
              </p>
            </div>

            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Sản phẩm</th><th>Size</th><th>Màu</th><th>Đơn giá</th><th>SL</th><th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {(detail.items || []).map((it) => (
                  <tr key={it.id}>
                    <td>{it.productName}</td>
                    <td>{it.size || '—'}</td>
                    <td>{it.color || '—'}</td>
                    <td>{formatVNDText(it.price)}</td>
                    <td>{it.quantity}</td>
                    <td>{formatVNDText(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="cart-summary">
              <dt>Tạm tính</dt><dd>{formatVNDText(detail.subtotal)}</dd>
              <dt>Giảm giá</dt><dd>-{formatVNDText(detail.discount)}</dd>
              <dt className="total-row"><strong>Tổng cộng</strong></dt>
              <dd className="total-row"><strong>{formatVNDText(detail.total)}</strong></dd>
            </dl>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
