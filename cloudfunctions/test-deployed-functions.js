const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

async function testDeployedFunctions() {
  try {
    console.log('🧪 测试已部署的云函数...\n');

    // 1. 测试数据库初始化
    console.log('1️⃣ 测试数据库初始化...');
    try {
      const initResult = await app.callFunction({
        name: 'initImagesDB',
        data: {}
      });
      console.log('数据库初始化结果:', initResult.result);
    } catch (error) {
      console.log('数据库初始化失败:', error.message);
    }

    // 2. 测试云存储图片管理
    console.log('\n2️⃣ 测试云存储图片管理...');
    try {
      const managerResult = await app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'saveImageInfo',
          data: {
            images: [{
              cloudPath: 'images/test/test1.jpg',
              url: 'https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/images/test/test1.jpg',
              fileName: 'test1.jpg',
              category: 'test',
              displayOrder: 1
            }],
            category: 'test'
          }
        }
      });
      console.log('云存储管理结果:', managerResult.result);
    } catch (error) {
      console.log('云存储管理失败:', error.message);
    }

    // 3. 测试获取图片列表
    console.log('\n3️⃣ 测试获取图片列表...');
    try {
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
    } catch (error) {
      console.log('获取图片列表失败:', error.message);
    }

    console.log('\n✅ 测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testDeployedFunctions();
