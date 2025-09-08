const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

const db = app.database();

exports.main = async (event, context) => {
  const { category, path } = event;
  
  try {
    // 从数据库获取图片列表（手动过滤）
    const allData = await db.collection('images').get();
    
    let images = allData.data || [];
    
    // 按分类过滤
    if (category) {
      images = images.filter(item => 
        item.data && item.data.category === category
      );
    }
    
    // 按 sortOrder 排序
    images.sort((a, b) => {
      const sortOrderA = a.data.sortOrder || 0;
      const sortOrderB = b.data.sortOrder || 0;
      return sortOrderA - sortOrderB;
    });
    
    // 为每个图片获取临时访问URL（如果fileID存在）
    const imagesWithURLs = await Promise.all(
      images.map(async (image) => {
        try {
          // 如果已经有URL，直接返回
          if (image.data.url) {
            return {
              ...image,
              url: image.data.url
            };
          }
          
          // 如果有fileID，尝试获取临时URL
          if (image.data.fileID) {
            const urlResult = await app.getTempFileURL({
              fileList: [{
                fileID: image.data.fileID,
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
          }
          
          // 如果都没有，返回原数据
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
