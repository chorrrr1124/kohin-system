import React, { useState, useEffect } from 'react';
import { app, ensureLogin } from '../utils/cloudbase';
import { useToast } from '../components/Toast';

const FixImageCategoryPage = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const { addToast } = useToast();

  const imageCategories = [
    { key: 'banner', label: '轮播图' },
    { key: 'general', label: '通用图片' },
    { key: 'product', label: '商品图片' },
    { key: 'category', label: '分类图片' },
    { key: 'ad', label: '广告图片' }
  ];

  // 获取所有图片
  const fetchImages = async () => {
    setLoading(true);
    try {
      await ensureLogin();
      
      const result = await app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'getImages',
          data: {}
        }
      });

      if (result.result && result.result.success) {
        const imageList = result.result.data || [];
        setImages(imageList);
      }
    } catch (error) {
      console.error('获取图片失败:', error);
      addToast('获取图片失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 更新图片分类
  const updateImageCategory = async (imageId, newCategory) => {
    setUpdating(true);
    try {
      await ensureLogin();
      
      const result = await app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'updateImageCategory',
          data: {
            imageId: imageId,
            category: newCategory
          }
        }
      });

      if (result.result && result.result.success) {
        addToast('分类更新成功', 'success');
        await fetchImages(); // 重新获取图片列表
      } else {
        addToast('分类更新失败', 'error');
      }
    } catch (error) {
      console.error('更新分类失败:', error);
      addToast('更新分类失败', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // 删除图片
  const deleteImage = async (imageId) => {
    console.log('🔴 FixImageCategoryPage 删除按钮被点击，图片ID:', imageId);
    
    if (!window.confirm('确定要删除这张图片吗？此操作不可撤销！')) {
      console.log('❌ 用户取消删除');
      return;
    }

    console.log('✅ 用户确认删除');
    setUpdating(true);
    
    try {
      console.log('🔐 检查登录状态...');
      await ensureLogin();
      console.log('✅ 登录状态确认');
      
      console.log('☁️ 调用云函数删除图片...');
      const result = await app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'deleteImage',
          data: {
            imageId: imageId
          }
        }
      });

      console.log('📊 删除结果:', result);
      console.log('📊 删除结果类型:', typeof result);
      console.log('📊 删除结果.result:', result.result);

      if (result.result && result.result.success) {
        console.log('✅ 删除成功');
        addToast('图片删除成功', 'success');
        await fetchImages(); // 重新获取图片列表
      } else {
        console.log('❌ 删除失败，错误信息:', result.result?.error);
        addToast(`删除失败: ${result.result?.error || '未知错误'}`, 'error');
      }
    } catch (error) {
      console.error('❌ 删除图片失败:', error);
      console.error('❌ 错误堆栈:', error.stack);
      addToast(`删除失败: ${error.message}`, 'error');
    } finally {
      setUpdating(false);
      console.log('🏁 删除操作完成');
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">🔧 修复图片分类</h1>
        
        <div className="mb-4">
          <button 
            onClick={fetchImages}
            className="btn btn-outline btn-sm"
            disabled={loading}
          >
            {loading ? '加载中...' : '刷新列表'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>图片</th>
                <th>标题</th>
                <th>当前分类</th>
                <th>上传时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {images.map((image) => (
                <tr key={image._id}>
                  <td>
                    <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden cursor-pointer" onClick={() => {
                      setPreviewImage(image);
                      setShowPreviewModal(true);
                    }}>
                      {(image.imageUrl || image.url) ? (
                        <img 
                          src={image.imageUrl || image.url} 
                          alt={image.title}
                          className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                          onError={(e) => {
                            e.target.src = '/images/placeholder.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-xs">无图片</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="font-medium">{image.title || image.fileName}</div>
                    <div className="text-sm text-gray-500">{image.fileName}</div>
                  </td>
                  <td>
                    <span className={`badge ${
                      image.category === 'banner' ? 'badge-primary' :
                      image.category === 'general' ? 'badge-secondary' :
                      image.category === 'product' ? 'badge-accent' :
                      'badge-ghost'
                    }`}>
                      {imageCategories.find(cat => cat.key === image.category)?.label || image.category}
                    </span>
                  </td>
                  <td>
                    <div className="text-sm">
                      {new Date(image.createTime || image.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <div className="dropdown">
                        <button 
                          tabIndex={0} 
                          className="btn btn-ghost btn-sm"
                          disabled={updating}
                        >
                          更改分类
                        </button>
                        <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                          {imageCategories.map((category) => (
                            <li key={category.key}>
                              <a 
                                onClick={() => updateImageCategory(image._id, category.key)}
                                className={image.category === category.key ? 'active' : ''}
                              >
                                {category.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button
                        onClick={() => deleteImage(image._id)}
                        className="btn btn-sm btn-error"
                        disabled={updating}
                        title="删除图片"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {images.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">暂无图片</p>
          </div>
        )}
      </div>

      {/* 图片预览模态框 */}
      {showPreviewModal && previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowPreviewModal(false)}>
          <div className="relative max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">{previewImage.title || previewImage.fileName}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  分类: {imageCategories.find(c => c.key === previewImage.category)?.label || previewImage.category}
                </p>
              </div>
              
              <div className="p-4">
                <img
                  src={previewImage.imageUrl || previewImage.url}
                  alt={previewImage.title || previewImage.fileName}
                  className="max-w-full max-h-[60vh] object-contain mx-auto"
                  onError={(e) => {
                    e.target.src = '/images/placeholder.png';
                  }}
                />
              </div>
              
              <div className="p-4 border-t bg-gray-50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">文件大小:</span>
                    <span className="ml-2 text-gray-600">
                      {previewImage.fileSize ? `${(previewImage.fileSize / 1024).toFixed(1)}KB` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">上传时间:</span>
                    <span className="ml-2 text-gray-600">
                      {previewImage.createdAt ? new Date(previewImage.createdAt).toLocaleString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">状态:</span>
                    <span className={`ml-2 badge ${previewImage.isActive ? 'badge-success' : 'badge-error'}`}>
                      {previewImage.isActive ? '启用' : '禁用'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">排序:</span>
                    <span className="ml-2 text-gray-600">{previewImage.sortOrder || 0}</span>
                  </div>
                </div>
                
                {previewImage.linkUrl && (
                  <div className="mt-3">
                    <span className="font-medium text-sm">跳转链接:</span>
                    <a
                      href={previewImage.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm break-all"
                    >
                      {previewImage.linkUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixImageCategoryPage;
