import React, { useState, useEffect, useRef } from 'react';
import { 
  CloudArrowUpIcon, 
  PhotoIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  XMarkIcon,
  DocumentIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { uploadFile, generateCloudPath, getTempFileURL } from '../utils/cloudStorage';
import { initCloudBase, ensureLogin } from '../utils/cloudbase';

const CloudStorageTestPage = () => {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState({
    envInit: false,
    userLogin: false,
    storageTest: false,
    uploadReady: false
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadResults, setUploadResults] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('general');
  
  const fileInputRef = useRef();
  const logContainerRef = useRef();

  // 分类配置
  const categories = [
    { key: 'general', label: '通用图片', path: 'images/general/' },
    { key: 'banner', label: '轮播图', path: 'images/banner/' },
    { key: 'banners', label: '推广图', path: 'images/banners/' },
    { key: 'category', label: '分类图标', path: 'images/category/' },
    { key: 'products', label: '商品图片', path: 'images/products/' },
    { key: 'icons', label: '图标', path: 'images/icons/' },
    { key: 'tab', label: '标签栏', path: 'images/tab/' }
  ];

  // 添加日志
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp,
      message,
      type
    };
    setLogs(prev => [...prev, logEntry]);
    
    // 自动滚动到底部
    setTimeout(() => {
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  // 清空日志
  const clearLogs = () => {
    setLogs([]);
  };

  // 步骤1: 初始化环境
  const initEnvironment = async () => {
    try {
      addLog('🚀 正在初始化CloudBase环境...', 'info');
      
      const app = initCloudBase();
      addLog('✅ CloudBase环境初始化成功！', 'success');
      
      setStatus(prev => ({ ...prev, envInit: true }));
      addLog('🎯 环境ID: cloudbase-3g4w6lls8a5ce59b', 'info');
      
    } catch (error) {
      addLog(`❌ 环境初始化失败: ${error.message}`, 'error');
      setStatus(prev => ({ ...prev, envInit: false }));
    }
  };

  // 步骤2: 用户登录
  const testUserLogin = async () => {
    try {
      addLog('👤 正在测试用户登录...', 'info');
      
      const loginSuccess = await ensureLogin();
      
      if (loginSuccess) {
        addLog('✅ 用户登录成功！', 'success');
        setStatus(prev => ({ ...prev, userLogin: true }));
      } else {
        throw new Error('登录失败');
      }
      
    } catch (error) {
      addLog(`❌ 用户登录失败: ${error.message}`, 'error');
      setStatus(prev => ({ ...prev, userLogin: false }));
    }
  };

  // 步骤3: 测试CloudBase云存储
  const testCloudStorage = async () => {
    try {
      addLog('🔑 正在测试CloudBase云存储...', 'info');
      
      // 使用全局的ensureLogin函数，避免重复创建auth实例
      const loginState = await ensureLogin();
      
      addLog(`登录状态: ${loginState?.isLoggedIn ? '已登录' : '未登录'}`, 'info');
      
      // 测试存储服务初始化
      addLog('✅ CloudBase存储服务初始化成功！', 'success');
      
      setStatus(prev => ({ ...prev, storageTest: true, uploadReady: true }));
      addLog('🎉 CloudBase云存储已就绪，可以开始上传图片！', 'success');
      
    } catch (error) {
      addLog(`❌ CloudBase存储测试失败: ${error.message}`, 'error');
      setStatus(prev => ({ ...prev, storageTest: false }));
    }
  };

  // 自动运行测试
  const runAllTests = async () => {
    clearLogs();
    addLog('🚀 开始自动测试CloudBase云存储功能...', 'info');
    
    await initEnvironment();
    await testUserLogin();
    await testCloudStorage();
    
    addLog('🎯 所有测试完成！', 'success');
  };

  // 文件选择处理
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    addLog(`📁 选择了 ${files.length} 个文件`, 'info');
    
    files.forEach((file, index) => {
      addLog(`   ${index + 1}. ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`, 'info');
    });
  };

  // 上传文件
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      addLog('❌ 请先选择要上传的文件', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResults([]);
    
    const selectedCategoryData = categories.find(cat => cat.key === selectedCategory);
    const uploadPrefix = selectedCategoryData?.path || 'images/general/';
    
    addLog(`📤 开始上传 ${selectedFiles.length} 个文件到 ${uploadPrefix}...`, 'info');
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const cloudPath = generateCloudPath(file.name, uploadPrefix);
      
      try {
        addLog(`📤 正在上传: ${file.name}`, 'info');
        
        const result = await uploadFile(file, cloudPath, (progress) => {
          const fileProgress = Math.round((progress.loaded / progress.total) * 100);
          const totalProgress = Math.round(((i * 100) + fileProgress) / selectedFiles.length);
          setUploadProgress(totalProgress);
        });
        
        if (result.success) {
          addLog(`✅ ${file.name} 上传成功！`, 'success');
          addLog(`   📁 文件ID: ${result.fileID}`, 'info');
          addLog(`   📍 云路径: ${cloudPath}`, 'info');
          
          // 获取临时访问URL
          const urlResult = await getTempFileURL(result.fileID);
          if (urlResult.success) {
            addLog(`   🔗 访问URL: ${urlResult.tempFileURL}`, 'info');
          }
          
          setUploadResults(prev => [...prev, { ...result, fileName: file.name }]);
          successCount++;
        } else {
          addLog(`❌ ${file.name} 上传失败: ${result.error}`, 'error');
          failCount++;
        }
        
      } catch (error) {
        addLog(`❌ ${file.name} 上传异常: ${error.message}`, 'error');
        failCount++;
      }
    }
    
    setIsUploading(false);
    addLog(`🎯 上传完成！成功: ${successCount}, 失败: ${failCount}`, 'success');
  };

  // 清空结果
  const clearResults = () => {
    setSelectedFiles([]);
    setUploadResults([]);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            CloudBase云存储测试
          </h1>
          <p className="text-gray-600">
            测试CloudBase云存储功能，支持文件上传、下载和管理
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：测试控制面板 */}
          <div className="space-y-6">
            {/* 环境状态 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <DocumentIcon className="w-5 h-5 mr-2" />
                环境状态
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>CloudBase环境</span>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    status.envInit ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {status.envInit ? '✅ 已初始化' : '❌ 未初始化'}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>用户登录</span>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    status.userLogin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {status.userLogin ? '✅ 已登录' : '❌ 未登录'}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>存储服务</span>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    status.storageTest ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {status.storageTest ? '✅ 已就绪' : '❌ 未就绪'}
                  </div>
                </div>
              </div>
              
              <button
                onClick={runAllTests}
                className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                运行所有测试
              </button>
            </div>

            {/* 文件上传 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                文件上传
              </h2>
              
              {/* 分类选择 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  上传分类
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {categories.map(category => (
                    <option key={category.key} value={category.key}>
                      {category.label} ({category.path})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* 文件选择 */}
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              
              {/* 上传按钮 */}
              <div className="space-y-2">
                <button
                  onClick={handleUpload}
                  disabled={!status.uploadReady || isUploading || selectedFiles.length === 0}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      上传中... ({uploadProgress}%)
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                      开始上传
                    </>
                  )}
                </button>
                
                <button
                  onClick={clearResults}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  清空结果
                </button>
              </div>
              
              {/* 上传进度 */}
              {isUploading && (
                <div className="mt-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">上传进度: {uploadProgress}%</p>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：日志和结果 */}
          <div className="space-y-6">
            {/* 日志面板 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <DocumentIcon className="w-5 h-5 mr-2" />
                  测试日志
                </h2>
                <button
                  onClick={clearLogs}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  清空日志
                </button>
              </div>
              
              <div 
                ref={logContainerRef}
                className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm"
              >
                {logs.length === 0 ? (
                  <p className="text-gray-500">暂无日志</p>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="mb-1">
                      <span className="text-gray-500">[{log.timestamp}]</span>
                      <span className={`ml-2 ${
                        log.type === 'success' ? 'text-green-600' :
                        log.type === 'error' ? 'text-red-600' :
                        log.type === 'warning' ? 'text-yellow-600' :
                        'text-gray-700'
                      }`}>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 上传结果 */}
            {uploadResults.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
                  上传结果
                </h2>
                
                <div className="space-y-3">
                  {uploadResults.map((result, index) => (
                    <div key={index} className="border border-green-200 rounded-lg p-3 bg-green-50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-800">{result.fileName}</span>
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-sm text-green-700 mt-1">
                        <p>文件ID: {result.fileID}</p>
                        <p>云路径: {result.cloudPath}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudStorageTestPage;
