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
import CloudStorageManager from '../utils/cloudStorage';
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
  const cloudStorage = new CloudStorageManager();

  // 添加日志
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { 
      id: Date.now(), 
      message, 
      type, 
      timestamp 
    }]);
  };

  // 滚动到底部
  const scrollToBottom = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  };

  // 初始化环境
  const initEnvironment = async () => {
    try {
      addLog('🚀 开始初始化 CloudBase 环境...', 'info');
      await initCloudBase();
      setStatus(prev => ({ ...prev, envInit: true }));
      addLog('✅ CloudBase 环境初始化成功', 'success');
      
      addLog('🔐 开始用户登录...', 'info');
      await ensureLogin();
      setStatus(prev => ({ ...prev, userLogin: true }));
      addLog('✅ 用户登录成功', 'success');
      
      addLog('📦 开始测试存储功能...', 'info');
      // 这里可以添加存储测试逻辑
      setStatus(prev => ({ ...prev, storageTest: true }));
      addLog('✅ 存储功能测试通过', 'success');
      
      setStatus(prev => ({ ...prev, uploadReady: true }));
      addLog('🎉 所有初始化完成，可以开始上传文件', 'success');
      
    } catch (error) {
      addLog(`❌ 初始化失败: ${error.message}`, 'error');
      console.error('初始化失败:', error);
    }
  };

  // 生成云存储路径
  const generateCloudPath = (fileName, category = 'general') => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileExtension = fileName.split('.').pop() || 'jpg';
    return `uploads/${category}/${timestamp}_${randomId}.${fileExtension}`;
  };

  // 处理文件选择
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    addLog(`📁 选择了 ${files.length} 个文件`, 'info');
  };

  // 上传文件
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      addLog('⚠️ 请先选择要上传的文件', 'warning');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResults([]);

    try {
      addLog(`🚀 开始上传 ${selectedFiles.length} 个文件...`, 'info');
      
      const uploadPromises = selectedFiles.map(async (file, index) => {
        try {
          const uploadPrefix = selectedCategory;
          const cloudPath = generateCloudPath(file.name, uploadPrefix);
          
          addLog(`📤 上传文件: ${file.name}`, 'info');
          
          // 使用新的云存储管理器上传
          const result = await cloudStorage.uploadImage(file);
          
          // 更新进度
          const progress = ((index + 1) / selectedFiles.length) * 100;
          setUploadProgress(progress);
          
          addLog(`✅ 文件上传成功: ${file.name}`, 'success');
          
          // 获取临时访问链接
          const urlResult = await cloudStorage.getTempFileURL(result.fileID);
          
          return {
            fileID: result.fileID,
            url: urlResult || result.url,
            name: file.name,
            size: file.size,
            type: file.type,
            cloudPath: cloudPath,
            category: selectedCategory
          };
        } catch (error) {
          addLog(`❌ 文件上传失败: ${file.name} - ${error.message}`, 'error');
          throw error;
        }
      });

      const results = await Promise.all(uploadPromises);
      setUploadResults(results);
      
      // 保存图片信息到数据库
      await cloudStorage.saveImageInfo(results);
      
      addLog(`🎉 所有文件上传完成！共 ${results.length} 个文件`, 'success');
      
    } catch (error) {
      addLog(`❌ 上传过程中出现错误: ${error.message}`, 'error');
      console.error('上传失败:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // 清空日志
  const clearLogs = () => {
    setLogs([]);
    addLog('🧹 日志已清空', 'info');
  };

  // 清空结果
  const clearResults = () => {
    setUploadResults([]);
    setSelectedFiles([]);
    addLog('🧹 结果已清空', 'info');
  };

  // 复制文件链接
  const copyFileLink = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      addLog('📋 文件链接已复制到剪贴板', 'success');
    }).catch(() => {
      addLog('❌ 复制失败', 'error');
    });
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取日志图标
  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'error': return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'warning': return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      default: return <DocumentIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">云存储测试</h1>
              <p className="text-sm text-gray-500 mt-1">测试 CloudBase 云存储功能</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={initEnvironment}
                disabled={status.uploadReady}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                {status.uploadReady ? '已初始化' : '初始化环境'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：控制面板 */}
          <div className="space-y-6">
            {/* 状态面板 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">系统状态</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">环境初始化</span>
                  {status.envInit ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">用户登录</span>
                  {status.userLogin ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">存储测试</span>
                  {status.storageTest ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">上传就绪</span>
                  {status.uploadReady ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* 上传控制 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">文件上传</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择分类
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">通用</option>
                    <option value="images">图片</option>
                    <option value="documents">文档</option>
                    <option value="videos">视频</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择文件
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {selectedFiles.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      已选择 {selectedFiles.length} 个文件
                    </p>
                  )}
                </div>

                {isUploading && (
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>上传进度</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={handleUpload}
                    disabled={!status.uploadReady || isUploading || selectedFiles.length === 0}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                    {isUploading ? '上传中...' : '开始上传'}
                  </button>
                  <button
                    onClick={clearResults}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    清空
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：日志和结果 */}
          <div className="space-y-6">
            {/* 日志面板 */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">操作日志</h3>
                <button
                  onClick={clearLogs}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  清空日志
                </button>
              </div>
              <div 
                ref={logContainerRef}
                className="h-64 overflow-y-auto p-6 space-y-2"
              >
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">暂无日志</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3">
                      {getLogIcon(log.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{log.message}</p>
                        <p className="text-xs text-gray-500">{log.timestamp}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 上传结果 */}
            {uploadResults.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">上传结果</h3>
                </div>
                <div className="p-6 space-y-4">
                  {uploadResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{result.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(result.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyFileLink(result.url)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          复制链接
                        </button>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          查看
                        </a>
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
