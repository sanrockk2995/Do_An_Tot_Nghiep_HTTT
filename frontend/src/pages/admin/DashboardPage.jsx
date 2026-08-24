import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { api } from '../../services/api';
import { formatVNDText } from '../../utils/format';

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
      api.get('/reports/revenue', { params: { group: 'day' } }),
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
            <LineChart data={revenuePoints}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={60} />
              <Tooltip
                formatter={(v) => formatVNDText(v)}
                labelFormatter={(l) => `Ngày ${l}`}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Doanh thu"
                stroke="#22C55E"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
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
