const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

const db = app.database();

exports.main = async (event, context) => {
  try {
    console.log('🔧 开始修复图片URL...');
    
    // 获取所有图片数据
    const result = await db.collection('images').get();
    const images = result.data || [];
    
    console.log(`📊 找到 ${images.length} 张图片`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const image of images) {
      let needUpdate = false;
      let updateData = {};
      
      // 检查并修复URL
      const currentUrl = image.imageUrl || image.url;
      
      if (currentUrl && (currentUrl.includes('mock-cdn.example.com') || 
          currentUrl.includes('undefined') ||
          currentUrl.includes('example.com'))) {
        
        console.log(`🚨 检测到无效URL: ${currentUrl}`);
        
        // 从fileID生成正确的URL
        if (image.fileID && image.fileID.startsWith('cloud://')) {
          const path = image.fileID.replace('cloud://cloudbase-3g4w6lls8a5ce59b.', '');
          const newUrl = `https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/${path}`;
          updateData.imageUrl = newUrl;
          updateData.url = newUrl;
          needUpdate = true;
          console.log(`✅ 生成新URL: ${newUrl}`);
        } else if (image.cloudPath) {
          const newUrl = `https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/${image.cloudPath}`;
          updateData.imageUrl = newUrl;
          updateData.url = newUrl;
          needUpdate = true;
          console.log(`✅ 生成新URL: ${newUrl}`);
        }
      }
      
      if (needUpdate) {
        await db.collection('images').doc(image._id).update({
          data: updateData
        });
        updatedCount++;
        console.log(`✅ 更新图片 ${image._id}`);
      } else {
        skippedCount++;
      }
    }
    
    console.log(`🎯 修复完成！更新了 ${updatedCount} 张图片，跳过了 ${skippedCount} 张图片`);
    
    return {
      success: true,
      message: `修复完成！更新了 ${updatedCount} 张图片，跳过了 ${skippedCount} 张图片`,
      data: {
        total: images.length,
        updated: updatedCount,
        skipped: skippedCount
      }
    };
    
  } catch (error) {
    console.error('❌ 修复图片URL失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
