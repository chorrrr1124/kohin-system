import React, { useState, useEffect, useCallback } from 'react';
import { 
  PhotoIcon, 
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  FolderIcon,
  CloudIcon
} from '@heroicons/react/24/outline';
import cloudStorage from '../utils/cloudStorage';

const ImageSelector = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedImages = [], 
  maxSelection = 5,
  category = 'product' // 默认选择商品图片分类
}) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [tempSelectedImages, setTempSelectedImages] = useState([...selectedImages]);
  const [categories, setCategories] = useState([]);

  // 图片分类选项
  const imageCategories = [
    { key: 'all', label: '全部图片', icon: '📁' },
    { key: 'product', label: '商品图片', icon: '🛍️' },
    { key: 'banner', label: '轮播图', icon: '🎠' },
    { key: 'general', label: '通用图片', icon: '🖼️' },
    { key: 'category', label: '分类图片', icon: '📂' },
    { key: 'ad', label: '广告图片', icon: '📢' }
  ];

  // 加载图片列表
  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const imageList = await cloudStorage.getImages(selectedCategory);
      setImages(imageList);
    } catch (error) {
      console.error('加载图片失败:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  // 初始化
  useEffect(() => {
    if (isOpen) {
      loadImages();
      setTempSelectedImages([...selectedImages]);
    }
  }, [isOpen, loadImages, selectedImages]);

  // 过滤图片
  const filteredImages = images.filter(image => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      image.fileName?.toLowerCase().includes(searchLower) ||
      image.title?.toLowerCase().includes(searchLower) ||
      image.category?.toLowerCase().includes(searchLower)
    );
  });

  // 处理图片选择
  const handleImageSelect = (image) => {
    setTempSelectedImages(prev => {
      const isSelected = prev.some(selected => selected._id === image._id);
      if (isSelected) {
        // 取消选择
        return prev.filter(selected => selected._id !== image._id);
      } else {
        // 选择图片（检查数量限制）
        if (prev.length >= maxSelection) {
          alert(`最多只能选择 ${maxSelection} 张图片`);
          return prev;
        }
        return [...prev, image];
      }
    });
  };

  // 确认选择
  const handleConfirm = () => {
    onSelect(tempSelectedImages);
    onClose();
  };

  // 取消选择
  const handleCancel = () => {
    setTempSelectedImages([...selectedImages]);
    onClose();
  };

  // 检查图片是否被选中
  const isImageSelected = (image) => {
    return tempSelectedImages.some(selected => selected._id === image._id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <PhotoIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">选择商品图片</h2>
            <span className="text-sm text-gray-500">
              ({tempSelectedImages.length}/{maxSelection})
            </span>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* 搜索和分类 */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex gap-4 items-center">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索图片名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 分类选择 */}
            <div className="flex gap-2">
              {imageCategories.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === cat.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 图片网格 */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">加载图片中...</p>
              </div>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <CloudIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">暂无图片</p>
                <p className="text-gray-400 text-sm">请先上传图片到云存储</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredImages.map((image) => {
                const isSelected = isImageSelected(image);
                return (
                  <div
                    key={image._id}
                    onClick={() => handleImageSelect(image)}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* 图片 */}
                    <div className="aspect-square bg-gray-100">
                      <img
                        src={image.url}
                        alt={image.fileName || '图片'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/images/placeholder.png';
                        }}
                      />
                    </div>

                    {/* 选择状态指示器 */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                        <CheckIcon className="w-4 h-4" />
                      </div>
                    )}

                    {/* 悬停信息 */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                      <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-center p-2">
                        <p className="text-sm font-medium truncate">
                          {image.fileName || '未命名'}
                        </p>
                        <p className="text-xs text-gray-200">
                          {image.category || '未分类'}
                        </p>
                      </div>
                    </div>

                    {/* 选择序号 */}
                    {isSelected && (
                      <div className="absolute bottom-2 left-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {tempSelectedImages.findIndex(selected => selected._id === image._id) + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            已选择 {tempSelectedImages.length} 张图片
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              确认选择 ({tempSelectedImages.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageSelector;
