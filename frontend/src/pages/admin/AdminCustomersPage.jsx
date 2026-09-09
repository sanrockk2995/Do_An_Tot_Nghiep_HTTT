import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { IconAlertCircle, IconX } from '../../components/Icons';
import {
  formatVNDText, formatDateTime, TIER_LABELS,
  ORDER_STATUS_LABELS, ORDER_STATUS_BADGES,
} from '../../utils/format';
import { VN_PROVINCES } from '../../data/vnLocations';

/**
 * Quản lý khách hàng (ADMIN + SALES_STAFF): bảng + tìm kiếm + modal chi tiết
 * với lịch sử đơn hàng (tải riêng qua /customers/{id}/orders).
 */
export default function AdminCustomersPage({ salesMode }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);   // CustomerResponse
  const [detailOrders, setDetailOrders] = useState([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // CustomerResponse đang sửa, null = thêm mới
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', address: '', district: '', city: '' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  /** Tỉnh/TP đang chọn (theo 34 tỉnh/thành mới từ 01/07/2025) → suy ra danh sách phường/xã. */
  const selectedProvince = useMemo(
    () => VN_PROVINCES.find((p) => stripPrefix(p.name) === form.city),
    [form.city],
  );
  const wardOptions = selectedProvince ? selectedProvince.wards : [];

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
        if (alive) setError(getErrorMessage(err, 'Không tải được danh sách khách hàng.'));
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

  function openCreate() {
    setNotice('');
    setForm({
      fullName: '',
      phone: '',
      email: '',
      address: '',
      district: '',
      city: '',
    });
    setEditing(null);
    setFormModalOpen(true);
  }

  function openEdit(c) {
    setNotice('');
    setForm({
      fullName: c.fullName || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      district: c.district || '',
      city: c.city || '',
    });
    setEditing(c);
    setFormModalOpen(true);
  }

  /** Chọn tỉnh/TP → reset phường/xã để chọn lại theo danh mục của tỉnh mới. */
  function handleProvinceChange(e) {
    const name = e.target.value;
    setForm((f) => ({ ...f, city: name, district: '' }));
  }

  /** UC "Thêm khách hàng" & "Cập nhật thông tin" (ADMIN + SALES_STAFF). */
  async function handleSave(e) {
    e.preventDefault();
    setNotice('');

    // 1. Kiểm tra trường bắt buộc
    const fullName = form.fullName.trim();
    if (!fullName) {
      setNotice('Vui lòng nhập họ tên khách hàng.');
      return;
    }

    const cleanPhone = form.phone.trim().replace(/[\s.-]/g, '');
    if (!cleanPhone) {
      setNotice('Vui lòng nhập số điện thoại.');
      return;
    }

    // 2. Kiểm tra độ dài và định dạng số điện thoại
    if (!/^(0|\+84)[0-9]{9}$/.test(cleanPhone)) {
      setNotice('Số điện thoại không đúng định dạng hoặc độ dài (yêu cầu 10 chữ số, ví dụ 0912345678).');
      return;
    }

    // 3. Kiểm tra định dạng email (nếu có nhập)
    const email = form.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) {
      setNotice('Email không đúng định dạng (ví dụ: khachhang@example.com).');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullName,
        phone: cleanPhone,
        email: email || null,
        address: form.address.trim() || null,
        district: form.district.trim() || null,
        city: form.city.trim() || null,
      };

      if (editing?.id) {
        await api.put(`/customers/${editing.id}`, payload);
        toast.success('Cập nhật thông tin thành công');
      } else {
        await api.post('/customers', payload);
        toast.success('Thêm khách hàng thành công');
      }
      setFormModalOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      const resp = err.response?.data;
      const status = err.response?.status;
      const message = resp?.message || resp?.fieldErrors?.email || resp?.fieldErrors?.phone || err.message;

      if (message && (message.includes('đã tồn tại') || message.includes('đã có trong hệ thống') || message.includes('đã được sử dụng'))) {
        setNotice(message || 'Khách hàng đã tồn tại.');
      } else if (!status || status >= 500) {
        setNotice('Lỗi kết nối hoặc lỗi hệ thống. Vui lòng thử lại.');
        toast.error('Lỗi kết nối hoặc lỗi hệ thống. Vui lòng thử lại.');
      } else {
        setNotice(message || 'Thông tin không hợp lệ. Vui lòng nhập lại.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function openDetail(id) {
    try {
      const [cRes, oRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/customers/${id}/orders`, { params: { page: 0, size: 10 } }),
      ]);
      setDetail(cRes.data);
      setDetailOrders(oRes.data?.content || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không tải được thông tin khách hàng.'));
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <h1>{salesMode ? 'Tra cứu khách hàng' : 'Khách hàng'}</h1>
          <p className="muted-text">
            Hạng thành viên: SILVER ≥ 5 triệu · GOLD ≥ 20 triệu · VIP ≥ 50 triệu tổng mua.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Thêm khách hàng
        </button>
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
                    </button>{' '}
                    <button className="btn btn-primary" onClick={() => openEdit(c)}>
                      Sửa
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

      {formModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card">
            <h2>{editing ? `Cập nhật thông tin: ${editing.fullName}` : 'Thêm khách hàng mới'}</h2>
            <form onSubmit={handleSave} noValidate>
              <div className="field">
                <label htmlFor="edit-fullname">Họ tên *</label>
                <input
                  id="edit-fullname"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Nhập họ và tên khách hàng..."
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="edit-phone">Số điện thoại *</label>
                <input
                  id="edit-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Ví dụ: 0912345678 (10 chữ số)"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="edit-email">Email</label>
                <input
                  id="edit-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Ví dụ: khachhang@example.com (tùy chọn)"
                />
              </div>
              <div className="field">
                <label htmlFor="edit-address">Địa chỉ</label>
                <input
                  id="edit-address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Số nhà, tên đường..."
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="field" style={{ flex: 1 }}>
                  <label htmlFor="edit-city">Tỉnh/Thành phố</label>
                  <select
                    id="edit-city"
                    value={form.city}
                    onChange={handleProvinceChange}
                  >
                    <option value="">— Chọn tỉnh/thành phố —</option>
                    {VN_PROVINCES.map((p) => (
                      <option key={p.name} value={stripPrefix(p.name)}>
                        {p.name}
                      </option>
                    ))}
                    {form.city && !VN_PROVINCES.some((p) => stripPrefix(p.name) === form.city) && (
                      <option value={form.city}>{form.city} (đơn vị cũ)</option>
                    )}
                  </select>
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label htmlFor="edit-ward">Phường/Xã</label>
                  <select
                    id="edit-ward"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    disabled={wardOptions.length === 0 && !form.district}
                  >
                    <option value="">
                      {wardOptions.length === 0 ? '— Chọn tỉnh/thành phố trước —' : '— Chọn phường/xã —'}
                    </option>
                    {wardOptions.map((w) => (
                      <option key={`${w.n}|${w.t}`} value={w.n}>
                        {w.t === 'Xã' ? w.n : `${w.n} (${w.t})`}
                      </option>
                    ))}
                    {form.district && !wardOptions.some((w) => w.n === form.district) && (
                      <option value={form.district}>{form.district} (đơn vị cũ)</option>
                    )}
                  </select>
                </div>
              </div>

              {notice && (
                <div className="alert alert-error" role="alert">
                  <span className="alert-icon"><IconAlertCircle size={18} /></span>
                  <span className="alert-content">{notice}</span>
                  <button
                    type="button"
                    className="alert-close"
                    onClick={() => setNotice('')}
                    aria-label="Đóng thông báo"
                  >
                    <IconX size={15} />
                  </button>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setFormModalOpen(false)}>
                  Huỷ
                </button>
                <button type="submit" className={`btn btn-primary${saving ? ' loading' : ''}`} disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
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

/** 'Thành phố Hà Nội' → 'Hà Nội', 'Tỉnh Cao Bằng' → 'Cao Bằng'. */
function stripPrefix(name) {
  return name.replace(/^(Thành phố|Tỉnh) /, '');
}
