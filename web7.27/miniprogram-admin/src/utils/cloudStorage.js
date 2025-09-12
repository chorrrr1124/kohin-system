import { initCloudBase, ensureLogin } from './cloudbase';

/**
 * CloudBase云存储工具类
 * 简化文件上传和管理，无需复杂的STS配置
 */
class CloudStorageService {
  constructor() {
    this.app = initCloudBase();
  }

  /**
   * 确保用户已登录
   */
  async ensureLogin() {
    // 使用全局的ensureLogin函数，避免重复创建auth实例
    const loginState = await ensureLogin();
    return loginState?.isLoggedIn;
  }

  /**
   * 读取文件为ArrayBuffer
   * @param {File} file - 文件对象
   * @returns {Promise<ArrayBuffer>} 文件内容
   */
  async readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 上传文件到CloudBase云存储
   * @param {File} file - 要上传的文件
   * @param {string} cloudPath - 云存储路径
   * @param {Function} onProgress - 进度回调函数
   * @returns {Promise} 上传结果
   */
  async uploadFile(file, cloudPath, onProgress) {
    // 从路径中提取分类，如果路径是 images/all/ 则使用 general
    let category = cloudPath.split('/')[1] || 'general';
    if (category === 'all') {
      category = 'general';
    }
    
    try {
      // 确保用户已登录
      await this.ensureLogin();

      console.log('🚀 开始上传文件到CloudBase云存储 (v2.0):', {
        fileName: file.name,
        fileSize: file.size,
        cloudPath: cloudPath
      });
      
      console.log('🔍 详细参数检查:', {
        cloudPath: cloudPath,
        cloudPathType: typeof cloudPath,
        cloudPathLength: cloudPath.length,
        file: file,
        fileType: typeof file,
        fileName: file.name
      });

      // 检查文件大小（限制为10MB）
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error(`文件大小超过限制，最大支持10MB，当前文件大小：${(file.size / 1024 / 1024).toFixed(2)}MB`);
      }

      // 直接使用CloudBase SDK上传文件到云存储
      console.log('📤 直接上传到CloudBase云存储:', {
        fileName: file.name,
        cloudPath: cloudPath
      });

      // 直接使用文件对象，无需转换为Base64
      console.log('📁 准备上传文件:', {
        name: file.name,
        size: file.size,
        type: file.type,
        cloudPath: cloudPath
      });

      // 直接使用 CloudBase SDK 上传文件，避免复杂的转换
      console.log('📤 直接使用 CloudBase SDK 上传文件...');
      
      // 直接使用原始文件对象，不进行任何转换
      const uploadResult = await this.app.uploadFile({
        cloudPath: cloudPath,
        filePath: file
      });

      console.log('📊 直接上传结果:', uploadResult);

      if (!uploadResult.fileID) {
        throw new Error('直接上传失败: ' + (uploadResult.errMsg || '未知错误'));
      }

      // 从上传结果获取fileID
      const fileID = uploadResult.fileID;
      const imageUrl = `https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/${cloudPath}`;
      
      console.log('✅ CloudBase直接上传成功:', { fileID, cloudPath, imageUrl });

      // 保存图片信息到数据库
      try {
        const saveResult = await this.app.callFunction({
          name: 'cloudStorageManager',
          data: {
            action: 'saveImageInfo',
            data: {
              images: [{
                fileID: fileID,
                cloudPath: cloudPath,
                url: imageUrl,
                imageUrl: imageUrl,
                fileName: cloudPath.split('/').pop(),
                title: file.name,
                category: category,
                createdAt: new Date().toISOString(),
                createTime: new Date().toISOString(),
                isActive: true,
                sortOrder: 0
              }],
              category: category
            }
          }
        });

        if (saveResult.result && saveResult.result.success) {
          console.log('✅ 图片信息保存到数据库成功');
        } else {
          console.warn('⚠️ 图片信息保存到数据库失败:', saveResult.result?.error);
        }
      } catch (saveError) {
        console.warn('⚠️ 保存图片信息到数据库时出错:', saveError);
      }

      return {
        success: true,
        fileID: fileID,
        cloudPath: cloudPath,
        url: imageUrl,
        imageUrl: imageUrl,
        fileName: cloudPath.split('/').pop(),
        title: file.name,
        category: category,
        createdAt: new Date().toISOString(),
        createTime: new Date().toISOString(),
        message: '上传成功'
      };

    } catch (error) {
      console.error('❌ CloudBase上传失败:', error);
      
      // 确保 category 变量在 catch 块中可用
      const fallbackCategory = cloudPath ? cloudPath.split('/')[1] || 'general' : 'general';
      
      return {
        success: false,
        error: error.message,
        message: '上传失败',
        category: fallbackCategory === 'all' ? 'general' : fallbackCategory
      };
    }
  }

  /**
   * 获取文件的临时访问URL
   * @param {string} fileID - 文件ID
   * @returns {Promise} 临时URL
   */
  async getTempFileURL(fileID) {
    try {
      await this.ensureLogin();

      console.log('🔄 获取临时URL:', fileID);
      
      // 使用新的云函数获取临时URL
      const result = await this.app.callFunction({
        name: 'cloudStorageFileManager',
        data: {
          action: 'getTemporaryUrl',
          data: {
            fileList: [fileID]
          }
        }
      });

      if (result.result && result.result.success) {
        const urlData = result.result.data;
        if (urlData && urlData.length > 0) {
          const fileInfo = urlData[0];
          console.log('✅ 通过云函数获取临时URL成功:', fileInfo.tempFileURL);
          return {
            success: true,
            tempFileURL: fileInfo.tempFileURL,
            fileID: fileID
          };
        }
      }
      
      throw new Error(result.result?.error || '获取临时URL失败');

    } catch (error) {
      console.error('获取临时URL失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量获取文件的临时访问URL
   * @param {Array} fileIDs - 文件ID数组
   * @returns {Promise} 临时URL数组
   */
  async getBatchTempFileURLs(fileIDs) {
    try {
      await this.ensureLogin();

      console.log('🔄 批量获取临时URL:', fileIDs);
      
      // 使用新的云函数批量获取临时URL
      const result = await this.app.callFunction({
        name: 'cloudStorageFileManager',
        data: {
          action: 'getTemporaryUrl',
          data: {
            fileList: fileIDs
          }
        }
      });

      if (result.result && result.result.success) {
        const urlData = result.result.data;
        const urlMap = {};
        
        if (urlData && urlData.length > 0) {
          urlData.forEach(fileInfo => {
            if (fileInfo.tempFileURL) {
              urlMap[fileInfo.fileID] = fileInfo.tempFileURL;
              console.log('✅ 获取临时URL成功:', fileInfo.fileID, fileInfo.tempFileURL);
            } else {
              console.error('❌ 获取临时URL失败:', fileInfo.fileID, fileInfo.errMsg);
              // 如果获取失败，尝试生成一个基于fileID的URL
              urlMap[fileInfo.fileID] = this.generateFallbackURL(fileInfo.fileID);
            }
          });
        }

        return {
          success: true,
          urlMap: urlMap,
          fileIDs: fileIDs
        };
      } else {
        throw new Error(result.result?.error || '获取临时URL失败');
      }

    } catch (error) {
      console.error('批量获取临时URL失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成备用URL（当无法获取临时URL时使用）
   * @param {string} fileID - 文件ID
   * @returns {string} 备用URL
   */
  generateFallbackURL(fileID) {
    // 从fileID中提取路径信息
    if (fileID.startsWith('cloud://')) {
      const path = fileID.replace('cloud://cloudbase-3g4w6lls8a5ce59b.', '');
      return `https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/${path}`;
    }
    return `https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/${fileID}`;
  }

  /**
   * 删除文件
   * @param {string} fileID - 文件ID
   * @returns {Promise} 删除结果
   */
  async deleteFile(fileID) {
    try {
      await this.ensureLogin();

      // 模拟删除文件
      await new Promise(resolve => setTimeout(resolve, 500)); // 模拟删除时间

      return {
        success: true,
        message: '删除成功（模拟模式）'
      };

    } catch (error) {
      console.error('删除文件失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成唯一的文件路径
   * @param {string} filename - 原始文件名
   * @param {string} prefix - 路径前缀
   * @returns {string} 唯一的文件路径
   */
  generateCloudPath(filename, prefix = 'images/') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = filename.split('.').pop();
    const result = `${prefix}${timestamp}_${random}.${extension}`;
    
    console.log('🔧 generateCloudPath 调试信息:', {
      filename: filename,
      prefix: prefix,
      timestamp: timestamp,
      random: random,
      extension: extension,
      result: result
    });
    
    return result;
  }

  /**
   * 获取默认图片
   */
  getDefaultImage() {
    return 'data:image/svg+xml;charset=utf-8,%3Csvg width="200" height="200" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="100" y="100" font-family="Arial, sans-serif" font-size="16" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3E暂无图片%3C/text%3E%3C/svg%3E';
  }
}

// 创建单例实例
const cloudStorageService = new CloudStorageService();

// 导出便捷方法
export const uploadFile = (file, cloudPath, onProgress) => 
  cloudStorageService.uploadFile(file, cloudPath, onProgress);

export const getTempFileURL = (fileID) => 
  cloudStorageService.getTempFileURL(fileID);

export const getBatchTempFileURLs = (fileIDs) => 
  cloudStorageService.getBatchTempFileURLs(fileIDs);

export const deleteFile = (fileID) => 
  cloudStorageService.deleteFile(fileID);

export const generateCloudPath = (filename, prefix) => 
  cloudStorageService.generateCloudPath(filename, prefix);

export const getDefaultImage = () => 
  cloudStorageService.getDefaultImage();

export default cloudStorageService;
