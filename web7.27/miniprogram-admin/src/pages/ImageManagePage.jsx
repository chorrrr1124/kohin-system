import React, { useState, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Eye, 
  Download,
  FolderOpen,
  Plus,
  Search,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import imageApi from '../api/imageApi';

const ImageManagePage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadCategory, setUploadCategory] = useState('general');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // 图片分类配置
  const categories = [
    { key: 'all', label: '全部图片', path: '' },
    { key: 'banner', label: '轮播图', path: 'banner' },
    { key: 'banners', label: '推广图', path: 'banners' },
    { key: 'category', label: '分类图标', path: 'category' },
    { key: 'products', label: '商品图片', path: 'products' },
    { key: 'icons', label: '图标', path: 'icons' },
    { key: 'tab', label: '标签栏', path: 'tab' },
    { key: 'other', label: '其他', path: '' }
  ];

  // 小程序图片目录路径
  const MINIPROGRAM_IMAGES_PATH = 'c:\\Users\\chor\\Desktop\\code\\finish\\商城小程序\\images';

  // 加载图片数据
  const loadImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await imageApi.getAllImages();
      setImages(response.data || []);
    } catch (error) {
      console.error('加载图片失败:', error);
      setError('加载图片失败，请稍后重试');
      // 使用模拟数据作为后备
      const mockImages = [
        {
          id: '1',
          name: 'banner1.jpg',
          path: '/banner/banner1.jpg',
          category: 'banner',
          size: '245KB',
          lastModified: '2024-01-15',
          url: '/images/banner/banner1.jpg'
        },
        {
          id: '2',
          name: 'hot.png',
          path: '/category/hot.png',
          category: 'category',
          size: '12KB',
          lastModified: '2024-01-10',
          url: '/images/category/hot.png'
        },
        {
          id: '3',
          name: 'drink1.jpg',
          path: '/products/drink1.jpg',
          category: 'products',
          size: '156KB',
          lastModified: '2024-01-12',
          url: '/images/products/drink1.jpg'
        },
        {
          id: '4',
          name: 'home-active.png',
          path: '/icons/home-active.png',
          category: 'icons',
          size: '8KB',
          lastModified: '2024-01-08',
          url: '/images/icons/home-active.png'
        }
      ];
      setImages(mockImages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // 处理文件选择
  const handleFileSelect = (files, category) => {
    setUploadFiles(files);
    setUploadCategory(category);
  };

  const handleUpload = async (files, category) => {
    if (!files || files.length === 0) {
      setError('请选择要上传的文件');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setUploadProgress(0);

      if (files.length === 1) {
        // 单文件上传
        const response = await imageApi.uploadImage(files[0], category);
        setSuccess(`成功上传图片: ${response.data.name}`);
      } else {
        // 多文件上传
        const response = await imageApi.uploadMultipleImages(files, category);
        setSuccess(`成功上传 ${response.data.length} 张图片`);
      }

      // 重新加载图片列表
      await loadImages();
      
      // 重置上传状态
      setUploadFiles([]);
      setUploadCategory('general');
      setShowUploadModal(false);
      setUploadProgress(0);
    } catch (error) {
      console.error('上传失败:', error);
      setError('上传失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageIds) => {
    if (!imageIds || imageIds.length === 0) {
      setError('请选择要删除的图片');
      return;
    }

    if (!window.confirm(`确定要删除选中的 ${imageIds.length} 张图片吗？此操作不可撤销。`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (imageIds.length === 1) {
        await imageApi.deleteImage(imageIds[0]);
        setSuccess('成功删除图片');
      } else {
        await imageApi.deleteMultipleImages(imageIds);
        setSuccess(`成功删除 ${imageIds.length} 张图片`);
      }

      // 重新加载图片列表
      await loadImages();
      setSelectedImages([]);
    } catch (error) {
      console.error('删除失败:', error);
      setError('删除失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (imageId) => {
    setSelectedImages(prev => {
      if (prev.includes(imageId)) {
        return prev.filter(id => id !== imageId);
      } else {
        return [...prev, imageId];
      }
    });
  };

  // 筛选图片
  const filteredImages = images.filter(img => {
    const matchesCategory = activeCategory === 'all' || img.category === activeCategory;
    const matchesSearch = img.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 清除消息
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // 格式化文件大小
  const formatFileSize = (sizeStr) => {
    if (typeof sizeStr === 'string') return sizeStr;
    if (typeof sizeStr === 'number') {
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(sizeStr) / Math.log(k));
      return parseFloat((sizeStr / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    return '未知';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">图片资源管理</h1>
        <p className="text-gray-600">管理小程序的所有图片资源，支持上传、预览、删除操作</p>
      </div>

      {/* 错误和成功消息 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertTriangle className="text-red-500 mr-2" size={20} />
          <span className="text-red-700">{error}</span>
          <button onClick={clearMessages} className="ml-auto text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <span className="text-green-700">{success}</span>
          <button onClick={clearMessages} className="ml-auto text-green-500 hover:text-green-700">
            ×
          </button>
        </div>
      )}

      {/* 工具栏 */}
      <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* 分类筛选 */}
            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-gray-500" />
              <select 
                value={activeCategory} 
                onChange={(e) => setActiveCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* 搜索框 */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索图片名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* 批量操作 */}
            {selectedImages.length > 0 && (
              <button
                onClick={() => handleDelete(selectedImages)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 size={18} />
                <span>删除选中 ({selectedImages.length})</span>
              </button>
            )}

            {/* 上传按钮 */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload size={18} />
              <span>上传图片</span>
            </button>
          </div>
        </div>
      </div>

      {/* 图片网格 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">暂无图片</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredImages.map(image => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setPreviewImage(image)}
                    onError={(e) => {
                      e.target.src = '/images/placeholder.svg';
                    }}
                  />
                </div>
                
                {/* 选择框 */}
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    checked={selectedImages.includes(image.id)}
                    onChange={() => handleImageSelect(image.id)}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                {/* 操作按钮 */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setPreviewImage(image)}
                      className="p-1 bg-white rounded shadow hover:bg-gray-50"
                    >
                      <Eye size={14} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete([image.id])}
                      className="p-1 bg-white rounded shadow hover:bg-gray-50"
                    >
                      <Trash2 size={14} className="text-red-600" />
                    </button>
                  </div>
                </div>

                {/* 图片信息 */}
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900 truncate" title={image.name}>
                    {image.name}
                  </p>
                  <p className="text-xs text-gray-500">{image.size}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 上传模态框 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <button
              type="button"
              className="absolute top-4 right-4 p-1 hover:bg-gray-200 rounded-full transition-colors"
              onClick={() => setShowUploadModal(false)}
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
            <h3 className="text-lg font-semibold mb-4 pr-8">上传图片</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择分类
                </label>
                <select 
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="general">通用</option>
                  <option value="banner">轮播图</option>
                  <option value="products">商品图片</option>
                  <option value="icons">图标</option>
                  <option value="tab">标签栏</option>
                  <option value="category">分类图片</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择文件
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileSelect(Array.from(e.target.files), uploadCategory)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                {uploadFiles.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    已选择 {uploadFiles.length} 个文件
                  </div>
                )}
              </div>
              
              {uploadProgress > 0 && (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>上传进度</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFiles([]);
                  setUploadProgress(0);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                取消
              </button>
              <button 
                onClick={() => handleUpload(uploadFiles, uploadCategory)}
                disabled={uploadFiles.length === 0 || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '上传中...' : '上传'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 图片预览模态框 */}
      {previewImage && (
        <ImagePreviewModal
          image={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
};



// 图片预览模态框组件
const ImagePreviewModal = ({ image, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="max-w-4xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{image.name}</h3>
                <p className="text-sm text-gray-500">
                  {image.size} • {image.lastModified} • {image.category}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
          <div className="p-4">
            <img
              src={image.url}
              alt={image.name}
              className="max-w-full max-h-96 mx-auto"
              onError={(e) => {
                e.target.src = '/images/placeholder.svg';
              }}
            />
          </div>
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">路径: {image.path}</span>
              <div className="flex space-x-2">
                <button className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                  <Download size={14} />
                  <span>下载</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageManagePage;