// 手机号解密云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  console.log('=== 手机号解密云函数开始 ===');
  console.log('接收到的参数:', JSON.stringify(event, null, 2));
  console.log('云函数环境:', cloud.DYNAMIC_CURRENT_ENV);
  
  try {
    const { code } = event;
    
    if (!code) {
      console.error('缺少code参数');
      return {
        success: false,
        error: '缺少code参数',
        detail: '请确保传入有效的code'
      };
    }

    console.log('开始解密手机号，code长度:', code.length);
    console.log('code前10位:', code.substring(0, 10) + '...');

    // 调用微信API解密手机号
    console.log('调用微信API解密手机号...');
    const result = await cloud.openapi.phonenumber.getPhoneNumber({
      code: code
    });

    console.log('微信API返回结果:', JSON.stringify(result, null, 2));

    // 检查返回结果
    if (result && result.phoneNumber) {
      console.log('手机号解密成功:', result.phoneNumber);
      return {
        success: true,
        phoneNumber: result.phoneNumber,
        countryCode: result.countryCode || '86',
        timestamp: new Date().toISOString()
      };
    } else {
      console.error('微信API返回结果异常:', result);
      return {
        success: false,
        error: '手机号解密失败',
        detail: '微信API返回结果异常',
        result: result
      };
    }
    
  } catch (error) {
    console.error('=== 手机号解密失败 ===');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    console.error('完整错误对象:', JSON.stringify(error, null, 2));
    
    // 根据错误类型返回不同的错误信息
    let errorMessage = '手机号解密失败';
    let errorDetail = error.message || '未知错误';
    
    if (error.message) {
      if (error.message.includes('40013')) {
        errorMessage = '无效的code，请重新获取';
        errorDetail = 'code无效或已过期';
      } else if (error.message.includes('40029')) {
        errorMessage = 'code已过期，请重新获取';
        errorDetail = 'code使用次数超限或已过期';
      } else if (error.message.includes('45011')) {
        errorMessage = '请求过于频繁，请稍后重试';
        errorDetail = 'API调用频率限制';
      } else if (error.message.includes('40226')) {
        errorMessage = '高风险用户，需要完成实名认证';
        errorDetail = '用户需要完成实名认证';
      } else if (error.message.includes('1400001')) {
        errorMessage = '功能使用次数已达上限';
        errorDetail = '手机号获取功能使用次数已达上限';
      } else if (error.message.includes('cloudId')) {
        errorMessage = 'code格式错误';
        errorDetail = '请使用正确的code格式';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      detail: errorDetail,
      originalError: error.message,
      timestamp: new Date().toISOString()
    };
  }
}; 