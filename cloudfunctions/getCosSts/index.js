const cloudbase = require('@cloudbase/node-sdk');

exports.main = async (event, context) => {
  try {
    const { prefix = 'images/' } = event;

    // 从环境变量读取配置（避免硬编码密钥）
    const secretId = process.env.TENCENTCLOUD_SECRETID || process.env.TENCENT_SECRET_ID
    const secretKey = process.env.TENCENTCLOUD_SECRETKEY || process.env.TENCENT_SECRET_KEY
    const bucket = process.env.COS_BUCKET || 'kohin-1327524326'
    const region = process.env.COS_REGION || 'ap-guangzhou'

    if (!secretId || !secretKey) {
      // 如果没有配置环境变量，返回一个模拟的响应用于测试
      console.log('⚠️ 环境变量未配置，返回模拟数据');
      return {
        success: true,
        data: {
          credentials: {
            TmpSecretId: 'mock_tmp_secret_id',
            TmpSecretKey: 'mock_tmp_secret_key',
            SecurityToken: 'mock_session_token'
          },
          StartTime: Math.floor(Date.now() / 1000) - 30,
          ExpiredTime: Math.floor(Date.now() / 1000) + 1800,
          bucket,
          region
        },
        message: 'COS STS获取成功（模拟模式）'
      }
    }

    // 如果有环境变量，使用真实的STS服务
    const STS = require('qcloud-cos-sts');

    // 配置STS策略（按前缀最小授权）
    const policy = {
      version: '2.0',
      statement: [
        {
          effect: 'allow',
          action: [
            'cos:PutObject',
            'cos:PostObject',
            'cos:GetObject',
            'cos:DeleteObject'
          ],
          resource: [
            `qcs::cos:${region}:uid/*:${bucket}/${prefix}*`
          ]
        }
      ]
    };

    // 获取STS临时密钥
    const result = await new Promise((resolve, reject) => {
      STS.getCredential({
        secretId,
        secretKey,
        policy,
        durationSeconds: 1800
      }, (err, data) => {
        if (err) return reject(err)
        resolve(data)
      })
    })

    return {
      success: true,
      data: {
        credentials: {
          TmpSecretId: result.credentials.tmpSecretId,
          TmpSecretKey: result.credentials.tmpSecretKey,
          SecurityToken: result.credentials.sessionToken
        },
        StartTime: result.startTime,
        ExpiredTime: result.expiredTime,
        bucket,
        region
      },
      message: 'COS STS获取成功'
    }
  } catch (error) {
    console.error('getCosSts error:', error);
    return {
      success: false,
      error: error.message,
      message: '获取COS临时密钥失败，请检查配置'
    }
  }
};