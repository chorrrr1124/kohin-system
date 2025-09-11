const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

const db = app.database();

async function checkDatabase() {
  try {
    console.log('🔍 检查数据库中的图片数据...');
    const result = await db.collection('images').get();
    console.log('📊 总数据量:', result.data.length);
    
    if (result.data.length > 0) {
      console.log('📸 第一张图片数据结构:');
      console.log(JSON.stringify(result.data[0], null, 2));
      
      console.log('🔍 按分类统计:');
      const categories = {};
      result.data.forEach(item => {
        const cat = item.category || 'unknown';
        categories[cat] = (categories[cat] || 0) + 1;
      });
      console.log(categories);
      
      // 检查banner分类的数据
      const bannerImages = result.data.filter(item => item.category === 'banner');
      console.log('🎯 banner分类图片数量:', bannerImages.length);
      if (bannerImages.length > 0) {
        console.log('📸 banner分类第一张图片:');
        console.log(JSON.stringify(bannerImages[0], null, 2));
      }
    } else {
      console.log('❌ 数据库中没有图片数据');
    }
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  }
}

checkDatabase();
