const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

async function testImageSave() {
  try {
    console.log('🧪 测试图片保存功能...\n');

    // 测试保存图片信息
    console.log('1️⃣ 测试保存图片信息到数据库...');
    const saveResult = await app.callFunction({
      name: 'cloudStorageManager',
      data: {
        action: 'saveImageInfo',
        data: {
          images: [{
            cloudPath: 'images/test/test1.jpg',
            url: 'https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/images/test/test1.jpg',
            fileName: 'test1.jpg',
            category: 'test',
            displayOrder: 1,
            createTime: new Date(),
            updateTime: new Date()
          }],
          category: 'test'
        }
      }
    });

    console.log('保存结果:', saveResult.result);
    
    if (saveResult.result.success) {
      console.log('✅ 图片信息保存成功！\n');
      
      // 测试获取图片列表
      console.log('2️⃣ 测试获取图片列表...');
      const listResult = await app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'getImageList',
          data: {
            category: 'test'
          }
        }
      });

      console.log('图片列表结果:', listResult.result);
      
      if (listResult.result.success) {
        console.log('✅ 图片列表获取成功！');
        console.log(`📊 共找到 ${listResult.result.data.length} 张图片`);
      } else {
        console.log('❌ 图片列表获取失败:', listResult.result.error);
      }
    } else {
      console.log('❌ 图片信息保存失败:', saveResult.result.error);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testImageSave();
