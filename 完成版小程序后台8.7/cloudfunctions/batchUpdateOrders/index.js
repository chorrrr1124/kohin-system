// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { orders } = event
  
  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return {
      success: false,
      message: '未提供有效的订单数据'
    }
  }
  
  console.log(`收到${orders.length}个订单更新请求`)
  
  const updatePromises = orders.map(order => {
    return db.collection('orders').doc(order.id).update({
      data: {
        createTime: order.createTime
      }
    }).then(res => {
      return {
        id: order.id,
        success: true,
        updated: res.stats.updated
      }
    }).catch(err => {
      console.error(`更新订单 ${order.id} 时出错:`, err)
      return {
        id: order.id,
        success: false,
        error: err.message || err.errMsg || String(err)
      }
    })
  })
  
  const results = await Promise.all(updatePromises)
  
  const successCount = results.filter(r => r.success).length
  
  return {
    success: true,
    message: `成功更新 ${successCount}/${orders.length} 个订单`,
    results: results
  }
} 