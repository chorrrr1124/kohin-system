import React, { useState } from 'react';
import { uploadToCOS } from '../utils/cos';
import { initCloudBase } from '../utils/cloudbase';

const TestCosUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const testCloudBase = async () => {
    try {
      addLog('开始测试云开发连接...');
      const app = initCloudBase();
      
      // 测试登录
      const auth = app.auth();
      let loginState = await auth.getLoginState();
      
      if (!loginState || !loginState.isLoggedIn) {
        addLog('执行匿名登录...');
        await auth.signInAnonymously();
        loginState = await auth.getLoginState();
      }
      
      addLog(`登录状态: ${loginState?.isLoggedIn ? '已登录' : '未登录'} (用户ID: ${loginState?.user?.uid || '匿名'})`);
      
      // 测试云函数调用
      addLog('测试调用getCosSts云函数...');
      const res = await app.callFunction({ 
        name: 'getCosSts',
        data: { prefix: 'images/' }
      });
      
      addLog(`云函数原始返回: ${JSON.stringify(res, null, 2)}`);
      
      // 详细分析返回的数据结构
      const data = res?.result;
      addLog(`result字段: ${JSON.stringify(data, null, 2)}`);
      
      if (data?.success) {
        addLog(`success为true，检查data字段...`);
        addLog(`data.data: ${JSON.stringify(data?.data, null, 2)}`);
        
        const creds = data?.data?.credentials;
        addLog(`credentials: ${JSON.stringify(creds, null, 2)}`);
        addLog(`密钥信息: tmpSecretId-${creds?.tmpSecretId ? '已获取' : '缺失'}, ExpiredTime-${data?.data?.expiredTime || '未知'}`);
      } else {
        addLog(`云函数执行失败: ${data?.error || '未知错误'}`);
        // 兼容旧的数据结构
        const tmpSecretId = data?.tmpSecretId || data?.TmpSecretId;
        const expiredTime = data?.expiredTime || data?.ExpiredTime;
        if (tmpSecretId) {
          addLog(`发现旧格式密钥信息: tmpSecretId=${tmpSecretId ? '已获取' : '缺失'}, ExpiredTime=${expiredTime || '未知'}`);
        }
      }
      
    } catch (err) {
      addLog(`测试失败: ${err.message}`);
      console.error('测试失败:', err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    addLog(`选择文件: ${selectedFile?.name}`);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('请选择文件');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);
    addLog('开始上传文件...');

    try {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileExtension = file.name.split('.').pop();
      const fileName = `test_${timestamp}_${randomStr}.${fileExtension}`;
      
      addLog(`生成文件名: ${fileName}`);
      
      const result = await uploadToCOS(file, fileName, 'general');
      addLog(`上传成功: ${JSON.stringify(result)}`);
      setResult(result);
    } catch (err) {
      addLog(`上传失败: ${err.message}`);
      setError(err.message);
      console.error('上传失败:', err);
    } finally {
      setUploading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">COS上传测试页面</h1>
      
      <div className="space-y-6">
        {/* 云开发连接测试 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">云开发连接测试</h2>
          <button 
            onClick={testCloudBase}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            测试云开发连接和云函数
          </button>
        </div>

        {/* 文件上传测试 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">文件上传测试</h2>
          <div className="space-y-4">
            <div>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            
            <button 
              onClick={handleUpload}
              disabled={!file || uploading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? '上传中...' : '上传文件'}
            </button>
          </div>
        </div>

        {/* 结果显示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <h3 className="text-red-800 font-semibold">错误信息:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h3 className="text-green-800 font-semibold">上传成功:</h3>
            <pre className="text-green-700 text-sm mt-2">{JSON.stringify(result, null, 2)}</pre>
            {result.url && (
              <div className="mt-4">
                <img src={result.url} alt="上传的图片" className="max-w-xs rounded" />
              </div>
            )}
          </div>
        )}

        {/* 日志显示 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">调试日志:</h3>
            <button 
              onClick={clearLogs}
              className="text-sm bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
            >
              清空日志
            </button>
          </div>
          <div className="bg-black text-green-400 p-3 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">暂无日志</div>
            ) : (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCosUpload;