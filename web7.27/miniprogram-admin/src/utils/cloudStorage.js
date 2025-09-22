import cloudbase from '@cloudbase/js-sdk';
import { getCloudBaseConfig, validateConfig } from '../config/cloudbase.js';

class CloudStorageManager {
  constructor() {
    this.app = null;
    this.isInitialized = false;
  }

  // 初始化云开发环境
  async init() {
    if (this.isInitialized) {
      return;
    }

    try {
      // 验证配置
      if (!validateConfig()) {
        console.warn('⚠️ CloudBase 配置验证失败，继续使用默认配置');
      }

      // 获取 CloudBase 配置
      const config = getCloudBaseConfig();
      
      // 添加错误处理配置
      const initConfig = {
        ...config,
        // 添加更长的超时时间
        timeout: 30000,
        // 添加重试机制
        retry: 3,
        // 添加请求配置
        request: {
          timeout: 30000,
          retry: 3
        }
      };
      
      console.log('🔧 初始化 CloudBase 配置:', initConfig);
      
      // 初始化 CloudBase
      this.app = cloudbase.init(initConfig);

      // CloudBase Web SDK 不需要单独的 storage 对象
      // 直接使用 app 的方法即可

      // 如果使用 API Key 认证，则不需要额外的登录步骤
      if (config.accessKey) {
        console.log('🔑 使用 API Key 认证，跳过登录步骤');
        this.isInitialized = true;
        console.log('✅ CloudStorageManager 初始化成功 (API Key 模式)');
        return;
      }

      // 检查登录状态（仅在使用匿名登录时）
      const auth = this.app.auth();
      const loginState = await auth.getLoginState();

      if (!loginState || !loginState.isLoggedIn) {
        console.log('🔐 用户未登录，尝试匿名登录...');
        
        try {
          await auth.signInAnonymously();
          console.log('✅ 匿名登录成功');
        } catch (loginError) {
          console.error('❌ 匿名登录失败:', loginError);
          
          // 如果是频率限制错误，使用降级模式
          if (loginError.message && loginError.message.includes('rate limit')) {
            console.warn('⚠️ 匿名登录频率限制，使用降级模式');
            this.isInitialized = true;
            console.log('✅ CloudStorageManager 初始化成功 (降级模式)');
            return;
          }
          
          throw loginError;
        }
      } else {
        console.log('✅ 用户已登录');
      }

      this.isInitialized = true;
      console.log('✅ CloudStorageManager 初始化成功 (匿名登录模式)');
    } catch (error) {
      console.error('❌ CloudStorageManager 初始化失败:', error);
      
      // 即使初始化失败，也标记为已初始化，避免重复尝试
      this.isInitialized = true;
      console.warn('⚠️ 使用降级模式继续运行');
    }
  }

