// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 更新商品库存
 * 使用事务确保高并发下的数据一致性，避免重复扣减
 */
exports.main = async (event, context) => {
  const { items, orderId } = event
  const db = cloud.database()
  
  console.log('接收到的参数：', JSON.stringify(event));
  
  // 参数验证
  if (!items || !Array.isArray(items) || items.length === 0) {
    return {
      success: false,
      message: '商品列表不能为空'
    }
  }
  
  if (!orderId) {
    return {
      success: false,
      message: '缺少订单ID'
    }
  }
  
  // 验证商品数据格式
  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity <= 0) {
      return {
        success: false,
        message: '商品数据格式错误'
      }
    }
  }
  
  console.log('开始处理库存扣减:', {
    orderId,
    itemsCount: items.length
  });
  
  try {
    // 开启事务
    const transaction = await db.startTransaction()
    
    // 1. 先检查所有商品的库存是否充足
    console.log('检查库存充足性...');
    const stockChecks = [];
    
    for (const item of items) {
      const productDoc = await transaction.collection('shopProducts').doc(item.productId).get();
      
      if (!productDoc.data) {
        throw new Error(`商品 ${item.productId} 不存在`);
      }
      
      const currentStock = productDoc.data.stock || 0;
      console.log(`商品 ${item.productName || item.productId} 当前库存: ${currentStock}, 需要扣减: ${item.quantity}`);
      
      if (currentStock < item.quantity) {
        throw new Error(`商品 ${productDoc.data.name || item.productId} 库存不足，当前库存：${currentStock}，需要：${item.quantity}`);
      }
      
      stockChecks.push({
        productId: item.productId,
        productName: productDoc.data.name,
        currentStock,
        requiredQuantity: item.quantity
      });
    }
    
    console.log('库存检查通过，开始扣减库存...');
    
    // 2. 扣减库存
    const updateResults = [];
    
    for (const item of items) {
      try {
        // 使用事务更新库存
        const updateResult = await transaction.collection('shopProducts').doc(item.productId).update({
          data: {
            stock: db.command.inc(-item.quantity),
            updateTime: db.serverDate()
          }
        });
        
        console.log(`商品 ${item.productName || item.productId} 库存扣减成功: ${item.quantity}`);
        
        updateResults.push({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          success: true
        });
        
      } catch (updateErr) {
        console.error(`更新商品 ${item.productId} 库存失败:`, updateErr);
        throw new Error(`更新商品 ${item.productName || item.productId} 库存失败: ${updateErr.message}`);
      }
    }
    
    // 3. 创建出库记录
    console.log('创建出库记录...');
    try {
      for (const item of items) {
        const recordData = {
          productName: item.productName || '未知商品',
          amount: item.quantity,
          type: 'out',
          createTime: db.serverDate(),
          orderId: orderId,
          orderNote: `商城订单出库: ${orderId}`,
          productId: item.productId
        };
        
        await transaction.collection('records').add({
          data: recordData
        });
      }
      console.log('出库记录创建成功');
    } catch (recordErr) {
      console.error('创建出库记录失败，但库存扣减已成功:', recordErr);
      // 不影响主流程返回
    }
    
    // 4. 提交事务
    await transaction.commit();
    
    console.log('库存扣减事务提交成功');
    
    return {
      success: true,
      message: '库存扣减成功',
      orderId,
      updatedItems: updateResults,
      stockChecks
    };
    
  } catch (err) {
    console.error('库存扣减失败：', err);
    return {
      success: false,
      message: err.message || '库存扣减失败',
      error: err.toString(),
      stack: err.stack
    };
  }
}
