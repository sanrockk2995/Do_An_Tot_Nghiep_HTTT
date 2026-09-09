import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { api } from '../../services/api';
import { formatVNDText } from '../../utils/format';

/** Đảm bảo biểu đồ doanh thu theo ngày trong tháng có đủ các ngày từ ngày 1 đến hôm nay. */
function ensureMonthDays(rawPoints) {
  const map = new Map();
  if (Array.isArray(rawPoints)) {
    rawPoints.forEach((p) => {
      if (p && p.period) {
        map.set(p.period, {
          period: p.period,
          revenue: Number(p.revenue || 0),
          orderCount: Number(p.orderCount || 0),
        });
      }
    });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const today = now.getDate();

  const points = [];
  for (let d = 1; d <= today; d++) {
    const dayStr = String(d).padStart(2, '0');
    const period = `${year}-${month}-${dayStr}`;
    if (map.has(period)) {
      points.push(map.get(period));
    } else {
      points.push({ period, revenue: 0, orderCount: 0 });
    }
  }
  return points;
}

/** Trang tổng quan ADMIN: thẻ số liệu + biểu đồ doanh thu + bán chạy + tồn kho thấp. */
export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [revenuePoints, setRevenuePoints] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.get('/reports/overview'),
      api.get('/reports/revenue', { params: { groupBy: 'day', group: 'day' } }),
      api.get('/reports/best-selling-products', { params: { limit: 5 } }),
      api.get('/reports/low-stock', { params: { limit: 5 } }),
    ])
      .then(([oRes, rRes, bRes, lRes]) => {
        if (!alive) return;
        setOverview(oRes.data);
        setRevenuePoints(rRes.data || []);
        setBestSelling(bRes.data || []);
        setLowStock(lRes.data || []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const chartData = useMemo(() => ensureMonthDays(revenuePoints), [revenuePoints]);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Tổng quan</h1>
        <p className="muted-text">Số liệu tháng hiện tại.</p>
      </header>

      <section className="stat-tiles" aria-label="Chỉ số tổng quan">
        <div className="stat-tile card">
          <span className="stat-label">Doanh thu</span>
          <strong className="stat-value">{formatVNDText(overview?.revenue)}</strong>
          <span className="muted-text">Tháng này</span>
        </div>
        <div className="stat-tile card">
          <span className="stat-label">Đơn hàng</span>
          <strong className="stat-value">{overview?.orderCount ?? '—'}</strong>
          <span className="muted-text">Tháng này</span>
        </div>
        <div className="stat-tile card">
          <span className="stat-label">Sản phẩm bán ra</span>
          <strong className="stat-value">{overview?.productsSold ?? '—'}</strong>
          <span className="muted-text">Tháng này</span>
        </div>
        <div className="stat-tile card">
          <span className="stat-label">Khách hàng</span>
          <strong className="stat-value">{overview?.customerCount ?? '—'}</strong>
          <span className="muted-text">Tổng hiện có</span>
        </div>
      </section>

      <section className="admin-grid-2">
        <section className="card chart-card">
          <h2>Doanh thu theo ngày (tháng này)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 12, right: 16, bottom: 4, left: 4 }}>
              <defs>
                <linearGradient id="routineRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="period"
                tickFormatter={(val) => {
                  if (!val) return '';
                  const parts = String(val).split('-');
                  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : val;
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
                  return parts.length === 3 ? `Ngày ${parts[2]}/${parts[1]}/${parts[0]}` : `Kỳ ${l}`;
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
                dataKey="revenue"
                name="Doanh thu"
                stroke="#059669"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#routineRevenueGrad)"
                dot={{ r: 3.5, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <p className="muted-text">Đơn vị: VNĐ — chỉ tính đơn hàng hoàn tất.</p>
        </section>

        <section className="card">
          <h2>Top sản phẩm bán chạy</h2>
          <ul className="ranking-list">
            {bestSelling.map((r) => (
              <li key={r.productId}>
                <span>{r.name}</span>
                <strong>{r.soldQuantity} sp · {formatVNDText(r.price)}</strong>
              </li>
            ))}
          </ul>

          <h2 style={{ marginTop: 24 }}>Cảnh báo tồn kho thấp</h2>
          <ul className="ranking-list">
            {lowStock.map((r) => (
              <li key={r.productId} className="warn-row">
                <span>{r.name}</span>
                <strong>Còn {r.stock}</strong>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </div>
  );
}
