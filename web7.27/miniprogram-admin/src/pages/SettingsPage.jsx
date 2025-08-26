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
      siteName: '丘大叔茶饮管理系统',
      siteDescription: '专业的茶饮店管理系统',
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
    { id: 'system', name: '系统设置', icon: CogIcon },
    { id: 'notification', name: '通知设置', icon: BellIcon },
    { id: 'security', name: '安全设置', icon: ShieldCheckIcon },
    { id: 'logs', name: '操作日志', icon: DocumentTextIcon }
  ];

  if (loading && !settings.system.siteName) {
    return <ContentLoading />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">系统设置</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 侧边栏 */}
        <div className="lg:col-span-1">
          <div className="bg-base-100 shadow rounded-lg p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-content'
                        : 'hover:bg-base-200'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="lg:col-span-3">
          <div className="bg-base-100 shadow rounded-lg p-6">
            {/* 系统设置 */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold flex items-center">
                  <CogIcon className="w-6 h-6 mr-2" />
                  系统设置
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">网站名称</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={settings.system.siteName}
                      onChange={(e) => updateSetting('system', 'siteName', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">联系邮箱</span>
                    </label>
                    <input
                      type="email"
                      className="input input-bordered"
                      value={settings.system.contactEmail}
                      onChange={(e) => updateSetting('system', 'contactEmail', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">联系电话</span>
                    </label>
                    <input
                      type="tel"
                      className="input input-bordered"
                      value={settings.system.contactPhone}
                      onChange={(e) => updateSetting('system', 'contactPhone', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">时区</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={settings.system.timezone}
                      onChange={(e) => updateSetting('system', 'timezone', e.target.value)}
                    >
                      <option value="Asia/Shanghai">Asia/Shanghai</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">网站描述</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    value={settings.system.siteDescription}
                    onChange={(e) => updateSetting('system', 'siteDescription', e.target.value)}
                  ></textarea>
                </div>
              </div>
            )}

            {/* 通知设置 */}
            {activeTab === 'notification' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold flex items-center">
                  <BellIcon className="w-6 h-6 mr-2" />
                  通知设置
                </h2>
                
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="cursor-pointer label">
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
                    <label className="cursor-pointer label">
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
                    <label className="cursor-pointer label">
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
                    <label className="cursor-pointer label">
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
                    <label className="cursor-pointer label">
                      <span className="label-text">系统警告</span>
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

            {/* 安全设置 */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold flex items-center">
                  <ShieldCheckIcon className="w-6 h-6 mr-2" />
                  安全设置
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">会话超时时间（分钟）</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">密码最小长度</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">最大登录尝试次数</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={settings.security.loginAttempts}
                      onChange={(e) => updateSetting('security', 'loginAttempts', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="cursor-pointer label">
                      <span className="label-text">密码必须包含特殊字符</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={settings.security.requireSpecialChars}
                        onChange={(e) => updateSetting('security', 'requireSpecialChars', e.target.checked)}
                      />
                    </label>
                  </div>
                  
                  <div className="form-control">
                    <label className="cursor-pointer label">
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

            {/* 操作日志 */}
            {activeTab === 'logs' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold flex items-center">
                    <DocumentTextIcon className="w-6 h-6 mr-2" />
                    操作日志
                  </h2>
                  <button
                    onClick={fetchOperationLogs}
                    className="btn btn-sm btn-outline"
                  >
                    刷新日志
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>时间</th>
                        <th>操作</th>
                        <th>模块</th>
                        <th>动作</th>
                        <th>详情</th>
                      </tr>
                    </thead>
                    <tbody>
                      {operationLogs.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-8 text-gray-500">
                            暂无操作日志
                          </td>
                        </tr>
                      ) : (
                        operationLogs.map((log) => (
                          <tr key={log._id}>
                            <td className="text-sm">{formatTime(log.createTime)}</td>
                            <td>
                              <span className="badge badge-outline">{log.operation}</span>
                            </td>
                            <td>{log.module}</td>
                            <td>{log.action}</td>
                            <td className="text-sm text-gray-500">
                              {log.details ? JSON.stringify(log.details) : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 保存按钮 */}
            {activeTab !== 'logs' && (
              <div className="flex justify-end pt-6 border-t">
                <button
                  onClick={saveSettings}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm mr-2"></span>
                      保存中...
                    </>
                  ) : (
                    '保存设置'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;