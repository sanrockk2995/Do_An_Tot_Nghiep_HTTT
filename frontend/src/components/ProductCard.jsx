import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatVNDText } from '../utils/format';
import { IconHeart, IconStar } from './Icons';

/** Thẻ sản phẩm dùng chung cho lưới trang chủ / danh sách / tìm kiếm. */
export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { inWishlist, toggleWishlist } = useCart();
  const navigate = useNavigate();

  function handleWishlistClick(e) {
    e.preventDefault();
    if (!user || user.role !== 'CUSTOMER') {
      navigate('/dang-nhap');
      return;
    }
    toggleWishlist(product.id);
  }

  return (
    <Link to={`/san-pham/chi-tiet/${product.id}`} className="product-card">
      <div className="product-thumb">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-placeholder" aria-hidden="true"><IconHeart size={64} /></div>
        )}
        {product.badge && (
          <span className={`badge ${product.badge === 'SALE' ? 'badge-red' : 'badge-pink'} badge-float`}>
            {product.badge}
          </span>
        )}
        <button
          className={`wishlist-btn ${inWishlist(product.id) ? 'active' : ''}`}
          onClick={handleWishlistClick}
          aria-label={inWishlist(product.id) ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
        >
          <IconHeart filled={inWishlist(product.id)} size={18} />
        </button>
      </div>
      <div className="product-info">
        {product.categoryName && (
          <div className="product-category-line">{product.categoryName}</div>
        )}
        <h3 className="product-name">{product.name}</h3>
        <div className="product-price-row">
          <span className="product-price">{formatVNDText(product.price)}</span>
          {product.oldPrice && (
            <span className="product-old-price">{formatVNDText(product.oldPrice)}</span>
          )}
        </div>
        {product.rating > 0 && (
          <div className="product-rating">
            <IconStar size={13} /> {Number(product.rating).toFixed(1)}
            {product.reviewCount > 0 && <span className="muted-text"> ({product.reviewCount})</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
