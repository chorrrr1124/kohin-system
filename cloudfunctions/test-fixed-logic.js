const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

const db = app.database();

async function testFixedLogic() {
  try {
    console.log('🧪 测试修复后的逻辑...');
    
    // 模拟云函数中的逻辑
    const allData = await db.collection('images')
      .limit(100)
      .get();
    
    console.log('📊 原始数据数量:', allData.data?.length || 0);
    
    let filteredData = allData.data || [];
    
    // 测试轮播图过滤
    const bannerData = filteredData.filter(item => 
      item.category === 'banner'
    );
    
    console.log('🎯 轮播图数量:', bannerData.length);
    
    if (bannerData.length > 0) {
      console.log('📸 第一张轮播图:', {
        _id: bannerData[0]._id,
        fileName: bannerData[0].fileName,
        category: bannerData[0].category,
        url: bannerData[0].url
      });
    }
    
    // 测试全部图片
    console.log('📊 全部图片数量:', filteredData.length);
    
    // 按 sortOrder 排序
    filteredData.sort((a, b) => {
      const sortOrderA = a.sortOrder || 0;
      const sortOrderB = b.sortOrder || 0;
      if (sortOrderA !== sortOrderB) {
        return sortOrderA - sortOrderB;
      }
      const timeA = new Date(a.createTime || 0).getTime();
      const timeB = new Date(b.createTime || 0).getTime();
      return timeB - timeA;
    });
    
    console.log('✅ 排序完成，前3张图片:');
    filteredData.slice(0, 3).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.fileName} (${item.category}) - sortOrder: ${item.sortOrder || 0}`);
    });
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testFixedLogic();
