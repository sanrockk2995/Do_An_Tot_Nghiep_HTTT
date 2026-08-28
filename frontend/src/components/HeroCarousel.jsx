import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatVNDText } from '../utils/format';

/**
 * Carousel banner hero tự động: gắn sản phẩm bán chạy + nổi bật (GET /products/featured).
 * Tự chạy mỗi 5 giây, tạm dừng khi hover; có nút prev/next và dot điều hướng.
 */
export default function HeroCarousel() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .get('/products/featured')
      .then((res) => {
        if (alive && Array.isArray(res.data)) setSlides(res.data.slice(0, 8));
      })
      .catch(() => {}); // lỗi → giữ fallback glyph "R"
    return () => {
      alive = false;
    };
  }, []);

  const count = slides.length;

  // Tự động chuyển slide mỗi 5s, dừng khi hover
  useEffect(() => {
    if (count < 2 || paused) return undefined;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % count);
    }, 5000);
    return () => clearInterval(timer);
  }, [count, paused]);

  const go = (i) => setCurrent(((i % count) + count) % count);

  if (count === 0) {
    // Fallback: giữ khối glyph cũ nếu chưa tải được sản phẩm
    return (
      <div className="hero-art" aria-hidden="true">
        <div className="hero-art-glyph">R</div>
        <div className="hero-art-caption">Bộ sưu tập mới · Thu Đông 2026</div>
      </div>
    );
  }

  const slide = slides[current];
  const label = slide.badge
    || (slide.rating >= 4.5 ? `Đánh giá ${slide.rating}/5` : 'Nổi bật');

  return (
    <div
      className="hero-carousel hero-art"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Sản phẩm bán chạy và nổi bật"
    >
      {slides.map((p, i) => (
        <Link
          key={p.id}
          to={`/products/detail/${p.id}`}
          className={`hero-slide${i === current ? ' active' : ''}`}
          aria-hidden={i !== current}
          tabIndex={i === current ? 0 : -1}
        >
          <img src={p.imageUrl} alt={p.name} loading={i === 0 ? 'eager' : 'lazy'} />
        </Link>
      ))}

      {/* Nhãn slide: tag + tên + giá */}
      <div className="hero-slide-info">
        <span className="hero-slide-tag">{label}</span>
        <span className="hero-slide-name">{slide.name}</span>
        <span className="hero-slide-price">{formatVNDText(slide.price)}</span>
      </div>

      {/* Điều hướng prev / next */}
      <button
        type="button"
        className="hero-carousel-arrow prev"
        aria-label="Slide trước"
        onClick={(e) => { e.preventDefault(); go(current - 1); }}
      >
        ‹
      </button>
      <button
        type="button"
        className="hero-carousel-arrow next"
        aria-label="Slide sau"
        onClick={(e) => { e.preventDefault(); go(current + 1); }}
      >
        ›
      </button>

      {/* Dots */}
      <div className="hero-carousel-dots" style={{ position: 'absolute', bottom: 16, left: 20, display: 'flex', gap: 8 }}>
        {slides.map((p, i) => (
          <button
            key={p.id}
            type="button"
            className={`hero-dot${i === current ? ' active' : ''}`}
            aria-label={`Chuyển đến slide ${i + 1}: ${p.name}`}
            onClick={(e) => { e.preventDefault(); go(i); }}
            style={{
              width: 10, height: 10, borderRadius: '50%',
              border: 'none', cursor: 'pointer', padding: 0,
              background: i === current ? 'var(--accent)' : 'rgba(255,255,255,0.7)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              transition: 'background 0.25s',
            }}
          />
        ))}
      </div>
    </div>
  );
}
