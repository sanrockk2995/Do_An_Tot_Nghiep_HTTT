import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import ProductCard from '../../components/ProductCard';

/** Trang kết quả tìm kiếm sản phẩm theo từ khóa. */
export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';

  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    api
      .get('/products/search', { params: { q, page, size: 12 } })
      .then((res) => {
        if (!alive) return;
        setProducts(res.data.content || []);
        setTotalPages(res.data.totalPages || 1);
      })
      .catch(() => {
        if (alive) setError('Có lỗi khi tìm kiếm. Vui lòng thử lại.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [q, page]);

  return (
    <div className="container section">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span aria-hidden="true"> / </span>
        <span>Tìm kiếm</span>
      </nav>

      <h1>Kết quả cho “{q}”</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" />
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <p>Không tìm thấy sản phẩm phù hợp với từ khóa.</p>
          <Link to="/products" className="btn btn-outline">Xem tất cả sản phẩm →</Link>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="pagination" aria-label="Phân trang">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>← Trước</button>
          <span>Trang {page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Sau →</button>
        </nav>
      )}
    </div>
  );
}
