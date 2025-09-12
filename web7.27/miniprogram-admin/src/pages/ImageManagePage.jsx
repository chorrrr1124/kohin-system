import React, { useState, useEffect, useRef } from 'react';
import { PhotoIcon, PlusIcon, PencilIcon, TrashIcon, EyeIcon, FolderIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { app, ensureLogin } from '../utils/cloudbase';
import { ContentLoading, CardLoading } from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { getBatchTempFileURLs, uploadFile, generateCloudPath } from '../utils/cloudStorage';

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
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef();

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
        let imageList = result.result.data || [];
        console.log('✅ 图片列表更新成功，共', imageList.length, '张图片');
        console.log('📸 返回的图片数据:', imageList);
        
        // 修复图片URL
        imageList = await fixImageUrls(imageList);
        
        // 按最新上传时间排序
        imageList.sort((a, b) => {
          const timeA = new Date(a.createdAt || a.createTime || 0).getTime();
          const timeB = new Date(b.createdAt || b.createTime || 0).getTime();
          return timeB - timeA; // 最新的在前
        });
        
        setImages(imageList);
        console.log('✅ 图片列表处理完成，共', imageList.length, '张图片');
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

  // 修复图片URL
  const fixImageUrls = async (imageList) => {
    try {
      console.log('🔧 开始修复图片URL...');
      console.log('📊 原始图片数据:', imageList);
      
      // 收集需要获取临时URL的fileID
      const fileIDsToFix = [];
      const imageMap = new Map();
      
      imageList.forEach((img, index) => {
        const currentUrl = img.imageUrl || img.url;
        
        // 如果URL无效，需要获取临时URL
        if (!currentUrl || 
            currentUrl.includes('mock-cdn.example.com') || 
            currentUrl.includes('undefined') ||
            currentUrl.includes('example.com')) {
          
          if (img.fileID) {
            fileIDsToFix.push(img.fileID);
            imageMap.set(img.fileID, { index, img });
          }
        }
      });
      
      // 如果有需要修复的图片，批量获取临时URL
      if (fileIDsToFix.length > 0) {
        console.log('🔄 批量获取临时URL，文件数量:', fileIDsToFix.length);
        
        try {
          const urlResult = await app.callFunction({
            name: 'cloudStorageFileManager',
            data: {
              action: 'getTemporaryUrl',
              data: {
                fileList: fileIDsToFix
              }
            }
          });
          
          if (urlResult.result && urlResult.result.success) {
            const urlData = urlResult.result.data;
            console.log('✅ 获取临时URL成功:', urlData);
            
            // 更新图片URL
            const updatedImages = [...imageList];
            urlData.forEach(fileInfo => {
              if (fileInfo.tempFileURL && imageMap.has(fileInfo.fileID)) {
                const { index, img } = imageMap.get(fileInfo.fileID);
                updatedImages[index] = {
                  ...img,
                  imageUrl: fileInfo.tempFileURL,
                  url: fileInfo.tempFileURL,
                  originalUrl: img.imageUrl || img.url,
                  fixedAt: new Date().toISOString()
                };
                console.log('✅ 图片URL已修复:', fileInfo.fileID, fileInfo.tempFileURL);
              }
            });
            
            console.log('✅ 图片URL修复完成，修复后的数据:', updatedImages);
            return updatedImages;
          }
        } catch (urlError) {
          console.error('❌ 获取临时URL失败:', urlError);
        }
      }
      
      // 如果没有需要修复的图片或获取临时URL失败，使用备用方案
      const updatedImages = imageList.map((img, index) => {
        const currentUrl = img.imageUrl || img.url;
        
        if (!currentUrl || 
            currentUrl.includes('mock-cdn.example.com') || 
            currentUrl.includes('undefined') ||
            currentUrl.includes('example.com')) {
          
          let newUrl = null;
          
          // 尝试从fileID生成URL
          if (img.fileID && img.fileID.startsWith('cloud://')) {
            const path = img.fileID.replace('cloud://cloudbase-3g4w6lls8a5ce59b.', '');
            newUrl = `https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/${path}`;
          }
          // 尝试从cloudPath生成URL
          else if (img.cloudPath) {
            newUrl = `https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/${img.cloudPath}`;
          }
          // 尝试从fileName生成URL
          else if (img.fileName) {
            newUrl = `https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/${img.fileName}`;
          }
          
          if (newUrl) {
            return {
              ...img,
              imageUrl: newUrl,
              url: newUrl,
              originalUrl: currentUrl,
              fixedAt: new Date().toISOString()
            };
          }
        }
        
        return img;
      });
      
      console.log('✅ 图片URL修复完成（备用方案）:', updatedImages);
      return updatedImages;
      
    } catch (error) {
      console.error('❌ 修复图片URL失败:', error);
      return imageList;
    }
  };

  useEffect(() => {
    console.log('🔄 页面加载，开始获取图片...');
    fetchImages();
  }, [activeTab]);

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

    try {
      console.log('🚀 开始上传图片，文件数量:', selectedFiles.length);
      
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const progress = ((i + 1) / selectedFiles.length) * 100;
        setUploadProgress(progress);

        console.log(`📤 正在上传 ${i + 1}/${selectedFiles.length}: ${file.name}`);

        // 生成文件路径 - 修复分类问题
        const uploadCategory = activeTab === 'all' ? 'general' : activeTab;
        const cloudPath = generateCloudPath(file.name, `images/${uploadCategory}/`);
        console.log('🔍 生成的cloudPath:', cloudPath);
        console.log('🔍 activeTab:', activeTab);
        console.log('🔍 uploadCategory:', uploadCategory);
        console.log('🔍 文件名:', file.name);
        
        // 上传到云存储
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

    } catch (error) {
      console.error('上传失败:', error);
      addToast(`上传失败: ${error.message}`, 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
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
              await fetchImages();
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
          <button
            onClick={async () => {
              try {
                setLoading(true);
                console.log('🔧 开始修复数据库中的图片URL...');
                await ensureLogin();
                
                const fixResult = await app.callFunction({
                  name: 'fixImageUrls',
                  data: {}
                });
                
                console.log('📊 修复结果:', fixResult);
                
                if (fixResult.result && fixResult.result.success) {
                  addToast(`修复完成！更新了 ${fixResult.result.data?.updated || 0} 张图片`, 'success');
                  // 修复完成后重新加载图片列表
                  await fetchImages();
                } else {
                  addToast(`修复失败: ${fixResult.result?.error || '未知错误'}`, 'error');
                }
              } catch (error) {
                console.error('❌ 修复失败:', error);
                addToast(`修复失败: ${error.message}`, 'error');
              } finally {
                setLoading(false);
              }
            }}
            className="btn btn-warning"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2"></span>
                修复中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                修复URL
              </>
            )}
          </button>
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
            className="btn btn-secondary"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            手动添加
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
            <table className="table w-full">
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
