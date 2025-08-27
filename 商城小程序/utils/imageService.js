// 图片服务 - 处理COS图片显示和管理
const app = getApp();

class ImageService {
  constructor() {
    this.cosConfig = {
      bucket: 'kohin-1327524326',
      region: 'ap-guangzhou',
      baseUrl: 'https://kohin-1327524326.cos.ap-guangzhou.myqcloud.com'
    };
    
    // 图片分类路径映射
    this.categoryPaths = {
      'banner': 'images/banner/',
      'banners': 'images/banners/',
      'category': 'images/category/',
      'products': 'images/products/',
      'icons': 'images/icons/',
      'tab': 'images/tab/',
      'general': 'images/general/',
      'carousel': 'carousel/' // 兼容旧版本
    };
  }

  /**
   * 构建COS图片URL
   * @param {string} key - COS对象键或本地路径
   * @returns {string} 完整的图片URL
   */
  buildImageUrl(key) {
    if (!key) return '';
    
    // 如果已经是完整URL，直接返回
    if (key.startsWith('http://') || key.startsWith('https://')) {
      return key;
    }
    
    // 如果是本地路径（以/开头），直接返回
    if (key.startsWith('/')) {
      return key;
    }
    
    // 构建COS URL
    return `${this.cosConfig.baseUrl}/${key}`;
  }

  /**
   * 根据分类和文件名构建图片URL
   * @param {string} fileName - 文件名
   * @param {string} category - 图片分类
   * @returns {string} 完整的图片URL
   */
  buildImageUrlByCategory(fileName, category = 'general') {
    if (!fileName) return '';
    
    const categoryPath = this.categoryPaths[category] || this.categoryPaths.general;
    const key = `${categoryPath}${fileName}`;
    return this.buildImageUrl(key);
  }

  /**
   * 获取轮播图列表
   * @returns {Promise<Array>} 轮播图数组
   */
  async getBannerImages() {
    try {
      const db = wx.cloud.database();
      const result = await db.collection('homepage_carousel')
        .where({ status: 'active' })
        .orderBy('sort', 'asc')
        .orderBy('createTime', 'desc')
        .get();
      
      return result.data.map(item => ({
        ...item,
        imageUrl: this.buildImageUrl(item.imageUrl || item.image_url || item.url)
      }));
    } catch (error) {
      console.error('获取轮播图失败:', error);
      return [];
    }
  }

  /**
   * 获取商品图片
   * @param {string} productId - 商品ID
   * @returns {Promise<Array>} 商品图片数组
   */
  async getProductImages(productId) {
    try {
      const db = wx.cloud.database();
      const result = await db.collection('products')
        .doc(productId)
        .get();
      
      const product = result.data;
      const images = [];
      
      // 主图
      if (product.image) {
        images.push({
          url: this.buildImageUrl(product.image),
          type: 'main'
        });
      }
      
      // 详情图
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach((img, index) => {
          images.push({
            url: this.buildImageUrl(img),
            type: 'detail',
            index
          });
        });
      }
      
      return images;
    } catch (error) {
      console.error('获取商品图片失败:', error);
      return [];
    }
  }

  /**
   * 获取分类图标
   * @param {string} categoryId - 分类ID
   * @returns {Promise<string>} 分类图标URL
   */
  async getCategoryIcon(categoryId) {
    try {
      const db = wx.cloud.database();
      const result = await db.collection('categories')
        .doc(categoryId)
        .get();
      
      const category = result.data;
      return this.buildImageUrl(category.icon || category.image);
    } catch (error) {
      console.error('获取分类图标失败:', error);
      return '';
    }
  }

  /**
   * 预加载图片
   * @param {string|Array} urls - 图片URL或URL数组
   * @returns {Promise} 预加载Promise
   */
  preloadImages(urls) {
    const urlArray = Array.isArray(urls) ? urls : [urls];
    
    const promises = urlArray.map(url => {
      return new Promise((resolve, reject) => {
        if (!url) {
          resolve();
          return;
        }
        
        wx.getImageInfo({
          src: url,
          success: () => resolve(),
          fail: (error) => {
            console.warn('图片预加载失败:', url, error);
            resolve(); // 即使失败也resolve，不阻塞其他图片
          }
        });
      });
    });
    
    return Promise.all(promises);
  }

  /**
   * 检查图片是否可访问
   * @param {string} url - 图片URL
   * @returns {Promise<boolean>} 是否可访问
   */
  checkImageAccessible(url) {
    return new Promise((resolve) => {
      if (!url) {
        resolve(false);
        return;
      }
      
      wx.getImageInfo({
        src: url,
        success: () => resolve(true),
        fail: () => resolve(false)
      });
    });
  }

  /**
   * 获取图片信息
   * @param {string} url - 图片URL
   * @returns {Promise<Object>} 图片信息
   */
  getImageInfo(url) {
    return new Promise((resolve, reject) => {
      if (!url) {
        reject(new Error('图片URL为空'));
        return;
      }
      
      wx.getImageInfo({
        src: url,
        success: (res) => resolve(res),
        fail: (error) => reject(error)
      });
    });
  }

  /**
   * 保存图片到相册
   * @param {string} url - 图片URL
   * @returns {Promise} 保存Promise
   */
  async saveImageToAlbum(url) {
    try {
      // 先下载图片
      const downloadResult = await new Promise((resolve, reject) => {
        wx.downloadFile({
          url: url,
          success: (res) => resolve(res),
          fail: (error) => reject(error)
        });
      });
      
      // 保存到相册
      await new Promise((resolve, reject) => {
        wx.saveImageToPhotosAlbum({
          filePath: downloadResult.tempFilePath,
          success: () => resolve(),
          fail: (error) => reject(error)
        });
      });
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('保存图片失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
      throw error;
    }
  }
}

// 创建单例实例
const imageService = new ImageService();

module.exports = imageService;