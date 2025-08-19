// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { cartItems, address, totalAmount, customerId, isPrepaidProduct } = event
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()
  
  try {
    // 开启事务
    const transaction = await db.startTransaction()
    
    // 1. 检查库存
    for (const item of cartItems) {
      const inventory = await transaction.collection('inventory')
        .where({ productId: item.productId })
        .get()
        
      if (!inventory.data.length || inventory.data[0].quantity < item.quantity) {
        throw new Error(`商品 ${item.productName} 库存不足`)
      }
    }
    
    // 2. 创建订单
    const orderResult = await transaction.collection('orders').add({
      data: {
        userId: OPENID,
        items: cartItems,
        address,
        totalAmount: isPrepaidProduct ? 0 : totalAmount, // 预存扣除订单金额为0
        customerId: customerId || null,
        isPrepaidProduct: isPrepaidProduct || false,
        status: 'pending',
        createTime: db.serverDate()
      }
    })
    
    // 3. 扣减库存并记录出库
    for (const item of cartItems) {
      // 扣减库存
      await transaction.collection('inventory')
        .where({ productId: item.productId })
        .update({
          data: {
            quantity: db.command.inc(-item.quantity)
          }
        })
      
      // 记录出库
      await transaction.collection('records').add({
        data: {
          productId: item.productId,
          productName: item.productName,
          type: 'out',
          quantity: item.quantity,
          reason: '商城订单',
          orderId: orderResult._id,
          createTime: db.serverDate()
        }
      })
    }
    
    // 检查是否需要扣减预存产品数量
    // 如果订单中包含客户ID和预存产品信息，则调用updatePrepaidProduct云函数
    /*
    if (event.customerId && event.isPrepaidProduct) {
      try {
        // 调用updatePrepaidProduct云函数扣减预存产品数量
        const updateResult = await cloud.callFunction({
          name: 'updatePrepaidProduct',
          data: {
            customerId: event.customerId,
            productName: cartItems[0].productName, // 假设只有一种预存产品
            quantity: cartItems[0].quantity,
            orderId: orderResult._id
          }
        });
        
        if (!updateResult.result.success) {
          throw new Error(updateResult.result.message || '扣减预存产品数量失败');
        }
        
        console.log('预存产品数量扣减成功:', updateResult.result);
      } catch (prepaidErr) {
        console.error('扣减预存产品数量失败:', prepaidErr);
        // 即使预存产品扣减失败，也继续提交订单事务
      }
    }
    */
    
    // 提交事务
    await transaction.commit()
    
    return {
      success: true,
      message: '下单成功',
      orderId: orderResult._id
    }
  } catch (err) {
    console.error('提交订单失败：', err)
    return {
      success: false,
      message: err.message || '下单失败',
      error: err
    }
  }
}