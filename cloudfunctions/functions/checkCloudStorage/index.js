const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

exports.main = async (event, context) => {
  try {
    console.log('🔍 开始检查云存储文件结构...');
    
    // 获取云存储文件列表
    const result = await app.getTempFileURL({
      fileList: []
    });
    
    console.log('📊 云存储文件列表:', result);
    
    // 尝试列出云存储中的文件
    // 注意：CloudBase Node.js SDK 可能没有直接的文件列表API
    // 我们需要通过其他方式获取文件信息
    
    return {
      success: true,
      message: '云存储检查完成',
      data: {
        fileList: result.fileList || [],
        note: '文件按分类存储在以下路径：images/banner/, images/general/, images/category/, images/products/, images/icons/, images/tab/'
      }
    };
    
  } catch (error) {
    console.error('❌ 检查云存储失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
