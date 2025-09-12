const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

const db = app.database();

exports.main = async (event, context) => {
  try {
    console.log('🧹 开始清理图片URL...');
    
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
      if (image.data && image.data.imageUrl) {
        if (image.data.imageUrl.includes('mock-cdn.example.com') || 
            image.data.imageUrl.includes('undefined') ||
            image.data.imageUrl.includes('example.com')) {
          
          // 从fileID生成正确的URL
          if (image.data.fileID && image.data.fileID.startsWith('cloud://')) {
            const path = image.data.fileID.replace('cloud://cloudbase-3g4w6lls8a5ce59b.', '');
            const newUrl = `https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/${path}`;
            updateData['data.imageUrl'] = newUrl;
            updateData['data.url'] = newUrl;
            needUpdate = true;
            console.log(`🔄 更新图片 ${image._id}: ${image.data.imageUrl} -> ${newUrl}`);
          } else if (image.data.cloudPath) {
            const newUrl = `https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/${image.data.cloudPath}`;
            updateData['data.imageUrl'] = newUrl;
            updateData['data.url'] = newUrl;
            needUpdate = true;
            console.log(`🔄 更新图片 ${image._id}: ${image.data.imageUrl} -> ${newUrl}`);
          }
        }
      }
      
      // 检查根级别的URL
      if (image.imageUrl && (image.imageUrl.includes('mock-cdn.example.com') || 
          image.imageUrl.includes('undefined') ||
          image.imageUrl.includes('example.com'))) {
        
        if (image.fileID && image.fileID.startsWith('cloud://')) {
          const path = image.fileID.replace('cloud://cloudbase-3g4w6lls8a5ce59b.', '');
          const newUrl = `https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/${path}`;
          updateData.imageUrl = newUrl;
          updateData.url = newUrl;
          needUpdate = true;
          console.log(`🔄 更新图片 ${image._id}: ${image.imageUrl} -> ${newUrl}`);
        } else if (image.cloudPath) {
          const newUrl = `https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/${image.cloudPath}`;
          updateData.imageUrl = newUrl;
          updateData.url = newUrl;
          needUpdate = true;
          console.log(`🔄 更新图片 ${image._id}: ${image.imageUrl} -> ${newUrl}`);
        }
      }
      
      if (needUpdate) {
        await db.collection('images').doc(image._id).update({
          data: updateData
        });
        updatedCount++;
      } else {
        skippedCount++;
      }
    }
    
    console.log(`✅ 清理完成！更新了 ${updatedCount} 张图片，跳过了 ${skippedCount} 张图片`);
    
    return {
      success: true,
      message: `清理完成！更新了 ${updatedCount} 张图片，跳过了 ${skippedCount} 张图片`,
      data: {
        total: images.length,
        updated: updatedCount,
        skipped: skippedCount
      }
    };
    
  } catch (error) {
    console.error('❌ 清理图片URL失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
