import React from 'react';

const LoadingSpinner = ({ 
  size = 'lg', 
  text = '加载中...', 
  fullScreen = false,
  className = '',
  showText = true 
}) => {
  const sizeClasses = {
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg',
    xl: 'loading-xl'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`loading loading-spinner ${sizeClasses[size]} text-primary`}></div>
      {showText && (
        <p className="mt-3 text-base-content/70 text-sm">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-base-200/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-64">
      {spinner}
    </div>
  );
};

// 页面级加载组件
export const PageLoading = ({ text = '页面加载中...' }) => (
  <LoadingSpinner fullScreen text={text} />
);

// 内容区域加载组件
export const ContentLoading = ({ text = '数据加载中...', className = '' }) => (
  <LoadingSpinner size="md" text={text} className={className} />
);

// 按钮加载状态
export const ButtonLoading = ({ text = '处理中...', size = 'sm' }) => (
  <LoadingSpinner size={size} text={text} showText={false} className="inline-flex" />
);

// 表格加载状态
export const TableLoading = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="flex space-x-4">
          <div className="rounded-full bg-base-300 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-base-300 rounded w-3/4"></div>
            <div className="h-4 bg-base-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// 卡片加载状态
export const CardLoading = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="card bg-base-100 shadow animate-pulse">
        <div className="card-body">
          <div className="h-4 bg-base-300 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-base-300 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-base-300 rounded w-full"></div>
        </div>
      </div>
    ))}
  </div>
);

export default LoadingSpinner;