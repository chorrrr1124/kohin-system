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
      case 'getImageList':
        return await getImageList(data);
      case 'saveImages':
        return await saveImages(data);
      case 'deleteImage':
        return await deleteImage(data);
      case 'updateImageOrder':
        return await updateImageOrder(data);
      default:
        return {
          success: false,
          error: '未知的操作类型'
        };
    }
  } catch (error) {
    console.error('图片管理云函数错误:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 获取图片列表
async function getImageList(data) {
  const { category, path } = data;
  
  try {
    const result = await db.collection('images')
      .where({
        category: category
      })
      .orderBy('displayOrder', 'asc')
      .get();
    
    return {
      success: true,
      data: result.data || []
    };
  } catch (error) {
    console.error('获取图片列表失败:', error);
    
    // 如果集合不存在，返回空数组而不是错误
    if (error.code === 'DATABASE_COLLECTION_NOT_EXIST') {
      return {
        success: true,
        data: [],
        message: 'Images集合不存在，返回空列表'
      };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// 保存图片信息
async function saveImages(data) {
  const { images, category } = data;
  
  try {
    // 先尝试创建集合（通过插入一条记录）
    try {
      await db.collection('images').add({
        data: {
          _init: true,
          createTime: new Date()
        }
      });
      
      // 删除初始化记录
      const initResult = await db.collection('images').where({ _init: true }).get();
      if (initResult.data.length > 0) {
        await db.collection('images').doc(initResult.data[0]._id).remove();
      }
    } catch (initError) {
      console.log('集合可能已存在或创建失败:', initError.message);
    }
    
    // 使用Promise.all进行批量插入
    const insertPromises = images.map(image => {
      return db.collection('images').add({
        data: {
          ...image,
          category: category,
          createTime: new Date(),
          updateTime: new Date()
        }
      });
    });
    
    await Promise.all(insertPromises);
    
    return {
      success: true,
      message: `成功保存 ${images.length} 张图片`
    };
  } catch (error) {
    console.error('保存图片失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 删除图片
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
      message: '图片删除成功'
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
          displayOrder: newOrder,
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
