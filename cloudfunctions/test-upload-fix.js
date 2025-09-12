const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

async function testUploadFix() {
  console.log('🧪 开始测试修复后的上传功能...');
  
  try {
    // 创建一个测试文件（模拟图片数据）
    const testData = Buffer.alloc(1024 * 1024, 'A'); // 1MB 测试数据
    const base64Data = testData.toString('base64');
    
    // 模拟分块数据
    const chunkSize = 100 * 1024; // 100KB 每块
    const chunks = [];
    
    for (let i = 0; i < base64Data.length; i += chunkSize) {
      const chunk = base64Data.slice(i, i + chunkSize);
      chunks.push(chunk);
    }
    
    console.log(`📦 创建了 ${chunks.length} 个分块，总大小: ${testData.length} bytes`);
    
    // 调用云函数
    const result = await app.callFunction({
      name: 'uploadToCloudStorage',
      data: {
        fileBuffer: chunks,
        fileName: 'test-upload-fix.jpg',
        category: 'general',
        contentType: 'image/jpeg',
        fileSize: testData.length,
        chunkCount: chunks.length
      }
    });
    
    console.log('📊 测试结果:', result);
    
    if (result.result && result.result.success) {
      console.log('✅ 测试成功！上传功能已修复');
      console.log('📁 文件信息:', result.result.data);
    } else {
      console.log('❌ 测试失败:', result.result?.message || result.errMsg);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

// 运行测试
testUploadFix();
