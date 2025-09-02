// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { phone, phoneNumber, code, type = 'login' } = event
  // 兼容两种参数名
  const targetPhone = phone || phoneNumber
  
  try {
    // 验证参数
    if (!targetPhone || !code) {
      return {
        success: false,
        error: '手机号和验证码不能为空'
      }
    }
    
    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(targetPhone)) {
      return {
        success: false,
        error: '手机号格式不正确'
      }
    }
    
    // 验证验证码格式
    if (!/^\d{6}$/.test(code)) {
      return {
        success: false,
        error: '验证码格式不正确'
      }
    }
    
    // 查询验证码记录
    const now = new Date()
    const smsRecord = await db.collection('sms_codes')
      .where({
        phoneNumber: targetPhone,
        code: code,
        type: type,
        used: false,
        expireTime: db.command.gt(now)
      })
      .orderBy('createTime', 'desc')
      .limit(1)
      .get()
    
    if (smsRecord.data.length === 0) {
      return {
        success: false,
        error: '验证码无效或已过期'
      }
    }
    
    const record = smsRecord.data[0]
    
    // 标记验证码为已使用
    await db.collection('sms_codes').doc(record._id).update({
      data: {
        used: true,
        useTime: now
      }
    })
    
    // 创建或更新用户记录
    const userData = {
      phoneNumber: targetPhone,
      openid: wxContext.OPENID,
      unionid: wxContext.UNIONID || '',
      lastLoginTime: now,
      loginCount: db.command.inc(1)
    }
    
    // 查找现有用户
    const existingUser = await db.collection('users')
      .get()
    
    if (existingUser.data.length > 0) {
      // 更新现有用户
      await db.collection('users').doc(existingUser.data[0]._id).update({
        data: {
          lastLoginTime: now,
          loginCount: db.command.inc(1)
        }
      })
    } else {
      // 创建新用户
      userData.createTime = now
      await db.collection('users').add({
        data: userData
      })
    }
    
    return {
      success: true,
      message: '验证成功',
      data: {
        phoneNumber: phoneNumber,
        isNewUser: existingUser.data.length === 0
      }
    }
    
  } catch (error) {
    console.error('验证验证码失败:', error)
    return {
      success: false,
      error: '验证失败，请重试'
    }
  }
} 