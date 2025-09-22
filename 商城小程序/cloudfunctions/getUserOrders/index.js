// 获取用户订单云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const orders = db.collection('orders');

exports.main = async (event, context) => {
  console.log('=== 获取用户订单云函数开始 ===');
  console.log('接收到的参数:', JSON.stringify(event, null, 2));
  
  try {
    const { openid, limit = 20, offset = 0 } = event || {};
    
    if (!openid) {
      return {
        success: false,
        message: '缺少用户openid'
      };
    }

    // 查询用户订单
    const result = await orders
      .where({
        openid: openid
      })
      .orderBy('createTime', 'desc')
      .skip(offset)
      .limit(limit)
      .get();

    console.log('查询到订单数量:', result.data.length);

    return {
      success: true,
      orders: result.data || [],
      total: result.data ? result.data.length : 0
    };
    
  } catch (error) {
    console.error('获取用户订单失败:', error);
    return {
      success: false,
      message: error.message || '获取用户订单失败',
      orders: []
    };
  }
};