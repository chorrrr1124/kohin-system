import { createCosClient, uploadToCOS } from '../utils/cos';

// 图片管理API
const imageApi = {
  // 获取所有图片
  getAllImages: async () => {
    try {
      const response = await fetch('http://localhost:3001/api/images');
      return await response.json();
    } catch (error) {
      console.error('获取图片列表失败:', error);
      throw error;
    }
  },

  // 按分类获取图片
  getImagesByCategory: async (category) => {
    try {
      const response = await fetch(`http://localhost:3001/api/images/category/${category}`);
      return await response.json();
    } catch (error) {
      console.error('获取分类图片失败:', error);
      throw error;
    }
  },

  // 上传单个图片到COS
  uploadImage: async (file, category = 'general') => {
    try {
      // 生成唯一文件名
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomStr}.${fileExtension}`;
      
      // 上传到COS
      const cosResult = await uploadToCOS(file, fileName, category);
      
      // 同时保存到本地API（用于管理和索引）
      const formData = new FormData();
      formData.append('image', file);
      formData.append('category', category);
      formData.append('cosUrl', cosResult.url);
      formData.append('cosKey', cosResult.key);
      
      const response = await fetch('http://localhost:3001/api/images/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      return {
        ...result,
        cosUrl: cosResult.url,
        cosKey: cosResult.key
      };
    } catch (error) {
      console.error('上传图片失败:', error);
      throw error;
    }
  },

  // 批量上传图片到COS
  uploadMultipleImages: async (files, category = 'general') => {
    try {
      const uploadPromises = files.map(async (file) => {
        // 生成唯一文件名
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const fileExtension = file.name.split('.').pop();
        const fileName = `${timestamp}_${randomStr}.${fileExtension}`;
        
        // 上传到COS
        const cosResult = await uploadToCOS(file, fileName, category);
        
        return {
          file,
          cosUrl: cosResult.url,
          cosKey: cosResult.key,
          fileName
        };
      });
      
      const cosResults = await Promise.all(uploadPromises);
      
      // 批量保存到本地API
      const formData = new FormData();
      cosResults.forEach(({ file, cosUrl, cosKey }) => {
        formData.append('images', file);
        formData.append('cosUrls', cosUrl);
        formData.append('cosKeys', cosKey);
      });
      formData.append('category', category);
      
      const response = await fetch('http://localhost:3001/api/images/upload-multiple', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      return {
        ...result,
        cosResults
      };
    } catch (error) {
      console.error('批量上传失败:', error);
      throw error;
    }
  },

  // 删除图片
  deleteImage: async (imageId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/images/${imageId}`, {
        method: 'DELETE'
      });
      return await response.json();
    } catch (error) {
      console.error('删除图片失败:', error);
      throw error;
    }
  },

  // 批量删除图片
  deleteMultipleImages: async (imageIds) => {
    try {
      const response = await fetch('http://localhost:3001/api/images/batch', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageIds })
      });
      return await response.json();
    } catch (error) {
      console.error('批量删除失败:', error);
      throw error;
    }
  },

  // 获取分类列表
  getCategories: async () => {
    try {
      const response = await fetch('http://localhost:3001/api/images/categories');
      return await response.json();
    } catch (error) {
      console.error('获取分类列表失败:', error);
      throw error;
    }
  }
};

export default imageApi;