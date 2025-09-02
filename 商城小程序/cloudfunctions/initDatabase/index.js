// 数据库初始化云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('=== 数据库初始化云函数开始 ===');
  
  try {
    const collections = [
      'sms_codes',           // 短信验证码集合
      'users',               // 用户信息集合
      'orders',              // 订单集合
      'products',            // 商品集合
      'coupons',             // 优惠券集合
      'popup_content'        // 弹窗内容集合
    ];
    
    const results = [];
    
    for (const collectionName of collections) {
      try {
        // 尝试创建集合
        await db.createCollection(collectionName);
        console.log(`集合 ${collectionName} 创建成功或已存在`);
        results.push({
          name: collectionName,
          status: 'success',
          message: '创建成功或已存在'
        });
      } catch (error) {
        console.log(`集合 ${collectionName} 创建失败:`, error.message);
        results.push({
          name: collectionName,
          status: 'error',
          message: error.message
        });
      }
    }
    
    // 为sms_codes集合创建索引
    try {
      await db.collection('sms_codes').createIndex({
        data: {
          phoneNumber: 1,
          expireTime: 1,
          used: 1
        }
      });
      console.log('sms_codes 索引创建成功');
    } catch (error) {
      console.log('sms_codes 索引创建失败或已存在:', error.message);
    }
    
    return {
      success: true,
      message: '数据库初始化完成',
      results: results,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return {
      success: false,
      error: '数据库初始化失败',
      detail: error.message,
      timestamp: new Date().toISOString()
    };
  }
};