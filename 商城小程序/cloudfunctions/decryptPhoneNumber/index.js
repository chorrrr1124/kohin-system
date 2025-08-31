// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 获取手机号
    const result = await cloud.getOpenData({
      list: [event.code]
    })
    
    console.log('解密结果:', result)
    
    if (result.list && result.list.length > 0) {
      const phoneData = result.list[0]
      
      if (phoneData.data && phoneData.data.phoneNumber) {
        return {
          success: true,
          phoneNumber: phoneData.data.phoneNumber,
          countryCode: phoneData.data.countryCode || '86'
        }
      } else {
        return {
          success: false,
          error: '手机号数据格式错误'
        }
      }
    } else {
      return {
        success: false,
        error: '解密失败，未获取到手机号'
      }
    }
    
  } catch (error) {
    console.error('解密手机号失败:', error)
    return {
      success: false,
      error: error.message || '解密手机号失败'
    }
  }
} 