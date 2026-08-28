import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { formatVNDText } from '../../utils/format';
import { useCart } from '../../context/CartContext';
import { IconHeart, IconStar } from '../../components/Icons';

/** Danh sách sản phẩm yêu thích của khách hàng (dữ liệu phẳng từ backend). */
export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toggleWishlist } = useCart();

  useEffect(() => {
    let alive = true;
    api
      .get('/wishlist-items')
      .then((res) => {
        if (!alive) return;
        setItems(res.data || []);
      })
      .catch(() => {
        if (alive) setError('Không tải được danh sách yêu thích.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="container section">
      <h1>Sản phẩm yêu thích</h1>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" />
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có sản phẩm nào trong danh sách yêu thích.</p>
          <Link to="/products" className="btn btn-primary">Khám phá ngay</Link>
        </div>
      ) : (
        <div className="product-grid">
          {items.map((w) => (
            <div key={w.id ?? w.productId} className="product-card">
              <Link to={`/products/detail/${w.productId}`} className="product-thumb">
                {w.imageUrl ? (
                  <img src={w.imageUrl} alt={w.name} loading="lazy" />
                ) : (
                  <div className="product-placeholder" aria-hidden="true"><IconHeart size={64} /></div>
                )}
              </Link>
              <div className="product-info">
                <h3 className="product-name">
                  <Link to={`/products/detail/${w.productId}`}>{w.name}</Link>
                </h3>
                <div className="product-price-row">
                  <span className="product-price">{formatVNDText(w.price)}</span>
                  {w.oldPrice && <span className="product-old-price">{formatVNDText(w.oldPrice)}</span>}
                </div>
                {w.rating > 0 && (
                  <div className="product-rating"><IconStar size={13} /> {Number(w.rating).toFixed(1)}</div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={() =>
                      (window.location.href = `/products/detail/${w.productId}`)
                    }
                  >
                    Chọn size/màu
                  </button>
                  <button
                    className="btn btn-ghost text-danger"
                    onClick={() => {
                      toggleWishlist(w.productId).then(() =>
                        setItems((prev) => prev.filter((x) => x.productId !== w.productId))
                      );
                    }}
                    aria-label={`Bỏ yêu thích ${w.name}`}
                  >
                    <IconHeart filled size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
