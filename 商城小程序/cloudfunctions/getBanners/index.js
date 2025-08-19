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
    
    const result = await db.collection('mall_banners')
      .where({
        status: status,
        startTime: db.command.lte(new Date()),
        endTime: db.command.gte(new Date())
      })
      .orderBy('sort', 'asc')
      .orderBy('createTime', 'desc')
      .limit(limit)
      .get()

    return {
      success: true,
      data: result.data,
      message: '获取轮播图成功'
    }
  } catch (error) {
    console.error('获取轮播图失败:', error)
    return {
      success: false,
      data: [],
      message: '获取轮播图失败'
    }
  }
} 