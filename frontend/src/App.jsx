import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layout khách hàng
import StoreLayout from './layouts/StoreLayout';

// Trang công khai (khách hàng)
import HomePage from './pages/customer/HomePage';
import ProductsPage from './pages/customer/ProductsPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import SearchPage from './pages/customer/SearchPage';
import WishlistPage from './pages/customer/WishlistPage';
import CartPage from './pages/customer/CartPage';
import SupportPage from './pages/customer/SupportPage';
import MyOrdersPage from './pages/customer/MyOrdersPage';

// Trang đăng nhập / đăng ký
import CustomerLoginPage from './pages/auth/CustomerLoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StaffLoginPage from './pages/auth/StaffLoginPage';

// Nội bộ
import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import PosPage from './pages/admin/PosPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import PromotionsPage from './pages/admin/PromotionsPage';
import SuppliersPage from './pages/admin/SuppliersPage';
import OnlineOrdersPage from './pages/admin/OnlineOrdersPage';
import WarehousePage from './pages/admin/WarehousePage';
import StocktakePage from './pages/admin/StocktakePage';
import UsersPage from './pages/admin/UsersPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AccountingPage from './pages/admin/AccountingPage';
import StaffOrdersPage from './pages/admin/StaffOrdersPage';
import PayrollPage from './pages/admin/PayrollPage';
import ProfilePage from './pages/shared/ProfilePage';

const HOME_BY_ROLE = {
  ADMIN: '/quan-ly',
  SALES_STAFF: '/ban-hang',
  WAREHOUSE_STAFF: '/kho-hang',
  ACCOUNTANT: '/ke-toan',
};

/** Route guard: yêu cầu đăng nhập nhân viên + đúng vai trò. */
function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>;
  }
  if (!user) return <Navigate to="/dang-nhap-nhan-vien" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={HOME_BY_ROLE[user.role] || '/'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* ===== Khách hàng ===== */}
            <Route element={<StoreLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/san-pham" element={<ProductsPage />} />
              <Route path="/san-pham/:slugCategory" element={<ProductsPage />} />
              <Route path="/san-pham/chi-tiet/:id" element={<ProductDetailPage />} />
              <Route path="/tim-kiem" element={<SearchPage />} />
              <Route path="/yeu-thich" element={<RequireCustomer><WishlistPage /></RequireCustomer>} />
              <Route path="/gio-hang" element={<CartPage />} />
              <Route path="/don-hang-cua-toi" element={<RequireCustomer><MyOrdersPage /></RequireCustomer>} />
              <Route path="/ho-tro" element={<SupportPage />} />
              <Route path="/tai-khoan" element={<RequireCustomer><ProfilePage customerMode /></RequireCustomer>} />
            </Route>

            <Route path="/dang-nhap" element={<CustomerLoginPage />} />
            <Route path="/dang-ky" element={<RegisterPage />} />
            <Route path="/dang-nhap-nhan-vien" element={<StaffLoginPage />} />

            {/* ===== Quản lý (ADMIN) — layout lồng nhau ===== */}
            <Route
              path="/quan-ly"
              element={<RequireRole roles={['ADMIN']}><AdminLayout /></RequireRole>}
            >
              <Route index element={<DashboardPage />} />
              <Route path="tao-hoa-don" element={<PosPage />} />
              <Route path="san-pham" element={<AdminProductsPage />} />
              <Route path="khach-hang" element={<AdminCustomersPage />} />
              <Route path="khuyen-mai" element={<PromotionsPage />} />
              <Route path="nha-cung-cap" element={<SuppliersPage />} />
              <Route path="don-hang-online" element={<OnlineOrdersPage />} />
              <Route path="kho-hang" element={<WarehousePage />} />
              <Route path="kiem-ke" element={<StocktakePage />} />
              <Route path="nhan-vien" element={<UsersPage />} />
              <Route path="bao-cao" element={<AdminReportsPage />} />
              <Route path="hoa-don" element={<StaffOrdersPage />} />
              <Route path="ho-so" element={<ProfilePage />} />
            </Route>

            {/* ===== NV bán hàng (POS) ===== */}
            <Route
              path="/ban-hang"
              element={<RequireRole roles={['ADMIN', 'SALES_STAFF']}><AdminLayout /></RequireRole>}
            >
              <Route index element={<PosPage />} />
              <Route path="san-pham" element={<AdminProductsPage salesMode />} />
              <Route path="khach-hang" element={<AdminCustomersPage salesMode />} />
              <Route path="khuyen-mai" element={<PromotionsPage salesMode />} />
              <Route path="don-hang-online" element={<OnlineOrdersPage salesMode />} />
              <Route path="hoa-don" element={<StaffOrdersPage salesMode />} />
              <Route path="ho-so" element={<ProfilePage />} />
            </Route>

            {/* ===== Kế toán ===== */}
            <Route
              path="/ke-toan"
              element={<RequireRole roles={['ADMIN', 'ACCOUNTANT']}><AdminLayout /></RequireRole>}
            >
              <Route index element={<AccountingPage />} />
              <Route path="hoa-don" element={<StaffOrdersPage accountingMode />} />
              <Route path="bang-luong" element={<PayrollPage />} />
              <Route path="ho-so" element={<ProfilePage />} />
            </Route>

            {/* ===== NV kho ===== */}
            <Route
              path="/kho-hang"
              element={<RequireRole roles={['ADMIN', 'WAREHOUSE_STAFF']}><AdminLayout /></RequireRole>}
            >
              <Route index element={<WarehousePage />} />
              <Route path="kiem-ke" element={<StocktakePage />} />
              <Route path="san-pham" element={<AdminProductsPage warehouseMode />} />
              <Route path="ho-so" element={<ProfilePage />} />
            </Route>

            {/* Route lạ → về trang chủ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

/** Chặn trang cần đăng nhập khách hàng → chuyển sang đăng nhập. */
function RequireCustomer({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>;
  }
  if (!user || user.role !== 'CUSTOMER') return <Navigate to="/dang-nhap" replace />;
  return children;
}
