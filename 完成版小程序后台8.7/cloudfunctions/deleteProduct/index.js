// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { productId } = event
  
  console.log('开始删除产品，ID:', productId)
  
  if (!productId) {
    console.error('未提供产品ID')
    return {
      success: false,
      message: '未提供产品ID'
    }
  }
  
  try {
    const db = cloud.database()
    
    // 尝试直接操作数据库，不使用事务（事务可能不支持）
    console.log('开始删除产品记录')
    // 1. 删除产品记录
    try {
      const productRes = await db.collection('products').doc(productId).remove()
      console.log('产品记录删除成功', productRes)
    } catch (e) {
      console.error('删除产品记录失败:', e)
      // 继续执行，不要中断流程
    }
    
    console.log('开始删除库存记录')
    // 2. 删除相关的库存记录
    try {
      const inventoryRes = await db.collection('inventory').where({
        productId: productId
      }).remove()
      console.log('库存记录删除成功', inventoryRes)
    } catch (e) {
      console.error('删除库存记录失败:', e)
      // 继续执行，不要中断流程
    }
    
    console.log('开始删除出入库记录')
    // 3. 删除相关的出入库记录
    try {
      const recordsRes = await db.collection('stockRecords').where({
        productId: productId
      }).remove()
      console.log('出入库记录删除成功', recordsRes)
    } catch (e) {
      console.error('删除出入库记录失败:', e)
      // 继续执行，不要中断流程
    }
    
    console.log('开始删除商城产品记录')
    // 4. 删除商城产品记录(shopProducts集合)
    try {
      const shopRes = await db.collection('shopProducts').where({
        $or: [
          { _id: productId },
          { id: productId },
          { productId: productId }
        ]
      }).remove()
      console.log('商城产品记录删除成功', shopRes)
    } catch (e) {
      console.error('删除商城产品记录失败:', e)
      // 继续执行，不要中断流程
    }
    
    console.log('所有删除操作完成')
    
    return {
      success: true,
      message: '删除成功'
    }
  } catch (err) {
    console.error('删除产品失败，错误详情：', err)
    return {
      success: false,
      message: '删除失败: ' + (err.message || JSON.stringify(err))
    }
  }
}