// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const orders = db.collection('orders')

// 提交订单
exports.main = async (event, context) => {
  const { orderData } = event || {}
  const wxContext = cloud.getWXContext()
  const _openid = wxContext.OPENID

  if (!_openid) {
    return { ok: false, message: 'missing openid' }
  }

  if (!orderData) {
    return { ok: false, message: 'missing order data' }
  }

  try {
    const now = Date.now()
    const orderId = `ORDER_${now}_${Math.random().toString(36).substr(2, 9)}`
    
    const order = {
      _openid, // 关联用户openid，实现数据隔离
      orderId,
      ...orderData,
      status: orderData.status || 'pending', // 默认状态为待付款
      createTime: now,
      updateTime: now
    }

    const result = await orders.add({ data: order })
    
    return {
      ok: true,
      orderId,
      _id: result._id,
      message: '订单提交成功'
    }
  } catch (error) {
    console.error('提交订单失败:', error)
    return {
      ok: false,
      message: '提交订单失败',
      error: error.message
    }
  }
}