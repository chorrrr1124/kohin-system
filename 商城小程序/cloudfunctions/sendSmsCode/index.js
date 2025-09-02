// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { phone, phoneNumber, type = 'login' } = event
  // 兼容两种参数名
  const targetPhone = phone || phoneNumber
  
  try {
    console.log('=== sendSmsCode 云函数开始 ===');
    console.log('接收到的参数:', JSON.stringify(event, null, 2));
    console.log('目标手机号:', targetPhone);
    
    // 验证手机号格式
    if (!targetPhone) {
      console.error('缺少手机号参数');
      return {
        success: false,
        error: '缺少手机号参数'
      }
    }
    
    if (!/^1[3-9]\d{9}$/.test(targetPhone)) {
      console.error('手机号格式不正确:', targetPhone);
      return {
        success: false,
        error: '手机号格式不正确'
      }
    }
    
    // 检查并创建数据库集合
    try {
      await db.createCollection('sms_codes');
      console.log('sms_codes 集合创建成功或已存在');
    } catch (error) {
      console.log('sms_codes 集合已存在或创建失败:', error.message);
    }
    
    // 生成6位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    console.log('生成验证码:', code);
    
    // 设置验证码过期时间（5分钟）
    const expireTime = new Date(Date.now() + 5 * 60 * 1000)
    
    // 保存验证码到数据库
    console.log('开始保存验证码到数据库...');
    const dbResult = await db.collection('sms_codes').add({
      data: {
        phoneNumber: targetPhone,
        code,
        type,
        expireTime,
        createTime: new Date(),
        openid: wxContext.OPENID,
        used: false
      }
    });
    
    console.log('验证码保存成功，数据库ID:', dbResult._id);
    
    // 这里应该调用短信服务发送验证码
    // 由于是演示，我们只记录日志
    console.log(`向手机号 ${targetPhone} 发送验证码: ${code}`)
    
    // 实际项目中，这里应该调用短信服务API
    // const smsResult = await sendSms(phoneNumber, code)
    
    return {
      success: true,
      message: '验证码发送成功',
      // 开发环境下返回验证码，生产环境应该注释掉
      code: code,
      dbId: dbResult._id,
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('=== 发送验证码失败 ===');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    
    // 根据错误类型返回更具体的错误信息
    let errorMessage = '发送验证码失败，请重试';
    let errorDetail = error.message || '未知错误';
    
    if (error.message) {
      if (error.message.includes('permission')) {
        errorMessage = '数据库权限不足';
        errorDetail = '无法写入验证码数据，请检查数据库权限';
      } else if (error.message.includes('collection')) {
        errorMessage = '数据库集合创建失败';
        errorDetail = '无法创建或访问验证码集合';
      } else if (error.message.includes('network')) {
        errorMessage = '网络连接失败';
        errorDetail = '请检查网络连接后重试';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      detail: errorDetail,
      originalError: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

// 发送短信的函数（需要配置短信服务）
async function sendSms(phoneNumber, code) {
  // 这里应该集成短信服务，如腾讯云短信、阿里云短信等
  // 示例代码：
  /*
  const tencentcloud = require("tencentcloud-sdk-nodejs")
  const SmsClient = tencentcloud.sms.v20210111.Client
  
  const clientConfig = {
    credential: {
      secretId: "YOUR_SECRET_ID",
      secretKey: "YOUR_SECRET_KEY",
    },
    region: "ap-guangzhou",
    profile: {
      httpProfile: {
        endpoint: "sms.tencentcloudapi.com",
      },
    },
  }
  
  const client = new SmsClient(clientConfig)
  const params = {
    PhoneNumberSet: [`+86${phoneNumber}`],
    SmsSdkAppId: "YOUR_SMS_SDK_APP_ID",
    SignName: "YOUR_SIGN_NAME",
    TemplateId: "YOUR_TEMPLATE_ID",
    TemplateParamSet: [code]
  }
  
  return await client.SendSms(params)
  */
  
  // 模拟发送成功
  return { success: true }
} 