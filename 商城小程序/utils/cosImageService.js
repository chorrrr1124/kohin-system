// COS图片服务工具
const cosImageService = {
  // 获取COS中的图片列表
  async getImages(category = 'all', limit = 50) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getCosImages',
        data: {
          category: category,
          limit: limit
        }
      });
      
      if (result.result && result.result.success) {
        return result.result.data;
      } else {
        console.error('获取COS图片失败:', result.result?.error);
        return [];
      }
    } catch (error) {
      console.error('调用getCosImages云函数失败:', error);
      return [];
    }
  },

  // 获取轮播图
  async getBanners() {
    return await this.getImages('banners');
  },

  // 获取商品图片
  async getProductImages() {
    return await this.getImages('products');
  },

  // 获取分类图片
  async getCategoryImages() {
    return await this.getImages('category');
  },

  // 获取图标
  async getIcons() {
    return await this.getImages('icons');
  },

  // 构建图片URL（兼容多种格式）
  buildImageUrl(imageData) {
    if (!imageData) return this.getDefaultImage();
    
    // 如果已经是完整URL
    if (typeof imageData === 'string') {
      if (imageData.startsWith('http')) {
        return imageData;
      }
      if (imageData.startsWith('cloud://')) {
        return imageData;
      }
    }
    
    // 如果是对象，取url字段
    if (typeof imageData === 'object' && imageData.url) {
      return imageData.url;
    }
    
    return this.getDefaultImage();
  },

  // 获取默认图片
  getDefaultImage() {
    return '/images/placeholder.svg';
  },

  // 预加载图片
  async preloadImages(imageUrls) {
    if (!Array.isArray(imageUrls)) return;
    
    const preloadPromises = imageUrls.map(url => {
      return new Promise((resolve) => {
        if (!url || url === this.getDefaultImage()) {
          resolve();
          return;
        }
        
        wx.getImageInfo({
          src: url,
          success: () => {
            console.log('图片预加载成功:', url);
            resolve();
          },
          fail: (error) => {
            console.warn('图片预加载失败:', url, error);
            resolve();
          }
        });
      });
    });
    
    await Promise.all(preloadPromises);
  },

  // 检查图片是否存在
  async checkImageExists(url) {
    if (!url || url === this.getDefaultImage()) return false;
    
    try {
      const result = await wx.getImageInfo({
        src: url
      });
      return !!result;
    } catch (error) {
      return false;
    }
  }
};

module.exports = cosImageService;
