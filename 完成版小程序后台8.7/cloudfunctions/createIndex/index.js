// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const db = cloud.database()
    const collection = event.collection || 'orders'
    
    // 默认为id字段创建索引
    const indexes = event.indexes || [
      {
        key: { id: 1 },
        name: 'id_index'
      }
    ]
    
    console.log(`开始为集合 ${collection} 创建索引:`, indexes)
    
    // 获取当前集合的索引信息
    const indexList = await db.collection(collection).getIndexes()
    console.log('当前索引列表:', indexList)
    
    // 检查索引是否已存在
    for (let index of indexes) {
      // 检查索引是否已存在
      let indexExists = false
      if (indexList && indexList.indexes) {
        indexExists = indexList.indexes.some(existingIndex => existingIndex.name === index.name)
      }
      
      // 如果索引不存在，则创建
      if (!indexExists) {
        console.log(`索引 ${index.name} 不存在，开始创建...`)
        await db.collection(collection).createIndex(index)
        console.log(`索引 ${index.name} 创建完成`)
      } else {
        console.log(`索引 ${index.name} 已存在，无需创建`)
      }
    }
    
    return {
      success: true,
      message: '索引检查和创建完成'
    }
  } catch (error) {
    console.error('创建索引失败:', error)
    return {
      success: false,
      message: '创建索引失败',
      error: error
    }
  }
} 