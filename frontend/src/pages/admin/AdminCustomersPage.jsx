import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  formatVNDText, formatDateTime, TIER_LABELS,
  ORDER_STATUS_LABELS, ORDER_STATUS_BADGES,
} from '../../utils/format';

/**
 * Quản lý khách hàng (ADMIN + SALES_STAFF): bảng + tìm kiếm + modal chi tiết
 * với lịch sử đơn hàng (tải riêng qua /customers/{id}/orders).
 */
export default function AdminCustomersPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);   // CustomerResponse
  const [detailOrders, setDetailOrders] = useState([]);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    api
      .get('/customers', { params: { q, page, size: 10 } })
      .then((res) => {
        if (!alive) return;
        setItems(res.data.content || []);
        setTotalPages(res.data.totalPages || 1);
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Không tải được khách hàng.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [q, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function openDetail(id) {
    try {
      const [cRes, oRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/customers/${id}/orders`, { params: { page: 0, size: 10 } }),
      ]);
      setDetail(cRes.data);
      setDetailOrders(oRes.data?.content || []);
    } catch (err) {
      alert(err.message || 'Không tải được thông tin khách hàng.');
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Khách hàng</h1>
        <p className="muted-text">
          Hạng thành viên: SILVER ≥ 5 triệu · GOLD ≥ 20 triệu · VIP ≥ 50 triệu tổng mua.
        </p>
      </header>

      <section className="admin-toolbar">
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Tìm theo tên, SĐT hoặc email..."
          aria-label="Tìm kiếm khách hàng"
        />
      </section>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>SĐT</th>
                <th>Email</th>
                <th>Số đơn</th>
                <th>Tổng mua</th>
                <th>Hạng</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>{c.fullName}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.totalOrders ?? 0}</td>
                  <td>{formatVNDText(c.totalSpent)}</td>
                  <td>
                    <span className={`badge ${tierBadge(c.tier)}`}>
                      {TIER_LABELS[c.tier] || c.tier}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-outline" onClick={() => openDetail(c.id)}>
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted-text">Không có dữ liệu.</td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Phân trang">
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>← Trước</button>
              <span>Trang {page + 1} / {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Sau →</button>
            </nav>
          )}
        </>
      )}

      {detail && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card modal-wide">
            <h2>Khách hàng: {detail.fullName}</h2>
            <dl className="detail-list">
              <dt>Email</dt><dd>{detail.email || '—'}</dd>
              <dt>Số điện thoại</dt><dd>{detail.phone || '—'}</dd>
              <dt>Địa chỉ</dt>
              <dd>{[detail.address, detail.district, detail.city].filter(Boolean).join(', ') || '—'}</dd>
              <dt>Số đơn hàng</dt><dd>{detail.totalOrders ?? 0}</dd>
              <dt>Tổng mua</dt><dd>{formatVNDText(detail.totalSpent)}</dd>
              <dt>Hạng</dt><dd>{TIER_LABELS[detail.tier] || detail.tier}</dd>
              <dt>Lần mua cuối</dt>
              <dd>{detail.lastOrderAt ? formatDateTime(detail.lastOrderAt) : '—'}</dd>
            </dl>

            <h3 style={{ marginTop: 16 }}>Lịch sử đơn hàng</h3>
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Mã ĐH</th>
                  <th>Ngày</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {detailOrders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.orderNumber}</td>
                    <td>{formatDateTime(o.createdAt)}</td>
                    <td>{formatVNDText(o.total)}</td>
                    <td>
                      <span className={`badge ${ORDER_STATUS_BADGES[o.status] || ''}`}>
                        {ORDER_STATUS_LABELS[o.status] || o.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {detailOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted-text">Chưa có đơn hàng.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setDetail(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function tierBadge(tier) {
  switch (tier) {
    case 'VIP':
      return 'badge-pink';
    case 'GOLD':
      return 'badge-yellow';
    default:
      return 'badge-gray';
  }
}
