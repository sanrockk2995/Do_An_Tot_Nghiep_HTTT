import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { api } from '../../services/api';
import { formatVNDText } from '../../utils/format';

/** Báo cáo doanh thu cho ACCOUNTANT: tổng quan + biểu đồ theo ngày/tháng/năm. */
export default function AccountingPage() {
  const [overview, setOverview] = useState(null);
  const [points, setPoints] = useState([]);
  const [group, setGroup] = useState('day');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);

  async function fetchRevenue(g, f, t) {
    const res = await api.get('/reports/revenue', { params: { group: g, from: f || undefined, to: t || undefined } });
    // Backend trả RevenuePoint(period, revenue, orderCount) → map sang label/value cho chart
    setPoints((res.data || []).map((p) => ({ ...p, label: p.period, value: Number(p.revenue || 0) })));
  }

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.get('/reports/overview'),
      api.get('/reports/revenue', { params: { group: 'day' } }),
    ])
      .then(([oRes, rRes]) => {
        if (!alive) return;
        setOverview(oRes.data);
        const rows = rRes.data || [];
        setPoints(rows.map((p) => ({ ...p, label: p.period, value: Number(p.revenue || 0) })));
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  function handleFilter(e) {
    e.preventDefault();
    fetchRevenue(group, from, to).catch(() => alert('Không tải được báo cáo.'));
  }

  /** Xuất báo cáo tài chính ra Excel theo khoảng ngày đang chọn. */
  async function exportTaiChinh() {
    try {
      const params = { groupBy: group };
      if (from) params.from = `${from}T00:00:00`;
      if (to) params.to = `${to}T23:59:59`;
      const res = await api.get('/reports/financial/export', {
        params,
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bao-cao-tai-chinh.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Không xuất được báo cáo tài chính.');
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Báo cáo doanh thu</h1>
        <p className="muted-text">Chỉ tính đơn hàng hoàn tất (COMPLETED).</p>
      </header>

      <section className="stat-tiles">
        <div className="stat-tile card">
          <span className="stat-label">Doanh thu</span>
          <strong className="stat-value">{formatVNDText(overview?.revenue)}</strong>
          <span className="muted-text">Tháng này</span>
        </div>
        <div className="stat-tile card">
          <span className="stat-label">Đơn hàng</span>
          <strong className="stat-value">{overview?.orderCount ?? '—'}</strong>
          <span className="muted-text">Tháng này (không tính đơn hủy)</span>
        </div>
        <div className="stat-tile card">
          <span className="stat-label">Sản phẩm bán ra</span>
          <strong className="stat-value">{overview?.productsSold ?? '—'}</strong>
          <span className="muted-text">Tháng này</span>
        </div>
      </section>

      <form onSubmit={handleFilter} className="card admin-toolbar" style={{ marginTop: 16 }}>
        <div className="field-inline">
          <label htmlFor="rp-group">Nhóm theo:</label>
          <select id="rp-group" value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="day">Ngày</option>
            <option value="month">Tháng</option>
            <option value="year">Năm</option>
          </select>
        </div>
        <div className="field-inline">
          <label htmlFor="rp-from">Từ ngày:</label>
          <input id="rp-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field-inline">
          <label htmlFor="rp-to">Đến ngày:</label>
          <input id="rp-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary">Áp dụng</button>
        <button type="button" className="btn btn-ghost" onClick={exportTaiChinh}>
          ⬇ Xuất báo cáo tài chính
        </button>
      </form>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Biểu đồ doanh thu</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : points.length === 0 ? (
          <p className="muted-text">Không có dữ liệu trong khoảng đã chọn.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1e6)}tr`} width={64} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatVNDText(v)} labelFormatter={(l) => `Kỳ: ${l}`} />
                <Legend />
                <Line type="monotone" dataKey="value" name="Doanh thu" stroke="#22C55E" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>

            <h3 style={{ marginTop: 24 }}>Chi tiết theo kỳ</h3>
            <table className="data-table compact" style={{ maxWidth: 560 }}>
              <thead><tr><th>Kỳ</th><th>Doanh thu</th></tr></thead>
              <tbody>
                {points.map((pt) => (
                  <tr key={pt.label}>
                    <td>{pt.label}</td>
                    <td>{formatVNDText(pt.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </div>
  );
}
