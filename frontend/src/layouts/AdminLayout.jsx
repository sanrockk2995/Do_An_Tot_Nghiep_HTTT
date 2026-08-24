import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/format';
import {
  IconDashboard, IconReceipt, IconDress, IconUsers, IconBox,
  IconStore, IconClipboard, IconGift, IconTruck, IconBadgeUser,
  IconSearchDoc, IconMoney, IconArrowLeft, IconLogout,
} from '../components/Icons';

/** Menu tương ứng từng vai trò — khớp với định tuyến trong App.jsx. */
const MENU = {
  ADMIN: [
    { to: '/quan-ly', label: 'Tổng quan', icon: IconDashboard, end: true },
    { to: '/quan-ly/tao-hoa-don', label: 'Bán hàng tại quầy', icon: IconReceipt },
    { to: '/quan-ly/san-pham', label: 'Sản phẩm', icon: IconDress },
    { to: '/quan-ly/khach-hang', label: 'Khách hàng', icon: IconUsers },
    { to: '/quan-ly/don-hang-online', label: 'Đơn hàng online', icon: IconBox },
    { to: '/quan-ly/kho-hang', label: 'Kho hàng', icon: IconStore },
    { to: '/quan-ly/kiem-ke', label: 'Kiểm kê', icon: IconClipboard },
    { to: '/quan-ly/khuyen-mai', label: 'Khuyến mãi', icon: IconGift },
    { to: '/quan-ly/nha-cung-cap', label: 'Nhà cung cấp', icon: IconTruck },
    { to: '/quan-ly/nhan-vien', label: 'Nhân viên', icon: IconBadgeUser },
    { to: '/quan-ly/hoa-don', label: 'Tra cứu hóa đơn', icon: IconSearchDoc },
    { to: '/quan-ly/ho-so', label: 'Hồ sơ cá nhân', icon: IconBadgeUser },
  ],
  SALES_STAFF: [
    { to: '/ban-hang', label: 'Bán hàng tại quầy', icon: IconReceipt, end: true },
    { to: '/ban-hang/san-pham', label: 'Sản phẩm', icon: IconDress },
    { to: '/ban-hang/khach-hang', label: 'Khách hàng', icon: IconUsers },
    { to: '/ban-hang/khuyen-mai', label: 'Khuyến mãi', icon: IconGift },
    { to: '/ban-hang/don-hang-online', label: 'Đơn hàng online', icon: IconBox },
    { to: '/ban-hang/hoa-don', label: 'Hóa đơn đã tạo', icon: IconSearchDoc },
    { to: '/ban-hang/ho-so', label: 'Hồ sơ cá nhân', icon: IconBadgeUser },
  ],
  WAREHOUSE_STAFF: [
    { to: '/kho-hang', label: 'Nhập / xuất kho', icon: IconStore, end: true },
    { to: '/kho-hang/kiem-ke', label: 'Kiểm kê', icon: IconClipboard },
    { to: '/kho-hang/san-pham', label: 'Tồn kho sản phẩm', icon: IconDress },
    { to: '/kho-hang/ho-so', label: 'Hồ sơ cá nhân', icon: IconBadgeUser },
  ],
  ACCOUNTANT: [
    { to: '/ke-toan', label: 'Báo cáo doanh thu', icon: IconMoney, end: true },
    { to: '/ke-toan/bang-luong', label: 'Bảng lương nhân viên', icon: IconBadgeUser },
    { to: '/ke-toan/hoa-don', label: 'Tra cứu hóa đơn', icon: IconSearchDoc },
    { to: '/ke-toan/ho-so', label: 'Hồ sơ cá nhân', icon: IconBadgeUser },
  ],
};

const HOME_BY_ROLE = {
  ADMIN: '/quan-ly',
  SALES_STAFF: '/ban-hang',
  WAREHOUSE_STAFF: '/kho-hang',
  ACCOUNTANT: '/ke-toan',
};

/** Layout quản trị — sidebar than + vùng nội dung sáng (dùng chung mọi vai trò nội bộ). */
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const items = MENU[user?.role] || [];

  function handleLogout() {
    logout();
    navigate('/dang-nhap-nhan-vien');
  }

  const initial = (user?.fullName || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div>
            <div className="admin-brand-name">ROUTINE</div>
            <div className="admin-brand-sub">Hệ thống quản lý</div>
          </div>
        </div>

        <nav className="admin-menu" aria-label="Menu quản trị">
          <div className="admin-menu-label">Chức năng</div>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-menu-item ${isActive ? 'active' : ''}`}
            >
              <item.icon /> {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <LinkHome user={user} navigate={navigate} />
          <div className="admin-user">
            <span className="admin-user-avatar" aria-hidden="true">{initial}</span>
            <div className="admin-user-meta">
              <div className="admin-user-name">{user?.fullName || user?.email}</div>
              <div className="admin-user-role">{ROLE_LABELS[user?.role] || user?.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-block" onClick={handleLogout}>
            <IconLogout size={16} /> Đăng xuất
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

function LinkHome({ user, navigate }) {
  if (!user || !HOME_BY_ROLE[user.role]) return null;
  return (
    <button
      className="btn btn-ghost btn-block"
      style={{ marginBottom: 8 }}
      onClick={() => navigate('/')}
    >
      <IconArrowLeft size={15} /> Xem website bán hàng
    </button>
  );
}
