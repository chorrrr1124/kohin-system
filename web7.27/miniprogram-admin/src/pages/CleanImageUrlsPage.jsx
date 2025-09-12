import React, { useState } from 'react';
import { app, ensureLogin } from '../utils/cloudbase';
import { useToast } from '../components/Toast';

const CleanImageUrlsPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { addToast } = useToast();

  const cleanImageUrls = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🧹 开始清理图片URL...');
      await ensureLogin();
      
      const cleanResult = await app.callFunction({
        name: 'cleanImageUrls',
        data: {}
      });
      
      console.log('📊 清理结果:', cleanResult);
      
      if (cleanResult.result && cleanResult.result.success) {
        setResult(cleanResult.result);
        addToast('图片URL清理完成！', 'success');
      } else {
        addToast(`清理失败: ${cleanResult.result?.error || '未知错误'}`, 'error');
      }
      
    } catch (error) {
      console.error('❌ 清理失败:', error);
      addToast(`清理失败: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">清理图片URL</h1>
        <p className="text-gray-600 mt-1">清理数据库中的模拟URL，生成正确的CloudBase URL</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">操作说明</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 扫描数据库中的所有图片记录</li>
            <li>• 检测包含 mock-cdn.example.com 的无效URL</li>
            <li>• 根据 fileID 或 cloudPath 生成正确的CloudBase URL</li>
            <li>• 更新数据库中的图片URL字段</li>
          </ul>
        </div>

        <div className="flex gap-4 items-center">
          <button
            onClick={cleanImageUrls}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2"></span>
                清理中...
              </>
            ) : (
              '开始清理'
            )}
          </button>
          
          {result && (
            <div className="text-sm text-gray-600">
              清理完成：更新了 {result.data?.updated || 0} 张图片
            </div>
          )}
        </div>

        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">清理结果</h3>
            <div className="text-sm text-green-700 space-y-1">
              <div>总图片数：{result.data?.total || 0}</div>
              <div>已更新：{result.data?.updated || 0}</div>
              <div>已跳过：{result.data?.skipped || 0}</div>
            </div>
            <div className="mt-2 text-xs text-green-600">
              {result.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CleanImageUrlsPage;
