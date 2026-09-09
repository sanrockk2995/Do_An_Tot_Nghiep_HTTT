import { useEffect, useMemo, useState } from 'react';
import { api, getErrorMessage } from '../../services/api';
import { formatVNDText } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { IconCheckCircle, IconX } from '../../components/Icons';

/**
 * Báo cáo - Thống kê (ADMIN) — theo SRS:
 * - UC "Xem báo cáo": danh sách báo cáo (tên, thời gian tạo, người lập, trạng thái) + lọc.
 * - UC "In báo cáo": bản xem trước → in / xuất file PDF khổ A4.
 */
const REPORT_CATALOG = [
  { type: 'doanh-thu', name: 'Báo cáo doanh thu', needGroupBy: true },
  { type: 'san-pham-ban-chay', name: 'Báo cáo sản phẩm bán chạy' },
  { type: 'ton-kho', name: 'Báo cáo tồn kho' },
];

const EMPTY_STATUS = {}; // type → { printedAt, printedBy }

export default function AdminReportsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [typeFilter, setTypeFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [groupBy, setGroupBy] = useState('month');
  const [statusMap, setStatusMap] = useState(EMPTY_STATUS);
  const [message, setMessage] = useState('');

  // Bản xem trước báo cáo đang mở
  const [preview, setPreview] = useState(null); // { meta, overview?, rows?, columns }
  const [previewLoading, setPreviewLoading] = useState(false);
  const [printing, setPrinting] = useState(false);

  /** Lọc danh sách báo cáo theo loại (UC "Xem báo cáo": lọc theo loại, thời gian). */
  const visibleReports = useMemo(
    () => REPORT_CATALOG.filter((r) => !typeFilter || r.type === typeFilter),
    [typeFilter],
  );

  function periodParams() {
    const params = {};
    if (from) params.from = `${from}T00:00:00`;
    if (to) params.to = `${to}T23:59:59`;
    return params;
  }

  /** Nạp dữ liệu của 1 loại báo cáo để hiển thị bản xem trước. */
  async function openPreview(report) {
    setMessage('');
    setPreviewLoading(true);
    try {
      const params = periodParams();
      if (report.type === 'doanh-thu') {
        const [oRes, rRes] = await Promise.all([
          api.get('/reports/overview', { params }),
          api.get('/reports/revenue', {
            params: { ...params, groupBy },
          }),
        ]);
        setPreview({
          meta: report,
          overview: oRes.data,
          columns: ['Kỳ', 'Số đơn', 'Doanh thu'],
          rows: (rRes.data || []).map((p) => ({
            key: p.period,
            cells: [p.period, String(p.orderCount), formatVNDText(p.revenue)],
          })),
        });
      } else if (report.type === 'san-pham-ban-chay') {
        const res = await api.get('/reports/best-selling-products', {
          params: { limit: 10 },
        });
        setPreview({
          meta: report,
          columns: ['STT', 'Mã SP', 'Tên sản phẩm', 'Đơn giá', 'SL bán'],
          rows: (res.data || []).map((r, i) => ({
            key: r.productId,
            cells: [i + 1, r.code, r.name, formatVNDText(r.price), String(r.soldQuantity)],
          })),
        });
      } else {
        const res = await api.get('/reports/low-stock');
        setPreview({
          meta: report,
          columns: ['STT', 'Mã SP', 'Tên sản phẩm', 'Tồn kho', 'Ngưỡng tối thiểu'],
          rows: (res.data || []).map((r, i) => ({
            key: r.productId,
            cells: [i + 1, r.code, r.name, String(r.stock), String(r.minStock)],
          })),
        });
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không tải được dữ liệu báo cáo.'));
    } finally {
      setPreviewLoading(false);
    }
  }

  /** UC "In báo cáo": hệ thống tạo file PDF A4 → mở bản in (Print Preview của trình duyệt). */
  async function handlePrint() {
    if (!preview) return;
    setPrinting(true);
    try {
      const params = { type: preview.meta.type, groupBy, ...periodParams() };
      const res = await api.get('/reports/print', { params, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank'); // trình duyệt hiển thị PDF + hộp thoại in (Ctrl+P)
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setStatusMap((m) => ({
        ...m,
        [preview.meta.type]: { printedAt: new Date().toISOString(), printedBy: user?.fullName || user?.email || 'Quản lý' },
      }));
      toast.success('In báo cáo thành công. File PDF đã được mở để in hoặc tải về.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không in được báo cáo.'));
    } finally {
      setPrinting(false);
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Báo cáo - Thống kê</h1>
        <p className="muted-text">Danh sách báo cáo hệ thống — chọn một báo cáo để xem trước và in.</p>
      </header>

      {/* Bộ lọc danh sách theo thời gian, loại báo cáo */}
      <form className="card admin-toolbar" onSubmit={(e) => e.preventDefault()}>
        <div className="field-inline">
          <label htmlFor="rp-type">Loại báo cáo:</label>
          <select id="rp-type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Tất cả</option>
            {REPORT_CATALOG.map((r) => (
              <option key={r.type} value={r.type}>{r.name}</option>
            ))}
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
        <div className="field-inline">
          <label htmlFor="rp-group">Nhóm doanh thu theo:</label>
          <select id="rp-group" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            <option value="day">Ngày</option>
            <option value="month">Tháng</option>
            <option value="year">Năm</option>
          </select>
        </div>
      </form>

      {message && (
        <div className="alert alert-success" role="status">
          <span className="alert-icon"><IconCheckCircle size={18} /></span>
          <span className="alert-content">{message}</span>
          <button
            type="button"
            className="alert-close"
            onClick={() => setMessage('')}
            aria-label="Đóng thông báo"
          >
            <IconX size={15} />
          </button>
        </div>
      )}

      {/* Danh sách báo cáo */}
      <table className="data-table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>Tên báo cáo</th>
            <th>Kỳ dữ liệu</th>
            <th>Thời gian tạo</th>
            <th>Người lập</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {visibleReports.map((r) => {
            const st = statusMap[r.type];
            return (
              <tr key={r.type}>
                <td><strong>{r.name}</strong></td>
                <td>{from || to ? `${from || '...'} → ${to || '...'}` : 'Toàn hệ thống'}</td>
                <td>{st ? formatIso(st.printedAt) : '—'}</td>
                <td>{st ? st.printedBy : user?.fullName || user?.email || '—'}</td>
                <td>
                  <span className={`badge ${st ? 'badge-green' : 'badge-blue'}`}>
                    {st ? 'Đã in' : 'Sẵn sàng'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-outline" onClick={() => openPreview(r)} disabled={previewLoading}>
                    Xem trước
                  </button>{' '}
                  <button
                    className="btn btn-primary"
                    onClick={() => openPreview(r).then(handlePrint)}
                    disabled={previewLoading || printing}
                  >
                    In báo cáo
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ===== Bản xem trước báo cáo (Print Preview) ===== */}
      {preview && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card modal-wide">
            <h2>Bản xem trước — {preview.meta.name}</h2>
            <p className="muted-text">
              Kỳ báo cáo: {from || to ? `${from || '...'} → ${to || '...'}` : 'toàn hệ thống'}
            </p>

            {previewLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <>
                {preview.overview && (
                  <section className="stat-tiles">
                    <div className="stat-tile card">
                      <span className="stat-label">Doanh thu</span>
                      <strong className="stat-value">{formatVNDText(preview.overview.revenue)}</strong>
                    </div>
                    <div className="stat-tile card">
                      <span className="stat-label">Đơn hàng</span>
                      <strong className="stat-value">{preview.overview.orderCount ?? '—'}</strong>
                    </div>
                    <div className="stat-tile card">
                      <span className="stat-label">SP bán ra</span>
                      <strong className="stat-value">{preview.overview.productsSold ?? '—'}</strong>
                    </div>
                    <div className="stat-tile card">
                      <span className="stat-label">TB / đơn</span>
                      <strong className="stat-value">{formatVNDText(preview.overview.avgOrderValue)}</strong>
                    </div>
                  </section>
                )}

                <table className="data-table compact">
                  <thead>
                    <tr>{preview.columns.map((c) => <th key={c}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr key={row.key}>
                        {row.cells.map((cell, i) => <td key={i}>{cell}</td>)}
                      </tr>
                    ))}
                    {preview.rows.length === 0 && (
                      <tr>
                        <td colSpan={preview.columns.length} className="muted-text">
                          Không có dữ liệu báo cáo trong khoảng đã chọn.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setPreview(null)}>
                Đóng
              </button>
              <button
                type="button"
                className={`btn btn-primary${printing ? ' loading' : ''}`}
                onClick={handlePrint}
                disabled={printing || previewLoading}
              >
                {printing ? 'Đang tạo file in...' : '🖨 In / Xuất PDF (A4)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatIso(iso) {
  try {
    return new Date(iso).toLocaleString('vi-VN');
  } catch {
    return iso;
  }
}
