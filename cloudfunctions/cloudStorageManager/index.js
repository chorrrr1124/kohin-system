const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

const db = app.database();

exports.main = async (event, context) => {
  const { action, data } = event;
  
  try {
    switch (action) {
      case 'saveImageInfo':
        return await saveImageInfo(data);
      case 'getImageList':
        return await getImageList(data);
      case 'deleteImage':
        return await deleteImage(data);
      case 'updateImageOrder':
        return await updateImageOrder(data);
      case 'getImageByCategory':
        return await getImageByCategory(data);
      default:
        return {
          success: false,
          error: '未知的操作类型'
        };
    }
  } catch (error) {
    console.error('云存储图片管理错误:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 保存图片信息到数据库（图片文件存储在云存储中）
async function saveImageInfo(data) {
  const { images, category } = data;
  
  try {
    // 逐个保存图片信息
    const results = [];
    for (const image of images) {
      const result = await db.collection('images').add({
        data: {
          ...image,
          category: category,
          createTime: new Date(),
          updateTime: new Date(),
          // 确保包含云存储相关信息
          cloudStorageId: '636c-cloudbase-3g4w6lls8a5ce59b',
          fileID: image.fileID || image.cloudPath,
          cloudPath: image.cloudPath || image.fileID,
          // 兼容前端字段
          sortOrder: image.displayOrder || image.sortOrder || 0,
          title: image.title || image.fileName,
          imageUrl: image.url,
          linkUrl: image.linkUrl || '',
          isActive: image.isActive !== undefined ? image.isActive : true
        }
      });
      results.push(result);
    }
    
    return {
      success: true,
      message: `成功保存 ${images.length} 张图片信息到数据库`,
      data: {
        savedCount: images.length,
        category: category
      }
    };
  } catch (error) {
    console.error('保存图片信息失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 获取图片列表
async function getImageList(data) {
  const { category, limit = 50, offset = 0 } = data;
  
  try {
    // 先获取所有数据，然后手动过滤
    let allData = await db.collection('images')
      .skip(offset)
      .limit(limit * 2) // 获取更多数据以便过滤
      .get();
    
    let filteredData = allData.data || [];
    
    // 如果有分类条件，手动过滤
    if (category) {
      filteredData = filteredData.filter(item => 
        item.category === category
      );
    }
    
    // 按 sortOrder 和 createTime 排序
    filteredData.sort((a, b) => {
      const sortOrderA = a.sortOrder || 0;
      const sortOrderB = b.sortOrder || 0;
      if (sortOrderA !== sortOrderB) {
        return sortOrderA - sortOrderB;
      }
      const timeA = new Date(a.createTime || 0).getTime();
      const timeB = new Date(b.createTime || 0).getTime();
      return timeB - timeA;
    });
    
    // 应用 limit
    filteredData = filteredData.slice(0, limit);
    
    const result = {
      data: filteredData,
      total: filteredData.length
    };
    
    return {
      success: true,
      data: filteredData,
      total: filteredData.length
    };
  } catch (error) {
    console.error('获取图片列表失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 删除图片（从数据库删除记录，云存储文件需要单独删除）
async function deleteImage(data) {
  const { imageId, category } = data;
  
  try {
    await db.collection('images')
      .where({
        _id: imageId,
        category: category
      })
      .remove();
    
    return {
      success: true,
      message: '图片信息删除成功',
      note: '如需删除云存储文件，请使用云存储删除API'
    };
  } catch (error) {
    console.error('删除图片失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 更新图片显示顺序
async function updateImageOrder(data) {
  const { imageId, newOrder, category } = data;
  
  try {
    await db.collection('images')
      .where({
        _id: imageId,
        category: category
      })
      .update({
        data: {
          sortOrder: newOrder,
          updateTime: new Date()
        }
      });
    
    return {
      success: true,
      message: '顺序更新成功'
    };
  } catch (error) {
    console.error('更新顺序失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 按分类获取图片
async function getImageByCategory(data) {
  const { category } = data;
  
  try {
    // 先获取所有数据，然后手动过滤
    const allData = await db.collection('images').get();
    
    let filteredData = allData.data || [];
    
    // 按分类过滤
    if (category) {
      filteredData = filteredData.filter(item => 
        item.data && item.data.category === category
      );
    }
    
    // 按 sortOrder 排序
    filteredData.sort((a, b) => {
      const sortOrderA = a.data.sortOrder || 0;
      const sortOrderB = b.data.sortOrder || 0;
      return sortOrderA - sortOrderB;
    });
    
    const result = {
      data: filteredData
    };
    
    return {
      success: true,
      data: result.data || [],
      category: category
    };
  } catch (error) {
    console.error('获取分类图片失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
