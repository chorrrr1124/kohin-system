import { useState, useEffect } from 'react';

// 设备检测和响应式工具
export const isMobile = () => {
  // 检测屏幕宽度
  const screenWidth = window.innerWidth;
  
  // 检测用户代理
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
  
  // 检测触摸支持
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // 综合判断：屏幕宽度小于768px 或 移动设备UA 或 触摸设备
  return screenWidth < 768 || isMobileUA || isTouchDevice;
};

export const getDeviceType = () => {
  const screenWidth = window.innerWidth;
  
  if (screenWidth < 480) {
    return 'mobile-small'; // 小屏手机
  } else if (screenWidth < 768) {
    return 'mobile'; // 手机
  } else if (screenWidth < 1024) {
    return 'tablet'; // 平板
  } else {
    return 'desktop'; // 桌面
  }
};

// 响应式断点
export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200
};

// 监听窗口大小变化
export const useResponsive = () => {
  const [deviceType, setDeviceType] = useState(getDeviceType());
  const [isMobileDevice, setIsMobileDevice] = useState(isMobile());
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  useEffect(() => {
    const handleResize = () => {
      setDeviceType(getDeviceType());
      setIsMobileDevice(isMobile());
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return { 
    deviceType, 
    isMobile: isMobileDevice,
    screenSize: deviceType,
    windowSize
  };
};

// 移动端专用的样式类
export const getMobileClasses = (baseClasses = '') => {
  const deviceType = getDeviceType();
  
  const mobileClasses = {
    'mobile-small': 'text-xs p-2',
    'mobile': 'text-sm p-3',
    'tablet': 'text-base p-4',
    'desktop': 'text-base p-6'
  };
  
  return `${baseClasses} ${mobileClasses[deviceType] || mobileClasses.desktop}`;
};
