const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  console.log("云函数接收到的参数:", JSON.stringify(event, null, 2));
  
  const { action, data, categoryData, categoryId, updateData } = event;
  
  try {
    switch (action) {
      case "uploadImage":
        return await uploadImage(data);
      case "getImages":
        return await getImages(data);
      case "getImagesByCategory":
        return await getImagesByCategory(data);
      case "deleteImage":
        return await deleteImage(data);
      case "updateImage":
        return await updateImage(data);
      case "createCategory":
        return await createCategory(categoryData);
      case "getCategories":
        return await getCategories();
      case "updateCategory":
        return await updateCategory(categoryId, updateData);
      case "deleteCategory":
        return await deleteCategory(categoryId);
      case "uploadFile":
        return await uploadFile(data);
      case "saveImageInfo":
        return await saveImageInfo(data);
      case "listImages":
        return await listImages();
      case "getImageInfo":
        return await getImageInfo(data);
      case "getTempFileURL":
        return await getTempFileURL(data);
      case "getStorageStats":
        return await getStorageStats();
      case "listFolders":
        return await listFolders();
      case "createFolder":
        return await createFolder(data);
      case "deleteFolder":
        return await deleteFolder(data);
      default:
        console.error("未知的操作类型:", action);
        throw new Error("未知的操作类型: " + action);
    }
  } catch (error) {
    console.error("云函数执行错误:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 上传图片（包含分类）
async function uploadImage(data) {
  console.log("uploadImage 接收到的数据:", JSON.stringify(data, null, 2));
  
  if (!data || !data.fileData) {
    console.error("缺少必要参数:", data);
    return {
      success: false,
      error: "缺少必要参数: fileData"
    };
  }
  
  const { fileData, fileName, fileType, cloudPath, category = 'general' } = data;
  
  try {
    console.log("开始上传图片:", { fileName, fileType, cloudPath, category });
    
    const buffer = Buffer.from(fileData.split(',')[1], "base64");
    
    const uploadResult = await cloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: buffer,
    });
    
    console.log("上传结果:", uploadResult);
    
    if (uploadResult.fileID) {
      const tempFileResult = await cloud.getTempFileURL({
        fileList: [uploadResult.fileID]
      });
      
      const url = tempFileResult.fileList[0] ? tempFileResult.fileList[0].tempFileURL : "";
      
      console.log("临时链接:", url);
      
      // 保存图片信息到数据库
      const imageData = {
        fileID: uploadResult.fileID,
        url: url,
        fileName: fileName,
        fileType: fileType,
        cloudPath: cloudPath,
        category: category,
        title: fileName,
        isActive: true,
        createTime: new Date(),
        updateTime: new Date()
      };
      
      const saveResult = await db.collection('images').add({
        data: imageData
      });
      
      console.log("图片信息保存结果:", saveResult);
      
      return {
        success: true,
        data: {
          _id: saveResult._id,
          ...imageData
        }
      };
    } else {
      throw new Error("上传失败，未获取到文件ID");
    }
  } catch (error) {
    console.error("上传图片失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 获取图片列表
async function getImages(data) {
  const { category = 'all', limit = 20, offset = 0 } = data || {};
  
  try {
    let query = {};
    if (category !== 'all') {
      query.category = category;
    }
    
    const result = await db.collection('images')
      .where(query)
      .orderBy('createTime', 'desc')
      .skip(offset)
      .limit(limit)
      .get();
    
    return {
      success: true,
      data: {
        images: result.data,
        total: result.data.length
      }
    };
  } catch (error) {
    console.error("获取图片失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 按分类获取图片
async function getImagesByCategory(data) {
  const { category, limit = 20, offset = 0 } = data;
  
  try {
    const result = await db.collection('images')
      .where({
        category: category
      })
      .orderBy('createTime', 'desc')
      .skip(offset)
      .limit(limit)
      .get();
    
    return {
      success: true,
      data: {
        images: result.data,
        total: result.data.length
      }
    };
  } catch (error) {
    console.error("按分类获取图片失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 删除图片
async function deleteImage(data) {
  const { imageId } = data;
  
  try {
    // 先获取图片信息
    const imageResult = await db.collection('images').doc(imageId).get();
    if (imageResult.data.length === 0) {
      return {
        success: false,
        error: "图片不存在"
      };
    }
    
    const image = imageResult.data[0];
    
    // 删除云存储文件
    if (image.fileID) {
      await cloud.deleteFile({
        fileList: [image.fileID]
      });
    }
    
    // 删除数据库记录
    await db.collection('images').doc(imageId).remove();
    
    return {
      success: true,
      data: { deleted: true }
    };
  } catch (error) {
    console.error("删除图片失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 更新图片信息
async function updateImage(data) {
  const { imageId, updateData } = data;
  
  try {
    await db.collection('images').doc(imageId).update({
      data: {
        ...updateData,
        updateTime: new Date()
      }
    });
    
    return {
      success: true,
      data: { updated: true }
    };
  } catch (error) {
    console.error("更新图片失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 创建分类
async function createCategory(categoryData) {
  try {
    const result = await db.collection('categories').add({
      data: {
        ...categoryData,
        createTime: new Date(),
        updateTime: new Date(),
        imageCount: 0
      }
    });
    
    return {
      success: true,
      data: {
        _id: result._id,
        ...categoryData,
        createTime: new Date(),
        updateTime: new Date(),
        imageCount: 0
      }
    };
  } catch (error) {
    console.error("创建分类失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 获取分类列表
async function getCategories() {
  try {
    const result = await db.collection('categories')
      .orderBy('createTime', 'desc')
      .get();
    
    // 为每个分类计算图片数量
    const categoriesWithCount = await Promise.all(
      result.data.map(async (category) => {
        const imageCountResult = await db.collection('images')
          .where({ category: category.name })
          .count();
        
        return {
          ...category,
          imageCount: imageCountResult.total
        };
      })
    );
    
    return {
      success: true,
      data: categoriesWithCount
    };
  } catch (error) {
    console.error("获取分类失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 更新分类
async function updateCategory(categoryId, updateData) {
  try {
    await db.collection('categories').doc(categoryId).update({
      data: {
        ...updateData,
        updateTime: new Date()
      }
    });
    
    return {
      success: true,
      data: { updated: true }
    };
  } catch (error) {
    console.error("更新分类失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 删除分类
async function deleteCategory(categoryId) {
  try {
    // 先删除该分类下的所有图片
    const imagesResult = await db.collection('images')
      .where({ category: categoryId })
      .get();
    
    for (const image of imagesResult.data) {
      if (image.fileID) {
        await cloud.deleteFile({
          fileList: [image.fileID]
        });
      }
      await db.collection('images').doc(image._id).remove();
    }
    
    // 删除分类
    await db.collection('categories').doc(categoryId).remove();
    
    return {
      success: true,
      data: { deleted: true }
    };
  } catch (error) {
    console.error("删除分类失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 上传文件
async function uploadFile(data) {
  const { fileData, fileName, fileType, cloudPath } = data;
  
  try {
    const buffer = Buffer.from(fileData.split(',')[1], "base64");
    
    const uploadResult = await cloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: buffer,
    });
    
    if (uploadResult.fileID) {
      const tempFileResult = await cloud.getTempFileURL({
        fileList: [uploadResult.fileID]
      });
      
      const url = tempFileResult.fileList[0] ? tempFileResult.fileList[0].tempFileURL : "";
      
      return {
        success: true,
        data: {
          fileID: uploadResult.fileID,
          url: url,
          fileName: fileName,
          fileType: fileType,
          cloudPath: cloudPath
        }
      };
    } else {
      throw new Error("上传失败，未获取到文件ID");
    }
  } catch (error) {
    console.error("上传文件失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 保存图片信息
async function saveImageInfo(data) {
  const { imageInfo } = data;
  
  try {
    const result = await db.collection('images').add({
      data: {
        ...imageInfo,
        createTime: new Date(),
        updateTime: new Date()
      }
    });
    
    return {
      success: true,
      data: {
        _id: result._id,
        ...imageInfo
      }
    };
  } catch (error) {
    console.error("保存图片信息失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 列出所有图片
async function listImages() {
  try {
    const result = await db.collection('images')
      .orderBy('createTime', 'desc')
      .get();
    
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error("列出图片失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 获取图片信息
async function getImageInfo(data) {
  const { imageId } = data;
  
  try {
    const result = await db.collection('images').doc(imageId).get();
    
    if (result.data.length === 0) {
      return {
        success: false,
        error: "图片不存在"
      };
    }
    
    return {
      success: true,
      data: result.data[0]
    };
  } catch (error) {
    console.error("获取图片信息失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 获取临时文件URL
async function getTempFileURL(data) {
  const { fileList } = data;
  
  try {
    const result = await cloud.getTempFileURL({
      fileList: fileList
    });
    
    return {
      success: true,
      data: result.fileList
    };
  } catch (error) {
    console.error("获取临时文件URL失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 获取存储统计
async function getStorageStats() {
  try {
    const imagesResult = await db.collection('images').count();
    const categoriesResult = await db.collection('categories').count();
    
    return {
      success: true,
      data: {
        totalImages: imagesResult.total,
        totalCategories: categoriesResult.total
      }
    };
  } catch (error) {
    console.error("获取存储统计失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 列出文件夹
async function listFolders() {
  try {
    // 这里可以调用云存储API列出文件夹
    // 暂时返回空数组
    return {
      success: true,
      data: []
    };
  } catch (error) {
    console.error("列出文件夹失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 创建文件夹
async function createFolder(data) {
  const { folderName, folderPath } = data;
  
  try {
    // 云存储会自动创建文件夹，这里只需要记录到数据库
    return {
      success: true,
      data: { created: true }
    };
  } catch (error) {
    console.error("创建文件夹失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 删除文件夹
async function deleteFolder(data) {
  const { folderPath } = data;
  
  try {
    // 删除文件夹下的所有文件
    const imagesResult = await db.collection('images')
      .where({ cloudPath: db.RegExp({
        regexp: `^${folderPath}`,
        options: 'i'
      }) })
      .get();
    
    for (const image of imagesResult.data) {
      if (image.fileID) {
        await cloud.deleteFile({
          fileList: [image.fileID]
        });
      }
      await db.collection('images').doc(image._id).remove();
    }
    
    return {
      success: true,
      data: { deleted: true }
    };
  } catch (error) {
    console.error("删除文件夹失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
