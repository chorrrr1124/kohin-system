import React, { useState, useEffect } from 'react';
import cloudStorage from '../utils/cloudStorage';

const ImageManagement = ({ 
  images, 
  categories, 
  onImageDelete, 
  onCategoryUpdate, 
  loading 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createTime');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedImages, setSelectedImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);

  // 过滤和排序图片
  useEffect(() => {
    let filtered = [...images];

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(image =>
        image.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (image.title && image.title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'createTime') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredImages(filtered);
  }, [images, searchTerm, sortBy, sortOrder]);

  // 处理图片选择
  const handleImageSelect = (imageId) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedImages.length === filteredImages.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(filteredImages.map(img => img._id));
    }
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
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '未知分类';
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">图片管理</h2>
        
        {/* 搜索和筛选 */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* 搜索框 */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索图片名称..."
                  className="input input-bordered w-full pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* 排序选项 */}
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select select-bordered select-sm"
              >
                <option value="createTime">创建时间</option>
                <option value="fileName">文件名</option>
                <option value="category">分类</option>
              </select>
              
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="select select-bordered select-sm"
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
          </div>

          {/* 批量操作 */}
          {selectedImages.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-700">
                已选择 {selectedImages.length} 张图片
              </span>
              <div className="flex space-x-2">
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
            </div>
          )}
        </div>

        {/* 图片列表 */}
        {loading ? (
          <div className="text-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4 text-gray-500">加载中...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无图片</h3>
            <p className="text-gray-500">
              {searchTerm ? '没有找到匹配的图片' : '还没有上传任何图片'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedImages.length === filteredImages.length && filteredImages.length > 0}
                      onChange={handleSelectAll}
                      className="checkbox checkbox-primary"
                    />
                  </th>
                  <th>预览</th>
                  <th>文件名</th>
                  <th>分类</th>
                  <th>大小</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredImages.map((image) => (
                  <tr key={image._id} className="hover">
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedImages.includes(image._id)}
                        onChange={() => handleImageSelect(image._id)}
                        className="checkbox checkbox-primary"
                      />
                    </td>
                    <td>
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image.url}
                          alt={image.title || image.fileName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/images/placeholder.png';
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900 truncate">
                          {image.title || image.fileName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {image.fileName}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-outline">
                        {getCategoryName(image.category)}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-500">
                        {formatFileSize(image.fileSize || 0)}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-500">
                        {new Date(image.createTime).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(image.url, '_blank')}
                          className="btn btn-ghost btn-sm"
                          title="查看原图"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onImageDelete(image._id)}
                          className="btn btn-error btn-sm"
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
        )}

        {/* 统计信息 */}
        {filteredImages.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            显示 {filteredImages.length} 张图片，共 {images.length} 张
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageManagement;
