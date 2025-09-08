const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

async function debugImageLoading() {
  try {
    console.log('🔍 开始排查图片加载问题...\n');

    // 1. 检查所有图片记录
    console.log('1️⃣ 检查所有图片记录...');
    const allImagesResult = await app.callFunction({
      name: 'cloudStorageManager',
      data: {
        action: 'getImageList',
        data: {}
      }
    });

    console.log('所有图片记录:', allImagesResult.result);
    console.log(`📊 总共找到 ${allImagesResult.result.data ? allImagesResult.result.data.length : 0} 张图片\n`);

    // 2. 检查轮播图分类
    console.log('2️⃣ 检查轮播图分类...');
    const bannerResult = await app.callFunction({
      name: 'cloudStorageManager',
      data: {
        action: 'getImageList',
        data: {
          category: 'banner'
        }
      }
    });

    console.log('轮播图记录:', bannerResult.result);
    console.log(`📊 轮播图分类找到 ${bannerResult.result.data ? bannerResult.result.data.length : 0} 张图片\n`);

    // 3. 检查banners分类
    console.log('3️⃣ 检查banners分类...');
    const bannersResult = await app.callFunction({
      name: 'cloudStorageManager',
      data: {
        action: 'getImageList',
        data: {
          category: 'banners'
        }
      }
    });

    console.log('banners记录:', bannersResult.result);
    console.log(`📊 banners分类找到 ${bannersResult.result.data ? bannersResult.result.data.length : 0} 张图片\n`);

    // 4. 检查按分类获取
    console.log('4️⃣ 检查按分类获取轮播图...');
    const categoryResult = await app.callFunction({
      name: 'cloudStorageManager',
      data: {
        action: 'getImageByCategory',
        data: {
          category: 'banner'
        }
      }
    });

    console.log('按分类获取轮播图:', categoryResult.result);
    console.log(`📊 按分类获取找到 ${categoryResult.result.data ? categoryResult.result.data.length : 0} 张图片\n`);

    // 5. 测试保存一张轮播图
    console.log('5️⃣ 测试保存一张轮播图...');
    const saveResult = await app.callFunction({
      name: 'cloudStorageManager',
      data: {
        action: 'saveImageInfo',
        data: {
          images: [{
            cloudPath: 'images/banner/test-banner.jpg',
            url: 'https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/images/banner/test-banner.jpg',
            fileName: 'test-banner.jpg',
            category: 'banner',
            displayOrder: 1
          }],
          category: 'banner'
        }
      }
    });

    console.log('保存轮播图结果:', saveResult.result);

    if (saveResult.result.success) {
      console.log('✅ 轮播图保存成功！\n');
      
      // 再次检查轮播图
      console.log('6️⃣ 再次检查轮播图...');
      const checkAgainResult = await app.callFunction({
        name: 'cloudStorageManager',
        data: {
          action: 'getImageList',
          data: {
            category: 'banner'
          }
        }
      });

      console.log('再次检查轮播图:', checkAgainResult.result);
      console.log(`📊 现在轮播图分类有 ${checkAgainResult.result.data ? checkAgainResult.result.data.length : 0} 张图片`);
    }

  } catch (error) {
    console.error('❌ 排查失败:', error);
  }
}

// 运行排查
debugImageLoading();
