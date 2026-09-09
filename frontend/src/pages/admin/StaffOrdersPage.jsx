import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  formatVNDText, formatDateTime,
  ORDER_STATUS_LABELS, ORDER_STATUS_BADGES, PAYMENT_METHOD_LABELS,
} from '../../utils/format';

/**
 * Tra cứu hóa đơn: bảng đơn hàng + tải PDF hóa đơn.
 * salesMode / accountingMode chỉ thay đổi tiêu đề.
 */
export default function StaffOrdersPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    api.get('/orders', { params: { q: q || undefined, page: 0, size: 20 } })
      .then((res) => {
        if (!alive) return;
        setItems(res.data?.content || res.data || []);
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Không tải được danh sách.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [q]);

  useEffect(() => { load(); }, [load]);

  async function downloadInvoice(id, orderNumber) {
    try {
      const res = await api.get(`/orders/${id}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `hoa-don-${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message || 'Không tải được hóa đơn PDF.');
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Tra cứu hóa đơn</h1>
        <p className="muted-text">Tìm theo mã đơn hoặc tên/SĐT khách — tải hóa đơn PDF.</p>
      </header>

      <section className="admin-toolbar">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Mã ĐH / tên khách / SĐT..." aria-label="Tìm hóa đơn" />
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã ĐH</th><th>Ngày</th><th>Khách hàng</th><th>Kênh</th><th>Tổng tiền</th><th>Trạng thái</th><th>Hóa đơn</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id}>
                  <td>{o.orderNumber}</td>
                  <td>{formatDateTime(o.createdAt)}</td>
                  <td>{o.customerName || o.customerPhone || 'Khách lẻ'}</td>
                  <td>{o.channel === 'ONLINE' ? 'Online' : 'Tại quầy'}</td>
                  <td>{formatVNDText(o.total)}</td>
                  <td>
                    <span className={`badge ${ORDER_STATUS_BADGES[o.status] || ''}`}>
                      {ORDER_STATUS_LABELS[o.status] || o.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-outline"
                      onClick={() => downloadInvoice(o.id, o.orderNumber)}>
                      Tải PDF
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={7} className="muted-text">Không có dữ liệu.</td></tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
