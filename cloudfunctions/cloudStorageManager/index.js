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
      filteredData = filteredData.filter(item => {
        // 兼容两种数据结构：item.category 和 item.data.category
        const itemCategory = item.category || (item.data && item.data.category);
        return itemCategory === category;
      });
    }
    
    // 按 sortOrder 和 createTime 排序
    filteredData.sort((a, b) => {
      // 兼容两种数据结构：item.sortOrder 和 item.data.sortOrder
      const sortOrderA = a.sortOrder || (a.data && a.data.sortOrder) || 0;
      const sortOrderB = b.sortOrder || (b.data && b.data.sortOrder) || 0;
      if (sortOrderA !== sortOrderB) {
        return sortOrderA - sortOrderB;
      }
      // 兼容两种数据结构：item.createTime 和 item.data.createTime
      const timeA = new Date(a.createTime || (a.data && a.data.createTime) || 0).getTime();
      const timeB = new Date(b.createTime || (b.data && b.data.createTime) || 0).getTime();
      return timeB - timeA;
    });
    
    // 应用 limit
    filteredData = filteredData.slice(0, limit);
    
    // 数据转换：将嵌套的 data 结构展平，兼容前端期望的数据格式
    const transformedData = await Promise.all(filteredData.map(async (item) => {
      let imageData;
      
      // 如果数据在 data 字段中，将其展平
      if (item.data && typeof item.data === 'object') {
        imageData = {
          _id: item._id,
          ...item.data,
          // 确保有正确的图片URL字段
          imageUrl: item.data.imageUrl || item.data.url,
          url: item.data.url || item.data.imageUrl,
          // 确保有正确的文件名字段
          title: item.data.title || item.data.fileName,
          fileName: item.data.fileName || item.data.title
        };
      } else {
        // 如果数据直接在根级别，直接返回
        imageData = {
          _id: item._id,
          ...item,
          // 确保有正确的图片URL字段
          imageUrl: item.imageUrl || item.url,
          url: item.url || item.imageUrl,
          // 确保有正确的文件名字段
          title: item.title || item.fileName,
          fileName: item.fileName || item.title
        };
      }
      
      // 如果URL是模拟URL或者无效，尝试从fileID生成真实URL
      if (!imageData.url || imageData.url.includes('mock-cdn.example.com') || imageData.url.includes('undefined')) {
        if (imageData.fileID) {
          try {
            console.log('🔄 尝试为fileID生成临时URL:', imageData.fileID);
            const urlResult = await app.getTempFileURL({
              fileList: [{
                fileID: imageData.fileID,
                maxAge: 3600 // 1小时有效期
              }]
            });
            
            if (urlResult.fileList && urlResult.fileList.length > 0) {
              const fileInfo = urlResult.fileList[0];
              if (fileInfo.code === 'SUCCESS') {
                imageData.url = fileInfo.tempFileURL;
                imageData.imageUrl = fileInfo.tempFileURL;
                console.log('✅ 生成临时URL成功:', fileInfo.tempFileURL);
              } else {
                console.log('❌ 生成临时URL失败:', fileInfo.code, fileInfo.errMsg);
              }
            }
          } catch (error) {
            console.error('❌ 生成临时URL异常:', error.message);
          }
        }
      }
      
      return imageData;
    }));
    
    return {
      success: true,
      data: transformedData,
      total: transformedData.length
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
    console.log('🗑️ 开始删除图片，ID:', imageId, '分类:', category);
    
    // 先查询要删除的图片信息
    const queryResult = await db.collection('images')
      .where({
        _id: imageId
      })
      .get();
    
    if (queryResult.data.length === 0) {
      return {
        success: false,
        error: '图片不存在'
      };
    }
    
    console.log('📸 找到图片:', queryResult.data[0]);
    
    // 删除图片记录
    const deleteResult = await db.collection('images')
      .where({
        _id: imageId
      })
      .remove();
    
    console.log('✅ 删除结果:', deleteResult);
    
    return {
      success: true,
      message: '图片信息删除成功',
      deletedCount: deleteResult.deleted || 1,
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
