// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { OPENID } = cloud.getWXContext()
    
    if (!OPENID) {
      return {
        success: false,
        data: 0,
        message: '用户未登录'
      }
    }

    const now = new Date()
    
    // 查询用户可用的优惠券数量
    // 条件：未使用 + 未过期 + 优惠券模板有效
    const result = await db.collection('user_coupons')
      .aggregate()
      .match({
        _openid: OPENID,
        status: 'unused'
      })
      .lookup({
        from: 'mall_coupons',
        localField: 'couponId',
        foreignField: '_id',
        as: 'couponTemplate'
      })
      .match({
        'couponTemplate.status': 'active',
        $or: [
          { 'couponTemplate.endTime': null }, // 永不过期
          { 'couponTemplate.endTime': db.command.gte(now) } // 未过期
        ]
      })
      .count('total')
      .end()

    const count = result.list && result.list.length > 0 ? result.list[0].total : 0

    return {
      success: true,
      data: count,
      message: '获取优惠券数量成功'
    }
  } catch (error) {
    console.error('获取用户优惠券数量失败:', error)
    return {
      success: false,
      data: 0,
      message: '获取优惠券数量失败'
    }
  }
} 