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
import { uploadFile, generateCloudPath, getTempFileURL, deleteFile } from '../utils/cloudStorage';
import { initCloudBase, ensureLogin } from '../utils/cloudbase';

const ImageManagementPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef();

  // 图片分类配置
  const categories = [
    { key: 'all', label: '全部图片', path: 'all', maxCount: 100, description: '查看所有图片' },
    { key: 'banner', label: '轮播图', path: 'banner', maxCount: 10, description: '首页轮播图，最多10张' },
    { key: 'general', label: '通用图片', path: 'general', maxCount: 50, description: '通用图片资源' },
    { key: 'product', label: '商品图片', path: 'product', maxCount: 200, description: '商品相关图片' },
    { key: 'category', label: '分类图片', path: 'category', maxCount: 20, description: '商品分类图片' },
    { key: 'ad', label: '广告图片', path: 'ad', maxCount: 30, description: '广告宣传图片' }
  ];

  // 获取当前分类配置
  const currentCategory = categories.find(cat => cat.key === selectedCategory);

  // 初始化
  useEffect(() => {
    loadImages();
  }, [selectedCategory]);

  // 生成临时访问URL
  const generateTempURL = async (fileID) => {
    try {
      const app = initCloudBase();
      const result = await app.getTempFileURL({
        fileList: [{
          fileID: fileID,
          maxAge: 3600 // 1小时有效期
        }]
      });
      
      if (result.fileList && result.fileList.length > 0) {
        const fileInfo = result.fileList[0];
        if (fileInfo.code === 'SUCCESS') {
          return fileInfo.tempFileURL;
        }
      }
    } catch (error) {
      console.error('生成临时URL失败:', error);
    }
    return null;
  };

  // 加载图片列表
  const loadImages = async () => {
    setLoading(true);
    try {
      console.log('🔍 开始加载图片，分类:', selectedCategory);
      const app = initCloudBase();
      console.log('✅ CloudBase 初始化成功');
      
      const result = await app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'getImageList',
          data: {
            category: selectedCategory === 'all' ? undefined : selectedCategory
          }
        }
      });

      console.log('📊 云函数调用结果:', result);

      if (result.result && result.result.success) {
        const rawImages = result.result.data || [];
        console.log('✅ 图片列表加载成功:', rawImages.length, '张图片');
        
        // 处理图片URL，为模拟URL生成真实临时URL
        const processedImages = await Promise.all(rawImages.map(async (image) => {
          // 如果URL是模拟URL，尝试生成真实URL
          if (image.url && (image.url.includes('mock-cdn.example.com') || image.url.includes('example.com'))) {
            if (image.fileID) {
              console.log('🔄 为模拟URL生成临时URL:', image.fileID);
              const tempURL = await generateTempURL(image.fileID);
              if (tempURL) {
                console.log('✅ 生成临时URL成功:', tempURL);
                return {
                  ...image,
                  url: tempURL,
                  imageUrl: tempURL
                };
              }
            }
          }
          return image;
        }));
        
        setImages(processedImages);
        console.log('📸 处理后的图片数据:', processedImages);
      } else {
        console.error('❌ 获取图片列表失败:', result.result?.error);
        console.error('❌ 完整结果:', result);
        setImages([]);
      }
    } catch (error) {
      console.error('❌ 加载图片失败:', error);
      console.error('❌ 错误详情:', error.message);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  // 文件选择处理
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    // 检查数量限制
    if (images.length + files.length > currentCategory.maxCount) {
      alert(`最多只能上传 ${currentCategory.maxCount} 张图片，当前已有 ${images.length} 张`);
      return;
    }
    
    setSelectedFiles(files);
  };

  // 拖拽处理
  const handleDrop = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
    
    const files = Array.from(event.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (images.length + files.length > currentCategory.maxCount) {
      alert(`最多只能上传 ${currentCategory.maxCount} 张图片，当前已有 ${images.length} 张`);
      return;
    }
    
    setSelectedFiles(files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
  };

  // 上传图片
  const uploadImages = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      console.log('🚀 开始上传图片，文件数量:', selectedFiles.length);
      
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const progress = ((i + 1) / selectedFiles.length) * 100;
        setUploadProgress(progress);

        console.log(`📤 正在上传 ${i + 1}/${selectedFiles.length}: ${file.name}`);

        // 生成文件路径
        const cloudPath = generateCloudPath(file.name, currentCategory.path);
        
        // 上传到云存储（uploadFile函数已经包含了保存到数据库的逻辑）
        const uploadResult = await uploadFile(file, cloudPath, (progressData) => {
          console.log(`上传进度: ${Math.round(progressData.percent || 0)}%`);
        });

        if (uploadResult.success) {
          console.log(`✅ ${file.name} 上传成功`);
          successCount++;
        } else {
          console.error(`❌ ${file.name} 上传失败:`, uploadResult.error);
          failCount++;
        }
      }

      console.log(`🎯 上传完成！成功: ${successCount}, 失败: ${failCount}`);
      
      // 重新加载图片列表
      await loadImages();

      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // 显示结果提示
      if (successCount > 0) {
        alert(`上传完成！成功上传 ${successCount} 张图片${failCount > 0 ? `，失败 ${failCount} 张` : ''}`);
      } else {
        alert('上传失败，请检查网络连接或文件格式');
      }

    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 保存图片到数据库
  const saveImagesToDatabase = async (imageList) => {
    try {
      const app = initCloudBase();
      const result = await app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'saveImageInfo',
          data: {
            images: imageList,
            category: selectedCategory
          }
        }
      });
      
      if (result.result && result.result.success) {
        console.log('✅ 图片信息保存成功:', result.result.message);
      } else {
        console.error('❌ 图片信息保存失败:', result.result?.error);
      }
    } catch (error) {
      console.error('保存图片信息失败:', error);
    }
  };

  // 删除图片
  const deleteImage = async (image) => {
    if (!confirm('确定要删除这张图片吗？')) return;

    try {
      // 从数据库删除
      const app = initCloudBase();
      const result = await app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'deleteImage',
          data: {
            imageId: image._id || image.id,
            category: selectedCategory
          }
        }
      });
      
      if (result.result && result.result.success) {
        console.log('✅ 图片删除成功:', result.result.message);
      } else {
        console.error('❌ 图片删除失败:', result.result?.error);
      }

      await loadImages(); // 重新加载图片列表
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败: ' + error.message);
    }
  };

  // 更新图片显示顺序
  const updateImageOrder = async (imageId, newOrder) => {
    try {
      const app = initCloudBase();
      await app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'updateImageOrder',
          data: {
            imageId: imageId,
            newOrder: newOrder,
            category: selectedCategory
          }
        }
      });

      await loadImages();
    } catch (error) {
      console.error('更新顺序失败:', error);
    }
  };

  // 清空选择
  const clearSelection = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center space-x-3">
        <PhotoIcon className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">图片管理</h1>
          <p className="text-sm text-gray-600">管理商城小程序的所有图片资源</p>
        </div>
      </div>

      {/* 分类选择 */}
      <div className="flex space-x-2">
        {categories.map(category => (
          <button
            key={category.key}
            onClick={() => setSelectedCategory(category.key)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
              selectedCategory === category.key
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            <FolderIcon className="w-4 h-4" />
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {/* 当前分类信息 */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
        <div>
          <h3 className="font-medium text-gray-900">
            当前分类: {currentCategory.label} ({images.length}张)
          </h3>
          <p className="text-sm text-gray-600">{currentCategory.description}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              console.log('🧪 测试云函数调用...');
              console.log('🧪 当前分类:', selectedCategory);
              try {
                const app = initCloudBase();
                const result = await app.callFunction({
                  name: 'cloudStorageManager',
                  data: {
                    action: 'getImageList',
                    data: {
                      category: selectedCategory === 'all' ? undefined : selectedCategory
                    }
                  }
                });
                console.log('🧪 完整测试结果:', JSON.stringify(result, null, 2));
                console.log('🧪 result.result:', result.result);
                console.log('🧪 result.result.success:', result.result?.success);
                console.log('🧪 result.result.data:', result.result?.data);
                console.log('🧪 数据长度:', result.result?.data?.length || 0);
                
                if (result.result?.data && result.result.data.length > 0) {
                  console.log('🧪 第一张图片:', result.result.data[0]);
                }
              } catch (error) {
                console.error('🧪 测试失败:', error);
              }
            }}
            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
          >
            测试云函数
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= currentCategory.maxCount}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="w-4 h-4" />
            <span>添加图片</span>
          </button>
        </div>
      </div>

      {/* 文件选择区域 */}
      {selectedFiles.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">已选择 {selectedFiles.length} 个文件</h3>
            <button
              onClick={clearSelection}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              清空选择
            </button>
          </div>
          
          <div className="space-y-2 mb-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                <PhotoIcon className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">{file.name}</div>
                  <div className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)}KB • {file.type}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={uploadImages}
              disabled={uploading}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CloudArrowUpIcon className="w-4 h-4" />
              <span>{uploading ? '上传中...' : '开始上传'}</span>
            </button>
            
            {uploading && (
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  上传进度: {uploadProgress.toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 图片网格 */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-medium text-gray-900">
            {currentCategory.label} ({images.length}张)
          </h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">加载中...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="p-8 text-center">
            <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">暂无图片</p>
            <p className="text-sm text-gray-500">点击上方按钮添加图片</p>
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={image._id || image.id || index} className="group relative bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.url || image.imageUrl}
                    alt={image.fileName || image.title}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      console.log('图片加载失败:', image.url || image.imageUrl);
                      e.target.src = 'data:image/svg+xml;charset=utf-8,%3Csvg width="200" height="200" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="100" y="100" font-family="Arial, sans-serif" font-size="16" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3E加载失败%3C/text%3E%3C/svg%3E';
                    }}
                    onLoad={() => {
                      console.log('图片加载成功:', image.url || image.imageUrl);
                    }}
                  />
                  
                  {/* 操作按钮 */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPreviewImage(image)}
                        className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors"
                        title="预览"
                      >
                        <EyeIcon className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => setEditingImage(image)}
                        className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors"
                        title="编辑"
                      >
                        <PencilIcon className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => deleteImage(image)}
                        className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors"
                        title="删除"
                      >
                        <TrashIcon className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {/* 图片信息 */}
                  <div className="p-2">
                    <p className="text-xs text-gray-600 truncate">{image.fileName || image.title}</p>
                    <p className="text-xs text-gray-500">
                      {image.size ? (image.size / 1024).toFixed(1) + 'KB' : '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 图片预览模态框 */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium text-gray-900">图片预览</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={previewImage.url || previewImage.imageUrl}
                alt={previewImage.fileName || previewImage.title}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>文件名:</strong> {previewImage.fileName || previewImage.title}</p>
                <p><strong>大小:</strong> {previewImage.size ? (previewImage.size / 1024).toFixed(1) + 'KB' : '-'}</p>
                <p><strong>上传时间:</strong> {previewImage.uploadTime ? new Date(previewImage.uploadTime).toLocaleString() : (previewImage.createdAt ? new Date(previewImage.createdAt).toLocaleString() : '-')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 图片编辑模态框 */}
      {editingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium text-gray-900">编辑图片</h3>
              <button
                onClick={() => setEditingImage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  显示顺序
                </label>
                <input
                  type="number"
                  value={editingImage.displayOrder || editingImage.sortOrder || 1}
                  onChange={(e) => setEditingImage({
                    ...editingImage,
                    displayOrder: parseInt(e.target.value) || 1
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    updateImageOrder(editingImage._id || editingImage.id, editingImage.displayOrder);
                    setEditingImage(null);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  保存
                </button>
                <button
                  onClick={() => setEditingImage(null)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageManagementPage;
