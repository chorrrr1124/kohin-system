import React, { useState, useEffect } from 'react';
import { app, ensureLogin } from '../utils/cloudbase';

const TestImagePage = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // 获取图片列表
  const fetchImages = async () => {
    setLoading(true);
    setDebugInfo('开始获取图片...');
    
    try {
      console.log('🔍 开始获取图片列表...');
      await ensureLogin();
      console.log('✅ 登录成功，开始调用云函数...');
      
      // 使用云函数查询图片
      const result = await app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'getImages',
          data: {
            category: 'banner'
          }
        }
      });
      
      console.log('📊 云函数查询结果:', result);
      setDebugInfo(`云函数返回: ${JSON.stringify(result, null, 2)}`);
      
      if (result.result && result.result.success) {
        setImages(result.result.data || []);
        console.log('✅ 图片列表更新成功，共', result.result.data?.length || 0, '张图片');
        setDebugInfo(`成功获取 ${result.result.data?.length || 0} 张图片`);
      } else {
        console.error('❌ 云函数查询失败:', result.result?.error);
        setDebugInfo(`查询失败: ${result.result?.error || '未知错误'}`);
        setImages([]);
      }
    } catch (error) {
      console.error('❌ 获取图片失败:', error);
      setDebugInfo(`错误: ${error.message}`);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 页面加载，开始获取图片...');
    fetchImages();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">图片加载测试页面</h1>
      
      <div className="mb-4">
        <button 
          onClick={fetchImages}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {loading ? '加载中...' : '重新获取图片'}
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">调试信息:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
          {debugInfo}
        </pre>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">图片列表 ({images.length} 张):</h2>
        {images.length === 0 ? (
          <p className="text-gray-500">暂无图片</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={image._id || index} className="border rounded p-4">
                <h3 className="font-semibold">{image.data?.fileName || '未命名'}</h3>
                <p className="text-sm text-gray-600">分类: {image.data?.category}</p>
                <p className="text-sm text-gray-600">排序: {image.data?.sortOrder || 0}</p>
                {image.data?.url && (
                  <img 
                    src={image.data.url} 
                    alt={image.data.fileName}
                    className="w-full h-32 object-cover mt-2 rounded"
                    onError={(e) => {
                      console.log('图片加载失败:', image.data?.url);
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <p className="text-xs text-gray-500 mt-2">URL: {image.data?.url}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestImagePage;
