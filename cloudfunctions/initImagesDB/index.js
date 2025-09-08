const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

const db = app.database();

exports.main = async (event, context) => {
  try {
    // 先尝试查询images集合是否存在
    try {
      await db.collection('images').limit(1).get();
      return {
        success: true,
        message: 'Images数据库集合已存在'
      };
    } catch (queryError) {
      // 如果查询失败，说明集合不存在，需要创建
      console.log('Images集合不存在，开始创建...');
    }

    // 创建images集合（通过插入一条记录来创建集合）
    const result = await db.collection('images').add({
      data: {
        _init: true,
        createTime: new Date(),
        message: 'Images collection initialized'
      }
    });

    // 删除初始化记录
    await db.collection('images').doc(result.id).remove();

    return {
      success: true,
      message: 'Images数据库集合创建成功',
      collectionId: result.id
    };
  } catch (error) {
    console.error('初始化数据库失败:', error);
    return {
      success: false,
      error: error.message,
      message: '数据库初始化失败'
    };
  }
};
