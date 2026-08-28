import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import ProductCard from '../../components/ProductCard';
import HeroCarousel from '../../components/HeroCarousel';
import {
  IconShirt, IconJacket, IconPants, IconDress, IconTshirt,
  IconArrowRight,
} from '../../components/Icons';

const CATEGORY_TILES = [
  { slug: 'ao-so-mi', label: 'Áo sơ mi', Icon: IconShirt },
  { slug: 'ao-khoac', label: 'Áo khoác', Icon: IconJacket },
  { slug: 'quan-jean', label: 'Quần jean', Icon: IconPants },
  { slug: 'vay-dam', label: 'Váy / Đầm', Icon: IconDress },
  { slug: 'ao-thun', label: 'Áo thun', Icon: IconTshirt },
];

/** Trang chủ: hero editorial + danh mục nhanh + sản phẩm mới. */
export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api
      .get('/products', { params: { page: 0, size: 8 } })
      .then((res) => {
        if (alive) setProducts(res.data.content || []);
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
  }, []);

  return (
    <div className="home-page">
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="hero-eyebrow">Bộ sưu tập Thu Đông 2026</span>
            <h1>Thời trang cho mọi ngày thường</h1>
            <p>
              Trang phục tinh tế, chất liệu thoải mái, giá hợp lý — Routine đồng hành
              cùng bạn trong từng khoảnh khắc thường nhật.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-lg">Mua sắm ngay</Link>
              <Link to="/support" className="btn btn-outline btn-lg">Cần hỗ trợ?</Link>
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-value">50+</div>
                <div className="hero-stat-label">Mẫu mã mới</div>
              </div>
              <div>
                <div className="hero-stat-value">4.9/5</div>
                <div className="hero-stat-label">Đánh giá khách hàng</div>
              </div>
              <div>
                <div className="hero-stat-value">24/7</div>
                <div className="hero-stat-label">Hỗ trợ trực tuyến</div>
              </div>
            </div>
          </div>
          {/* Carousel tự động: SP bán chạy + nổi bật */}
          <HeroCarousel />
        </div>
      </section>

      <section className="container section">
        <h2 className="section-title">Danh mục nổi bật</h2>
        <p className="section-subtitle">Khám phá theo phong cách của bạn</p>
        <div className="category-tiles">
          {CATEGORY_TILES.map(({ slug, label, Icon }) => (
            <Link key={slug} to={`/products/${slug}`} className="category-tile">
              <span aria-hidden="true"><Icon /></span> {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-title-row">
          <h2 className="section-title">Sản phẩm mới</h2>
          <Link to="/products" className="btn btn-outline" style={{ minHeight: 40 }}>
            Xem tất cả
            <span style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
              <IconArrowRight size={15} />
            </span>
          </Link>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}><div className="spinner" /></div>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
