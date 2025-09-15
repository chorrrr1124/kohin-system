import React, { useState, useRef } from 'react';
import cloudStorage from '../utils/cloudStorage';

const ImageUpload = ({ categories, onUpload, loading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  // 处理文件选择
  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      if (!cloudStorage.isValidImageType(file.type)) {
        alert(`文件 ${file.name} 不是有效的图片格式`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB限制
        alert(`文件 ${file.name} 超过10MB大小限制`);
        return false;
      }
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  // 处理拖拽
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // 处理文件输入
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  // 移除文件
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 上传文件
  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      alert('请选择要上传的文件');
      return;
    }

    if (!selectedCategory) {
      alert('请选择分类');
      return;
    }

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress(prev => ({ ...prev, [i]: 0 }));
        
        try {
          await onUpload(file, selectedCategory);
          setUploadProgress(prev => ({ ...prev, [i]: 100 }));
        } catch (error) {
          console.error(`上传文件 ${file.name} 失败:`, error);
          setUploadProgress(prev => ({ ...prev, [i]: -1 }));
        }
      }
      
      // 清空文件列表
      setSelectedFiles([]);
      setUploadProgress({});
      alert('上传完成！');
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败：' + error.message);
    }
  };

  // 清空文件列表
  const clearFiles = () => {
    setSelectedFiles([]);
    setUploadProgress({});
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">上传图片</h2>
        
        {/* 分类选择 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择分类
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="select select-bordered w-full max-w-xs"
          >
            <option value="general">默认分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* 拖拽上传区域 */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                拖拽图片到此处，或
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-500 ml-1"
                >
                  点击选择文件
                </button>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                支持 JPG、PNG、GIF、WebP 格式，单个文件不超过 10MB
              </p>
            </div>
          </div>
        </div>

        {/* 文件列表 */}
        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                已选择文件 ({selectedFiles.length})
              </h3>
              <button
                onClick={clearFiles}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                清空列表
              </button>
            </div>
            
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {cloudStorage.formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {uploadProgress[index] === 100 && (
                      <span className="text-green-600 text-sm">✓ 完成</span>
                    )}
                    {uploadProgress[index] === -1 && (
                      <span className="text-red-600 text-sm">✗ 失败</span>
                    )}
                    {uploadProgress[index] > 0 && uploadProgress[index] < 100 && (
                      <span className="text-blue-600 text-sm">上传中...</span>
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={clearFiles}
            className="btn btn-outline"
            disabled={selectedFiles.length === 0 || loading}
          >
            清空
          </button>
          <button
            onClick={uploadFiles}
            className="btn btn-primary"
            disabled={selectedFiles.length === 0 || loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                上传中...
              </>
            ) : (
              `上传 ${selectedFiles.length} 个文件`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
