import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import { isMobile, useResponsive } from '../utils/deviceDetection';

const Layout = () => {
  const { isMobile: isMobileView, screenSize, windowSize } = useResponsive();
  // 桌面端默认展开，移动端默认折叠
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        {/* 移动端顶部导航栏 - 临时强制显示用于调试 */}
        {(isMobileView || windowSize.width < 1200) && (
          <div className="navbar bg-base-100 shadow-sm lg:hidden">
            <div className="flex-none">
              <button 
                className="btn btn-square btn-ghost"
                onClick={toggleSidebar}
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">科银系统</h1>
            </div>
            {/* 调试信息 */}
            <div className="text-xs text-gray-500">
              {screenSize} ({windowSize.width}px) {isMobileView ? 'MOBILE' : 'DESKTOP'}
            </div>
          </div>
        )}
        
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
        <div className={`min-h-full ${isMobileView ? 'w-80' : 'w-80'}`}>
          <Sidebar onItemClick={() => isMobileView && setSidebarOpen(false)} />
        </div>
      </div>
    </div>
  );
};

export default Layout;
