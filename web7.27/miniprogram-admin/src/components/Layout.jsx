import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import { isMobile, useResponsive } from '../utils/responsive';

const Layout = () => {
  const { isMobile: isMobileView, screenSize } = useResponsive();
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
        {/* 顶部导航栏 */}
        <div className={`navbar bg-base-100 shadow-sm ${isMobileView ? '' : 'lg:hidden'}`}>
          <div className="flex-none">
            <label 
              htmlFor="drawer-toggle" 
              className="btn btn-square btn-ghost"
              onClick={toggleSidebar}
            >
              <Bars3Icon className="w-6 h-6" />
            </label>
          </div>
          <div className="flex-1">
            <span className={`font-bold ${
              isMobileView ? 'text-lg' : 'text-xl'
            }`}>
              丘大叔茶饮管理系统
            </span>
          </div>
        </div>
        
        {/* 页面内容 */}
        <main className={`flex-1 ${
          isMobileView ? 'p-4' : 'p-6'
        }`}>
          <Outlet />
        </main>
      </div>
      
      {/* 侧边栏 */}
      <div className="drawer-side">
        <label 
          htmlFor="drawer-toggle" 
          className="drawer-overlay"
          onClick={() => isMobileView && setSidebarOpen(false)}
        ></label>
        <Sidebar onItemClick={() => isMobileView && setSidebarOpen(false)} />
      </div>
    </div>
  );
};

export default Layout;