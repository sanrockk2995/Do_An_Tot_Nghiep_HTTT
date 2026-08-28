import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/format';
import {
  IconDashboard, IconReceipt, IconDress, IconUsers, IconBox,
  IconStore, IconClipboard, IconGift, IconTruck, IconBadgeUser,
  IconSearchDoc, IconMoney, IconArrowLeft, IconLogout,
} from '../components/Icons';

/** Menu tương ứng từng vai trò — khớp với định tuyến tiếng Anh trong App.jsx. */
const MENU = {
  ADMIN: [
    { to: '/admin', label: 'Tổng quan', icon: IconDashboard, end: true },
    { to: '/admin/pos', label: 'Bán hàng tại quầy', icon: IconReceipt },
    { to: '/admin/products', label: 'Sản phẩm', icon: IconDress },
    { to: '/admin/customers', label: 'Khách hàng', icon: IconUsers },
    { to: '/admin/online-orders', label: 'Đơn hàng online', icon: IconBox },
    { to: '/admin/warehouse', label: 'Kho hàng', icon: IconStore },
    { to: '/admin/stocktake', label: 'Kiểm kê', icon: IconClipboard },
    { to: '/admin/promotions', label: 'Khuyến mãi', icon: IconGift },
    { to: '/admin/suppliers', label: 'Nhà cung cấp', icon: IconTruck },
    { to: '/admin/users', label: 'Nhân viên', icon: IconBadgeUser },
    { to: '/admin/reports', label: 'Báo cáo - Thống kê', icon: IconMoney },
    { to: '/admin/invoices', label: 'Tra cứu hóa đơn', icon: IconSearchDoc },
    { to: '/admin/profile', label: 'Hồ sơ cá nhân', icon: IconBadgeUser },
  ],
  SALES_STAFF: [
    { to: '/pos', label: 'Bán hàng tại quầy', icon: IconReceipt, end: true },
    { to: '/pos/products', label: 'Sản phẩm', icon: IconDress },
    { to: '/pos/customers', label: 'Khách hàng', icon: IconUsers },
    { to: '/pos/promotions', label: 'Khuyến mãi', icon: IconGift },
    { to: '/pos/online-orders', label: 'Đơn hàng online', icon: IconBox },
    { to: '/pos/invoices', label: 'Hóa đơn đã tạo', icon: IconSearchDoc },
    { to: '/pos/profile', label: 'Hồ sơ cá nhân', icon: IconBadgeUser },
  ],
  WAREHOUSE_STAFF: [
    { to: '/warehouse', label: 'Nhập / xuất kho', icon: IconStore, end: true },
    { to: '/warehouse/stocktake', label: 'Kiểm kê', icon: IconClipboard },
    { to: '/warehouse/products', label: 'Tồn kho sản phẩm', icon: IconDress },
    { to: '/warehouse/profile', label: 'Hồ sơ cá nhân', icon: IconBadgeUser },
  ],
  ACCOUNTANT: [
    { to: '/accounting', label: 'Báo cáo doanh thu', icon: IconMoney, end: true },
    { to: '/accounting/payroll', label: 'Bảng lương nhân viên', icon: IconBadgeUser },
    { to: '/accounting/invoices', label: 'Tra cứu hóa đơn', icon: IconSearchDoc },
    { to: '/accounting/profile', label: 'Hồ sơ cá nhân', icon: IconBadgeUser },
  ],
};

const HOME_BY_ROLE = {
  ADMIN: '/admin',
  SALES_STAFF: '/pos',
  WAREHOUSE_STAFF: '/warehouse',
  ACCOUNTANT: '/accounting',
};

/** Layout quản trị — sidebar than + vùng nội dung sáng (dùng chung mọi vai trò nội bộ). */
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const items = MENU[user?.role] || [];

  function handleLogout() {
    logout();
    navigate('/staff-login');
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
