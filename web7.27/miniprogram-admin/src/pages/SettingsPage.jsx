import React, { useState, useEffect } from 'react';
import {
  CogIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  BellIcon,
  GlobeAltIcon,
  KeyIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { app, ensureLogin } from '../utils/cloudbase';
import { ContentLoading, CardLoading } from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

const SettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('system');
  const [settings, setSettings] = useState({
    system: {
      siteName: '管理系统',
      siteDescription: '专业的店铺管理系统',
      contactEmail: 'admin@example.com',
      contactPhone: '400-123-4567',
      timezone: 'Asia/Shanghai',
      language: 'zh-CN'
    },
    notification: {
      emailNotifications: true,
      smsNotifications: false,
      orderNotifications: true,
      stockAlerts: true,
      systemAlerts: true
    },
    security: {
      sessionTimeout: 30,
      passwordMinLength: 8,
      requireSpecialChars: true,
      enableTwoFactor: false,
      loginAttempts: 5
    }
  });
  const [operationLogs, setOperationLogs] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // 获取操作日志
  const fetchOperationLogs = async () => {
    try {
      const db = app.database();
      const result = await db.collection('operationLogs')
        .orderBy('createTime', 'desc')
        .limit(20)
        .get();
      
      setOperationLogs(result.data);
    } catch (error) {
      console.error('获取操作日志失败:', error);
    }
  };

  // 保存设置
  const saveSettings = async () => {
    console.log('开始保存设置...');
    console.log('当前设置数据:', settings);
    
    setLoading(true);
    try {
      // 确保用户已登录
      console.log('检查登录状态...');
      await ensureLogin();
      console.log('登录状态检查完成');
      
      const db = app.database();
      console.log('数据库实例获取成功');
      
      // 保存系统设置到数据库
      console.log('开始保存到systemSettings集合...');
      const saveResult = await db.collection('systemSettings').doc('main').set({
        ...settings,
        updateTime: new Date()
      });
      console.log('systemSettings保存结果:', saveResult);
      
      // 记录操作日志
      console.log('开始记录操作日志...');
      const logResult = await db.collection('operationLogs').add({
        operation: 'update',
        module: 'system',
        action: 'update_settings',
        details: { tab: activeTab },
        createTime: new Date()
      });
      console.log('操作日志记录结果:', logResult);
      
      console.log('设置保存完成！');
      addToast('设置保存成功！', 'success');
      
    } catch (error) {
      console.error('保存设置失败 - 详细错误信息:', error);
      console.error('错误类型:', error.name);
      console.error('错误消息:', error.message);
      console.error('错误堆栈:', error.stack);
      addToast(`保存设置失败：${error.message}`, 'error');
    } finally {
      setLoading(false);
      console.log('保存操作结束，loading状态已重置');
    }
  };

  // 加载设置
  const loadSettings = async () => {
    try {
      const db = app.database();
      const result = await db.collection('systemSettings').doc('main').get();
      
      if (result.data) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...result.data
        }));
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  };

  useEffect(() => {
    ensureLogin();
    loadSettings();
    fetchOperationLogs();
  }, []);

  // 更新设置
  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '未知';
    return new Date(timestamp).toLocaleString();
  };

  const tabs = [
    { id: 'system', label: '系统设置', icon: CogIcon },
    { id: 'notification', label: '通知设置', icon: BellIcon },
    { id: 'security', label: '安全设置', icon: ShieldCheckIcon },
    { id: 'logs', label: '操作日志', icon: DocumentTextIcon }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
        <p className="text-gray-600 mt-1">管理系统配置和参数</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        {/* 标签页导航 */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* 标签页内容 */}
        <div className="p-6">
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">
                    <span className="label-text">网站名称</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={settings.system.siteName}
                    onChange={(e) => updateSetting('system', 'siteName', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">联系电话</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={settings.system.contactPhone}
                    onChange={(e) => updateSetting('system', 'contactPhone', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">联系邮箱</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered w-full"
                    value={settings.system.contactEmail}
                    onChange={(e) => updateSetting('system', 'contactEmail', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">时区</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={settings.system.timezone}
                    onChange={(e) => updateSetting('system', 'timezone', e.target.value)}
                  >
                    <option value="Asia/Shanghai">Asia/Shanghai</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">网站描述</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-24"
                  value={settings.system.siteDescription}
                  onChange={(e) => updateSetting('system', 'siteDescription', e.target.value)}
                />
              </div>
            </div>
          )}

          {activeTab === 'notification' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">邮件通知</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={settings.notification.emailNotifications}
                      onChange={(e) => updateSetting('notification', 'emailNotifications', e.target.checked)}
                    />
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">短信通知</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={settings.notification.smsNotifications}
                      onChange={(e) => updateSetting('notification', 'smsNotifications', e.target.checked)}
                    />
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">订单通知</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={settings.notification.orderNotifications}
                      onChange={(e) => updateSetting('notification', 'orderNotifications', e.target.checked)}
                    />
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">库存预警</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={settings.notification.stockAlerts}
                      onChange={(e) => updateSetting('notification', 'stockAlerts', e.target.checked)}
                    />
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">系统警报</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={settings.notification.systemAlerts}
                      onChange={(e) => updateSetting('notification', 'systemAlerts', e.target.checked)}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">
                    <span className="label-text">会话超时时间（分钟）</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">密码最小长度</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">登录尝试次数限制</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={settings.security.loginAttempts}
                    onChange={(e) => updateSetting('security', 'loginAttempts', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">要求特殊字符</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={settings.security.requireSpecialChars}
                      onChange={(e) => updateSetting('security', 'requireSpecialChars', e.target.checked)}
                    />
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">启用双因素认证</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={settings.security.enableTwoFactor}
                      onChange={(e) => updateSetting('security', 'enableTwoFactor', e.target.checked)}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">最近操作日志</h3>
                <button
                  onClick={fetchOperationLogs}
                  className="btn btn-outline btn-sm"
                >
                  刷新
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="table w-full table-fixed">
                  <thead>
                    <tr>
                      <th>操作</th>
                      <th>模块</th>
                      <th>动作</th>
                      <th>时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operationLogs.map((log, index) => (
                      <tr key={index}>
                        <td>{log.operation}</td>
                        <td>{log.module}</td>
                        <td>{log.action}</td>
                        <td>{formatTime(log.createTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 保存按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? '保存中...' : '保存设置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
