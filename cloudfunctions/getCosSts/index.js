const STS = require('qcloud-cos-sts');

exports.main = async (event, context) => {
  console.log('getCosSts function started');
  
  // 调试：打印环境变量状态
  console.log('Environment variables check:');
  console.log('TENCENT_SECRET_ID:', process.env.TENCENT_SECRET_ID ? 'SET' : 'NOT SET');
  console.log('TENCENT_SECRET_KEY:', process.env.TENCENT_SECRET_KEY ? 'SET' : 'NOT SET');
  console.log('COS_BUCKET:', process.env.COS_BUCKET);
  console.log('COS_REGION:', process.env.COS_REGION);
  
  try {
    // 从环境变量获取配置
    const config = {
      secretId: process.env.TENCENT_SECRET_ID,
      secretKey: process.env.TENCENT_SECRET_KEY,
      bucket: process.env.COS_BUCKET,
      region: process.env.COS_REGION,
      durationSeconds: 1800, // 30分钟有效期
      allowPrefix: '*', // 允许操作的资源前缀
      allowActions: [
        'name/cos:PutObject',
        'name/cos:PostObject',
        'name/cos:GetObject',
        'name/cos:HeadObject',
        'name/cos:DeleteObject'
      ]
    };

    // 验证必要的环境变量
    if (!config.secretId || !config.secretKey || !config.bucket || !config.region) {
      console.error('Missing required environment variables');
      return {
        success: false,
        error: 'Missing required environment variables',
        message: 'Please configure TENCENT_SECRET_ID, TENCENT_SECRET_KEY, COS_BUCKET, COS_REGION'
      };
    }

    console.log('Config validated, requesting STS credentials');

    // 获取临时密钥
    const stsResult = await new Promise((resolve, reject) => {
      STS.getCredential({
        secretId: config.secretId,
        secretKey: config.secretKey,
        policy: {
          version: '2.0',
          statement: [{
            effect: 'allow',
            action: config.allowActions,
            resource: [
              `qcs::cos:${config.region}:uid/*:${config.bucket}/*`
            ]
          }]
        },
        durationSeconds: config.durationSeconds
      }, (err, result) => {
        if (err) {
          console.error('STS error:', err);
          reject(err);
        } else {
          console.log('STS success');
          resolve(result);
        }
      });
    });

    // 返回临时密钥信息（使用COS SDK期望的大写字段名）
    const response = {
      success: true,
      data: {
        credentials: {
          tmpSecretId: stsResult.credentials.tmpSecretId,
          tmpSecretKey: stsResult.credentials.tmpSecretKey,
          sessionToken: stsResult.credentials.sessionToken,
          // 同时提供大写格式以兼容COS SDK
          TmpSecretId: stsResult.credentials.tmpSecretId,
          TmpSecretKey: stsResult.credentials.tmpSecretKey,
          SecurityToken: stsResult.credentials.sessionToken
        },
        // 同时提供大写和小写格式以兼容不同的调用方式
        TmpSecretId: stsResult.credentials.tmpSecretId,
        TmpSecretKey: stsResult.credentials.tmpSecretKey,
        SecurityToken: stsResult.credentials.sessionToken,
        ExpiredTime: stsResult.expiredTime,
        expiredTime: stsResult.expiredTime,
        expiration: stsResult.expiration,
        bucket: config.bucket,
        region: config.region,
        cosConfig: {
          Bucket: config.bucket,
          Region: config.region
        }
      }
    };

    console.log('Returning STS credentials successfully');
    return response;

  } catch (error) {
    console.error('Function error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack
    };
  }
};