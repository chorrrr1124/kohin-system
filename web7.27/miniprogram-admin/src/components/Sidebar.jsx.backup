import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  ShoppingBagIcon,
  ArchiveBoxIcon,
  BuildingStorefrontIcon,
  PhotoIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  TicketIcon,
  ChartBarIcon,
  CubeIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const navLinks = [
  { to: '/', icon: HomeIcon, text: '仪表板' },
  { to: '/users', icon: UsersIcon, text: '客户管理' },
  { to: '/orders', icon: ShoppingBagIcon, text: '订单管理' },
  { to: '/deposits', icon: ArchiveBoxIcon, text: '预存记录' },
  { to: '/shop', icon: BuildingStorefrontIcon, text: '商品管理' },
  { 
    to: '/coupons', 
    icon: TicketIcon, 
    text: '优惠券管理',
    children: [
      { to: '/coupons', text: '优惠券管理' },
      { to: '/coupons/analytics', text: '优惠券分析' }
    ]
  },
  { to: '/inventory', icon: CubeIcon, text: '仓库库存管理' },
  { to: '/images', icon: PhotoIcon, text: '图片管理' },
  { 
    to: '/settings', 
    icon: Cog6ToothIcon, 
    text: '系统设置',
    children: [
      { to: '/settings', text: '系统设置' },
      { to: '/popup-content', text: '弹窗内容管理' }
    ]
  },
];

const Sidebar = ({ onItemClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState(['/coupons', '/settings']); // 默认展开优惠券管理和系统设置

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

  const toggleExpanded = (path) => {
    setExpandedItems(prev => 
      prev.includes(path) 
        ? prev.filter(item => item !== path)
        : [...prev, path]
    );
  };

  const isActive = (path) => {
    if (path === '/coupons') {
      return location.pathname === '/coupons' || location.pathname.startsWith('/coupons/');
    }
    return location.pathname === path;
  };

  const isChildActive = (path) => {
    return location.pathname === path;
  };

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.to);
    const isActiveItem = isActive(item.to);

    if (hasChildren) {
      return (
        <div key={item.text}>
          <button
            onClick={() => toggleExpanded(item.to)}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors ${
              isActiveItem
                ? 'bg-primary text-primary-content'
                : 'hover:bg-base-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5" />
              <span>{item.text}</span>
            </div>
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
          
          {isExpanded && (
            <div className="ml-6 mt-2 space-y-1">
              {item.children.map((child) => (
                <Link
                  key={child.text}
                  to={child.to}
                  className={`block px-3 py-2 rounded-lg transition-colors text-sm ${
                    isChildActive(child.to)
                      ? 'bg-primary/20 text-primary'
                      : 'hover:bg-base-300'
                  }`}
                  onClick={() => handleNavigation(child.to)}
                >
                  {child.text}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.text}
        to={item.to}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          isActiveItem
            ? 'bg-primary text-primary-content'
            : 'hover:bg-base-300'
        }`}
        onClick={() => handleNavigation(item.to)}
      >
        <Icon className="w-5 h-5" />
        <span>{item.text}</span>
      </Link>
    );
  };

  return (
    <aside className="min-h-full w-80 bg-base-200 p-4 overflow-y-auto">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShoppingBagIcon className="w-5 h-5 text-primary-content" />
          </div>
          <h1 className="text-xl font-bold">小程序管理后台</h1>
        </div>
        
        <nav className="space-y-2 mb-8">
          {navLinks.map(renderNavItem)}
        </nav>

        <div className="mt-auto">
          <div className="bg-base-300 rounded-lg p-4 mb-2">
            <div className="flex items-center gap-2 mb-2">
              <Cog6ToothIcon className="w-4 h-2" />
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