import React, { useState, useEffect } from 'react';

const TestImagePage = () => {
  const [message, setMessage] = useState('正在测试图片管理功能...');
  const [apiStatus, setApiStatus] = useState('检查中...');

  useEffect(() => {
    // 测试后端API连接
    const testAPI = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/images/categories');
        if (response.ok) {
          const data = await response.json();
          setApiStatus('后端API连接成功');
          setMessage(`找到 ${data.data?.length || 0} 个图片分类`);
        } else {
          setApiStatus('后端API连接失败');
          setMessage('无法连接到后端服务器');
        }
      } catch (error) {
        setApiStatus('后端API连接错误');
        setMessage(`连接错误: ${error.message}`);
      }
    };

    testAPI();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">图片管理测试页面</h1>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="mb-2"><strong>API状态:</strong> {apiStatus}</p>
        <p><strong>消息:</strong> {message}</p>
      </div>
    </div>
  );
};

export default TestImagePage;