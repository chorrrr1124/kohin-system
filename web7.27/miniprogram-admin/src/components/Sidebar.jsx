import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  ShoppingBagIcon,
<<<<<<< Updated upstream
  CreditCardIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  HomeIcon,
  PhotoIcon
=======
  ArchiveBoxIcon,
  BuildingStorefrontIcon,
  PhotoIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  TicketIcon,
  ChartBarIcon
>>>>>>> Stashed changes
} from '@heroicons/react/24/outline';

const navLinks = [
  { to: '/', icon: HomeIcon, text: '仪表板' },
  { to: '/users', icon: UsersIcon, text: '客户管理' },
  { to: '/orders', icon: ShoppingBagIcon, text: '订单管理' },
  { to: '/deposits', icon: ArchiveBoxIcon, text: '预存记录' },
  { to: '/shop', icon: BuildingStorefrontIcon, text: '商品管理' },
  { to: '/coupons', icon: TicketIcon, text: '优惠券管理' },
  { to: '/coupon-analytics', icon: ChartBarIcon, text: '优惠券分析' },
  { to: '/mall', icon: CreditCardIcon, text: '商城装修' },
  { to: '/image-management', icon: PhotoIcon, text: '图片管理' },
  { to: '/settings', icon: Cog6ToothIcon, text: '系统设置' },
];

const Sidebar = ({ onItemClick }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (onItemClick) {
      onItemClick();
    }
  };

<<<<<<< Updated upstream
  const navigation = [
    {
      name: '仪表板',
      href: '/',
      icon: ChartBarIcon,
      current: location.pathname === '/'
    },
    {
      name: '客户管理',
      href: '/users',
      icon: UsersIcon,
      current: location.pathname === '/users'
    },
    {
      name: '订单管理',
      href: '/orders',
      icon: ShoppingBagIcon,
      current: location.pathname === '/orders'
    },
    {
      name: '预存记录',
      href: '/deposits',
      icon: CreditCardIcon,
      current: location.pathname === '/deposits'
    },
    {
      name: '商城管理',
      href: '/shop',
      icon: ShoppingBagIcon,
      current: location.pathname === '/shop'
    },
    {
      name: '商城装修',
      href: '/mall',
      icon: PaintBrushIcon,
      current: location.pathname === '/mall'
    },
    // 首页设置入口已移除,
    {
      name: '轮播图管理',
      href: '/carousel',
      icon: HomeIcon,
      current: location.pathname === '/carousel'
    },
    {
      name: '图片管理',
      href: '/image-management',
      icon: PhotoIcon,
      current: location.pathname === '/image-management'
    },
    {
      name: 'COS上传测试',
      href: '/test-cos-upload',
      icon: PhotoIcon,
      current: location.pathname === '/test-cos-upload'
    },
    {
      name: '系统设置',
      href: '/settings',
      icon: Cog6ToothIcon,
      current: location.pathname === '/settings'
    }
  ];

=======
>>>>>>> Stashed changes
  return (
    <aside className="min-h-full w-80 bg-base-200 p-4">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShoppingBagIcon className="w-5 h-5 text-primary-content" />
          </div>
          <h1 className="text-xl font-bold">小程序管理后台</h1>
        </div>
        
        <nav className="space-y-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.text}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === item.to
                    ? 'bg-primary text-primary-content'
                    : 'hover:bg-base-300'
                }`}
                onClick={() => handleNavigation(item.to)}
              >
                <Icon className="w-5 h-5" />
                <span>{item.text}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-base-300 rounded-lg p-4 mb-2">
            <div className="flex items-center gap-2 mb-2">
              <Cog6ToothIcon className="w-4 h-4" />
              <span className="text-sm font-medium">系统信息</span>
            </div>
            <div className="text-xs text-base-content/70">
              <p>环境: cloudbase-3g4w6lls8a5ce59b</p>
              <p>版本: v1.0.0</p>
            </div>
          </div>
          <button className="btn btn-error w-full" onClick={handleLogout}>退出登录</button>
        </div>
      </aside>
  );
};

export default Sidebar;