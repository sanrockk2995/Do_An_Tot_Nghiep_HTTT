import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatVNDText } from '../../utils/format';

/** Báo cáo doanh thu cho ACCOUNTANT: tổng quan + biểu đồ theo ngày/tháng/năm. */
export default function AccountingPage() {
  const toast = useToast();
  const [overview, setOverview] = useState(null);
  const [points, setPoints] = useState([]);
  const [group, setGroup] = useState('day');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [filterApplied, setFilterApplied] = useState(false);
  const [loading, setLoading] = useState(true);

  function buildParams(g, f, t) {
    const params = { groupBy: g, group: g };
    if (f) params.from = f.includes('T') ? f : `${f}T00:00:00`;
    if (t) params.to = t.includes('T') ? t : `${t}T23:59:59`;
    return params;
  }

  async function loadReport(g, f, t) {
    setLoading(true);
    try {
      const params = buildParams(g, f, t);
      const [oRes, rRes] = await Promise.all([
        api.get('/reports/overview', { params: { from: params.from, to: params.to } }),
        api.get('/reports/revenue', { params }),
      ]);
      setOverview(oRes.data);
      const rows = rRes.data || [];
      setPoints(rows.map((p) => ({ ...p, label: p.period, value: Number(p.revenue || 0) })));
      setFilterApplied(Boolean(f || t));
    } catch (err) {
      toast.error('Không tải được báo cáo: ' + (err.response?.data?.message || err.message || 'Lỗi kết nối máy chủ.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport('day', '', '');
  }, []);

  function handleFilter(e) {
    e.preventDefault();
    loadReport(group, from, to);
  }

  function handleReset() {
    setFrom('');
    setTo('');
    setGroup('day');
    loadReport('day', '', '');
  }

  /** Xuất báo cáo tài chính ra Excel theo khoảng ngày đang chọn. */
  async function exportTaiChinh() {
    try {
      const params = buildParams(group, from, to);
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
      toast.error('Không xuất được báo cáo tài chính.');
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
          <span className="muted-text">{filterApplied ? 'Khoảng đã chọn' : 'Tháng này'}</span>
        </div>
        <div className="stat-tile card">
          <span className="stat-label">Đơn hàng</span>
          <strong className="stat-value">{overview?.orderCount ?? '—'}</strong>
          <span className="muted-text">{filterApplied ? 'Khoảng đã chọn' : 'Tháng này (không tính đơn hủy)'}</span>
        </div>
        <div className="stat-tile card">
          <span className="stat-label">Sản phẩm bán ra</span>
          <strong className="stat-value">{overview?.productsSold ?? '—'}</strong>
          <span className="muted-text">{filterApplied ? 'Khoảng đã chọn' : 'Tháng này'}</span>
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
        {filterApplied && (
          <button type="button" className="btn btn-outline" onClick={handleReset}>
            Đặt lại
          </button>
        )}
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
              <AreaChart data={points} margin={{ top: 12, right: 16, bottom: 4, left: 4 }}>
                <defs>
                  <linearGradient id="accountingRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickFormatter={(val) => {
                    if (!val) return '';
                    const parts = String(val).split('-');
                    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
                    if (parts.length === 2) return `T${parts[1]}`;
                    return val;
                  }}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  stroke="#cbd5e1"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tickFormatter={(v) => {
                    if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, '')}tr`;
                    if (v >= 1e3) return `${Math.round(v / 1000)}k`;
                    return `${v}`;
                  }}
                  width={56}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  stroke="#cbd5e1"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(v) => [formatVNDText(v), 'Doanh thu']}
                  labelFormatter={(l) => {
                    if (!l) return '';
                    const parts = String(l).split('-');
                    if (parts.length === 3) return `Ngày ${parts[2]}/${parts[1]}/${parts[0]}`;
                    if (parts.length === 2) return `Tháng ${parts[1]}/${parts[0]}`;
                    return `Năm ${l}`;
                  }}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.96)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '10px',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    fontSize: '13px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Doanh thu"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#accountingRevenueGrad)"
                  dot={{ r: 3.5, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
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
