// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 更新会员预存产品数量
 * 在商城下单后调用此函数扣减预存产品数量
 */
exports.main = async (event, context) => {
  const { customerId, customerPhone, productName, quantity, orderId, receiver, phone, address } = event
  const db = cloud.database()
  
  console.log('接收到的参数：', JSON.stringify(event));
  
  // 参数验证
  if (!productName) {
    return {
      success: false,
      message: '缺少产品名称'
    }
  }
  
  if (!quantity || quantity <= 0) {
    return {
      success: false,
      message: '数量必须大于0'
    }
  }
  
  if (!orderId) {
    return {
      success: false,
      message: '缺少订单ID'
    }
  }
  
  console.log('开始处理预存产品扣减:', {
    customerId,
    customerPhone,
    productName,
    quantity,
    orderId,
    receiver,
    phone,
    address
  });
  
  try {
    // 开启事务
    const transaction = await db.startTransaction()
    
    // 构建查询条件数组，尝试多种可能的查询条件
    let queryConditions = [];
    
    // 基本条件：产品名称和类型
    const baseCondition = {
      productName: productName,
      type: 'product',
      balance: db.command.gt(0)
    };
    
    // 1. 如果有customerId，添加customerId条件
    if (customerId) {
      queryConditions.push({
        ...baseCondition,
        customerId: customerId
      });
    }
    
    // 2. 如果有customerPhone，添加精确匹配条件
    if (customerPhone) {
      queryConditions.push({
        ...baseCondition,
        customerPhone: customerPhone
      });
      
      // 3. 添加尾部匹配条件
      const phoneRegex = new RegExp(customerPhone + '$');
      queryConditions.push({
        ...baseCondition,
        customerPhone: phoneRegex
      });
    }
    
    // 4. 如果都没找到，尝试只用产品名称查询
    queryConditions.push(baseCondition);
    
    console.log(`将尝试以下查询条件:`, JSON.stringify(queryConditions));
    
    // 尝试每一种查询条件，找到符合的记录就停止
    let records = { data: [] };
    for (const queryCondition of queryConditions) {
      console.log(`尝试查询条件:`, JSON.stringify(queryCondition));
      
      // 先不使用事务查询，验证条件是否有效
      const preCheck = await db.collection('prepaidRecords')
        .where(queryCondition)
        .get();
        
      console.log(`查询结果:`, JSON.stringify(preCheck));
      
      if (preCheck.data && preCheck.data.length > 0) {
        // 找到匹配的记录，使用此条件进行事务操作
        records = await transaction.collection('prepaidRecords')
          .where(queryCondition)
          .orderBy('createTime', 'asc')
          .get();
          
        console.log(`找到 ${records.data.length} 条预存记录，使用此条件`);
        break;
      }
    }
    
    if (!records.data.length) {
      // 尝试查询客户记录，获取更多信息
      let customerInfo = null;
      if (customerId) {
        try {
          const customerResult = await db.collection('customers').doc(customerId).get();
          customerInfo = customerResult.data;
          console.log('找到客户信息:', customerInfo);
        } catch (err) {
          console.log('查询客户信息失败:', err);
        }
      }
      
      throw new Error('未找到客户预存产品记录或余额不足');
    }
    
    // 计算总余额
    const totalBalance = records.data.reduce((sum, record) => sum + record.balance, 0);
    console.log(`预存产品总余额: ${totalBalance}, 需要扣减: ${quantity}`);
    
    if (totalBalance < quantity) {
      throw new Error(`预存产品余额不足，当前余额: ${totalBalance}, 需要: ${quantity}`);
    }
    
    // 找到有足够余额的记录
    let remainingQuantity = quantity;
    let updatedRecords = [];
    
    for (const record of records.data) {
      if (remainingQuantity <= 0) break;
      
      const deductAmount = Math.min(record.balance, remainingQuantity);
      remainingQuantity -= deductAmount;
      
      console.log(`正在扣减记录 ${record._id}: 扣减数量=${deductAmount}, 剩余数量=${remainingQuantity}`);
      
      try {
        // 更新记录余额
        await transaction.collection('prepaidRecords').doc(record._id).update({
          data: {
            balance: db.command.inc(-deductAmount),
            usageRecords: db.command.push({
              date: db.serverDate(),
              quantity: deductAmount,
              orderId: orderId,
              remark: '商城订单消费',
              type: 'consume',
              receiver: receiver,
              phone: phone,
              address: address
            })
          }
        });
        
        // 验证更新是否成功
        const updatedRecord = await transaction.collection('prepaidRecords').doc(record._id).get();
        console.log(`更新后的记录:`, JSON.stringify(updatedRecord.data));
        
        // 检查使用记录是否正确添加
        if (updatedRecord.data.usageRecords && updatedRecord.data.usageRecords.length > 0) {
          console.log(`使用记录已添加，当前共有 ${updatedRecord.data.usageRecords.length} 条使用记录`);
        } else {
          console.warn(`警告: 使用记录可能未正确添加到记录 ${record._id}`);
        }
        
        updatedRecords.push({
          recordId: record._id,
          deductAmount: deductAmount,
          remainingBalance: record.balance - deductAmount
        });
      } catch (updateErr) {
        console.error(`更新记录 ${record._id} 失败:`, updateErr);
        throw new Error(`更新记录失败: ${updateErr.message}`);
      }
    }
    
    if (remainingQuantity > 0) {
      throw new Error(`预存产品余额不足，还需${remainingQuantity}个`);
    }
    
    // 提交事务
    await transaction.commit();
    
    console.log('预存产品扣减成功，更新了以下记录:', updatedRecords);
    
    // 创建出库记录
    try {
      // 获取客户信息
      let customerInfo = '';
      if (customerId) {
        try {
          const customerResult = await db.collection('customers').doc(customerId).get();
          if (customerResult.data) {
            customerInfo = customerResult.data.name || customerId;
          }
        } catch (err) {
          console.log('获取客户信息失败:', err);
          customerInfo = customerId;
        }
      } else if (customerPhone) {
        customerInfo = customerPhone;
      }
      
      // 创建出库记录
      const recordData = {
        productName: productName,
        quantity: quantity,
        type: 'out',
        createTime: db.serverDate(),
        orderId: orderId,
        orderNote: `云函数预存产品扣减: ${orderId}`,
        customerInfo: customerInfo
      };
      
      await db.collection('records').add({
        data: recordData
      });
      
      console.log('预存产品扣减出库记录创建成功');
    } catch (recordErr) {
      console.error('创建出库记录失败，但预存产品扣减已成功:', recordErr);
      // 不影响主流程返回
    }
    
    return {
      success: true,
      message: '预存产品数量已更新',
      updatedRecords
    };
  } catch (err) {
    console.error('更新预存产品数量失败：', err);
    return {
      success: false,
      message: err.message || '更新预存产品数量失败',
      error: err.toString(),
      stack: err.stack
    };
  }
}