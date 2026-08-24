import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { formatVNDText, formatDateTime } from '../../utils/format';
import {
  IconHeart, IconStar, IconCartAdd, IconCheckCircle,
} from '../../components/Icons';

/** Trang chi tiết sản phẩm: chọn biến thể, thêm giỏ hàng, xem/đăng đánh giá. */
export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, toggleWishlist, inWishlist } = useCart();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/products/${id}/reviews`).catch(() => ({ data: [] })),
    ])
      .then(([pRes, rRes]) => {
        if (!alive) return;
        setProduct(pRes.data);
        setReviews(rRes.data?.content || rRes.data || []);
      })
      .catch(() => alive && setError('Không tìm thấy sản phẩm.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);

  const sizes = useMemo(
    () => [...new Set((product?.variants || []).map((v) => v.size))],
    [product]
  );
  const colorsForSize = useMemo(
    () => [...new Set(
      (product?.variants || [])
        .filter((v) => v.size === selectedSize)
        .map((v) => v.color)
    )],
    [product, selectedSize]
  );
  const selectedVariant = useMemo(
    () => (product?.variants || []).find(
      (v) => v.size === selectedSize && v.color === selectedColor
    ),
    [product, selectedSize, selectedColor]
  );
  // Số lượng tối đa theo tồn của biến thể đang chọn (không cho đặt vượt kho)
  const maxQuantity = Math.max(1, Math.min(99, selectedVariant?.stock ?? 0));

  function requireLogin() {
    if (!user || user.role !== 'CUSTOMER') {
      navigate('/dang-nhap');
      return true;
    }
    return false;
  }

  async function handleAddToCart() {
    setMessage('');
    if (requireLogin()) return;
    if (!selectedSize || !selectedColor) {
      setMessage('Vui lòng chọn size và màu sắc.');
      return;
    }
    if (!selectedVariant || selectedVariant.stock <= 0) {
      setMessage('Biến thể này đã hết hàng — vui lòng chọn size/màu khác.');
      return;
    }
    if (quantity > selectedVariant.stock) {
      setMessage(`Chỉ còn ${selectedVariant.stock} sản phẩm cho size/màu này.`);
      return;
    }
    try {
      await addToCart(product.id, selectedSize, selectedColor, quantity);
      setMessage('__OK__Đã thêm vào giỏ hàng!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(getErrorMessage(err, 'Không thể thêm vào giỏ hàng.'));
    }
  }

  async function handleBuyNow() {
    await handleAddToCart();
    if (!message || message.startsWith('__OK__')) navigate('/gio-hang');
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmittingReview(true);
    try {
      await api.post(`/products/${id}/reviews`, { rating, comment: comment.trim() });
      setComment('');
      setRating(5);
      const res = await api.get(`/products/${id}/reviews`);
      setReviews(res.data?.content || res.data || []);
    } catch (err) {
      setMessage(err.message || 'Không gửi được đánh giá.');
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 80, textAlign: 'center' }}><div className="spinner" /></div>;
  }
  if (error || !product) {
    return (
      <div className="container section empty-state">
        <p>{error || 'Sản phẩm không tồn tại.'}</p>
        <Link to="/san-pham" className="btn btn-outline">← Về danh sách sản phẩm</Link>
      </div>
    );
  }

  return (
    <div className="container section product-detail">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Trang chủ</Link><span aria-hidden="true"> / </span>
        <Link to="/san-pham">Sản phẩm</Link><span aria-hidden="true"> / </span>
        <span>{product.name}</span>
      </nav>

      <div className="detail-grid">
        <div className="detail-thumb">
          {product.imageUrl
            ? <img src={product.imageUrl} alt={product.name} />
            : <div className="product-placeholder big" aria-hidden="true"><IconHeart size={130} /></div>}
        </div>

        <div className="detail-info">
          {product.categoryName && (
            <div className="product-category-line" style={{ fontSize: 12.5 }}>{product.categoryName}</div>
          )}
          <h1>{product.name}</h1>
          <div className="detail-rating">
            <IconStar size={15} /> {Number(product.rating || 0).toFixed(1)}
            <span className="muted-text"> ({product.reviewCount || 0} đánh giá)</span>
            {product.badge && <> · <span className="badge badge-red">{product.badge}</span></>}
          </div>

          <div className="detail-price">
            <strong>{formatVNDText(product.price)}</strong>
            {product.oldPrice && <s>{formatVNDText(product.oldPrice)}</s>}
          </div>

          {selectedVariant && (
            <p className={`variant-stock ${selectedVariant.stock > 0 ? '' : 'out'}`}>
              {selectedVariant.stock > 0
                ? `Còn ${selectedVariant.stock} sản phẩm (SKU: ${selectedVariant.sku})`
                : 'Hết hàng — vui lòng chọn size/màu khác'}
            </p>
          )}

          <div className="option-group">
            <h4>Chọn size</h4>
            <div className="option-row">
              {sizes.map((s) => (
                <button
                  key={s}
                  className={`option-chip ${selectedSize === s ? 'active' : ''}`}
                  onClick={() => { setSelectedSize(s); setSelectedColor(''); setQuantity(1); }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="option-group">
            <h4>Chọn màu</h4>
            <div className="option-row">
              {colorsForSize.map((c) => (
                <button
                  key={c}
                  className={`option-chip ${selectedColor === c ? 'active' : ''}`}
                  onClick={() => { setSelectedColor(c); setQuantity(1); }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="option-group qty-row">
            <h4>Số lượng</h4>
            <div className="qty-stepper">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                aria-label="Giảm"
              >−</button>
              <input value={quantity} readOnly aria-label="Số lượng" />
              <button
                onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                disabled={!selectedVariant || quantity >= maxQuantity}
                aria-label="Tăng"
              >+</button>
            </div>
            {selectedVariant && selectedVariant.stock > 0 && (
              <span className="muted-text" style={{ marginLeft: 10 }}>
                (tối đa {maxQuantity})
              </span>
            )}
          </div>

          <div className="detail-actions">
            <button className="btn btn-primary btn-lg" onClick={handleAddToCart}>
              <IconCartAdd size={17} /> Thêm vào giỏ hàng
            </button>
            <button className="btn btn-dark btn-lg" onClick={handleBuyNow}>Mua ngay</button>
            <button
              className="btn btn-outline"
              onClick={() => !requireLogin() && toggleWishlist(product.id)}
              aria-label="Yêu thích"
            >
              <IconHeart filled={inWishlist(product.id)} size={16} />
              {inWishlist(product.id) ? 'Đã thích' : 'Yêu thích'}
            </button>
          </div>

          {message && (
            <div className={message.startsWith('__OK__') ? 'alert alert-success' : 'alert alert-error'} role="alert">
              {message.replace('__OK__', '')}
            </div>
          )}

          {(product.description || product.material) && (
            <section className="detail-desc">
              <h3>Mô tả sản phẩm</h3>
              {product.description && <p>{product.description}</p>}
              <ul>
                {product.material && <li><strong>Chất liệu:</strong> {product.material}</li>}
                {product.fit && <li><strong>Form dáng:</strong> {product.fit}</li>}
                {product.season && <li><strong>Mùa:</strong> {product.season}</li>}
                {product.careInstructions && <li><strong>Bảo quản:</strong> {product.careInstructions}</li>}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Đánh giá */}
      <section className="reviews-section">
        <h2>Đánh giá từ khách hàng ({reviews.length})</h2>

        {(!user || user.role !== 'CUSTOMER') ? (
          <p className="muted-text">
            <Link to="/dang-nhap">Đăng nhập</Link> để viết đánh giá của bạn.
          </p>
        ) : (
          <form onSubmit={handleSubmitReview} className="review-form card">
            <div className="field-inline">
              <label htmlFor="review-rating">Đánh giá:</label>
              <select id="review-rating" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>{r} sao</option>
                ))}
              </select>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
              rows={3}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={submittingReview}>
              {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </form>
        )}

        <ul className="review-list">
          {reviews.map((rv) => (
            <li key={rv.id} className="review-item card">
              <div className="review-head">
                <strong>{rv.customerName || 'Khách hàng'}</strong>
                <span className="review-stars" aria-label={`${rv.rating} sao`}>
                  {Array.from({ length: rv.rating }, (_, i) => (
                    <IconStar key={i} size={13} />
                  ))}
                </span>
                {rv.isVerified && <span className="badge badge-green">Đã mua hàng</span>}
              </div>
              <p>{rv.comment}</p>
              <time className="muted-text">{formatDateTime(rv.createdAt)}</time>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
