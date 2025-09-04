// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { type = 'all', limit = 50 } = event;
    
    // 获取云存储中的图片列表
    const result = await cloud.getTempFileURL({
      fileList: [
        // 轮播图
        'cloud://cloudbase-3g4w6lls8a5ce59b.636c-cloudbase-3g4w6lls8a5ce59b-1320051234/images/banners/banner1.jpg',
        'cloud://cloudbase-3g4w6lls8a5ce59b.636c-cloudbase-3g4w6lls8a5ce59b-1320051234/images/banners/banner2.jpg',
        'cloud://cloudbase-3g4w6lls8a5ce59b.636c-cloudbase-3g4w6lls8a5ce59b-1320051234/images/banners/banner3.jpg',
        // 商品图片
        'cloud://cloudbase-3g4w6lls8a5ce59b.636c-cloudbase-3g4w6lls8a5ce59b-1320051234/images/products/product1.jpg',
        'cloud://cloudbase-3g4w6lls8a5ce59b.636c-cloudbase-3g4w6lls8a5ce59b-1320051234/images/products/product2.jpg',
        'cloud://cloudbase-3g4w6lls8a5ce59b.636c-cloudbase-3g4w6lls8a5ce59b-1320051234/images/products/product3.jpg',
        'cloud://cloudbase-3g4w6lls8a5ce59b.636c-cloudbase-3g4w6lls8a5ce59b-1320051234/images/products/product4.jpg',
        'cloud://cloudbase-3g4w6lls8a5ce59b.636c-cloudbase-3g4w6lls8a5ce59b-1320051234/images/products/product5.jpg',
        'cloud://cloudbase-3g4w6lls8a5ce59b.636c-cloudbase-3g4w6lls8a5ce59b-1320051234/images/products/product6.jpg',
        // 分类图标
        'cloud://cloudbase-3g4w6lls8a5ce59b.636c-cloudbase-3g4w6lls8a5ce59b-1320051234/images/categories/electronics.jpg',
        'cloud://cloudbase-3g4w6lls8a5ce59b.636c-cloudbase-3g4w6lls8a5ce59b-1320051234/images/categories/clothing.jpg',
        'cloud://cloudbase-3g4w6lls8a5ce59b.636c-cloudbase-3g4w6lls8a5ce59b-1320051234/images/categories/home.jpg',
        'cloud://cloudbase-3g4w6lls8a5ce59b.636c-cloudbase-3g4w6lls8a5ce59b-1320051234/images/categories/sports.jpg',
        // 默认图片
        'cloud://cloudbase-3g4w6lls8a5ce59b.636c-cloudbase-3g4w6lls8a5ce59b-1320051234/images/placeholder.jpg',
        'cloud://cloudbase-3g4w6lls8a5ce59b.636c-cloudbase-3g4w6lls8a5ce59b-1320051234/images/default-product.jpg'
      ]
    });

    // 处理结果，按类型分类
    const images = {
      banners: [],
      products: [],
      categories: [],
      defaults: []
    };

    result.fileList.forEach(file => {
      if (file.status === 0) { // 成功获取临时链接
        const url = file.tempFileURL;
        if (file.fileID.includes('/banners/')) {
          images.banners.push(url);
        } else if (file.fileID.includes('/products/')) {
          images.products.push(url);
        } else if (file.fileID.includes('/categories/')) {
          images.categories.push(url);
        } else if (file.fileID.includes('/placeholder') || file.fileID.includes('/default-product')) {
          images.defaults.push(url);
        }
      }
    });

    // 根据请求类型返回对应图片
    if (type === 'banners') {
      return {
        success: true,
        data: images.banners,
        type: 'banners'
      };
    } else if (type === 'products') {
      return {
        success: true,
        data: images.products,
        type: 'products'
      };
    } else if (type === 'categories') {
      return {
        success: true,
        data: images.categories,
        type: 'categories'
      };
    } else {
      return {
        success: true,
        data: images,
        type: 'all'
      };
    }

  } catch (error) {
    console.error('获取图片失败:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
} 