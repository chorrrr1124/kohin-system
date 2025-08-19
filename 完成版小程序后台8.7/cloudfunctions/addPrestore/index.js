// cloudfunctions/addPrestore/index.js
const cloud = require('wx-server-sdk')

// 确保使用正确的云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 使用当前云环境
})

// 获取数据库引用
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  console.log('=============== 预存记录操作开始 ===============')
  console.log('收到预存请求，参数:', JSON.stringify(event))
  
  // 检查云环境
  try {
    const envInfo = await cloud.getWXContext()
    console.log('云环境信息:', JSON.stringify(envInfo))
  } catch (error) {
    console.error('获取云环境信息失败:', error)
  }
  
  const { 
    customerId, 
    customerName, 
    customerPhone, 
    amount, 
    operationId, 
    source, 
    items 
  } = event
  
  // 获取用户信息
  const { OPENID, APPID } = cloud.getWXContext()
  console.log('当前用户OPENID:', OPENID)
  console.log('当前云环境:', cloud.DYNAMIC_CURRENT_ENV)
  console.log('客户ID:', customerId)
  console.log('客户名称:', customerName)
  console.log('客户电话:', customerPhone)
  console.log('预存金额:', amount)
  console.log('操作ID:', operationId)
  
  // 确保必要参数存在
  if (!customerId || !amount) {
    console.error('参数错误：缺少customerId或amount')
    return {
      success: false,
      message: '参数错误：缺少必要信息'
    }
  }
  
  try {
    // 确保集合存在
    try {
      await db.createCollection('prepaidRecords')
      console.log('成功创建prepaidRecords集合')
    } catch (err) {
      // 集合可能已存在，这是正常的
      console.log('prepaidRecords集合可能已存在:', err.message || err)
    }
    
    try {
      await db.createCollection('prepaidHistory')
      console.log('成功创建prepaidHistory集合')
    } catch (err) {
      // 集合可能已存在，这是正常的
      console.log('prepaidHistory集合可能已存在:', err.message || err)
    }
    
    // 直接尝试创建新记录
    console.log('准备创建新的预存记录，客户ID:', customerId)
    const numAmount = Number(amount) || 0
    
    // 确定产品类型
    let productType = 'cash'; // 默认为现金预存
    let productName = '预存金额';
    
    // 如果有商品信息，尝试获取产品名称
    if (items && items.length > 0) {
      productName = items[0].name || '预存金额';
    }
    
    // 创建记录数据
    const addData = {
      customerId: customerId, // 确保使用正确的客户ID
      customerName: customerName || '',
      customerPhone: customerPhone || '',
      amount: numAmount,
      balance: numAmount, // 添加余额字段，初始等于预存金额
      createTime: new Date(),
      updateTime: new Date(),
      status: 'active',
      creator: OPENID || '',
      lastOperator: OPENID || '',
      lastOperationTime: new Date(),
      lastOperationType: 'create',
      lastOperationAmount: numAmount,
      type: productType, // 添加类型字段
      productName: productName // 添加产品名称字段
    }
    
    // 如果有操作ID，添加到记录中
    if (operationId) {
      addData.lastOperationId = operationId
      addData.creationOperationId = operationId
    }
    
    console.log('创建数据:', JSON.stringify(addData))
    
    // 添加记录到数据库
    const addResult = await db.collection('prepaidRecords').add({
      data: addData
    })
    console.log('创建结果:', JSON.stringify(addResult))
    
    // 确保有记录ID
    if (!addResult || !addResult._id) {
      console.error('创建记录失败，没有返回记录ID')
      return {
        success: false,
        message: '创建记录失败，没有返回记录ID'
      }
    }
    
    const recordId = addResult._id
    console.log('新创建的记录ID:', recordId)
    
    // 添加预存记录历史
    try {
      const historyData = {
        prestoreRecordId: recordId,
        customerId: customerId,
        customerName: customerName || '',
        customerPhone: customerPhone || '',
        amount: numAmount,
        type: 'create',
        createTime: new Date(),
        operator: OPENID || '',
        remark: source ? `${source}首次预存` : '购物车首次预存'
      }
      
      // 添加操作ID和商品信息
      if (operationId) {
        historyData.operationId = operationId
      }
      
      if (items && items.length > 0) {
        historyData.items = items
      }
      
      console.log('添加历史记录:', JSON.stringify(historyData))
      
      const historyResult = await db.collection('prepaidHistory').add({
        data: historyData
      })
      console.log('预存历史记录添加成功:', JSON.stringify(historyResult))
    } catch (historyErr) {
      console.error('添加预存历史记录失败:', historyErr.message || historyErr)
    }
    
    // 验证记录是否成功创建
    try {
      console.log('验证记录是否创建成功，查询ID:', recordId)
      const checkResult = await db.collection('prepaidRecords').doc(recordId).get()
      console.log('验证结果:', JSON.stringify(checkResult))
      if (checkResult && checkResult.data) {
        console.log('记录创建成功并可以查询到')
      } else {
        console.warn('记录创建成功但无法查询到')
      }
    } catch (checkErr) {
      console.error('验证记录失败:', checkErr.message || checkErr)
    }
    
    const returnResult = {
      success: true,
      message: '预存记录已创建',
      isNew: true,
      recordId: recordId,
      amount: numAmount,
      operationId: operationId || '',
      customerId: customerId // 返回客户ID以便验证
    }
    console.log('返回结果:', JSON.stringify(returnResult))
    console.log('=============== 预存记录操作结束 ===============')
    return returnResult
  } catch (error) {
    console.error('预存操作失败:', error.message || error)
    console.error('错误详情:', JSON.stringify(error))
    return {
      success: false,
      error: error.message || JSON.stringify(error),
      message: '预存操作失败'
    }
  }
} 