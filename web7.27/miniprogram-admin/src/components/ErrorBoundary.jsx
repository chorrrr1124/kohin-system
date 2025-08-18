import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // 记录错误到控制台
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 可以在这里添加错误上报逻辑
    // reportError(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
          <div className="card w-96 bg-base-100 shadow-xl">
            <div className="card-body text-center">
              <ExclamationTriangleIcon className="w-16 h-16 mx-auto text-error mb-4" />
              <h2 className="card-title justify-center text-error">页面出现错误</h2>
              <p className="text-base-content/70 mb-4">
                抱歉，页面遇到了一些问题。请尝试刷新页面或联系管理员。
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="collapse collapse-arrow bg-base-200 mb-4">
                  <input type="checkbox" /> 
                  <div className="collapse-title text-sm font-medium">
                    查看错误详情
                  </div>
                  <div className="collapse-content text-xs text-left">
                    <pre className="whitespace-pre-wrap break-words">
                      {this.state.error.toString()}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              )}
              
              <div className="card-actions justify-center">
                <button 
                  className="btn btn-primary"
                  onClick={this.handleRetry}
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  重试
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => window.location.reload()}
                >
                  刷新页面
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;