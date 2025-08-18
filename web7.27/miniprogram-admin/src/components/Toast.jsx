import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

const Toast = ({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose,
  position = 'top-right',
  showCloseButton = true 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-success',
          textColor: 'text-success-content',
          icon: CheckCircleIcon
        };
      case 'error':
        return {
          bgColor: 'bg-error',
          textColor: 'text-error-content',
          icon: XCircleIcon
        };
      case 'warning':
        return {
          bgColor: 'bg-warning',
          textColor: 'text-warning-content',
          icon: ExclamationTriangleIcon
        };
      default:
        return {
          bgColor: 'bg-info',
          textColor: 'text-info-content',
          icon: InformationCircleIcon
        };
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  if (!isVisible) return null;

  const { bgColor, textColor, icon: Icon } = getTypeStyles();
  const positionStyles = getPositionStyles();

  return (
    <div 
      className={`
        fixed z-50 ${positionStyles}
        transition-all duration-300 ease-in-out
        ${isLeaving ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'}
      `}
    >
      <div className={`
        alert ${bgColor} ${textColor} shadow-lg min-w-80 max-w-md
        flex items-center justify-between
      `}>
        <div className="flex items-center">
          <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="text-sm font-medium">{message}</span>
        </div>
        
        {showCloseButton && (
          <button 
            onClick={handleClose}
            className="btn btn-ghost btn-sm btn-circle ml-3"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Toast 容器组件
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          position={toast.position}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
};

// Toast Hook
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      duration: options.duration || 3000,
      position: options.position || 'top-right'
    };

    setToasts(prev => [...prev, toast]);

    // 自动移除
    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (message, options) => addToast(message, 'success', options);
  const error = (message, options) => addToast(message, 'error', options);
  const warning = (message, options) => addToast(message, 'warning', options);
  const info = (message, options) => addToast(message, 'info', options);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
};

export default Toast;