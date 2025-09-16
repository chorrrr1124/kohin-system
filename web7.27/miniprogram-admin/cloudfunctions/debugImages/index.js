const cloudbase = require('@cloudbase/node-sdk');

// 初始化云开发
const app = cloudbase.init({
  env: cloudbase.SYMBOL_CURRENT_ENV
});

const db = app.database();

exports.main = async (event, context) => {
  try {
    console.log('🔍 查询图片数据...');
    
    // 查询前3张图片
    const result = await db.collection('images')
      .orderBy('createTime', 'desc')
      .limit(3)
      .get();
    
    console.log('📊 查询结果:', result.data.length, '张图片');
    
    const images = result.data.map((image, index) => {
      console.log(`\n📷 图片 ${index + 1}:`);
      console.log('  ID:', image._id);
      console.log('  标题:', image.title || '无标题');
      console.log('  文件名:', image.fileName || '无文件名');
      console.log('  分类:', image.category || '无分类');
      console.log('  fileID:', image.fileID || '无fileID');
      console.log('  url:', image.url || '无url');
      console.log('  imageUrl:', image.imageUrl || '无imageUrl');
      console.log('  cloudPath:', image.cloudPath || '无cloudPath');
      console.log('  创建时间:', image.createTime);
      console.log('  是否启用:', image.isActive);
      
      return {
        _id: image._id,
        title: image.title,
        fileName: image.fileName,
        category: image.category,
        fileID: image.fileID,
        url: image.url,
        imageUrl: image.imageUrl,
        cloudPath: image.cloudPath,
        createTime: image.createTime,
        isActive: image.isActive
      };
    });
    
    return {
      success: true,
      data: {
        images: images,
        total: result.data.length
      }
    };
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
