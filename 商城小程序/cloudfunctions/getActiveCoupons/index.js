// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { limit = 10, status = 'active' } = event
    const now = new Date()
    
    // 从优惠券集合获取有效的优惠券
    // 构建查询条件
    const whereCondition = {
      status: status,
      totalCount: db.command.gt(0) // 还有库存
    }
    
    // 只有当startTime和endTime不为空时才添加时间条件
    const result = await db.collection('mall_coupons')
      .where(db.command.and([
        whereCondition,
        db.command.or([
          // 情况1：startTime和endTime都为空字符串或null（永久有效）
          {
            startTime: db.command.in(['', null]),
            endTime: db.command.in(['', null])
          },
          // 情况2：有具体的开始和结束时间
          {
            startTime: db.command.lte(now),
            endTime: db.command.gte(now)
          }
        ])
      ]))
      .orderBy('createTime', 'desc')
      .limit(limit)
      .get()

    return {
      success: true,
      data: result.data || [],
      message: '获取优惠券成功'
    }
  } catch (error) {
    console.error('获取优惠券失败:', error)
    return {
      success: false,
      data: [],
      message: '获取优惠券失败'
    }
  }
}