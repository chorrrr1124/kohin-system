const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

async function testFixedFunction() {
  try {
    console.log('🧪 测试修复后的云函数...');
    
    const result = await app.callFunction({
      name: 'cloudStorageManager',
      data: {
        action: 'getImageList',
        data: {
          category: 'banner'
        }
      }
    });
    
    console.log('📊 云函数调用结果:', JSON.stringify(result, null, 2));
    
    if (result.result && result.result.success) {
      console.log('✅ 成功获取图片列表');
      console.log('📸 图片数量:', result.result.data.length);
      
      if (result.result.data.length > 0) {
        console.log('📸 第一张图片数据:');
        console.log(JSON.stringify(result.result.data[0], null, 2));
      }
    } else {
      console.error('❌ 获取图片列表失败:', result.result?.error);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testFixedFunction();
