// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  
  try {
    // 创建商城产品集合
    await db.createCollection('shopProducts')
    
    // 初始化索引
    const collection = db.collection('shopProducts')
    await collection.createIndexes([
      {
        key: {
          productId: 1
        },
        name: 'productIdIndex',
        unique: true
      },
      {
        key: {
          type: 1
        },
        name: 'typeIndex'
      },
      {
        key: {
          brand: 1
        },
        name: 'brandIndex'
      }
    ])
    
    return {
      success: true,
      message: '商城产品集合创建成功'
    }
  } catch (err) {
    if (err.message.indexOf('collection already exists') !== -1) {
      return {
        success: true,
        message: '商城产品集合已存在'
      }
    }
    
    return {
      success: false,
      message: err.message
    }
  }
}