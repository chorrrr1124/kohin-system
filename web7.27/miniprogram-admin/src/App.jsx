import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import OrdersPage from './pages/OrdersPage';
import DepositsPage from './pages/DepositsPage';
import ShopPage from './pages/ShopPage';
import CouponManagePage from './pages/CouponManagePage';
import CouponAnalyticsPage from './pages/CouponAnalyticsPage';
import MallManagePage from './pages/MallManagePage';
import ImageManagePage from './pages/ImageManagePage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastContainer, useToast } from './components/Toast';

function RequireAuth({ children }) {
  const location = useLocation();
  const loggedIn = localStorage.getItem('admin_logged_in') === '1';
  if (!loggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function App() {
  const { toasts, removeToast } = useToast();
  
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-base-200">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
              <Route index element={<DashboardPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="deposits" element={<DepositsPage />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="coupons" element={<CouponManagePage />} />
              <Route path="coupon-analytics" element={<CouponAnalyticsPage />} />
              <Route path="mall" element={<MallManagePage />} />
              <Route path="image-management" element={<ImageManagePage />} />
<<<<<<< Updated upstream
              <Route path="test-image" element={<TestImagePage />} />
              <Route path="test-cos-upload" element={<TestCosUpload />} />
=======
>>>>>>> Stashed changes
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
          <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
