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
    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(targetPhone)) {
      return {
        success: false,
        error: '手机号格式不正确'
      }
    }
    
    // 生成6位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // 设置验证码过期时间（5分钟）
    const expireTime = new Date(Date.now() + 5 * 60 * 1000)
    
    // 保存验证码到数据库
    await db.collection('sms_codes').add({
      data: {
        phoneNumber: targetPhone,
        code,
        type,
        expireTime,
        createTime: new Date(),
        openid: wxContext.OPENID,
        used: false
      }
    })
    
    // 这里应该调用短信服务发送验证码
    // 由于是演示，我们只记录日志
    console.log(`向手机号 ${targetPhone} 发送验证码: ${code}`)
    
    // 实际项目中，这里应该调用短信服务API
    // const smsResult = await sendSms(phoneNumber, code)
    
    return {
      success: true,
      message: '验证码发送成功',
      // 开发环境下返回验证码，生产环境应该注释掉
      code: code
    }
    
  } catch (error) {
    console.error('发送验证码失败:', error)
    return {
      success: false,
      error: '发送验证码失败，请重试'
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