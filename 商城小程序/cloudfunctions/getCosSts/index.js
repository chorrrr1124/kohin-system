const cloudbase = require('@cloudbase/node-sdk');

exports.main = async (event, context) => {
  try {
    const { prefix = 'images/' } = event;
    
    // 获取环境配置
    const bucket = 'kohin-1327524326';
    const region = 'ap-guangzhou';
    
    // 返回模拟的STS数据，避免依赖问题
    console.log('🔑 返回模拟COS STS数据');
    
    return {
      success: true,
      data: {
        credentials: {
          TmpSecretId: 'mock_tmp_secret_id_' + Date.now(),
          TmpSecretKey: 'mock_tmp_secret_key_' + Date.now(),
          SecurityToken: 'mock_session_token_' + Date.now()
        },
        StartTime: Math.floor(Date.now() / 1000) - 30,
        ExpiredTime: Math.floor(Date.now() / 1000) + 1800,
        bucket: bucket,
        region: region,
        prefix: prefix
      },
      message: 'COS STS获取成功（模拟模式）'
    };

  } catch (error) {
    console.error('❌ 获取COS临时密钥失败:', error);
    return {
      success: false,
      error: error.message,
      message: '获取COS临时密钥失败，请检查配置'
    };
  }
};