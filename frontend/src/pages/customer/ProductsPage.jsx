import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import ProductCard from '../../components/ProductCard';

/** Danh sách sản phẩm công khai — hỗ trợ lọc danh mục, giới tính, giá và sắp xếp. */
export default function ProductsPage() {
  const { slugCategory } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentCategory = slugCategory
    ? categories.find((c) => c.slug === slugCategory)
    : undefined;

  useEffect(() => {
    api
      .get('/categories')
      .then((res) => {
        const activeList = (res.data || []).filter((c) => c.isActive !== false);
        setCategories(activeList);
      })
      .catch(() => {});
  }, []);

  // Reset về trang 1 khi đổi danh mục / bộ lọc
  useEffect(() => {
    setPage(0);
  }, [slugCategory, searchParams]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');

    const params = {
      page,
      size: 12,
      sort: searchParams.get('sap-xep') || 'newest',
    };
    if (currentCategory) params.categoryId = currentCategory.id;
    if (searchParams.get('gioi-tinh')) params.gender = searchParams.get('gioi-tinh');
    if (searchParams.get('tu-gia')) params.minPrice = searchParams.get('tu-gia');
    if (searchParams.get('den-gia')) params.maxPrice = searchParams.get('den-gia');

    api
      .get('/products', { params })
      .then((res) => {
        if (!alive) return;
        setProducts(res.data.content || []);
        setTotalPages(res.data.totalPages || 1);
      })
      .catch(() => {
        if (alive) setError('Không tải được sản phẩm. Vui lòng thử lại.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [currentCategory?.id, searchParams, page]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <div className="container section products-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span aria-hidden="true"> / </span>
        <span>{currentCategory ? currentCategory.name : 'Tất cả sản phẩm'}</span>
      </nav>

      <div className="page-head">
        <h1>{currentCategory ? currentCategory.name : 'Tất cả sản phẩm'}</h1>
        <div className="field-inline">
          <label htmlFor="sort-select">Sắp xếp:</label>
          <select
            id="sort-select"
            value={searchParams.get('sap-xep') || 'newest'}
            onChange={(e) => updateParam('sap-xep', e.target.value === 'newest' ? '' : e.target.value)}
          >
            <option value="newest">Mới nhất</option>
            <option value="price-asc">Giá thấp → cao</option>
            <option value="price-desc">Giá cao → thấp</option>
            <option value="name">Tên A–Z</option>
            <option value="rating">Đánh giá cao</option>
          </select>
        </div>
      </div>

      <div className="products-layout">
        <aside className="filters-panel" aria-label="Bộ lọc sản phẩm">
          <h3>Danh mục</h3>
          <ul className="filter-list">
            <li>
              <Link to="/products" className={!slugCategory ? 'active' : ''}>Tất cả</Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/products/${c.slug}`}
                  className={currentCategory?.id === c.id ? 'active' : ''}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>

          <h3>Đối tượng</h3>
          <ul className="filter-list">
            <li>
              <button
                className={`filter-btn ${!searchParams.get('gioi-tinh') ? 'active' : ''}`}
                onClick={() => updateParam('gioi-tinh', '')}
              >
                Tất cả
              </button>
            </li>
            <li>
              <button
                className={`filter-btn ${searchParams.get('gioi-tinh') === 'MALE' ? 'active' : ''}`}
                onClick={() => updateParam('gioi-tinh', 'MALE')}
              >
                Nam
              </button>
            </li>
            <li>
              <button
                className={`filter-btn ${searchParams.get('gioi-tinh') === 'FEMALE' ? 'active' : ''}`}
                onClick={() => updateParam('gioi-tinh', 'FEMALE')}
              >
                Nữ
              </button>
            </li>
            <li>
              <button
                className={`filter-btn ${searchParams.get('gioi-tinh') === 'UNISEX' ? 'active' : ''}`}
                onClick={() => updateParam('gioi-tinh', 'UNISEX')}
              >
                Unisex
              </button>
            </li>
          </ul>

          <h3>Khoảng giá</h3>
          <ul className="filter-list">
            <li><button className="filter-btn" onClick={() => { updateParam('tu-gia', ''); updateParam('den-gia', ''); }}>Tất cả</button></li>
            <li><button className="filter-btn" onClick={() => { updateParam('tu-gia', '0'); updateParam('den-gia', '300000'); }}>Dưới 300.000₫</button></li>
            <li><button className="filter-btn" onClick={() => { updateParam('tu-gia', '300000'); updateParam('den-gia', '600000'); }}>300k – 600k</button></li>
            <li><button className="filter-btn" onClick={() => { updateParam('tu-gia', '600000'); updateParam('den-gia', ''); }}>Trên 600k</button></li>
          </ul>
        </aside>

        <div className="products-results">
          {error && <div className="alert alert-error">{error}</div>}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}><div className="spinner" /></div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <p>Không có sản phẩm phù hợp bộ lọc.</p>
              <Link to="/san-pham" className="btn btn-outline">Xem tất cả</Link>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav className="pagination" aria-label="Phân trang">
                  <button disabled={page === 0} onClick={() => setPage(page - 1)}>← Trước</button>
                  <span>Trang {page + 1} / {totalPages}</span>
                  <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Sau →</button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
