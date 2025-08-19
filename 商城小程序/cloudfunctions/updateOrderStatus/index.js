// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const orders = db.collection('orders')

// 更新订单状态
exports.main = async (event, context) => {
  const { orderId, status, updateData = {} } = event || {}
  const wxContext = cloud.getWXContext()
  const _openid = wxContext.OPENID

  if (!_openid) {
    return { ok: false, message: 'missing openid' }
  }

  if (!orderId || !status) {
    return { ok: false, message: 'missing orderId or status' }
  }

  try {
    // 先查询订单是否存在且属于当前用户
    const { data } = await orders.where({ 
      orderId, 
      _openid // 确保只能更新自己的订单
    }).get()

    if (!data || data.length === 0) {
      return { ok: false, message: '订单不存在或无权限' }
    }

    const order = data[0]
    const now = Date.now()
    
    // 更新订单状态和其他数据
    const updateFields = {
      status,
      updateTime: now,
      ...updateData
    }

    await orders.doc(order._id).update({ data: updateFields })
    
    return {
      ok: true,
      orderId,
      status,
      message: '订单状态更新成功'
    }
  } catch (error) {
    console.error('更新订单状态失败:', error)
    return {
      ok: false,
      message: '更新订单状态失败',
      error: error.message
    }
  }
}