// 响应式设计工具类
import { useState, useEffect } from 'react';

// 断点配置
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

// 检查是否在浏览器环境
const isBrowser = typeof window !== 'undefined';

// 获取当前屏幕尺寸类型
export const getScreenSize = () => {
  if (!isBrowser) return 'lg';
  const width = window.innerWidth;
  
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
};

// 检查是否为移动设备
export const isMobile = () => {
  if (!isBrowser) return false;
  // 简化移动端判断：主要基于屏幕宽度
  const width = window.innerWidth;
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  // 屏幕宽度小于1024px就认为是移动端，或者明确是移动设备
  return width < breakpoints.lg || isMobileUA;
};

// 检查是否为平板设备
export const isTablet = () => {
  if (!isBrowser) return false;
  const width = window.innerWidth;
  return width >= breakpoints.md && width < breakpoints.lg;
};

// 检查是否为桌面设备
export const isDesktop = () => {
  if (!isBrowser) return true;
  return window.innerWidth >= breakpoints.lg;
};

// 响应式Hook (需要在React组件中使用时导入React)
export const useResponsive = () => {
  if (!isBrowser) {
    return {
      screenSize: 'lg',
      windowSize: { width: 1024, height: 768 },
      isMobile: false,
      isTablet: false,
      isDesktop: true
    };
  }

  const [screenSize, setScreenSize] = useState(getScreenSize());
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      const newSize = getScreenSize();
      setScreenSize(newSize);
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    screenSize,
    windowSize,
    isMobile: isMobile(),
    isTablet: isTablet(),
    isDesktop: isDesktop()
  };
};

// 响应式网格配置
export const getResponsiveGridCols = (screenSize) => {
  switch (screenSize) {
    case 'xs':
    case 'sm':
      return 1;
    case 'md':
      return 2;
    case 'lg':
      return 3;
    case 'xl':
    case '2xl':
      return 4;
    default:
      return 1;
  }
};

// 响应式表格配置
export const getResponsiveTableConfig = (screenSize) => {
  const isMobileView = ['xs', 'sm'].includes(screenSize);
  
  return {
    showAllColumns: !isMobileView,
    stackedLayout: isMobileView,
    pageSize: isMobileView ? 5 : 10,
    showPagination: true,
    compactMode: isMobileView
  };
};

// 响应式侧边栏配置
export const getSidebarConfig = (screenSize) => {
  const isMobileView = ['xs', 'sm'].includes(screenSize);
  
  return {
    collapsible: true,
    defaultCollapsed: isMobileView,
    overlay: isMobileView,
    width: isMobileView ? '280px' : '256px',
    breakpoint: 'md'
  };
};

// 响应式模态框配置
export const getModalConfig = (screenSize) => {
  const isMobileView = ['xs', 'sm'].includes(screenSize);
  
  return {
    fullScreen: isMobileView,
    width: isMobileView ? '100%' : 'auto',
    maxWidth: isMobileView ? '100%' : '600px',
    padding: isMobileView ? '1rem' : '2rem'
  };
};

// CSS类名生成器
export const generateResponsiveClasses = (baseClasses, responsiveClasses) => {
  const screenSize = getScreenSize();
  const classes = [baseClasses];
  
  if (responsiveClasses[screenSize]) {
    classes.push(responsiveClasses[screenSize]);
  }
  
  return classes.join(' ');
};

// 媒体查询工具
export const mediaQuery = {
  mobile: `(max-width: ${breakpoints.md - 1}px)`,
  tablet: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  desktop: `(min-width: ${breakpoints.lg}px)`,
  
  // 具体断点
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  '2xl': `(min-width: ${breakpoints['2xl']}px)`
};

// 检查媒体查询匹配
export const matchMedia = (query) => {
  if (isBrowser && window.matchMedia) {
    return window.matchMedia(query).matches;
  }
  return false;
};

// 响应式字体大小
export const getResponsiveFontSize = (screenSize, sizes = {}) => {
  const defaultSizes = {
    xs: 'text-sm',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-xl'
  };
  
  const finalSizes = { ...defaultSizes, ...sizes };
  return finalSizes[screenSize] || finalSizes.md;
};

// 响应式间距
export const getResponsiveSpacing = (screenSize, spacings = {}) => {
  const defaultSpacings = {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
    '2xl': 'p-8'
  };
  
  const finalSpacings = { ...defaultSpacings, ...spacings };
  return finalSpacings[screenSize] || finalSpacings.md;
};
