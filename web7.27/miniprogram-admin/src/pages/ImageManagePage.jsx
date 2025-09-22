import React, { useState, useEffect, useRef } from 'react';
import { PhotoIcon, TrashIcon, EyeIcon, FolderIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { app, ensureLogin } from '../utils/cloudbase';
import { ContentLoading, CardLoading } from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import cloudStorageManager from '../utils/cloudStorage';

const ImageManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [activeTab, setActiveTab] = useState('banner');
  const { addToast } = useToast();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef();
  const fetchTimeoutRef = useRef(null);
  const lastFetchTimeRef = useRef(0);
  const cacheRef = useRef({});

  const imageCategories = [
    { key: 'all', label: '全部图片', path: 'all' },
    { key: 'banner', label: '轮播图', path: 'banner' },
    { key: 'general', label: '通用图片', path: 'general' },
    { key: 'product', label: '商品图片', path: 'product' },
    { key: 'category', label: '分类图片', path: 'category' },
    { key: 'ad', label: '广告图片', path: 'ad' }
  ];

  // 获取图片列表（带防抖和缓存）
  const fetchImages = async (force = false) => {
    // 如果正在加载且不是强制刷新，则跳过
    if (loading && !force) {
      console.log('⏳ 正在加载中，跳过重复请求');
      return;
    }

    // 检查缓存和频率限制
    const now = Date.now();
    const cacheKey = activeTab;
    const cacheTime = 30000; // 30秒缓存
    
    if (!force && cacheRef.current[cacheKey] && (now - lastFetchTimeRef.current) < cacheTime) {
      console.log('📦 使用缓存数据');
      setImages(cacheRef.current[cacheKey]);
      return;
    }

    // 频率限制：最少间隔3秒
    if (!force && (now - lastFetchTimeRef.current) < 3000) {
      console.log('⏰ 请求过于频繁，跳过');
      return;
    }

    // 清除之前的定时器
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // 设置防抖延迟
    fetchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        console.log('🔍 开始获取图片列表...');
        await ensureLogin();
        console.log('✅ 登录成功，开始调用云函数...');
        
        // 添加超时机制
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('请求超时')), 15000); // 15秒超时
        });
        
        // 使用云函数查询图片
        const functionPromise = app.callFunction({
          name: 'cloudStorageManager',
          data: {
            action: 'listImages',
            data: {
              category: activeTab === 'all' ? undefined : activeTab, 
              limit: 100
            }
          }
        });
        
        const result = await Promise.race([functionPromise, timeoutPromise]);
        
        console.log('📊 云函数查询结果:', result);
        console.log('🔍 当前分类:', activeTab);
        console.log('🔍 传递给云函数的分类参数:', activeTab === 'all' ? undefined : activeTab);
        
        if (result.result && result.result.success) {
          let imageList = result.result.data?.images || result.result.data || [];
          console.log('✅ 图片列表更新成功，共', imageList.length, '张图片');
          console.log('📸 返回的图片数据:', imageList);
          
          // 修复图片URL
          
          // 按最新上传时间排序
          imageList.sort((a, b) => {
            const timeA = new Date(a.createdAt || a.createTime || 0).getTime();
            const timeB = new Date(b.createdAt || b.createTime || 0).getTime();
            return timeB - timeA; // 最新的在前
          });
          
          setImages(imageList);
          console.log('✅ 图片列表处理完成，共', imageList.length, '张图片');
          
          // 更新缓存
          cacheRef.current[cacheKey] = imageList;
          lastFetchTimeRef.current = now;
        } else {
          console.error('❌ 云函数查询失败:', result.result?.error);
          
          // 检查是否是频率限制错误
          const errorMsg = result.result?.error || '未知错误';
          if (errorMsg.includes('EXCEED_RATELIMIT') || errorMsg.includes('ratelimit')) {
            addToast('请求过于频繁，请稍后再试', 'warning');
            // 设置重试机制，5秒后重试
            setTimeout(() => {
              console.log('🔄 频率限制，5秒后重试...');
              fetchImages(true);
            }, 5000);
          } else {
            addToast(`获取图片失败: ${errorMsg}`, 'error');
          }
          setImages([]);
        }
      } catch (error) {
        console.error('❌ 获取图片失败:', error);
        
        // 更友好的错误提示
        let errorMessage = '获取图片失败';
        if (error.message.includes('超时')) {
          errorMessage = '网络连接超时，请检查网络后重试';
        } else if (error.message.includes('network') || error.message.includes('Network')) {
          errorMessage = '网络连接失败，请检查网络后重试';
        } else if (error.message.includes('CERT_DATE_INVALID')) {
          errorMessage = 'SSL证书错误，请稍后重试';
        } else if (error.message.includes('EXCEED_RATELIMIT') || error.message.includes('ratelimit')) {
          errorMessage = '请求过于频繁，请稍后再试';
          // 设置重试机制
          setTimeout(() => {
            console.log('🔄 频率限制，5秒后重试...');
            fetchImages(true);
          }, 5000);
        } else {
          errorMessage = `获取图片失败: ${error.message}`;
        }
        
        addToast(errorMessage, 'error');
        setImages([]);
      } finally {
        setLoading(false);
      }
    }, force ? 0 : 2000); // 强制刷新立即执行，否则延迟2秒，减少请求频率
  };


  useEffect(() => {
    console.log('🔄 页面加载，开始获取图片...');
    // 添加错误边界保护
    try {
      fetchImages(true); // 强制刷新
    } catch (error) {
      console.error('❌ useEffect中获取图片失败:', error);
      addToast('页面加载失败，请刷新重试', 'error');
    }

    // 清理函数
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [activeTab]); // 只依赖activeTab

  // 文件选择处理
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files).filter(file => 
      file.type.startsWith('image/')
    );
    setSelectedFiles(files);
  };

  // 上传图片
  const uploadImages = async () => {
    if (selectedFiles.length === 0) {
      addToast('请先选择要上传的图片', 'warning');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🚀 开始上传图片 (尝试 ${attempt}/${maxRetries})，文件数量:`, selectedFiles.length);
        
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const progress = ((i + 1) / selectedFiles.length) * 100;
          setUploadProgress(progress);

          console.log(`📤 正在上传 ${i + 1}/${selectedFiles.length}: ${file.name}`);

          // 生成文件路径 - 修复分类问题
          const uploadCategory = activeTab === 'all' ? 'general' : activeTab;
          const cloudPath = cloudStorageManager.generateCloudPath(file.name, `images/${uploadCategory}/`);
          console.log('🔍 生成的cloudPath:', cloudPath);
          console.log('🔍 activeTab:', activeTab);
          console.log('🔍 uploadCategory:', uploadCategory);
          console.log('🔍 文件名:', file.name);
          
          // 上传到云存储
          const uploadResult = await cloudStorageManager.uploadImage(file, uploadCategory);

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
        await fetchImages();

        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // 显示结果提示
        if (successCount > 0) {
          addToast(`上传完成！成功上传 ${successCount} 张图片${failCount > 0 ? `，失败 ${failCount} 张` : ''}`, 'success');
        } else {
          addToast('上传失败，请检查网络连接或文件格式', 'error');
        }

        // 成功完成，跳出重试循环
        break;

      } catch (error) {
        lastError = error;
        console.error(`❌ 上传失败 (尝试 ${attempt}/${maxRetries}):`, error);
        
        // 检查是否是SSL证书错误
        if (error.message && error.message.includes('CERT_DATE_INVALID')) {
          console.warn('⚠️ 检测到SSL证书日期无效错误，将在2秒后重试...');
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        }
        
        // 检查是否是网络错误
        if (error.message && (error.message.includes('network') || error.message.includes('timeout'))) {
          console.warn('⚠️ 检测到网络错误，将在3秒后重试...');
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }
        }
        
        // 如果不是可重试的错误，直接抛出
        if (attempt === maxRetries) {
          break;
        }
      }
    }
    
    // 所有重试都失败了
    if (lastError) {
      console.error('❌ 上传失败，已重试', maxRetries, '次');
      addToast(`上传失败: ${lastError.message}`, 'error');
    }
    
    setUploading(false);
    setUploadProgress(0);
  };

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
              onClick={() => {
                try {
                  console.log('🔄 切换分类到:', category.key);
                  setActiveTab(category.key);
                } catch (error) {
                  console.error('❌ 切换分类失败:', error);
                  addToast('切换分类失败，请重试', 'error');
                }
              }}
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
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-outline"
            disabled={uploading}
          >
            <CloudArrowUpIcon className="w-4 h-4 mr-2" />
            选择图片
          </button>
          {selectedFiles.length > 0 && (
            <button
              onClick={uploadImages}
              className="btn btn-primary"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  上传中... ({uploadProgress.toFixed(0)}%)
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                  上传 ({selectedFiles.length} 张)
                </>
              )}
            </button>
          )}
          <button
            onClick={async () => {
              console.log('🔄 手动刷新图片列表...');
              await fetchImages(true); // 强制刷新
              addToast('图片列表已刷新', 'success');
            }}
            className="btn btn-outline"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2"></span>
                刷新中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                刷新列表
              </>
            )}
          </button>
        </div>
      </div>

      {/* 已选文件显示 */}
      {selectedFiles.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-blue-800">已选择 {selectedFiles.length} 个文件</h3>
            <button
              onClick={() => {
                setSelectedFiles([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              清空选择
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded">
                <PhotoIcon className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">{file.name}</div>
                  <div className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)}KB • {file.type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 图片列表 */}
      <div className="bg-white rounded-lg shadow">
        {images.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <PhotoIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>暂无图片，点击上方按钮添加图片</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full table-fixed">
              <thead>
                <tr>
                  <th>预览</th>
                  <th>标题</th>
                  <th>分类</th>
                  <th>云存储路径</th>
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
                      <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden cursor-pointer" onClick={() => {
                        setPreviewImage(image);
                        setShowPreviewModal(true);
                      }}>
                        {(image.imageUrl || image.url) ? (
                          <img
                            src={image.imageUrl || image.url}
                            alt={image.title}
                            className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                            onError={(e) => {
                              console.log('图片加载失败:', image.imageUrl || image.url);
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                            onLoad={() => {
                              console.log('图片加载成功:', image.imageUrl || image.url);
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs" style={{display: (image.imageUrl || image.url) ? 'none' : 'flex'}}>
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
                      <div className="text-xs text-gray-600 max-w-32 truncate" title={image.cloudPath || image.fileID}>
                        {image.cloudPath || image.fileID || '-'}
                      </div>
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
                          onClick={async () => {
                            console.log('🔴 删除按钮被点击，图片ID:', image._id);
                            
                            if (window.confirm('确定要删除这张图片吗？此操作不可撤销！')) {
                              console.log('✅ 用户确认删除');
                              
                              try {
                                setLoading(true);
                                console.log('🗑️ 开始删除图片:', image._id);
                                console.log('🔧 当前app对象:', app);
                                
                                // 确保登录
                                console.log('🔐 检查登录状态...');
                                await ensureLogin();
                                console.log('✅ 登录状态确认');
                                
                                // 调用云函数
                                console.log('☁️ 调用云函数...');
                                const result = await app.callFunction({
                                  name: 'cloudStorageManager',
                                  data: {
                                    action: 'deleteImage',
                                    data: {
                                      imageId: image._id
                                    }
                                  }
                                });
                                
                                console.log('📊 删除结果:', result);
                                console.log('📊 删除结果类型:', typeof result);
                                console.log('📊 删除结果.result:', result.result);
                                
                                if (result.result && result.result.success) {
                                  console.log('✅ 删除成功');
                                  addToast('图片删除成功', 'success');
                                  // 重新加载图片列表
                                  await fetchImages(true); // 强制刷新
                                } else {
                                  console.log('❌ 删除失败，错误信息:', result.result?.error);
                                  addToast(`删除失败: ${result.result?.error || '未知错误'}`, 'error');
                                }
                              } catch (error) {
                                console.error('❌ 删除图片失败:', error);
                                console.error('❌ 错误堆栈:', error.stack);
                                addToast(`删除失败: ${error.message}`, 'error');
                              } finally {
                                setLoading(false);
                                console.log('🏁 删除操作完成');
                              }
                            } else {
                              console.log('❌ 用户取消删除');
                            }
                          }}
                          className="btn btn-sm btn-error"
                          disabled={loading}
                          title="删除图片"
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

export default ImageManagePage;
