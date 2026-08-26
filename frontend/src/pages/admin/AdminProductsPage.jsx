import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { formatVNDText } from '../../utils/format';
import { IconX } from '../../components/Icons';

/**
 * Quản lý sản phẩm: bảng + tìm kiếm + thêm/sửa (form modal) + xoá mềm.
 * Dùng chung cho ADMIN / SALES_STAFF / WAREHOUSE_STAFF qua props salesMode/warehouseMode.
 */
export default function AdminProductsPage({ salesMode = false, warehouseMode = false }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState([]);

  const [editing, setEditing] = useState(null); // null = đóng; {} = thêm mới; {...} = sửa
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data || [])).catch(() => {});
  }, []);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError('');
    api
      .get('/admin/products', { params: { q, status, page, size: 10 } })
      .then((res) => {
        if (!alive) return;
        setItems(res.data.content || []);
        setTotalPages(res.data.totalPages || 1);
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Không tải được danh sách sản phẩm.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [q, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id) {
    if (!window.confirm('Chuyển sản phẩm này sang ngừng kinh doanh?')) return;
    try {
      await api.delete(`/products/${id}`);
      setMessage('Đã chuyển sản phẩm sang ngừng kinh doanh.');
      load();
    } catch (err) {
      setError(err.message || 'Xoá thất bại.');
    }
  }

  function openCreate() {
    setEditing({
      code: '', name: '', categoryId: '', price: '', costPrice: '', oldPrice: '',
      description: '', imageUrl: '', sku: '', material: '', fit: '', season: '',
      careInstructions: '', minStock: 10, targetGender: 'UNISEX', badge: '',
      variants: [],
    });
  }

  function openEdit(p) {
    setEditing({ ...p, variants: p.variants || [] });
  }

  async function handleSave(e) {
    e.preventDefault();
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
        setMessage('Đã cập nhật sản phẩm.');
      } else {
        await api.post('/products', payload);
        setMessage('Đã tạo mới sản phẩm.');
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message || 'Lưu thất bại.');
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

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>{warehouseMode ? 'Tồn kho sản phẩm' : 'Sản phẩm'}</h1>
        {!warehouseMode && (
          <button className="btn btn-primary" onClick={openCreate}>+ Thêm sản phẩm</button>
        )}
      </header>

      <section className="admin-toolbar">
        <input
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(0); }}
          placeholder="Tìm theo tên hoặc mã SP..."
          aria-label="Tìm kiếm sản phẩm"
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang bán</option>
          <option value="INACTIVE">Ngừng bán</option>
        </select>
      </section>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {message && <div className="alert alert-success" role="status">{message}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã SP</th><th>Tên</th><th>Danh mục</th><th>Giá bán</th>
                <th>Tồn kho</th><th>Trạng thái</th>
                {!warehouseMode && <th>Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>{p.code}</td>
                  <td>{p.name}</td>
                  <td>{p.categoryName || '—'}</td>
                  <td>{formatVNDText(p.price)}</td>
                  <td className={p.lowStock ? 'text-warn' : ''}>{p.stock}</td>
                  <td>
                    {p.status === 'ACTIVE'
                      ? <span className="badge badge-green">Đang bán</span>
                      : <span className="badge badge-gray">Ngừng bán</span>}
                  </td>
                  {!warehouseMode && (
                    <td className="row-actions">
                      <button className="btn btn-outline" onClick={() => openEdit(p)}>Sửa</button>
                      {p.status === 'ACTIVE' && (
                        <button className="btn btn-ghost text-danger" onClick={() => handleDelete(p.id)}>Ngừng bán</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={warehouseMode ? 6 : 7} className="muted-text">Không có dữ liệu.</td></tr>
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

      {/* Modal thêm/sửa */}
      {editing !== null && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
          <div className="modal card">
            <h2 id="product-form-title">
              {editing.id ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
            </h2>
            <form onSubmit={handleSave}>
              <div className="form-grid-2col">
                <div className="field">
                  <label htmlFor="pf-code">Mã SP *</label>
                  <input id="pf-code" required value={editing.code} onChange={setField('code')} />
                </div>
                <div className="field">
                  <label htmlFor="pf-name">Tên sản phẩm *</label>
                  <input id="pf-name" required value={editing.name} onChange={setField('name')} />
                </div>
                <div className="field">
                  <label htmlFor="pf-category">Danh mục *</label>
                  <select id="pf-category" required value={editing.categoryId} onChange={setField('categoryId')}>
                    <option value="">— Chọn danh mục —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="pf-gender">Đối tượng</label>
                  <select id="pf-gender" value={editing.targetGender} onChange={setField('targetGender')}>
                    <option value="UNISEX">Unisex</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="pf-price">Giá bán * (₫)</label>
                  <input id="pf-price" type="number" required min="0" value={editing.price} onChange={setField('price')} />
                </div>
                <div className="field">
                  <label htmlFor="pf-cost">Giá vốn (₫)</label>
                  <input id="pf-cost" type="number" min="0" value={editing.costPrice ?? ''} onChange={setField('costPrice')} />
                </div>
                <div className="field">
                  <label htmlFor="pf-old">Giá trước giảm (₫)</label>
                  <input id="pf-old" type="number" min="0" value={editing.oldPrice ?? ''} onChange={setField('oldPrice')} />
                </div>
                <div className="field">
                  <label htmlFor="pf-minstock">Tồn tối thiểu</label>
                  <input id="pf-minstock" type="number" min="0" value={editing.minStock ?? ''} onChange={setField('minStock')} />
                </div>
                <div className="field">
                  <label htmlFor="pf-image">URL hình ảnh</label>
                  <input id="pf-image" value={editing.imageUrl ?? ''} onChange={setField('imageUrl')} placeholder="https://..." />
                </div>
                <div className="field">
                  <label htmlFor="pf-material">Chất liệu</label>
                  <input id="pf-material" value={editing.material ?? ''} onChange={setField('material')} />
                </div>
              </div>

              <div className="field">
                <label htmlFor="pf-desc">Mô tả</label>
                <textarea id="pf-desc" rows={3} value={editing.description ?? ''} onChange={setField('description')} />
              </div>

              <fieldset className="variants-fieldset">
                <legend>Biến thể (size × màu × tồn kho)</legend>
                {(editing.variants || []).map((v, idx) => (
                  <div key={idx} className="variant-row">
                    <input placeholder="Size (S/M/L)" value={v.size}
                      onChange={(e) => updateVariant(idx, { size: e.target.value })} aria-label="Size" />
                    <input placeholder="Màu (Đen/Trắng)" value={v.color}
                      onChange={(e) => updateVariant(idx, { color: e.target.value })} aria-label="Màu" />
                    <input type="number" min="0" placeholder="Tồn" value={v.stock}
                      onChange={(e) => updateVariant(idx, { stock: e.target.value })} aria-label="Tồn kho biến thể" />
                    <button type="button" className="btn btn-ghost text-danger" onClick={() => removeVariant(idx)} aria-label="Xóa biến thể"><IconX size={15} /></button>
                  </div>
                ))}
                <button type="button" className="btn btn-outline" onClick={addVariant}>+ Thêm dòng biến thể</button>
              </fieldset>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Huỷ</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
