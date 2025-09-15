import React, { useState, useEffect, useRef } from 'react';
import { 
  PhotoIcon, 
  CloudArrowUpIcon, 
  TrashIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  PlusIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import cloudStorage from '../utils/cloudStorage';

const ImageManagementPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedUploadCategory, setSelectedUploadCategory] = useState('general');
  
  const fileInputRef = useRef();

  // 初始化
  useEffect(() => {
    loadImages();
    loadCategories();
  }, []);

  // 加载分类列表
  const loadCategories = async () => {
    try {
      const categoryList = await cloudStorage.getCategories();
      setCategories(categoryList);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  // 加载图片列表
  const loadImages = async () => {
    setLoading(true);
    try {
      const imageList = await cloudStorage.getImages(selectedCategory);
      setImages(imageList);
    } catch (error) {
      console.error('加载图片失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 当分类改变时重新加载图片
  useEffect(() => {
    loadImages();
  }, [selectedCategory]);

  // 文件选择处理
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  // 生成云存储路径
  const generateCloudPath = (file) => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    return `images/${selectedUploadCategory}/${timestamp}_${randomId}.${fileExtension}`;
  };

  // 上传文件
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = selectedFiles.map(async (file, index) => {
        // 上传文件
        const uploadResult = await cloudStorage.uploadImage(file, selectedUploadCategory);
        
        // 更新进度
        setUploadProgress(((index + 1) / selectedFiles.length) * 100);
        
        return uploadResult;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      
      // 重新加载图片列表
      await loadImages();
      
      // 清空选择
      setSelectedFiles([]);
      setUploadProgress(0);
      
      console.log('✅ 上传完成');
    } catch (error) {
      console.error('❌ 上传失败:', error);
    } finally {
      setUploading(false);
    }
  };

  // 删除图片
  const handleDelete = async (imageId) => {
    if (!confirm('确定要删除这张图片吗？')) return;

    try {
      await cloudStorage.deleteImage(imageId);
      await loadImages();
      console.log('✅ 删除成功');
    } catch (error) {
      console.error('❌ 删除失败:', error);
    }
  };

  // 更新图片信息
  const handleUpdateImage = async () => {
    if (!editingImage) return;

    try {
      await cloudStorage.updateImage(editingImage.id, {
        title: editingImage.title,
        category: editingImage.category
      });
      setEditingImage(null);
      await loadImages();
      console.log('✅ 更新成功');
    } catch (error) {
      console.error('❌ 更新失败:', error);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化日期
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className="container mx-auto p-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">图片管理</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="btn btn-outline"
          >
            <FolderIcon className="w-5 h-5 mr-2" />
            管理分类
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary"
            disabled={uploading}
          >
            <CloudArrowUpIcon className="w-5 h-5 mr-2" />
            {uploading ? '上传中...' : '上传图片'}
          </button>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary' : 'btn-outline'}`}
          >
            全部
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`btn btn-sm ${selectedCategory === category.id ? 'btn-primary' : 'btn-outline'}`}
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
              <span className="ml-1 badge badge-ghost">{category.imageCount || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 上传区域 */}
      {selectedFiles.length > 0 && (
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h3 className="card-title">准备上传 {selectedFiles.length} 个文件</h3>
            
            {/* 分类选择 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">选择分类</span>
              </label>
              <select
                className="select select-bordered"
                value={selectedUploadCategory}
                onChange={(e) => setSelectedUploadCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 文件列表 */}
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <PhotoIcon className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                    className="btn btn-sm btn-ghost"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* 上传进度 */}
            {uploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="card-actions justify-end">
              <button
                onClick={() => setSelectedFiles([])}
                className="btn btn-ghost"
                disabled={uploading}
              >
                取消
              </button>
              <button
                onClick={handleUpload}
                className="btn btn-primary"
                disabled={uploading}
              >
                {uploading ? '上传中...' : '开始上传'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 图片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {images.map((image) => (
          <div key={image.id} className="card bg-base-100 shadow-xl">
            <figure className="px-4 pt-4">
              <img
                src={image.url || image.imageUrl}
                alt={image.title || image.fileName}
                className="rounded-xl w-full h-48 object-cover cursor-pointer"
                onClick={() => setPreviewImage(image)}
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title text-sm">{image.title || image.fileName}</h2>
              <div className="text-xs text-gray-500 space-y-1">
                <p>大小: {formatFileSize(image.size || 0)}</p>
                <p>分类: {image.category || '未分类'}</p>
                <p>上传: {formatDate(image.createTime || image.uploadTime)}</p>
              </div>
              <div className="card-actions justify-end">
                <button
                  onClick={() => setPreviewImage(image)}
                  className="btn btn-sm btn-ghost"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingImage(image)}
                  className="btn btn-sm btn-ghost"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(image.id || image._id)}
                  className="btn btn-sm btn-error"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {images.length === 0 && !loading && (
        <div className="text-center py-12">
          <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无图片</h3>
          <p className="text-gray-500 mb-4">点击上传按钮开始上传图片</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary"
          >
            <CloudArrowUpIcon className="w-5 h-5 mr-2" />
            上传图片
          </button>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-12">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      )}

      {/* 预览模态框 */}
      {previewImage && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4">{previewImage.title || previewImage.fileName}</h3>
            <img
              src={previewImage.url || previewImage.imageUrl}
              alt={previewImage.title || previewImage.fileName}
              className="w-full h-auto rounded-lg"
            />
            <div className="modal-action">
              <button
                onClick={() => setPreviewImage(null)}
                className="btn"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑模态框 */}
      {editingImage && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">编辑图片信息</h3>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">图片标题</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={editingImage.title || editingImage.fileName}
                onChange={(e) => setEditingImage({ ...editingImage, title: e.target.value })}
              />
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">分类</span>
              </label>
              <select
                className="select select-bordered"
                value={editingImage.category || 'general'}
                onChange={(e) => setEditingImage({ ...editingImage, category: e.target.value })}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-action">
              <button
                onClick={() => setEditingImage(null)}
                className="btn btn-ghost"
              >
                取消
              </button>
              <button
                onClick={handleUpdateImage}
                className="btn btn-primary"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 分类管理模态框 */}
      {showCategoryModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4">分类管理</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div key={category.id} className="card bg-base-100 shadow">
                  <div className="card-body p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <h4 className="font-medium">{category.name}</h4>
                          <p className="text-sm text-gray-500">{category.imageCount || 0} 张图片</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button className="btn btn-sm btn-outline">编辑</button>
                        <button className="btn btn-sm btn-error">删除</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-action">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="btn"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ImageManagementPage;
