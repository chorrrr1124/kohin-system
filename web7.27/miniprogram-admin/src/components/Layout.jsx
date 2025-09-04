import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import { isMobile, useResponsive } from '../utils/responsive';

const Layout = () => {
  const { isMobile: isMobileView, screenSize } = useResponsive();
  // 桌面端默认展开，移动端默认折叠
  const [sidebarOpen, setSidebarOpen] = useState(!isMobileView);

  // 响应屏幕尺寸变化
  useEffect(() => {
    if (isMobileView) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobileView]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="drawer lg:drawer-open">
      <input 
        id="drawer-toggle" 
        type="checkbox" 
        className="drawer-toggle" 
        checked={sidebarOpen}
        onChange={toggleSidebar}
      />
      
      {/* 主内容区域 */}
      <div className="drawer-content flex flex-col">
        {/* 页面内容 */}
        <main className={`flex-1 ${
          isMobileView ? 'p-4' : 'p-6'
        }`}>
          <Outlet />
        </main>
      </div>
      
      {/* 侧边栏 */}
      <div className="drawer-side">
        <div className="drawer-overlay" onClick={toggleSidebar}></div>
        <div className="min-h-full w-80">
          <Sidebar />
        </div>
      </div>
    </div>
  );
};

export default Layout;
