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

export const HOME_BY_ROLE = {
  ADMIN: '/admin',
  SALES_STAFF: '/pos',
  WAREHOUSE_STAFF: '/warehouse',
  ACCOUNTANT: '/accounting',
};

/** Route guard: yêu cầu đăng nhập nhân viên + đúng vai trò. */
function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>;
  }
  if (!user) return <Navigate to="/staff-login" replace />;
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
            {/* ===== Khách hàng (Customer Storefront) ===== */}
            <Route element={<StoreLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:slugCategory" element={<ProductsPage />} />
              <Route path="/products/detail/:id" element={<ProductDetailPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/wishlist" element={<RequireCustomer><WishlistPage /></RequireCustomer>} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/my-orders" element={<RequireCustomer><MyOrdersPage /></RequireCustomer>} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/profile" element={<RequireCustomer><ProfilePage customerMode /></RequireCustomer>} />

              {/* Backward compatibility redirects (Tiếng Việt -> Tiếng Anh) */}
              <Route path="/san-pham" element={<Navigate to="/products" replace />} />
              <Route path="/san-pham/:slugCategory" element={<Navigate to="/products/:slugCategory" replace />} />
              <Route path="/san-pham/chi-tiet/:id" element={<Navigate to="/products/detail/:id" replace />} />
              <Route path="/tim-kiem" element={<Navigate to="/search" replace />} />
              <Route path="/yeu-thich" element={<Navigate to="/wishlist" replace />} />
              <Route path="/gio-hang" element={<Navigate to="/cart" replace />} />
              <Route path="/don-hang-cua-toi" element={<Navigate to="/my-orders" replace />} />
              <Route path="/ho-tro" element={<Navigate to="/support" replace />} />
              <Route path="/tai-khoan" element={<Navigate to="/profile" replace />} />
            </Route>

            {/* ===== Auth Routes ===== */}
            <Route path="/login" element={<CustomerLoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/staff-login" element={<StaffLoginPage />} />

            {/* Auth Redirects */}
            <Route path="/dang-nhap" element={<Navigate to="/login" replace />} />
            <Route path="/dang-ky" element={<Navigate to="/register" replace />} />
            <Route path="/dang-nhap-nhan-vien" element={<Navigate to="/staff-login" replace />} />

            {/* ===== Quản lý (ADMIN) ===== */}
            <Route
              path="/admin"
              element={<RequireRole roles={['ADMIN']}><AdminLayout /></RequireRole>}
            >
              <Route index element={<DashboardPage />} />
              <Route path="pos" element={<PosPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="customers" element={<AdminCustomersPage />} />
              <Route path="promotions" element={<PromotionsPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="online-orders" element={<OnlineOrdersPage />} />
              <Route path="warehouse" element={<WarehousePage />} />
              <Route path="stocktake" element={<StocktakePage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="invoices" element={<StaffOrdersPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Redirects /quan-ly/* -> /admin/* */}
            <Route path="/quan-ly" element={<Navigate to="/admin" replace />} />
            <Route path="/quan-ly/tao-hoa-don" element={<Navigate to="/admin/pos" replace />} />
            <Route path="/quan-ly/san-pham" element={<Navigate to="/admin/products" replace />} />
            <Route path="/quan-ly/khach-hang" element={<Navigate to="/admin/customers" replace />} />
            <Route path="/quan-ly/khuyen-mai" element={<Navigate to="/admin/promotions" replace />} />
            <Route path="/quan-ly/nha-cung-cap" element={<Navigate to="/admin/suppliers" replace />} />
            <Route path="/quan-ly/don-hang-online" element={<Navigate to="/admin/online-orders" replace />} />
            <Route path="/quan-ly/kho-hang" element={<Navigate to="/admin/warehouse" replace />} />
            <Route path="/quan-ly/kiem-ke" element={<Navigate to="/admin/stocktake" replace />} />
            <Route path="/quan-ly/nhan-vien" element={<Navigate to="/admin/users" replace />} />
            <Route path="/quan-ly/bao-cao" element={<Navigate to="/admin/reports" replace />} />
            <Route path="/quan-ly/hoa-don" element={<Navigate to="/admin/invoices" replace />} />
            <Route path="/quan-ly/ho-so" element={<Navigate to="/admin/profile" replace />} />

            {/* ===== NV bán hàng (POS / Sales Staff) ===== */}
            <Route
              path="/pos"
              element={<RequireRole roles={['ADMIN', 'SALES_STAFF']}><AdminLayout /></RequireRole>}
            >
              <Route index element={<PosPage />} />
              <Route path="products" element={<AdminProductsPage salesMode />} />
              <Route path="customers" element={<AdminCustomersPage salesMode />} />
              <Route path="promotions" element={<PromotionsPage salesMode />} />
              <Route path="online-orders" element={<OnlineOrdersPage salesMode />} />
              <Route path="invoices" element={<StaffOrdersPage salesMode />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Redirects /ban-hang/* -> /pos/* */}
            <Route path="/ban-hang" element={<Navigate to="/pos" replace />} />
            <Route path="/ban-hang/san-pham" element={<Navigate to="/pos/products" replace />} />
            <Route path="/ban-hang/khach-hang" element={<Navigate to="/pos/customers" replace />} />
            <Route path="/ban-hang/khuyen-mai" element={<Navigate to="/pos/promotions" replace />} />
            <Route path="/ban-hang/don-hang-online" element={<Navigate to="/pos/online-orders" replace />} />
            <Route path="/ban-hang/hoa-don" element={<Navigate to="/pos/invoices" replace />} />
            <Route path="/ban-hang/ho-so" element={<Navigate to="/pos/profile" replace />} />

            {/* ===== Kế toán (Accounting) ===== */}
            <Route
              path="/accounting"
              element={<RequireRole roles={['ADMIN', 'ACCOUNTANT']}><AdminLayout /></RequireRole>}
            >
              <Route index element={<AccountingPage />} />
              <Route path="invoices" element={<StaffOrdersPage accountingMode />} />
              <Route path="payroll" element={<PayrollPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Redirects /ke-toan/* -> /accounting/* */}
            <Route path="/ke-toan" element={<Navigate to="/accounting" replace />} />
            <Route path="/ke-toan/hoa-don" element={<Navigate to="/accounting/invoices" replace />} />
            <Route path="/ke-toan/bang-luong" element={<Navigate to="/accounting/payroll" replace />} />
            <Route path="/ke-toan/ho-so" element={<Navigate to="/accounting/profile" replace />} />

            {/* ===== NV kho (Warehouse) ===== */}
            <Route
              path="/warehouse"
              element={<RequireRole roles={['ADMIN', 'WAREHOUSE_STAFF']}><AdminLayout /></RequireRole>}
            >
              <Route index element={<WarehousePage />} />
              <Route path="stocktake" element={<StocktakePage />} />
              <Route path="products" element={<AdminProductsPage warehouseMode />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Redirects /kho-hang/* -> /warehouse/* */}
            <Route path="/kho-hang" element={<Navigate to="/warehouse" replace />} />
            <Route path="/kho-hang/kiem-ke" element={<Navigate to="/warehouse/stocktake" replace />} />
            <Route path="/kho-hang/san-pham" element={<Navigate to="/warehouse/products" replace />} />
            <Route path="/kho-hang/ho-so" element={<Navigate to="/warehouse/profile" replace />} />

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
  if (!user || user.role !== 'CUSTOMER') return <Navigate to="/login" replace />;
  return children;
}
