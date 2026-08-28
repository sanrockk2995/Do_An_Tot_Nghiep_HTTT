import { Link, NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { IconHeart, IconBag, IconLogout, IconSearch, IconReceipt } from '../components/Icons';

/** Header + Footer dùng chung cho trang khách hàng (layout route). */
export default function StoreLayout() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [searchQ, setSearchQ] = useState('');
  const navigate = useNavigate();

  function submitSearch(e) {
    e.preventDefault();
    if (searchQ.trim()) navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="store-header">
        <div className="container store-header-inner">
          <Link to="/" className="brand">ROUTINE</Link>

          <nav className="store-nav" aria-label="Điều hướng chính">
            <NavLink to="/products" end>Tất cả</NavLink>
            <NavLink to="/products/ao-so-mi">Áo sơ mi</NavLink>
            <NavLink to="/products/ao-khoac">Áo khoác</NavLink>
            <NavLink to="/products/quan-jean">Quần jean</NavLink>
            <NavLink to="/products/vay-dam" className="nav-sale">Váy/Đầm</NavLink>
          </nav>

          <form onSubmit={submitSearch} className="store-search" role="search">
            <input
              type="search"
              placeholder="Tìm sản phẩm..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              aria-label="Tìm kiếm sản phẩm"
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 18px', minHeight: '42px' }}>
              Tìm
              <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: 6 }}>
                <IconSearch size={15} />
              </span>
            </button>
          </form>

          <div className="store-actions">
            {user?.role === 'CUSTOMER' ? (
              <>
                <Link to="/profile" className="icon-link" aria-label="Tài khoản của tôi">
                  <span className="account-avatar" aria-hidden="true">
                    {(user.fullName || user.email || '?').trim().charAt(0).toUpperCase()}
                  </span>
                </Link>
                <Link to="/wishlist" className="icon-link" aria-label="Sản phẩm yêu thích"><IconHeart /></Link>
                <Link to="/my-orders" className="icon-link" aria-label="Đơn hàng của tôi"><IconReceipt /></Link>
                <Link to="/cart" className="icon-link" aria-label="Giỏ hàng">
                  <IconBag />
                  {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                </Link>
                <button className="icon-link" onClick={logout} aria-label="Đăng xuất"><IconLogout /></button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">Đăng nhập</Link>
                <Link to="/register" className="btn btn-primary">Đăng ký</Link>
                <Link to="/staff-login" className="staff-link">Nhân viên</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer className="store-footer">
        <div className="container">
          <div>
            <div className="footer-brand">ROUTINE</div>
            <div className="footer-tagline">Thời trang cho mọi ngày thường</div>
          </div>
          <div>
            <Link to="/support">Trung tâm hỗ trợ</Link>
            {' · '}
            Hotline: 1900 1234 · Email: cskh@routine.vn
          </div>
        </div>
      </footer>
    </div>
  );
}
