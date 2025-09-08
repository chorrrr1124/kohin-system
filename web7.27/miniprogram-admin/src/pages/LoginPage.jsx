import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ensureLogin } from '../utils/cloudbase';

const USERNAME = 'admin';
const PASSWORD = '123456';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. 验证本地账号密码
      if (username !== USERNAME || password !== PASSWORD) {
        setError('账号或密码错误');
        setLoading(false);
        return;
      }

      // 2. 初始化CloudBase认证
      console.log('🔐 开始CloudBase认证...');
      try {
        const loginState = await ensureLogin();
        
        if (loginState && loginState.isLoggedIn) {
          console.log('✅ CloudBase认证成功');
          // 3. 设置本地登录状态
          localStorage.setItem('admin_logged_in', '1');
          localStorage.setItem('cloudbase_login_state', JSON.stringify(loginState));
          navigate('/');
        } else {
          console.warn('⚠️ CloudBase认证返回异常状态，使用降级模式');
          // 降级模式：仅设置本地登录状态
          localStorage.setItem('admin_logged_in', '1');
          localStorage.setItem('cloudbase_login_state', JSON.stringify({
            isLoggedIn: true,
            user: { uid: 'offline_admin', isOffline: true }
          }));
          navigate('/');
        }
      } catch (cloudbaseError) {
        console.warn('⚠️ CloudBase认证失败，使用降级模式:', cloudbaseError.message);
        // 降级模式：仅设置本地登录状态
        localStorage.setItem('admin_logged_in', '1');
        localStorage.setItem('cloudbase_login_state', JSON.stringify({
          isLoggedIn: true,
          user: { uid: 'offline_admin', isOffline: true }
        }));
        navigate('/');
      }
    } catch (error) {
      console.error('❌ 登录过程出错:', error);
      setError(`登录失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">后台登录</h1>
          <p className="text-gray-600">欢迎使用管理后台</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              账号
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="请输入账号"
              autoFocus
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          
          <button 
            className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                登录中...
              </div>
            ) : (
              '登录'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            默认账号：admin / 密码：123456
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 