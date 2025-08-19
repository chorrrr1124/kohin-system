// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const orders = db.collection('orders')

// 获取当前用户的订单列表
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const _openid = wxContext.OPENID

  if (!_openid) {
    return { ok: false, message: 'missing openid' }
  }

  try {
    // 只查询当前用户的订单数据
    const { data } = await orders.where({ _openid }).orderBy('createTime', 'desc').get()
    
    return {
      ok: true,
      data: data || [],
      count: data ? data.length : 0
    }
  } catch (error) {
    console.error('获取用户订单失败:', error)
    return {
      ok: false,
      message: '获取订单失败',
      error: error.message
    }
  }
}