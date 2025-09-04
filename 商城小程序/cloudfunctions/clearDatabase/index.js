// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    console.log('开始清空数据库...')
    
    // 清空各个集合
    const collections = [
      'products',
      'categories', 
      'brands',
      'banners',
      'orders',
      'users',
      'coupons'
    ]
    
    const clearPromises = collections.map(async (collectionName) => {
      try {
        const result = await db.collection(collectionName).where({}).remove()
        console.log(`清空集合 ${collectionName}:`, result)
        return { collection: collectionName, success: true, deleted: result.stats.removed }
      } catch (error) {
        console.error(`清空集合 ${collectionName} 失败:`, error)
        return { collection: collectionName, success: false, error: error.message }
      }
    })
    
    const results = await Promise.all(clearPromises)
    
    console.log('数据库清空完成:', results)
    
    return {
      success: true,
      message: '数据库清空完成',
      results: results,
      openid: wxContext.OPENID
    }
    
  } catch (error) {
    console.error('清空数据库失败:', error)
    
    return {
      success: false,
      error: error.message,
      openid: wxContext.OPENID
    }
  }
} 