  // 上传文件到云存储（通过云函数）
  async uploadFile(file, cloudPath, onProgress) {
    try {
      await this.init();

      // 确保云路径格式正确 - 不能以 / 开头
      let normalizedCloudPath = cloudPath;
      if (normalizedCloudPath.startsWith('/')) {
        normalizedCloudPath = normalizedCloudPath.substring(1);
      }

      console.log('📁 准备上传文件:', {
        name: file.name,
        size: file.size,
        type: file.type,
        cloudPath: normalizedCloudPath
      });

      // 将文件转换为base64格式
      const fileData = await this.fileToBase64(file);
      
      // 通过云函数上传文件
      console.log('🚀 开始调用云函数上传文件:', {
        fileName: file.name,
        fileType: file.type,
        cloudPath: normalizedCloudPath,
        fileDataLength: fileData ? fileData.length : 0
      });

      const result = await this.app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'uploadImage',
        data: {
            fileData: fileData,
            fileName: file.name,
            fileType: file.type,
            cloudPath: normalizedCloudPath,
            category: 'general' // 默认分类
          }
        }
      });

      console.log('📊 云函数完整返回结果:', JSON.stringify(result, null, 2));

      // 检查云函数返回的数据结构
      if (result && result.result && result.result.success) {
        const data = result.result.data;
        console.log('📊 云函数返回数据:', JSON.stringify(data, null, 2));
        
        // 确保 fileID 存在
        if (!data || !data.fileID) {
          console.error('❌ 云函数返回数据格式错误:', data);
          throw new Error('云函数返回数据格式错误: 缺少 fileID');
        }
        
        return {
          success: true,
          fileID: data.fileID,
          cloudPath: normalizedCloudPath,
          url: data.url || data.fileID // 如果没有 url，使用 fileID
        };
      } else {
        console.error('❌ 云函数调用失败:', result);
        throw new Error('上传失败: ' + (result?.result?.error || result?.error || '未知错误'));
      }
    } catch (error) {
      console.error('❌ 文件上传失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 将文件转换为base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 获取文件临时访问链接（通过云函数）
  async getTempFileURL(fileID) {
    try {
      await this.init();

      const result = await this.app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'getTempFileURL',
          data: {
            fileList: [fileID]
          }
        }
      });

      if (result.result && result.result.success) {
        const fileInfo = result.result.data[0];
        if (fileInfo.code === 'SUCCESS') {
      return {
        success: true,
            tempFileURL: fileInfo.tempFileURL
          };
        } else {
          throw new Error(fileInfo.errMsg || '获取临时链接失败');
        }
      } else {
        throw new Error('获取临时链接失败: ' + (result.result?.error || '未知错误'));
      }
    } catch (error) {
      console.error('❌ 获取临时链接失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 删除文件（通过云函数）
  async deleteFile(fileID) {
    try {
      await this.init();

      const result = await this.app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'deleteImage',
          data: {
            imageId: fileID
          }
        }
      });

      if (result.result && result.result.success) {
      return {
        success: true,
          message: '文件删除成功'
      };
      } else {
        throw new Error('文件删除失败: ' + (result.result?.error || '未知错误'));
      }
    } catch (error) {
      console.error('❌ 文件删除失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 生成唯一的云存储路径
  generateCloudPath(fileName, folder = 'images') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = fileName.split('.').pop();
    // 确保文件夹路径不以 / 开头，但以 / 结尾
    let normalizedFolder = folder;
    if (normalizedFolder.startsWith('/')) {
      normalizedFolder = normalizedFolder.substring(1);
    }
    if (!normalizedFolder.endsWith('/')) {
      normalizedFolder += '/';
    }
    return `${normalizedFolder}${timestamp}_${random}.${extension}`;
  }

  // 获取分类列表（通过云函数）
  async getCategories() {
    try {
      await this.init();
      
      const result = await this.app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'getCategories'
        }
      });

      if (result.result && result.result.success) {
        return result.result.data;
      } else {
        console.warn('⚠️ 获取分类失败，使用默认分类');
        return [
          { id: 'general', name: '通用', description: '通用图片分类' },
          { id: 'products', name: '产品', description: '产品图片分类' },
          { id: 'banners', name: '横幅', description: '横幅图片分类' }
        ];
      }
    } catch (error) {
      console.error('❌ 获取分类列表失败:', error);
      return [
        { id: 'general', name: '通用', description: '通用图片分类' },
        { id: 'products', name: '产品', description: '产品图片分类' },
        { id: 'banners', name: '横幅', description: '横幅图片分类' }
      ];
    }
  }

  // 创建分类（通过云函数）
  async createCategory(categoryData) {
    try {
      await this.init();
      
      const result = await this.app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'createCategory',
          categoryData: categoryData
        }
      });

      if (result.result && result.result.success) {
        return { success: true, data: result.result.data };
      } else {
        throw new Error('创建分类失败: ' + (result.result?.error || '未知错误'));
      }
    } catch (error) {
      console.error('❌ 创建分类失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 更新分类（通过云函数）
  async updateCategory(categoryId, updateData) {
    try {
      await this.init();
      
      const result = await this.app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'updateCategory',
          categoryId: categoryId,
          updateData: updateData
        }
      });

      if (result.result && result.result.success) {
        return { success: true, data: result.result.data };
      } else {
        throw new Error('更新分类失败: ' + (result.result?.error || '未知错误'));
      }
    } catch (error) {
      console.error('❌ 更新分类失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 删除分类（通过云函数）
  async deleteCategory(categoryId) {
    try {
      await this.init();
      
      const result = await this.app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'deleteCategory',
          categoryId: categoryId
        }
      });

      if (result.result && result.result.success) {
        return { success: true, data: result.result.data };
      } else {
        throw new Error('删除分类失败: ' + (result.result?.error || '未知错误'));
      }
    } catch (error) {
      console.error('❌ 删除分类失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取图片列表（通过云函数）
  async getImages(category = 'all') {
    try {
      await this.init();
      
      const result = await this.app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'getImages',
          data: { category: category }
        }
      });

      if (result.result && result.result.success) {
        return result.result.data.images || [];
      } else {
        console.warn('⚠️ 获取图片列表失败，返回空数组');
        return [];
      }
    } catch (error) {
      console.error('❌ 获取图片列表失败:', error);
      return [];
    }
  }

  // 根据分类获取图片（通过云函数）
  async getImagesByCategory(categoryId) {
    try {
      await this.init();
      
      const result = await this.app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'getImagesByCategory',
          data: { category: categoryId }
        }
      });

      if (result.result && result.result.success) {
        return result.result.data.images || [];
      } else {
        console.warn('⚠️ 获取分类图片失败，返回空数组');
        return [];
      }
    } catch (error) {
      console.error('❌ 获取分类图片失败:', error);
      return [];
    }
  }

  // 上传图片（通过云函数）
  async uploadImage(file, category = 'general') {
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.init();
        
        const cloudPath = this.generateCloudPath(file.name, `images/${category}`);
        const fileData = await this.fileToBase64(file);
        
        console.log(`🚀 开始调用云函数上传图片 (尝试 ${attempt}/${maxRetries}):`, {
          fileName: file.name,
          fileType: file.type,
          cloudPath: cloudPath,
          category: category,
          fileDataLength: fileData ? fileData.length : 0
        });

        const result = await this.app.callFunction({
          name: 'cloudStorageManager',
          data: {
            action: 'uploadImage',
            data: {
              fileData: fileData,
              fileName: file.name,
              fileType: file.type,
              cloudPath: cloudPath,
              category: category
            }
          }
        });

        console.log('📊 云函数完整返回结果:', JSON.stringify(result, null, 2));

        if (result && result.result && result.result.success) {
          const data = result.result.data;
          console.log('📊 云函数返回数据:', JSON.stringify(data, null, 2));
          
          // 确保 fileID 存在
          if (!data || !data.fileID) {
            console.error('❌ 云函数返回数据格式错误:', data);
            throw new Error('云函数返回数据格式错误: 缺少 fileID');
          }
          
          console.log('✅ 图片上传成功:', data);
          return {
            success: true,
            fileID: data.fileID,
            cloudPath: cloudPath,
            url: data.url || data.fileID,
            data: data
          };
        } else {
          console.error('❌ 云函数调用失败:', result);
          throw new Error('上传图片失败: ' + (result?.result?.error || result?.error || '未知错误'));
        }
      } catch (error) {
        lastError = error;
        console.error(`❌ 上传图片失败 (尝试 ${attempt}/${maxRetries}):`, error);
        
        // 检查是否是SSL证书错误
        if (error.message && error.message.includes('CERT_DATE_INVALID')) {
          console.warn('⚠️ 检测到SSL证书日期无效错误，将在1秒后重试...');
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        
        // 检查是否是网络错误
        if (error.message && (error.message.includes('network') || error.message.includes('timeout'))) {
          console.warn('⚠️ 检测到网络错误，将在2秒后重试...');
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000));
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
    console.error('❌ 上传图片失败，已重试', maxRetries, '次');
    return { success: false, error: lastError?.message || '上传失败' };
  }

  // 删除图片（通过云函数）
  async deleteImage(imageId) {
    try {
      await this.init();
      
      const result = await this.app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'deleteImage',
          data: { imageId: imageId }
        }
      });

      if (result.result && result.result.success) {
        return { success: true, data: result.result.data };
      } else {
        throw new Error('删除图片失败: ' + (result.result?.error || '未知错误'));
      }
    } catch (error) {
      console.error('❌ 删除图片失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 更新图片信息（通过云函数）
  async updateImage(imageId, updateData) {
    try {
      await this.init();
      
      const result = await this.app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'updateImage',
          data: {
            imageId: imageId,
            updateData: updateData
          }
        }
      });

      if (result.result && result.result.success) {
        return { success: true, data: result.result.data };
      } else {
        throw new Error('更新图片信息失败: ' + (result.result?.error || '未知错误'));
      }
    } catch (error) {
      console.error('❌ 更新图片信息失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 保存图片信息（通过云函数）
  async saveImageInfo(imageInfo) {
    try {
      await this.init();
      
      const result = await this.app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'saveImageInfo',
          data: { imageInfo: imageInfo }
        }
      });

      if (result.result && result.result.success) {
        return { success: true, data: result.result.data };
      } else {
        throw new Error('保存图片信息失败: ' + (result.result?.error || '未知错误'));
      }
    } catch (error) {
      console.error('❌ 保存图片信息失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 验证图片类型
  isValidImageType(type) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(type);
  }

  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 创建单例实例
const cloudStorageManager = new CloudStorageManager();

// 导出常用函数
export const generateCloudPath = (fileName, folder = 'images') => {
  return cloudStorageManager.generateCloudPath(fileName, folder);
};

export const uploadFile = async (file, cloudPath) => {
  return await cloudStorageManager.uploadFile(file, cloudPath);
};

export const getTempFileURL = async (fileID) => {
  return await cloudStorageManager.getTempFileURL(fileID);
};

export default cloudStorageManager;
