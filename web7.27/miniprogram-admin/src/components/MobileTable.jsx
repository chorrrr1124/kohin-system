import React from 'react';
import { isMobile, getDeviceType } from '../utils/deviceDetection';

// 移动端表格组件
const MobileTable = ({ 
  data = [], 
  columns = [], 
  className = '',
  cardClassName = '',
  showHeader = true 
}) => {
  const deviceType = getDeviceType();
  const isMobileDevice = isMobile();
  
  // 移动端渲染：卡片式布局
  if (isMobileDevice) {
    return (
      <div className={`space-y-3 ${className}`}>
        {data.map((row, index) => (
          <div 
            key={index} 
            className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${cardClassName}`}
          >
            {columns.map((column, colIndex) => {
              const value = row[column.key];
              const displayValue = column.render ? column.render(value, row, index) : value;
              
              return (
                <div key={colIndex} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-gray-600 font-medium text-sm min-w-0 flex-shrink-0">
                    {column.title}:
                  </span>
                  <span className="text-gray-900 text-sm text-right flex-1 ml-2 break-words">
                    {displayValue}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }
  
  // 桌面端渲染：传统表格
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        {showHeader && (
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th 
                  key={index}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {columns.map((column, colIndex) => {
                const value = row[column.key];
                const displayValue = column.render ? column.render(value, row, rowIndex) : value;
                
                return (
                  <td 
                    key={colIndex}
                    className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100"
                  >
                    {displayValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 移动端状态标签组件
export const MobileStatusBadge = ({ status, type = 'default' }) => {
  const getStatusConfig = (status, type) => {
    const configs = {
      order: {
        '已完成': { color: 'bg-green-100 text-green-800', icon: '✓' },
        '待处理': { color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
        '已取消': { color: 'bg-red-100 text-red-800', icon: '✗' },
        '处理中': { color: 'bg-blue-100 text-blue-800', icon: '🔄' },
        '待发货': { color: 'bg-orange-100 text-orange-800', icon: '📦' },
        '已发货': { color: 'bg-purple-100 text-purple-800', icon: '🚚' }
      },
      inventory: {
        '库存充足': { color: 'bg-green-100 text-green-800', icon: '✓' },
        '库存不足': { color: 'bg-red-100 text-red-800', icon: '⚠️' },
        '库存预警': { color: 'bg-yellow-100 text-yellow-800', icon: '⚠️' }
      },
      default: {
        '正常': { color: 'bg-green-100 text-green-800', icon: '✓' },
        '异常': { color: 'bg-red-100 text-red-800', icon: '✗' },
        '警告': { color: 'bg-yellow-100 text-yellow-800', icon: '⚠️' }
      }
    };
    
    return configs[type]?.[status] || configs.default[status] || { 
      color: 'bg-gray-100 text-gray-800', 
      icon: '•' 
    };
  };
  
  const config = getStatusConfig(status, type);
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <span className="mr-1">{config.icon}</span>
      {status}
    </span>
  );
};

// 移动端时间显示组件
export const MobileTimeDisplay = ({ time, format = 'short' }) => {
  if (!time) return '-';
  
  const date = new Date(time);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (format === 'relative') {
    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    }
  }
  
  // 移动端优化：只显示月-日 时:分
  if (isMobile()) {
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // 桌面端：完整时间
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default MobileTable;
