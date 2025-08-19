// cloudfunctions/homepageManagement/index.js
const cloud = require('wx-server-sdk');

// 初始化 cloud
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 使用当前云环境
});

const db = cloud.database();

/**
 * 首页管理云函数
 * 支持轮播图和推广内容的 CRUD 操作
 */
exports.main = async (event, context) => {
  const { action, type, data, id, params } = event;
  
  try {
    switch (action) {
      case 'getCarousel':
        return await getCarouselImages(params);
      case 'addCarousel':
        return await addCarouselImage(data);
      case 'updateCarousel':
        return await updateCarouselImage(id, data);
      case 'deleteCarousel':
        return await deleteCarouselImage(id);
      case 'getPromo':
        return await getPromoContent();
      case 'updatePromo':
        return await updatePromoContent(data);
      case 'uploadImage':
        return await uploadImage(data);
      default:
        return {
          success: false,
          error: '不支持的操作类型'
        };
    }
  } catch (error) {
    console.error('首页管理云函数执行失败:', error);
    return {
      success: false,
      error: error.message || '操作失败'
    };
  }
};

// 获取轮播图列表
async function getCarouselImages(params = {}) {
  try {
    const { status, limit = 50 } = params;
    
    let query = db.collection('homepage_carousel');
    
    // 如果指定了状态，则添加过滤条件
    if (status) {
      query = query.where({ status });
    }
    
    const result = await query
      .orderBy('sort', 'asc')
      .orderBy('createTime', 'desc')
      .limit(limit)
      .get();
    
    return {
      success: true,
      data: result.data,
      total: result.data.length
    };
  } catch (error) {
    throw new Error(`获取轮播图失败: ${error.message}`);
  }
}

// 添加轮播图
async function addCarouselImage(data) {
  try {
    // 验证必要字段
    if (!data.title || !data.imageUrl) {
      throw new Error('标题和图片不能为空');
    }
    
    const carouselData = {
      title: data.title,
      subtitle: data.subtitle || '',
      imageUrl: data.imageUrl,
      gradient: data.gradient || 'linear-gradient(135deg, rgba(76, 175, 80, 0.85) 0%, rgba(139, 195, 74, 0.85) 50%, rgba(205, 220, 57, 0.85) 100%)',
      sort: data.sort || 0,
      status: data.status || 'active',
      link: data.link || '',
      createTime: new Date(),
      updateTime: new Date()
    };
    
    const result = await db.collection('homepage_carousel').add({
      data: carouselData
    });
    
    return {
      success: true,
      data: {
        id: result._id,
        ...carouselData
      },
      message: '添加轮播图成功'
    };
  } catch (error) {
    throw new Error(`添加轮播图失败: ${error.message}`);
  }
}

// 更新轮播图
async function updateCarouselImage(id, data) {
  try {
    if (!id) {
      throw new Error('轮播图ID不能为空');
    }
    
    const updateData = {
      updateTime: new Date()
    };
    
    // 只更新提供的字段
    if (data.title !== undefined) updateData.title = data.title;
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.gradient !== undefined) updateData.gradient = data.gradient;
    if (data.sort !== undefined) updateData.sort = data.sort;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.link !== undefined) updateData.link = data.link;
    
    const result = await db.collection('homepage_carousel')
      .doc(id)
      .update({
        data: updateData
      });
    
    return {
      success: true,
      data: updateData,
      message: '更新轮播图成功'
    };
  } catch (error) {
    throw new Error(`更新轮播图失败: ${error.message}`);
  }
}

// 删除轮播图
async function deleteCarouselImage(id) {
  try {
    if (!id) {
      throw new Error('轮播图ID不能为空');
    }
    
    const result = await db.collection('homepage_carousel')
      .doc(id)
      .remove();
    
    return {
      success: true,
      message: '删除轮播图成功'
    };
  } catch (error) {
    throw new Error(`删除轮播图失败: ${error.message}`);
  }
}

// 获取推广内容
async function getPromoContent() {
  try {
    const result = await db.collection('homepage_promo')
      .orderBy('updateTime', 'desc')
      .limit(1)
      .get();
    
    return {
      success: true,
      data: result.data.length > 0 ? result.data[0] : null
    };
  } catch (error) {
    throw new Error(`获取推广内容失败: ${error.message}`);
  }
}

// 更新推广内容
async function updatePromoContent(data) {
  try {
    // 验证必要字段
    if (!data.title) {
      throw new Error('标题不能为空');
    }
    
    const promoData = {
      title: data.title,
      subtitle: data.subtitle || '',
      giftNote: data.giftNote || '',
      validityNote: data.validityNote || '',
      prices: data.prices || [],
      updateTime: new Date()
    };
    
    // 检查是否已存在记录
    const existingResult = await db.collection('homepage_promo')
      .limit(1)
      .get();
    
    let result;
    if (existingResult.data.length > 0) {
      // 更新现有记录
      result = await db.collection('homepage_promo')
        .doc(existingResult.data[0]._id)
        .update({
          data: promoData
        });
    } else {
      // 创建新记录
      promoData.createTime = new Date();
      result = await db.collection('homepage_promo').add({
        data: promoData
      });
    }
    
    return {
      success: true,
      data: promoData,
      message: '更新推广内容成功'
    };
  } catch (error) {
    throw new Error(`更新推广内容失败: ${error.message}`);
  }
}

// 上传图片到云存储
async function uploadImage(data) {
  try {
    const { fileContent, fileName, filePath } = data;
    
    if (!fileContent && !filePath) {
      throw new Error('文件内容或文件路径不能为空');
    }
    
    // 生成唯一文件名
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2);
    const cloudPath = `carousel/${timestamp}_${random}_${fileName || 'image.jpg'}`;
    
    let result;
    if (fileContent) {
      // 上传base64文件内容
      const buffer = Buffer.from(fileContent, 'base64');
      result = await cloud.uploadFile({
        cloudPath,
        fileContent: buffer
      });
    } else {
      // 上传文件路径
      result = await cloud.uploadFile({
        cloudPath,
        filePath
      });
    }
    
    return {
      success: true,
      data: {
        fileID: result.fileID,
        cloudPath: cloudPath
      },
      message: '图片上传成功'
    };
  } catch (error) {
    throw new Error(`图片上传失败: ${error.message}`);
  }
} 