import React from 'react';
import { isMobile, getDeviceType } from '../utils/deviceDetection';

// 移动端卡片组件
const MobileCard = ({ 
  title, 
  children, 
  className = '',
  headerClassName = '',
  bodyClassName = '',
  actions,
  icon,
  badge,
  onClick
}) => {
  const deviceType = getDeviceType();
  const isMobileDevice = isMobile();
  
  // 根据设备类型调整样式
  const getCardClasses = () => {
    const baseClasses = 'bg-white rounded-lg shadow-sm border border-gray-200';
    
    if (isMobileDevice) {
      return `${baseClasses} p-4 mb-3`;
    }
    
    return `${baseClasses} p-6 mb-4`;
  };
  
  const getHeaderClasses = () => {
    const baseClasses = 'flex items-center justify-between mb-4';
    
    if (isMobileDevice) {
      return `${baseClasses} ${headerClassName}`;
    }
    
    return `${baseClasses} ${headerClassName}`;
  };
  
  const getTitleClasses = () => {
    if (isMobileDevice) {
      return 'text-lg font-semibold text-gray-900';
    }
    
    return 'text-xl font-semibold text-gray-900';
  };
  
  return (
    <div 
      className={`${getCardClasses()} ${className} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      {/* 卡片头部 */}
      {(title || icon || badge || actions) && (
        <div className={getHeaderClasses()}>
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="flex-shrink-0">
                {icon}
              </div>
            )}
            {title && (
              <h3 className={getTitleClasses()}>
                {title}
              </h3>
            )}
            {badge && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {badge}
              </span>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      
      {/* 卡片内容 */}
      <div className={bodyClassName}>
        {children}
      </div>
    </div>
  );
};

// 移动端统计卡片
export const MobileStatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  color = 'blue',
  className = ''
}) => {
  const isMobileDevice = isMobile();
  
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600'
  };
  
  return (
    <MobileCard className={`${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${isMobileDevice ? 'text-gray-600' : 'text-gray-500'}`}>
            {title}
          </p>
          <p className={`${isMobileDevice ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 mt-1`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.positive ? '↗' : '↘'} {trend.value}
              </span>
              <span className="text-xs text-gray-500 ml-1">
                {trend.period}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </MobileCard>
  );
};

// 移动端列表项组件
export const MobileListItem = ({ 
  title, 
  subtitle, 
  value, 
  icon, 
  badge,
  onClick,
  className = ''
}) => {
  const isMobileDevice = isMobile();
  
  return (
    <div 
      className={`flex items-center justify-between p-4 bg-white border-b border-gray-100 last:border-b-0 ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {icon && (
          <div className="flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`${isMobileDevice ? 'text-sm' : 'text-base'} font-medium text-gray-900 truncate`}>
            {title}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2 flex-shrink-0">
        {badge && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {badge}
          </span>
        )}
        {value && (
          <span className={`${isMobileDevice ? 'text-sm' : 'text-base'} font-medium text-gray-900`}>
            {value}
          </span>
        )}
        {onClick && (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </div>
  );
};

export default MobileCard;
