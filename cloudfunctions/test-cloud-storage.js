const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

// 测试云存储图片管理功能
async function testCloudStorageManager() {
  try {
    console.log('🧪 开始测试云存储图片管理功能...\n');

    // 1. 测试保存图片信息
    console.log('1️⃣ 测试保存图片信息...');
    const saveResult = await app.callFunction({
      name: 'cloudStorageManager',
      data: {
        action: 'saveImageInfo',
        data: {
          images: [
            {
              fileID: 'cloud://cloudbase-3g4w6lls8a5ce59b.636c-cloudbase-3g4w6lls8a5ce59b-1320051234/images/test/test1.jpg',
              cloudPath: 'images/test/test1.jpg',
              url: 'https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/images/test/test1.jpg',
              fileName: 'test1.jpg',
              category: 'test',
              displayOrder: 1
            },
            {
              fileID: 'cloud://cloudbase-3g4w6lls8a5ce59b.636c-cloudbase-3g4w6lls8a5ce59b-1320051234/images/test/test2.jpg',
              cloudPath: 'images/test/test2.jpg',
              url: 'https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/images/test/test2.jpg',
              fileName: 'test2.jpg',
              category: 'test',
              displayOrder: 2
            }
          ],
          category: 'test'
        }
      }
    });

    console.log('保存结果:', saveResult.result);
    console.log('✅ 图片信息保存测试完成\n');

    // 2. 测试获取图片列表
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

    console.log('获取结果:', listResult.result);
    console.log('✅ 图片列表获取测试完成\n');

    // 3. 测试按分类获取图片
    console.log('3️⃣ 测试按分类获取图片...');
    const categoryResult = await app.callFunction({
      name: 'cloudStorageManager',
      data: {
        action: 'getImageByCategory',
        data: {
          category: 'test'
        }
      }
    });

    console.log('分类获取结果:', categoryResult.result);
    console.log('✅ 分类图片获取测试完成\n');

    console.log('🎉 所有测试完成！');
    return true;

  } catch (error) {
    console.error('❌ 测试失败:', error);
    return false;
  }
}

// 测试云存储上传功能
async function testCloudStorageUpload() {
  try {
    console.log('🧪 开始测试云存储上传功能...\n');

    // 模拟一个图片文件（base64编码的小图片）
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const uploadResult = await app.callFunction({
      name: 'uploadToCloudStorage',
      data: {
        fileBuffer: testImageBase64,
        fileName: 'test-image.png',
        category: 'test',
        contentType: 'image/png'
      }
    });

    console.log('上传结果:', uploadResult.result);
    console.log('✅ 云存储上传测试完成\n');

    return uploadResult.result.success;

  } catch (error) {
    console.error('❌ 上传测试失败:', error);
    return false;
  }
}

// 测试云存储文件管理功能
async function testCloudStorageFileManager() {
  try {
    console.log('🧪 开始测试云存储文件管理功能...\n');

    // 1. 测试获取文件列表
    console.log('1️⃣ 测试获取文件列表...');
    const listResult = await app.callFunction({
      name: 'cloudStorageFileManager',
      data: {
        action: 'listFiles',
        data: {
          cloudPath: 'images/test/'
        }
      }
    });

    console.log('文件列表结果:', listResult.result);
    console.log('✅ 文件列表获取测试完成\n');

    // 2. 测试获取临时链接
    console.log('2️⃣ 测试获取临时链接...');
    const urlResult = await app.callFunction({
      name: 'cloudStorageFileManager',
      data: {
        action: 'getTemporaryUrl',
        data: {
          fileList: ['images/test/test-image.png'],
          maxAge: 3600
        }
      }
    });

    console.log('临时链接结果:', urlResult.result);
    console.log('✅ 临时链接获取测试完成\n');

    // 3. 测试获取存储权限
    console.log('3️⃣ 测试获取存储权限...');
    const aclResult = await app.callFunction({
      name: 'cloudStorageFileManager',
      data: {
        action: 'getStorageAcl'
      }
    });

    console.log('存储权限结果:', aclResult.result);
    console.log('✅ 存储权限获取测试完成\n');

    return true;

  } catch (error) {
    console.error('❌ 文件管理测试失败:', error);
    return false;
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始云存储图片管理完整测试...\n');
  
  const uploadTest = await testCloudStorageUpload();
  const managerTest = await testCloudStorageManager();
  const fileManagerTest = await testCloudStorageFileManager();
  
  if (uploadTest && managerTest && fileManagerTest) {
    console.log('🎉 所有测试通过！云存储图片管理功能正常');
    return true;
  } else {
    console.log('❌ 部分测试失败，请检查配置');
    return false;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testCloudStorageManager, testCloudStorageUpload, testCloudStorageFileManager, runAllTests };
