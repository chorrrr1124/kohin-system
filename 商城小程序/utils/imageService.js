// 图片服务工具
const imageService = {
  // 获取云存储图片的临时访问链接
  async getImageUrl(cloudPath) {
    try {
      if (!cloudPath || !cloudPath.startsWith('cloud://')) {
        return this.getDefaultImage();
      }

      const result = await wx.cloud.getTempFileURL({
        fileList: [cloudPath]
      });

      if (result.fileList && result.fileList[0] && result.fileList[0].status === 0) {
        return result.fileList[0].tempFileURL;
      } else {
        console.warn('获取图片临时链接失败:', cloudPath);
        return this.getDefaultImage();
      }
    } catch (error) {
      console.error('获取图片链接异常:', error);
      return this.getDefaultImage();
    }
  },

  // 获取默认图片
  getDefaultImage() {
    return 'data:image/svg+xml;charset=utf-8,%3Csvg width="200" height="200" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="100" y="100" font-family="Arial, sans-serif" font-size="16" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3E暂无图片%3C/text%3E%3C/svg%3E';
  },

  // 批量获取图片链接
  async getBatchImageUrls(cloudPaths) {
    try {
      if (!Array.isArray(cloudPaths) || cloudPaths.length === 0) {
        return [];
      }

      // 过滤有效的云存储路径
      const validPaths = cloudPaths.filter(path => path && path.startsWith('cloud://'));
      
      if (validPaths.length === 0) {
        return cloudPaths.map(() => this.getDefaultImage());
      }

      const result = await wx.cloud.getTempFileURL({
        fileList: validPaths
      });

      const urlMap = {};
      result.fileList.forEach(file => {
        if (file.status === 0) {
          urlMap[file.fileID] = file.tempFileURL;
        }
      });

      // 返回对应顺序的图片链接
      return cloudPaths.map(path => {
        if (path && path.startsWith('cloud://')) {
          return urlMap[path] || this.getDefaultImage();
        } else {
          return this.getDefaultImage();
        }
      });
    } catch (error) {
      console.error('批量获取图片链接异常:', error);
      return cloudPaths.map(() => this.getDefaultImage());
    }
  },

  // 上传图片到云存储
  async uploadImage(filePath, cloudPath) {
    try {
      const result = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath
      });

      return {
        success: true,
        fileID: result.fileID,
        message: '上传成功'
      };
    } catch (error) {
      console.error('上传图片失败:', error);
      return {
        success: false,
        error: error.message,
        message: '上传失败'
      };
    }
  },

  // 删除云存储图片
  async deleteImage(fileID) {
    try {
      await wx.cloud.deleteFile({
        fileList: [fileID]
      });

      return {
        success: true,
        message: '删除成功'
      };
    } catch (error) {
      console.error('删除图片失败:', error);
      return {
        success: false,
        error: error.message,
        message: '删除失败'
      };
    }
  },

  // 预加载图片
  preloadImage(url) {
    return new Promise((resolve, reject) => {
      if (!url || url.startsWith('data:')) {
        resolve(url);
        return;
      }

      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = url;
    });
  }
};

module.exports = imageService;