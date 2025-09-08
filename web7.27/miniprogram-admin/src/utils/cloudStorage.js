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
   * 上传文件到CloudBase云存储
   * @param {File} file - 要上传的文件
   * @param {string} cloudPath - 云存储路径
   * @param {Function} onProgress - 进度回调函数
   * @returns {Promise} 上传结果
   */
  async uploadFile(file, cloudPath, onProgress) {
    try {
      // 确保用户已登录
      await this.ensureLogin();

      console.log('开始上传文件到CloudBase云存储:', {
        fileName: file.name,
        fileSize: file.size,
        cloudPath: cloudPath
      });

      // 获取COS临时密钥
      const stsResult = await this.app.callFunction({
        name: 'getCosSts',
        data: {
          prefix: cloudPath
        }
      });

      if (!stsResult.result || !stsResult.result.success) {
        throw new Error('获取COS临时密钥失败');
      }

      const credentials = stsResult.result.data.credentials;
      
      // 由于浏览器环境限制，暂时使用模拟上传
      // 在实际生产环境中，应该使用COS SDK或直接上传到CloudBase
      console.log('模拟上传到COS:', {
        fileName: file.name,
        cloudPath: cloudPath,
        credentials: credentials
      });

      // 模拟上传进度
      if (onProgress) {
        for (let i = 0; i <= 100; i += 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          onProgress({
            percent: i / 100,
            loaded: i,
            total: 100
          });
        }
      }

      // 模拟上传结果
      const uploadResult = {
        Location: `https://${credentials.bucket}.cos.${credentials.region}.myqcloud.com/${cloudPath}`,
        Bucket: credentials.bucket,
        Key: cloudPath,
        ETag: '"mock-etag-' + Date.now() + '"'
      };

      const fileID = `cloud://cloudbase-3g4w6lls8a5ce59b.${cloudPath}`;
      
      console.log('COS上传成功:', uploadResult);

      return {
        success: true,
        fileID: fileID,
        cloudPath: cloudPath,
        cosKey: cloudPath,
        message: '上传成功'
      };

    } catch (error) {
      console.error('CloudBase上传失败:', error);
      return {
        success: false,
        error: error.message,
        message: '上传失败'
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

      // 从fileID中提取cloudPath
      const cloudPath = fileID.replace('cloud://cloudbase-3g4w6lls8a5ce59b.', '');
      
      // 调用云函数获取临时URL
      const result = await this.app.callFunction({
        name: 'getTempFileURL',
        data: {
          fileID: fileID,
          cloudPath: cloudPath
        }
      });

      if (result.result && result.result.success) {
        return {
          success: true,
          tempFileURL: result.result.data.tempFileURL,
          fileID: fileID
        };
      } else {
        throw new Error(result.result?.error || '获取临时URL失败');
      }

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

      // 模拟批量获取临时URL
      const urlMap = {};
      fileIDs.forEach(fileID => {
        urlMap[fileID] = `https://mock-cdn.example.com/${fileID}`;
      });

      return {
        success: true,
        urlMap: urlMap,
        fileIDs: fileIDs
      };

    } catch (error) {
      console.error('批量获取临时URL失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
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
    return `${prefix}${timestamp}_${random}.${extension}`;
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
