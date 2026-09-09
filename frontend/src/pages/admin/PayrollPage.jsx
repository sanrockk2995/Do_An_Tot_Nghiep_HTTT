import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatVNDText, ROLE_LABELS } from '../../utils/format';
import { IconAlertCircle, IconX } from '../../components/Icons';

/** Chọn tháng hiện tại làm mặc định. */
function currentMonth() {
  const now = new Date();
  return { thang: now.getMonth() + 1, nam: now.getFullYear() };
}

/**
 * Bảng lương nhân viên — UC SRS "Bảng lương nhân viên" (kế toán/quản lý):
 * chọn tháng → xem bảng lương → cập nhật hệ số/phụ cấp/thưởng/khấu trừ.
 */
export default function PayrollPage() {
  const toast = useToast();
  const init = currentMonth();
  const [thang, setThang] = useState(init.thang);
  const [nam, setNam] = useState(init.nam);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Dòng đang chỉnh sửa inline: { userId, heSo, phuCap, thuong, khauTru }
  const [editing, setEditing] = useState(null);
  const [savingId, setSavingId] = useState(null);

  async function fetchPayroll(t = thang, n = nam) {
    if (n > init.nam || (n === init.nam && t > init.thang)) {
      setError(`Không thể xem bảng lương kỳ tương lai (tối đa tháng ${init.thang}/${init.nam}).`);
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/payrolls', { params: { thang: t, nam: n } });
      setRows(res.data || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Không tải được bảng lương.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPayroll(); /* eslint-disable-next-line */ }, []);

  function startEdit(row) {
    if (row.trangThai === 'DA_DUYET') return;
    setEditing({
      userId: row.userId,
      heSo: row.heSo ?? 1,
      phuCap: row.phuCap ?? 0,
      thuong: row.thuong ?? 0,
      khauTru: row.khauTru ?? 0,
    });
  }

  async function saveEdit(userId) {
    setSavingId(userId);
    try {
      await api.put(`/payrolls/${userId}`, editing, { params: { thang, nam } });
      setEditing(null);
      await fetchPayroll();
      toast.success('Cập nhật bảng lương thành công.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Cập nhật thất bại.'));
    } finally {
      setSavingId(null);
    }
  }

  async function approve(row) {
    if (!window.confirm(`Duyệt lương tháng ${thang}/${nam} cho ${row.tenNhanVien}?`)) return;
    try {
      await api.put(`/payrolls/${row.id}/approve`);
      await fetchPayroll();
      toast.success(`Đã duyệt lương cho ${row.tenNhanVien}.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Duyệt thất bại.'));
    }
  }

  async function exportExcel() {
    if (nam > init.nam || (nam === init.nam && thang > init.thang)) {
      toast.warning(`Không thể xuất bảng lương kỳ tương lai (tối đa tháng ${init.thang}/${init.nam}).`);
      return;
    }
    try {
      const res = await api.get('/payrolls/export', {
        params: { thang, nam },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bang-luong-${thang}-${nam}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Không xuất được file Excel.');
    }
  }

  const tongQuy = rows.reduce((sum, r) => sum + Number(r.tongLuong || 0), 0);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Bảng lương nhân viên</h1>
        <p className="muted-text">Xem và cập nhật hệ số, phụ cấp, thưởng, khấu trừ theo tháng.</p>
      </header>

      <form
        className="card admin-toolbar"
        onSubmit={(e) => { e.preventDefault(); fetchPayroll(); }}
      >
        <div className="field-inline">
          <label htmlFor="pl-thang">Tháng:</label>
          <select id="pl-thang" value={thang} onChange={(e) => setThang(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const isFuture = nam === init.nam && m > init.thang;
              return (
                <option key={m} value={m} disabled={isFuture}>
                  {m} {isFuture ? '(Chưa đến kỳ)' : ''}
                </option>
              );
            })}
          </select>
        </div>
        <div className="field-inline">
          <label htmlFor="pl-nam">Năm:</label>
          <input
            id="pl-nam"
            type="number"
            min={2020}
            max={init.nam}
            value={nam}
            onChange={(e) => {
              const val = Number(e.target.value);
              setNam(val);
              if (val >= init.nam && thang > init.thang) {
                setThang(init.thang);
              }
            }}
            style={{ width: 100 }}
          />
        </div>
        <button type="submit" className="btn btn-primary">Xem bảng lương</button>
        <button type="button" className="btn btn-ghost" onClick={exportExcel}>
          ⬇ Xuất Excel
        </button>
      </form>

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

      <section className="card" style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : rows.length === 0 ? (
          <p className="muted-text">Không có nhân viên nào.</p>
        ) : (
          <>
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Vai trò</th>
                  <th>Lương cơ bản</th>
                  <th>Hệ số</th>
                  <th>Phụ cấp</th>
                  <th>Thưởng</th>
                  <th>Khấu trừ</th>
                  <th>Thực nhận</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isEditing = editing?.userId === row.userId;
                  const locked = row.trangThai === 'DA_DUYET';
                  return (
                    <tr key={row.userId}>
                      <td>
                        <strong>{row.tenNhanVien}</strong>
                        <div className="muted-text" style={{ fontSize: 12 }}>{row.maNv}</div>
                      </td>
                      <td>{ROLE_LABELS[row.chucVu] || row.chucVu}</td>
                      <td>{formatVNDText(row.luongCoBan)}</td>
                      <td>
                        {isEditing ? (
                          <input type="number" min={0} max={20} step={0.1} style={{ width: 70 }}
                            value={editing.heSo}
                            onChange={(e) => setEditing({ ...editing, heSo: e.target.value })} />
                        ) : Number(row.heSo).toFixed(2)}
                      </td>
                      <td>
                        {isEditing ? (
                          <input type="number" min={0} step={10000} style={{ width: 110 }}
                            value={editing.phuCap}
                            onChange={(e) => setEditing({ ...editing, phuCap: e.target.value })} />
                        ) : formatVNDText(row.phuCap)}
                      </td>
                      <td>
                        {isEditing ? (
                          <input type="number" min={0} step={10000} style={{ width: 110 }}
                            value={editing.thuong}
                            onChange={(e) => setEditing({ ...editing, thuong: e.target.value })} />
                        ) : formatVNDText(row.thuong)}
                      </td>
                      <td>
                        {isEditing ? (
                          <input type="number" min={0} step={10000} style={{ width: 110 }}
                            value={editing.khauTru}
                            onChange={(e) => setEditing({ ...editing, khauTru: e.target.value })} />
                        ) : formatVNDText(row.khauTru)}
                      </td>
                      <td><strong>{formatVNDText(row.tongLuong)}</strong></td>
                      <td>
                        <span className={`badge ${locked ? 'badge-success' : 'badge-warning'}`}>
                          {locked ? 'Đã duyệt' : 'Nháp'}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {locked ? null : isEditing ? (
                          <>
                            <button type="button" className="btn btn-primary btn-sm"
                              disabled={savingId === row.userId}
                              onClick={() => saveEdit(row.userId)}>
                              Cập nhật
                            </button>{' '}
                            <button type="button" className="btn btn-ghost btn-sm"
                              onClick={() => setEditing(null)}>Huỷ</button>
                          </>
                        ) : (
                          <>
                            <button type="button" className="btn btn-ghost btn-sm"
                              onClick={() => startEdit(row)}>Sửa</button>{' '}
                            <button type="button" className="btn btn-primary btn-sm"
                              onClick={() => approve(row)}>Duyệt</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={7}><strong>Tổng quỹ lương tháng {thang}/{nam}</strong></td>
                  <td colSpan={3}><strong>{formatVNDText(tongQuy)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </>
        )}
      </section>
    </div>
  );
}
