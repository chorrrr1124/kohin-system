// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const { collectionName } = event
  
  try {
    console.log(`[云函数] 开始创建集合: ${collectionName}`)
    
    // 创建集合
    await db.createCollection(collectionName)
    
    console.log(`[云函数] 创建集合成功: ${collectionName}`)
    
    // 对新创建的集合添加一条初始记录
    try {
      if (collectionName === 'customerMergeHistory') {
        await db.collection(collectionName).add({
          data: {
            primaryCustomerId: 'system',
            mergedCustomerId: 'system',
            mergedCustomerName: '系统初始化记录',
            mergeTime: db.serverDate(),
            _isSystemRecord: true,
            remark: '此记录由系统自动创建，用于初始化数据库集合，可以删除。'
          }
        })
        console.log(`[云函数] 为集合 ${collectionName} 添加初始记录成功`)
      }
    } catch (initErr) {
      console.error(`[云函数] 为集合 ${collectionName} 添加初始记录失败:`, initErr)
      // 记录建立失败不影响集合创建的结果
    }
    
    return {
      success: true,
      message: `成功创建集合 ${collectionName}`
    }
  } catch (err) {
    console.error(`[云函数] 创建集合失败: ${collectionName}`, err)
    
    // 如果集合已存在，也视为成功（避免重复创建的问题）
    if (err.errCode === -502005 && err.errMsg.includes('collection exists')) {
      return {
        success: true,
        message: `集合 ${collectionName} 已存在，无需重复创建`,
        existed: true
      }
    }
    
    // 其他错误情况
    return {
      success: false,
      message: `创建集合失败：${err.message || err.errMsg || JSON.stringify(err)}`,
      error: err
    }
  }
} 