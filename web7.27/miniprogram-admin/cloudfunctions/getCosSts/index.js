// 云函数入口文件
const cloud = require('wx-server-sdk')
const STS = require('qcloud-cos-sts')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { prefix = 'images/' } = event;

    // 从环境变量读取配置（避免硬编码密钥）
    const secretId = process.env.TENCENTCLOUD_SECRETID || process.env.TENCENT_SECRET_ID
    const secretKey = process.env.TENCENTCLOUD_SECRETKEY || process.env.TENCENT_SECRET_KEY
    const bucket = process.env.COS_BUCKET
    const region = process.env.COS_REGION || 'ap-guangzhou'

    if (!secretId || !secretKey || !bucket || !region) {
      throw new Error('缺少必要的环境变量：TENCENTCLOUD_SECRETID/TENCENT_SECRET_ID、TENCENTCLOUD_SECRETKEY/TENCENT_SECRET_KEY、COS_BUCKET、COS_REGION')
    }

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
    return {
      success: false,
      error: error.message,
      message: '获取COS临时密钥失败，请检查配置'
    }
  }
}
