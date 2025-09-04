// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { category = 'all', limit = 50 } = event;
    
    // COS配置
    const cosConfig = {
      bucket: 'kohin-1327524326',
      region: 'ap-guangzhou'
    };
    
    // 根据分类获取图片列表
    let prefix = 'images/';
    if (category !== 'all') {
      prefix = `images/${category}/`;
    }
    
    // 获取COS对象列表
    const result = await cloud.cos.getBucket({
      bucket: cosConfig.bucket,
      region: cosConfig.region,
      prefix: prefix,
      maxKeys: limit
    });
    
    // 处理图片URL
    const images = [];
    if (result.Contents && result.Contents.length > 0) {
      for (const item of result.Contents) {
        if (item.Key && (item.Key.endsWith('.jpg') || item.Key.endsWith('.jpeg') || item.Key.endsWith('.png') || item.Key.endsWith('.gif'))) {
          // 构建图片访问URL
          const imageUrl = `https://${cosConfig.bucket}.cos.${cosConfig.region}.myqcloud.com/${item.Key}`;
          images.push({
            key: item.Key,
            url: imageUrl,
            size: item.Size,
            lastModified: item.LastModified,
            category: category
          });
        }
      }
    }
    
    return {
      success: true,
      data: images,
      category: category,
      count: images.length
    };
    
  } catch (error) {
    console.error('获取COS图片失败:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}
