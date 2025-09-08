const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

const db = app.database();

async function initCloudImagesCollection() {
  try {
    console.log('开始初始化cloudImages数据库集合...');
    
    // 先尝试查询cloudImages集合是否存在
    try {
      await db.collection('cloudImages').limit(1).get();
      console.log('✅ cloudImages数据库集合已存在');
      return { success: true, message: 'cloudImages数据库集合已存在' };
    } catch (queryError) {
      console.log('cloudImages集合不存在，开始创建...');
    }

    // 创建cloudImages集合（通过插入一条记录来创建集合）
    const result = await db.collection('cloudImages').add({
      data: {
        _init: true,
        cloudStorageId: '636c-cloudbase-3g4w6lls8a5ce59b',
        createTime: new Date(),
        message: 'CloudImages collection initialized for cloud storage'
      }
    });

    console.log('✅ cloudImages集合创建成功，ID:', result.id);

    // 删除初始化记录
    await db.collection('cloudImages').doc(result.id).remove();
    console.log('✅ 初始化记录已清理');

    return {
      success: true,
      message: 'cloudImages数据库集合创建成功',
      collectionId: result.id
    };
  } catch (error) {
    console.error('❌ 初始化数据库失败:', error);
    return {
      success: false,
      error: error.message,
      message: '数据库初始化失败'
    };
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initCloudImagesCollection().then(result => {
    console.log('初始化结果:', result);
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { initCloudImagesCollection };
