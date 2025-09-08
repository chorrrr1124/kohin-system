const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

const db = app.database();

exports.main = async (event, context) => {
  const { category, path } = event;
  
  try {
    // 从数据库获取图片列表
    const result = await db.collection('images')
      .where({
        category: category
      })
      .orderBy('displayOrder', 'asc')
      .get();
    
    const images = result.data || [];
    
    // 为每个图片获取临时访问URL
    const imagesWithURLs = await Promise.all(
      images.map(async (image) => {
        try {
          const urlResult = await app.getTempFileURL({
            fileList: [{
              fileID: image.fileID,
              maxAge: 3600 // 1小时有效期
            }]
          });
          
          if (urlResult.fileList && urlResult.fileList.length > 0) {
            const fileInfo = urlResult.fileList[0];
            if (fileInfo.code === 'SUCCESS') {
              return {
                ...image,
                url: fileInfo.tempFileURL
              };
            }
          }
          
          return image;
        } catch (error) {
          console.error('获取图片URL失败:', error);
          return image;
        }
      })
    );
    
    return {
      success: true,
      data: imagesWithURLs
    };
  } catch (error) {
    console.error('获取图片列表失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
