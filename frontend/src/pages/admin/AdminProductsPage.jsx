import { useCallback, useEffect, useState } from 'react';
import { api, getErrorMessage } from '../../services/api';
import { formatVNDText } from '../../utils/format';
import { IconX, IconAlertCircle, IconCheckCircle, IconSearch } from '../../components/Icons';
import { useToast } from '../../context/ToastContext';
import { validateProductSearch } from '../../utils/validators';

/**
 * Quản lý sản phẩm: bảng + tìm kiếm + thêm/sửa (form modal) + xoá mềm.
 * Dùng chung cho ADMIN / SALES_STAFF / WAREHOUSE_STAFF qua props salesMode/warehouseMode.
 * - salesMode: Thu ngân/bán hàng "Truy vấn sản phẩm" theo tên, mã sản phẩm hoặc danh mục.
 * - warehouseMode: Nhân viên kho kiểm tra tồn kho (chỉ đọc).
 * - ADMIN: Quản lý đầy đủ (thêm, sửa, ngừng kinh doanh).
 */
export default function AdminProductsPage({ salesMode = false, warehouseMode = false }) {
  const toast = useToast();
  const isReadOnly = salesMode || warehouseMode;

  const [items, setItems] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeFilter, setActiveFilter] = useState({ q: '', categoryId: '', status: '' });
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState([]);

  const [editing, setEditing] = useState(null); // null = đóng; { ...readOnly: true/false }
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data || [])).catch(() => {});
  }, []);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError('');
    api
      .get('/admin/products', {
        params: {
          q: activeFilter.q || undefined,
          categoryId: activeFilter.categoryId ? Number(activeFilter.categoryId) : undefined,
          status: activeFilter.status || undefined,
          page,
          size: 10,
        },
      })
      .then((res) => {
        if (!alive) return;
        setItems(res.data.content || []);
        setTotalPages(res.data.totalPages || 1);
      })
      .catch((err) => {
        if (alive) {
          const msg = getErrorMessage(err, 'Không tải được danh sách sản phẩm.');
          setError(msg);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [activeFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Xử lý tìm kiếm sản phẩm theo Đặc tả Use Case:
   * - Tiêu chí: tên sản phẩm, mã sản phẩm hoặc danh mục
   * - Luồng phụ 2: Bỏ trống trường tìm kiếm -> "Hệ thống yêu cầu nhập ít nhất một tiêu chí"
   * - Kiểm soát đầu vào 2 lớp: SQLi, XSS, ký tự đặc biệt, độ dài tối đa 100
   */
  function handleSearch(e) {
    if (e) e.preventDefault();
    setSearchError('');

    const trimmed = searchInput.trim();

    // Luồng phụ 2: Người dùng bỏ trống trường tìm kiếm (không nhập tên/mã và không chọn danh mục)
    if (!trimmed && !selectedCategory) {
      setSearchError('Hệ thống yêu cầu nhập ít nhất một tiêu chí');
      return;
    }

    // Kiểm tra tính hợp lệ của dữ liệu đầu vào (Luồng phụ bảo mật)
    if (trimmed) {
      const validation = validateProductSearch(trimmed);
      if (!validation.valid) {
        setSearchError(validation.error);
        return;
      }
    }

    setPage(0);
    setActiveFilter({
      q: trimmed,
      categoryId: selectedCategory,
      status: selectedStatus,
    });
    setSearched(true);
  }

  function handleClearSearch() {
    setSearchInput('');
    setSelectedCategory('');
    setSelectedStatus('');
    setActiveFilter({ q: '', categoryId: '', status: '' });
    setSearched(false);
    setSearchError('');
    setPage(0);
  }

  async function handleDelete(id) {
    if (!window.confirm('Chuyển sản phẩm này sang ngừng kinh doanh?')) return;
    setError('');
    try {
      await api.delete(`/products/${id}`);
      toast.success('Đã chuyển sản phẩm sang ngừng kinh doanh.');
      load();
    } catch (err) {
      const msg = getErrorMessage(err, 'Ngừng kinh doanh sản phẩm thất bại.');
      setError(msg);
      toast.error(msg);
    }
  }

  function openCreate() {
    setError('');
    setEditing({
      code: '', name: '', categoryId: '', price: '', costPrice: '', oldPrice: '',
      description: '', imageUrl: '', sku: '', material: '', fit: '', season: '',
      careInstructions: '', minStock: 10, targetGender: 'UNISEX', badge: '',
      variants: [],
      readOnly: false,
    });
  }

  function openEdit(p) {
    setError('');
    setEditing({ ...p, variants: p.variants || [], readOnly: false });
  }

  function openView(p) {
    setError('');
    setEditing({ ...p, variants: p.variants || [], readOnly: true });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (editing?.readOnly) {
      setEditing(null);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...editing,
        price: Number(editing.price),
        costPrice: editing.costPrice ? Number(editing.costPrice) : undefined,
        oldPrice: editing.oldPrice ? Number(editing.oldPrice) : undefined,
        categoryId: Number(editing.categoryId),
        minStock: Number(editing.minStock || 0),
      };
      if (editing.id) {
        await api.put(`/products/${editing.id}`, payload);
        toast.success('Cập nhật sản phẩm thành công.');
      } else {
        await api.post('/products', payload);
        toast.success('Tạo mới sản phẩm thành công.');
      }
      setEditing(null);
      load();
    } catch (err) {
      const msg = getErrorMessage(err, 'Lưu thông tin sản phẩm thất bại.');
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  // ===== Biến thể trong form =====
  function addVariant() {
    setEditing({
      ...editing,
      variants: [...(editing.variants || []), { size: '', color: '', stock: 0 }],
    });
  }

  function updateVariant(idx, patch) {
    setEditing({
      ...editing,
      variants: editing.variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)),
    });
  }

  function removeVariant(idx) {
    setEditing({
      ...editing,
      variants: editing.variants.filter((_, i) => i !== idx),
    });
  }

  const setField = (key) => (e) => setEditing({ ...editing, [key]: e.target.value });

  const pageTitle = warehouseMode
    ? 'Tồn kho sản phẩm'
    : salesMode
      ? 'Truy vấn sản phẩm'
      : 'Quản lý sản phẩm';

  const pageSubtitle = warehouseMode
    ? 'Theo dõi số lượng tồn kho tổng và chi tiết từng biến thể kích thước/màu sắc.'
    : salesMode
      ? 'Tra cứu sản phẩm theo tên, mã sản phẩm hoặc danh mục phục vụ tư vấn bán hàng.'
      : 'Thêm mới, sửa đổi thông tin, thiết lập giá và quản lý danh mục sản phẩm.';

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <h1>{pageTitle}</h1>
          <p className="muted-text">{pageSubtitle}</p>
        </div>
        {!isReadOnly && (
          <button className="btn btn-primary" onClick={openCreate}>+ Thêm sản phẩm</button>
        )}
      </header>

      <section className="admin-toolbar">
        <form
          onSubmit={handleSearch}
          noValidate
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', width: '100%' }}
        >
          <div style={{ flex: '1 1 240px', minWidth: 200 }}>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (searchError) setSearchError('');
              }}
              placeholder="Tìm theo tên hoặc mã sản phẩm..."
              aria-label="Tìm kiếm sản phẩm"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ minWidth: 160 }}>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                if (searchError) setSearchError('');
              }}
              aria-label="Chọn danh mục sản phẩm"
              style={{ width: '100%' }}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: 150 }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Trạng thái kinh doanh"
              style={{ width: '100%' }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang bán</option>
              <option value="INACTIVE">Ngừng bán</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ minHeight: 40, padding: '0 18px' }}>
            <IconSearch size={16} style={{ marginRight: 6 }} /> Tìm kiếm
          </button>

          {(searched || searchInput || selectedCategory || selectedStatus || searchError) && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClearSearch}
              style={{ minHeight: 40, padding: '0 14px' }}
            >
              Xóa tìm kiếm
            </button>
          )}
        </form>
      </section>

      {/* Luồng phụ 2 hoặc lỗi kiểm tra đầu vào */}
      {searchError && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>
          <span className="alert-icon"><IconAlertCircle size={18} /></span>
          <span className="alert-content">{searchError}</span>
          <button
            type="button"
            className="alert-close"
            onClick={() => setSearchError('')}
            aria-label="Đóng thông báo"
          >
            <IconX size={15} />
          </button>
        </div>
      )}

      {/* Luồng phụ 1: Không tìm thấy sản phẩm phù hợp */}
      {!searchError && searched && !loading && items.length === 0 && (
        <div className="alert alert-warning" role="alert" style={{ marginBottom: 16 }}>
          <span className="alert-icon"><IconAlertCircle size={18} /></span>
          <span className="alert-content">Không tìm thấy sản phẩm phù hợp</span>
        </div>
      )}

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

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã SP</th><th>Tên</th><th>Danh mục</th><th>Giá bán</th>
                <th>Tồn kho</th><th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.code}</strong></td>
                  <td>{p.name}</td>
                  <td>{p.categoryName || '—'}</td>
                  <td>{formatVNDText(p.price)}</td>
                  <td className={p.lowStock ? 'text-warn' : ''}>
                    {p.stock} {p.lowStock && <small>(Sắp hết)</small>}
                  </td>
                  <td>
                    {p.status === 'ACTIVE'
                      ? <span className="badge badge-green">Đang bán</span>
                      : <span className="badge badge-gray">Ngừng bán</span>}
                  </td>
                  <td className="row-actions">
                    {isReadOnly ? (
                      <button className="btn btn-outline" onClick={() => openView(p)}>
                        Chi tiết
                      </button>
                    ) : (
                      <>
                        <button className="btn btn-outline" onClick={() => openEdit(p)}>Sửa</button>
                        {p.status === 'ACTIVE' && (
                          <button className="btn btn-ghost text-danger" onClick={() => handleDelete(p.id)}>Ngừng bán</button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted-text text-center" style={{ padding: '24px 0' }}>
                    {searched ? 'Không tìm thấy sản phẩm phù hợp' : 'Không có dữ liệu sản phẩm.'}
                  </td>
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

      {/* Modal thêm/sửa/chi tiết */}
      {editing !== null && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
          <div className="modal card modal-wide">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 id="product-form-title" style={{ margin: 0 }}>
                {editing.readOnly
                  ? `Chi tiết sản phẩm: ${editing.name}`
                  : editing.id
                    ? 'Cập nhật sản phẩm'
                    : 'Thêm sản phẩm mới'}
              </h2>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setEditing(null)}
                aria-label="Đóng"
                style={{ padding: 6 }}
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-grid-2col">
                <div className="field">
                  <label htmlFor="pf-code">Mã SP *</label>
                  <input
                    id="pf-code"
                    required
                    value={editing.code}
                    disabled={editing.readOnly}
                    onChange={setField('code')}
                  />
                </div>
                <div className="field">
                  <label htmlFor="pf-name">Tên sản phẩm *</label>
                  <input
                    id="pf-name"
                    required
                    value={editing.name}
                    disabled={editing.readOnly}
                    onChange={setField('name')}
                  />
                </div>
                <div className="field">
                  <label htmlFor="pf-category">Danh mục *</label>
                  <select
                    id="pf-category"
                    required
                    value={editing.categoryId}
                    disabled={editing.readOnly}
                    onChange={setField('categoryId')}
                  >
                    <option value="">— Chọn danh mục —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="pf-gender">Đối tượng</label>
                  <select
                    id="pf-gender"
                    value={editing.targetGender}
                    disabled={editing.readOnly}
                    onChange={setField('targetGender')}
                  >
                    <option value="UNISEX">Unisex</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="pf-price">Giá bán * (₫)</label>
                  <input
                    id="pf-price"
                    type="number"
                    required
                    min="0"
                    value={editing.price}
                    disabled={editing.readOnly}
                    onChange={setField('price')}
                  />
                </div>
                <div className="field">
                  <label htmlFor="pf-cost">Giá vốn (₫)</label>
                  <input
                    id="pf-cost"
                    type="number"
                    min="0"
                    value={editing.costPrice ?? ''}
                    disabled={editing.readOnly}
                    onChange={setField('costPrice')}
                  />
                </div>
                <div className="field">
                  <label htmlFor="pf-old">Giá trước giảm (₫)</label>
                  <input
                    id="pf-old"
                    type="number"
                    min="0"
                    value={editing.oldPrice ?? ''}
                    disabled={editing.readOnly}
                    onChange={setField('oldPrice')}
                  />
                </div>
                <div className="field">
                  <label htmlFor="pf-minstock">Tồn tối thiểu</label>
                  <input
                    id="pf-minstock"
                    type="number"
                    min="0"
                    value={editing.minStock ?? ''}
                    disabled={editing.readOnly}
                    onChange={setField('minStock')}
                  />
                </div>
                <div className="field">
                  <label htmlFor="pf-image">URL hình ảnh</label>
                  <input
                    id="pf-image"
                    value={editing.imageUrl ?? ''}
                    disabled={editing.readOnly}
                    onChange={setField('imageUrl')}
                    placeholder="https://..."
                  />
                </div>
                <div className="field">
                  <label htmlFor="pf-material">Chất liệu</label>
                  <input
                    id="pf-material"
                    value={editing.material ?? ''}
                    disabled={editing.readOnly}
                    onChange={setField('material')}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="pf-desc">Mô tả</label>
                <textarea
                  id="pf-desc"
                  rows={3}
                  value={editing.description ?? ''}
                  disabled={editing.readOnly}
                  onChange={setField('description')}
                />
              </div>

              <fieldset className="variants-fieldset">
                <legend>Biến thể (size × màu × tồn kho)</legend>
                {(editing.variants || []).map((v, idx) => (
                  <div key={idx} className="variant-row">
                    <input
                      placeholder="Size (S/M/L)"
                      value={v.size}
                      disabled={editing.readOnly}
                      onChange={(e) => updateVariant(idx, { size: e.target.value })}
                      aria-label="Size"
                    />
                    <input
                      placeholder="Màu (Đen/Trắng)"
                      value={v.color}
                      disabled={editing.readOnly}
                      onChange={(e) => updateVariant(idx, { color: e.target.value })}
                      aria-label="Màu"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Tồn"
                      value={v.stock}
                      disabled={editing.readOnly}
                      onChange={(e) => updateVariant(idx, { stock: e.target.value })}
                      aria-label="Tồn kho biến thể"
                    />
                    {!editing.readOnly && (
                      <button
                        type="button"
                        className="btn btn-ghost text-danger"
                        onClick={() => removeVariant(idx)}
                        aria-label="Xóa biến thể"
                      >
                        <IconX size={15} />
                      </button>
                    )}
                  </div>
                ))}
                {!editing.readOnly && (
                  <button type="button" className="btn btn-outline" onClick={addVariant}>
                    + Thêm dòng biến thể
                  </button>
                )}
                {editing.readOnly && (editing.variants || []).length === 0 && (
                  <p className="muted-text" style={{ margin: '8px 0' }}>Chưa có biến thể chi tiết.</p>
                )}
              </fieldset>

              <div className="modal-actions">
                {editing.readOnly ? (
                  <button type="button" className="btn btn-primary" onClick={() => setEditing(null)}>
                    Đóng
                  </button>
                ) : (
                  <>
                    <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                      Huỷ
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

