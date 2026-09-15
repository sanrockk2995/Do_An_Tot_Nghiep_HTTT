import { useCallback, useEffect, useState } from 'react';
import { api, getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { IconAlertCircle, IconReceipt, IconSearch, IconX } from '../../components/Icons';
import {
  formatVNDText, formatDateTime,
  ORDER_STATUS_LABELS, ORDER_STATUS_BADGES, PAYMENT_METHOD_LABELS,
} from '../../utils/format';

/**
 * Tra cứu hóa đơn: bảng đơn hàng + tìm kiếm đa tiêu chí + chi tiết đơn + tải PDF.
 * Nhận props: salesMode (NV bán hàng) hoặc accountingMode (Kế toán) để tối ưu giao diện.
 */
export default function StaffOrdersPage({ salesMode = false, accountingMode = false }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // Debounce input tìm kiếm 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q.trim());
      setPage(0); // Reset về trang 1 khi đổi từ khóa
    }, 300);
    return () => clearTimeout(handler);
  }, [q]);

  // Reset trang khi đổi bộ lọc
  const handleChannelChange = (e) => {
    setChannelFilter(e.target.value);
    setPage(0);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const handleClearFilters = () => {
    setQ('');
    setDebouncedQ('');
    setChannelFilter('');
    setStatusFilter('');
    setPage(0);
  };

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError('');

    const params = {
      page,
      size: pageSize,
    };
    if (debouncedQ) params.q = debouncedQ;
    if (channelFilter) params.channel = channelFilter;
    if (statusFilter) params.status = statusFilter;

    api.get('/orders', { params })
      .then((res) => {
        if (!alive) return;
        const data = res.data;
        if (data && Array.isArray(data.content)) {
          setItems(data.content);
          setTotalPages(data.totalPages || 0);
          setTotalElements(data.totalElements || 0);
        } else if (Array.isArray(data)) {
          setItems(data);
          setTotalPages(1);
          setTotalElements(data.length);
        } else {
          setItems([]);
          setTotalPages(0);
          setTotalElements(0);
        }
      })
      .catch((err) => {
        if (alive) setError(getErrorMessage(err, 'Không tải được danh sách hóa đơn.'));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, [debouncedQ, channelFilter, statusFilter, page, pageSize]);

  useEffect(() => {
    const cleanup = load();
    return () => { if (cleanup) cleanup(); };
  }, [load]);

  async function openDetail(id) {
    try {
      const res = await api.get(`/orders/${id}`);
      setDetail(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không tải được chi tiết hóa đơn.'));
    }
  }

  async function downloadInvoice(id, orderNumber) {
    setDownloadingId(id);
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
      toast.success(`Đã tải hóa đơn ${orderNumber}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không tải được hóa đơn PDF.'));
    } finally {
      setDownloadingId(null);
    }
  }

  // Tiêu đề trang theo vai trò
  const pageTitle = accountingMode
    ? 'Kế toán — Tra cứu hóa đơn & chứng từ'
    : salesMode
      ? 'Bán hàng — Tra cứu hóa đơn'
      : 'Quản trị — Tra cứu hóa đơn';

  const pageDesc = accountingMode
    ? 'Tìm kiếm hóa đơn theo mã ĐH, khách hàng, SĐT, nhân viên lập, sản phẩm hoặc ghi chú — tải hóa đơn PDF đối soát.'
    : 'Tìm kiếm hóa đơn theo mã ĐH, thông tin khách hàng, nhân viên bán hàng hoặc tên sản phẩm.';

  const hasActiveFilters = Boolean(q || channelFilter || statusFilter);

  // Tính tổng tiền các hóa đơn trên trang hiện tại
  const currentPageTotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <h1>{pageTitle}</h1>
          <p className="muted-text">{pageDesc}</p>
        </div>
      </header>

      {/* Toolbar: Tìm kiếm đa tiêu chí + Bộ lọc Kênh & Trạng thái */}
      <section className="admin-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 320px', minWidth: 260 }}>
          <span style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-muted, #888)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
          }}>
            <IconSearch size={16} />
          </span>

          <input
            type="search"
            name="search_invoice_keyword"
            id="search_invoice_keyword"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            data-lpignore="true"
            data-form-type="other"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo mã ĐH, tên/SĐT khách, nhân viên, SP..."
            aria-label="Tìm hóa đơn"
            style={{ paddingLeft: 36, paddingRight: q ? 36 : 12, width: '100%' }}
          />

          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              title="Xóa tìm kiếm"
              aria-label="Xóa từ khóa tìm kiếm"
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-muted, #888)',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <IconX size={15} />
            </button>
          )}
        </div>

        {/* Lọc Kênh bán */}
        <select
          value={channelFilter}
          onChange={handleChannelChange}
          aria-label="Lọc theo kênh bán"
          style={{ minWidth: 150 }}
        >
          <option value="">Tất cả kênh bán</option>
          <option value="OFFLINE">Tại quầy (POS)</option>
          <option value="ONLINE">Đơn online</option>
        </select>

        {/* Lọc Trạng thái */}
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          aria-label="Lọc theo trạng thái đơn"
          style={{ minWidth: 160 }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="COMPLETED">Hoàn tất</option>
          <option value="PAID">Đã thanh toán</option>
          <option value="PENDING">Chờ xác nhận</option>
          <option value="SHIPPING">Đang giao hàng</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>

        {/* Nút Xóa lọc nhanh */}
        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleClearFilters}
            title="Đặt lại tất cả bộ lọc"
          >
            <IconX size={14} style={{ marginRight: 4 }} />
            Xóa bộ lọc
          </button>
        )}
      </section>

      {/* Dải thông tin tóm tắt kết quả */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '8px 12px',
        background: 'var(--color-card-bg, #f8f9fa)',
        border: '1px solid var(--color-border, #e9ecef)',
        borderRadius: 8,
        fontSize: '0.875rem',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconReceipt size={16} />
          <span>
            Tìm thấy: <strong>{totalElements}</strong> hóa đơn
            {hasActiveFilters && <span className="muted-text"> (đang lọc)</span>}
          </span>
        </div>
        <div>
          <span className="muted-text">Tổng trang này: </span>
          <strong style={{ color: 'var(--color-primary, #0052cc)' }}>
            {formatVNDText(currentPageTotal)}
          </strong>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon"><IconAlertCircle size={18} /></span>
          <span className="alert-content">{error}</span>
          <button
            type="button"
            className="alert-close"
            onClick={() => setError('')}
            aria-label="Đóng thông báo"
          >
            <IconX size={15} />
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" /></div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã ĐH</th>
                  <th>Ngày tạo</th>
                  <th>Khách hàng</th>
                  <th>Người lập</th>
                  <th>Kênh</th>
                  <th>PT thanh toán</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => openDetail(o.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          fontWeight: 600,
                          color: 'var(--color-primary, #0052cc)',
                          textDecoration: 'underline',
                        }}
                        title="Bấm để xem chi tiết hóa đơn"
                      >
                        {o.orderNumber}
                      </button>
                    </td>
                    <td>{formatDateTime(o.createdAt)}</td>
                    <td>
                      <div>
                        <strong>{o.customerName || (o.channel === 'OFFLINE' ? 'Khách lẻ' : 'Khách vãng lai')}</strong>
                        {o.customerPhone && (
                          <div className="muted-text" style={{ fontSize: '0.8rem' }}>{o.customerPhone}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="muted-text">{o.createdBy || '—'}</span>
                    </td>
                    <td>
                      <span className={`badge ${o.channel === 'ONLINE' ? 'badge-blue' : 'badge-gray'}`}>
                        {o.channel === 'ONLINE' ? 'Online' : 'Tại quầy'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {PAYMENT_METHOD_LABELS[o.paymentMethod] || o.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <strong>{formatVNDText(o.total)}</strong>
                      {o.discount > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>
                          - {formatVNDText(o.discount)}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${ORDER_STATUS_BADGES[o.status] || ''}`}>
                        {ORDER_STATUS_LABELS[o.status] || o.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="row-actions" style={{ justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => openDetail(o.id)}
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        >
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          disabled={downloadingId === o.id}
                          onClick={() => downloadInvoice(o.id, o.orderNumber)}
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        >
                          {downloadingId === o.id ? 'Đang tải...' : 'Tải PDF'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px 16px' }} className="muted-text">
                      {hasActiveFilters
                        ? 'Không tìm thấy hóa đơn phù hợp với từ khóa hoặc bộ lọc đã chọn.'
                        : 'Không có dữ liệu hóa đơn nào.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <nav className="pagination" aria-label="Phân trang hóa đơn" style={{ marginTop: 16 }}>
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                ← Trước
              </button>
              <span>Trang {page + 1} / {totalPages} (Tổng {totalElements} đơn)</span>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Sau →
              </button>
            </nav>
          )}
        </>
      )}

      {/* Modal Chi tiết Hóa đơn */}
      {detail && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="invoice-detail-title">
          <div className="modal card modal-wide" style={{ maxWidth: 760 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 id="invoice-detail-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconReceipt size={22} />
                Chi tiết hóa đơn #{detail.orderNumber}
              </h2>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDetail(null)}
                aria-label="Đóng"
                style={{ padding: 6 }}
              >
                <IconX size={18} />
              </button>
            </div>

            <dl className="detail-list" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div>
                <dt>Mã đơn hàng</dt>
                <dd><strong>{detail.orderNumber}</strong></dd>
              </div>
              <div>
                <dt>Trạng thái</dt>
                <dd>
                  <span className={`badge ${ORDER_STATUS_BADGES[detail.status] || ''}`}>
                    {ORDER_STATUS_LABELS[detail.status] || detail.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Kênh bán</dt>
                <dd>
                  <span className={`badge ${detail.channel === 'ONLINE' ? 'badge-blue' : 'badge-gray'}`}>
                    {detail.channel === 'ONLINE' ? 'Online (Website)' : 'Tại quầy (POS)'}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Phương thức thanh toán</dt>
                <dd>{PAYMENT_METHOD_LABELS[detail.paymentMethod] || detail.paymentMethod}</dd>
              </div>
              <div>
                <dt>Khách hàng</dt>
                <dd>{detail.customerName || 'Khách lẻ'}</dd>
              </div>
              <div>
                <dt>Số điện thoại</dt>
                <dd>{detail.customerPhone || '—'}</dd>
              </div>
              <div>
                <dt>Nhân viên tạo đơn</dt>
                <dd>{detail.createdBy || '—'}</dd>
              </div>
              <div>
                <dt>Thời gian tạo</dt>
                <dd>{formatDateTime(detail.createdAt)}</dd>
              </div>
              {detail.deliveredAt && (
                <div>
                  <dt>Thời gian giao/hoàn tất</dt>
                  <dd>{formatDateTime(detail.deliveredAt)}</dd>
                </div>
              )}
              {detail.notes && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <dt>Ghi chú</dt>
                  <dd>{detail.notes}</dd>
                </div>
              )}
            </dl>

            <h3 style={{ marginTop: 20, marginBottom: 10 }}>Danh sách sản phẩm</h3>
            <div className="table-responsive">
              <table className="data-table compact">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã SKU</th>
                    <th>Tên sản phẩm</th>
                    <th>Phân loại</th>
                    <th style={{ textAlign: 'right' }}>Đơn giá</th>
                    <th style={{ textAlign: 'center' }}>Số lượng</th>
                    <th style={{ textAlign: 'right' }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.items || []).map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td>{idx + 1}</td>
                      <td><code>{it.productCode || '—'}</code></td>
                      <td><strong>{it.productName}</strong></td>
                      <td>
                        {it.size || it.color ? (
                          <span>{it.size ? `Size ${it.size}` : ''} {it.color ? `- Màu ${it.color}` : ''}</span>
                        ) : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>{formatVNDText(it.price)}</td>
                      <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                      <td style={{ textAlign: 'right' }}><strong>{formatVNDText(it.subtotal)}</strong></td>
                    </tr>
                  ))}
                  {(!detail.items || detail.items.length === 0) && (
                    <tr><td colSpan={7} className="muted-text" style={{ textAlign: 'center' }}>Không có sản phẩm nào.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Tổng kết tài chính */}
            <div style={{
              marginTop: 16,
              padding: '12px 16px',
              background: 'var(--color-card-bg, #f8f9fa)',
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              alignItems: 'flex-end',
            }}>
              <div style={{ display: 'flex', gap: 24, fontSize: '0.9rem' }}>
                <span className="muted-text">Tạm tính:</span>
                <span>{formatVNDText(detail.subtotal)}</span>
              </div>
              {detail.discount > 0 && (
                <div style={{ display: 'flex', gap: 24, fontSize: '0.9rem', color: '#16a34a' }}>
                  <span>Chiết khấu / Giảm giá:</span>
                  <span>- {formatVNDText(detail.discount)}</span>
                </div>
              )}
              <div style={{
                display: 'flex',
                gap: 24,
                fontSize: '1.1rem',
                fontWeight: 700,
                borderTop: '1px solid var(--color-border, #e9ecef)',
                paddingTop: 6,
                marginTop: 4,
              }}>
                <span>Tổng cộng:</span>
                <span style={{ color: 'var(--color-primary, #0052cc)' }}>
                  {formatVNDText(detail.total)}
                </span>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-outline"
                disabled={downloadingId === detail.id}
                onClick={() => downloadInvoice(detail.id, detail.orderNumber)}
              >
                {downloadingId === detail.id ? 'Đang tải...' : 'Tải hóa đơn PDF'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setDetail(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
