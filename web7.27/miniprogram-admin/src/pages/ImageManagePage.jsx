import React, { useState, useEffect } from 'react';
import { PhotoIcon, PlusIcon, PencilIcon, TrashIcon, EyeIcon, FolderIcon } from '@heroicons/react/24/outline';
import { app, ensureLogin } from '../utils/cloudbase';
import { ContentLoading, CardLoading } from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

const ImageManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [activeTab, setActiveTab] = useState('banner');
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    sortOrder: 0,
    isActive: true,
    category: 'banner'
  });

  const imageCategories = [
    { key: 'all', label: '全部图片', path: 'all' },
    { key: 'banner', label: '轮播图', path: 'banner' },
    { key: 'general', label: '通用图片', path: 'general' },
    { key: 'product', label: '商品图片', path: 'product' },
    { key: 'category', label: '分类图片', path: 'category' },
    { key: 'ad', label: '广告图片', path: 'ad' }
  ];

  // 获取图片列表
  const fetchImages = async () => {
    setLoading(true);
    try {
      console.log('🔍 开始获取图片列表...');
      await ensureLogin();
      console.log('✅ 登录成功，开始调用云函数...');
      
      // 使用云函数查询图片
      const result = await app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'getImageList',
          data: {
            category: activeTab === 'all' ? undefined : activeTab
          }
        }
      });
      
      console.log('📊 云函数查询结果:', result);
      console.log('🔍 当前分类:', activeTab);
      console.log('🔍 传递给云函数的分类参数:', activeTab === 'all' ? undefined : activeTab);
      
      if (result.result && result.result.success) {
        setImages(result.result.data || []);
        console.log('✅ 图片列表更新成功，共', result.result.data?.length || 0, '张图片');
        console.log('📸 返回的图片数据:', result.result.data);
      } else {
        console.error('❌ 云函数查询失败:', result.result?.error);
        addToast(`获取图片失败: ${result.result?.error || '未知错误'}`, 'error');
        setImages([]);
      }
    } catch (error) {
      console.error('❌ 获取图片失败:', error);
      addToast(`获取图片失败: ${error.message}`, 'error');
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 页面加载，开始获取图片...');
    fetchImages();
  }, [activeTab]);

  if (loading && images.length === 0) {
    return <ContentLoading />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">图片管理</h1>
        <p className="text-gray-600 mt-1">管理商城小程序的所有图片资源</p>
      </div>

      {/* 分类标签 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-2">
          {imageCategories.map((category) => (
            <button
              key={category.key}
              onClick={() => setActiveTab(category.key)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeTab === category.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <FolderIcon className="w-4 h-4 inline mr-2" />
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-600">
          当前分类：{imageCategories.find(c => c.key === activeTab)?.label} ({images.length} 张)
        </div>
        <button
          onClick={() => {
            setEditingImage(null);
            setFormData({
              title: '',
              imageUrl: '',
              linkUrl: '',
              sortOrder: 0,
              isActive: true,
              category: activeTab
            });
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          添加图片
        </button>
      </div>

      {/* 图片列表 */}
      <div className="bg-white rounded-lg shadow">
        {images.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <PhotoIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>暂无图片，点击上方按钮添加图片</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>预览</th>
                  <th>标题</th>
                  <th>分类</th>
                  <th>跳转链接</th>
                  <th>排序</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {images.map((image) => (
                  <tr key={image._id}>
                    <td>
                      <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden">
                        {image.imageUrl ? (
                          <img
                            src={image.imageUrl}
                            alt={image.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log('图片加载失败:', image.imageUrl);
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                            onLoad={() => {
                              console.log('图片加载成功:', image.imageUrl);
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs" style={{display: image.imageUrl ? 'none' : 'flex'}}>
                          <PhotoIcon className="w-6 h-6" />
                        </div>
                      </div>
                    </td>
                    <td className="font-medium">{image.title}</td>
                    <td>
                      <span className="badge badge-outline">
                        {imageCategories.find(c => c.key === image.category)?.label || image.category}
                      </span>
                    </td>
                    <td>
                      {image.linkUrl ? (
                        <a
                          href={image.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {image.linkUrl.length > 30 ? `${image.linkUrl.substring(0, 30)}...` : image.linkUrl}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td>{image.sortOrder}</td>
                    <td>
                      <span className={`badge ${image.isActive ? 'badge-success' : 'badge-error'}`}>
                        {image.isActive ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td>
                      {image.createdAt ? new Date(image.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingImage(image);
                            setFormData({
                              title: image.title || '',
                              imageUrl: image.imageUrl || '',
                              linkUrl: image.linkUrl || '',
                              sortOrder: image.sortOrder || 0,
                              isActive: image.isActive !== false,
                              category: image.category || activeTab
                            });
                            setShowModal(true);
                          }}
                          className="btn btn-sm btn-outline"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('确定要删除这张图片吗？')) {
                              // 这里可以添加删除逻辑
                              addToast('删除功能待实现', 'info');
                            }
                          }}
                          className="btn btn-sm btn-error"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 添加/编辑图片模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingImage ? '编辑图片' : '添加图片'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标题
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="input input-bordered w-full"
                  placeholder="请输入图片标题"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  图片链接
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  className="input input-bordered w-full"
                  placeholder="请输入图片URL"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  跳转链接
                </label>
                <input
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({...formData, linkUrl: e.target.value})}
                  className="input input-bordered w-full"
                  placeholder="点击图片跳转的链接（可选）"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  排序
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
                  className="input input-bordered w-full"
                  placeholder="数字越小越靠前"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="checkbox"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  启用
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-outline"
              >
                取消
              </button>
              <button
                onClick={() => {
                  // 这里可以添加保存逻辑
                  addToast('保存功能待实现', 'info');
                  setShowModal(false);
                }}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageManagePage;
