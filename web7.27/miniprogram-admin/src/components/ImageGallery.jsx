import React, { useState } from 'react';

const ImageGallery = ({ 
  images, 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  onImageDelete, 
  loading 
}) => {
  const [viewMode, setViewMode] = useState('grid'); // grid 或 list
  const [selectedImages, setSelectedImages] = useState([]);

  // 处理分类选择
  const handleCategorySelect = (categoryId) => {
    onCategoryChange(categoryId);
  };

  // 处理图片选择
  const handleImageSelect = (imageId) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedImages.length === 0) {
      alert('请选择要删除的图片');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedImages.length} 张图片吗？`)) {
      return;
    }

    try {
      for (const imageId of selectedImages) {
        await onImageDelete(imageId);
      }
      setSelectedImages([]);
      alert('删除完成！');
    } catch (error) {
      console.error('批量删除失败:', error);
      alert('删除失败：' + error.message);
    }
  };

  // 获取分类名称
  const getCategoryName = (categoryId) => {
    if (categoryId === 'all') return '全部';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '未知分类';
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* 工具栏 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* 分类筛选 */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">分类筛选：</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategorySelect('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span 
                    className="inline-block w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  ></span>
                  {category.name} ({category.imageCount || 0})
                </button>
              ))}
            </div>
          </div>

          {/* 视图模式切换 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* 批量操作 */}
            {selectedImages.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  已选择 {selectedImages.length} 张图片
                </span>
                <button
                  onClick={handleBatchDelete}
                  className="btn btn-sm btn-error"
                >
                  批量删除
                </button>
                <button
                  onClick={() => setSelectedImages([])}
                  className="btn btn-sm btn-outline"
                >
                  取消选择
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 图片展示区域 */}
      {loading ? (
        <div className="text-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无图片</h3>
          <p className="text-gray-500">
            {selectedCategory === 'all' 
              ? '还没有上传任何图片' 
              : `在"${getCategoryName(selectedCategory)}"分类下没有图片`
            }
          </p>
        </div>
      ) : (
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
            : 'space-y-4'
        }`}>
          {images.map((image) => (
            <div
              key={image._id}
              className={`relative group bg-white rounded-lg shadow-md overflow-hidden ${
                viewMode === 'list' ? 'flex' : ''
              }`}
            >
              {/* 选择框 */}
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={selectedImages.includes(image._id)}
                  onChange={() => handleImageSelect(image._id)}
                  className="checkbox checkbox-primary"
                />
              </div>

              {/* 图片 */}
              <div className={`${viewMode === 'list' ? 'w-32 h-24 flex-shrink-0' : 'aspect-square'}`}>
                <img
                  src={image.url}
                  alt={image.title || image.fileName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/images/placeholder.png';
                  }}
                />
              </div>

              {/* 图片信息 */}
              <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <h3 className="font-medium text-gray-900 truncate">
                  {image.title || image.fileName}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {getCategoryName(image.category)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(image.createTime).toLocaleDateString()}
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-1">
                  <button
                    onClick={() => window.open(image.url, '_blank')}
                    className="btn btn-sm btn-ghost"
                    title="查看原图"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onImageDelete(image._id)}
                    className="btn btn-sm btn-error"
                    title="删除图片"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 统计信息 */}
      {images.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          共 {images.length} 张图片
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
