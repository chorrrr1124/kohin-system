import React, { useState, useEffect } from 'react';
import { app, ensureLogin } from '../utils/cloudbase';
import { useToast } from '../components/Toast';

const FixImageCategoryPage = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
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
          action: 'getImageList',
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
                    <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden">
                      {image.imageUrl ? (
                        <img 
                          src={image.imageUrl} 
                          alt={image.title}
                          className="w-full h-full object-cover"
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
    </div>
  );
};

export default FixImageCategoryPage;
