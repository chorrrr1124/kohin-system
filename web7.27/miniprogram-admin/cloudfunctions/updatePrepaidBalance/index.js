// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 更新预存记录
 * 支持两种类型：amount（金额型）和 product（数量型）
 * 使用事务确保高并发下的数据一致性
 */
exports.main = async (event, context) => {
  const { 
    customerId, 
    customerPhone, 
    amount, 
    orderId, 
    receiver, 
    phone, 
    address,
    prepaidType = 'amount' // 'amount' 或 'product'
  } = event;
  const db = cloud.database();
  
  console.log('接收到的参数：', JSON.stringify(event));
  
  // 参数验证
  if (!customerId && !customerPhone) {
    return {
      success: false,
      message: '客户ID或电话不能为空'
    }
  }
  
  if (!amount || amount <= 0) {
    return {
      success: false,
      message: '扣减金额必须大于0'
    }
  }
  
  if (!orderId) {
    return {
      success: false,
      message: '缺少订单ID'
    }
  }
  
  console.log('开始处理预存扣减:', {
    customerId,
    customerPhone,
    amount,
    orderId,
    prepaidType
  });
  
  try {
    // 开启事务
    const transaction = await db.startTransaction();
    
    // 1. 查找客户的预存记录
    console.log('查找预存记录...');
    let query = transaction.collection('prepaidRecords');
    
    if (customerId) {
      query = query.where({ customerId: customerId });
    } else {
      query = query.where({ customerPhone: customerPhone });
    }
    
    // 根据类型筛选
    if (prepaidType === 'amount') {
      query = query.where({ type: 'amount' });
    } else if (prepaidType === 'product') {
      query = query.where({ type: 'product' });
    }
    
    // 只查询有余额的记录
    query = query.where({ balance: db.command.gt(0) });
    
    const recordsResult = await query.orderBy('createTime', 'asc').get();
    const records = recordsResult.data || [];
    
    if (records.length === 0) {
      throw new Error('未找到可用的预存记录');
    }
    
    console.log(`找到 ${records.length} 条预存记录`);
    
    // 2. 计算需要扣减的金额/数量
    let remainingAmount = amount;
    const deductionDetails = [];
    
    for (const record of records) {
      if (remainingAmount <= 0) break;
      
      const availableBalance = record.balance || 0;
      const deductAmount = Math.min(remainingAmount, availableBalance);
      
      if (deductAmount > 0) {
        // 更新预存记录余额
        const newBalance = availableBalance - deductAmount;
        await transaction.collection('prepaidRecords').doc(record._id).update({
          data: {
            balance: newBalance,
            updateTime: db.serverDate()
          }
        });
        
        deductionDetails.push({
          recordId: record._id,
          productName: record.productName || '预存金额',
          originalBalance: availableBalance,
          deductAmount: deductAmount,
          remainingBalance: newBalance,
          type: record.type
        });
        
        remainingAmount -= deductAmount;
        
        console.log(`预存记录 ${record._id} 扣减成功: ${deductAmount} ${record.type === 'amount' ? '元' : '个'}`);
      }
    }
    
    // 3. 检查是否完全扣减
    if (remainingAmount > 0) {
      throw new Error(`预存余额不足，还需要 ${remainingAmount} ${prepaidType === 'amount' ? '元' : '个'}`);
    }
    
    // 4. 创建扣减记录
    console.log('创建扣减记录...');
    try {
      const deductionRecord = {
        customerId: customerId || '',
        customerPhone: customerPhone || '',
        orderId: orderId,
        type: prepaidType,
        totalAmount: amount,
        deductedAmount: amount - remainingAmount,
        details: deductionDetails,
        receiver: receiver || '',
        phone: phone || '',
        address: address || '',
        createTime: db.serverDate(),
        status: 'completed'
      };
      
      await transaction.collection('prepaidDeductions').add({
        data: deductionRecord
      });
      
      console.log('扣减记录创建成功');
    } catch (recordErr) {
      console.error('创建扣减记录失败，但预存扣减已成功:', recordErr);
      // 不影响主流程返回
    }
    
    // 5. 提交事务
    await transaction.commit();
    
    console.log('预存扣减事务提交成功');
    
    return {
      success: true,
      message: '预存扣减成功',
      orderId,
      deductedAmount: amount - remainingAmount,
      deductionDetails,
      prepaidType
    };
    
  } catch (err) {
    console.error('预存扣减失败：', err);
    return {
      success: false,
      message: err.message || '预存扣减失败',
      error: err.toString(),
      stack: err.stack
    };
  }
}
