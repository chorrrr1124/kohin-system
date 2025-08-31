// 手机号解密云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  try {
    const { code } = event;
    
    if (!code) {
      return {
        success: false,
        error: '缺少code参数'
      };
    }

    console.log('开始解密手机号，code:', code);

    // 调用微信API解密手机号
    const result = await cloud.openapi.phonenumber.getPhoneNumber({
      code: code
    });

    console.log('微信API返回结果:', result);

    if (result.phoneNumber) {
      return {
        success: true,
        phoneNumber: result.phoneNumber,
        countryCode: result.countryCode || '86',
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        success: false,
        error: '手机号解密失败',
        detail: result
      };
    }
    
  } catch (error) {
    console.error('手机号解密失败:', error);
    
    // 根据错误类型返回不同的错误信息
    let errorMessage = '手机号解密失败';
    
    if (error.message) {
      if (error.message.includes('40013')) {
        errorMessage = '无效的code，请重新获取';
      } else if (error.message.includes('40029')) {
        errorMessage = 'code已过期，请重新获取';
      } else if (error.message.includes('45011')) {
        errorMessage = '请求过于频繁，请稍后重试';
      } else if (error.message.includes('40226')) {
        errorMessage = '高风险用户，需要完成实名认证';
      } else if (error.message.includes('1400001')) {
        errorMessage = '功能使用次数已达上限';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      detail: error.message
    };
  }
}; 