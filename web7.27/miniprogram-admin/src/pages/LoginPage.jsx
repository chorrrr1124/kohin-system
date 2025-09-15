import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
      // 验证本地账号密码
      if (username !== USERNAME || password !== PASSWORD) {
        setError('账号或密码错误');
        setLoading(false);
        return;
      }

      // 设置本地登录状态
      localStorage.setItem('admin_logged_in', '1');
      localStorage.setItem('cloudbase_login_state', JSON.stringify({
        isLoggedIn: true,
        user: { uid: 'offline_admin', isOffline: true }
      }));
      
      console.log('✅ 登录成功，跳转到首页');
      navigate('/');
    } catch (error) {
      console.error('登录失败:', error);
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold text-center mb-6">
            管理员登录
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">用户名</span>
              </label>
              <input
                type="text"
                placeholder="请输入用户名"
                className="input input-bordered w-full"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">密码</span>
              </label>
              <input
                type="password"
                placeholder="请输入密码"
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}
            
            <div className="form-control mt-6">
              <button
                type="submit"
                className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </div>
          </form>
          
          <div className="mt-4 text-sm text-base-content/70">
            <p>默认账号：admin</p>
            <p>默认密码：123456</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
