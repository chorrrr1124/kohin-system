const STS = require('qcloud-cos-sts');

const COS_BUCKET = 'kohin-1327524326';
const COS_REGION = 'ap-guangzhou';
const APPID = '1327524326';

exports.main = async (event, context) => {
  // 从事件参数中获取上传路径前缀，默认为 images/
  const { prefix = 'images/' } = event;
  
  // 支持的图片分类路径
  const allowedPrefixes = [
    'images/banner/*',     // 轮播图
    'images/banners/*',    // 推广图
    'images/category/*',   // 分类图标
    'images/products/*',   // 商品图片
    'images/icons/*',      // 图标
    'images/tab/*',        // 标签栏图标
    'images/general/*',    // 通用图片
    'carousel/*'           // 兼容旧版本
  ];

  const policy = {
    version: '2.0',
    statement: [
      {
        action: [
          'name/cos:PutObject', 
          'name/cos:PostObject',
          'name/cos:GetObject'  // 添加读取权限用于预览
        ],
        effect: 'allow',
        resource: [`qcs::cos:${COS_REGION}:uid/${APPID}:${COS_BUCKET}/*`],
        condition: {
          string_like: {
            'cos:prefix': allowedPrefixes
          }
        }
      }
    ]
  };

  const secretId = process.env.TENCENTCLOUD_SECRETID || process.env.TENCENTCLOUD_SECRET_ID;
  const secretKey = process.env.TENCENTCLOUD_SECRETKEY || process.env.TENCENTCLOUD_SECRET_KEY;

  const opts = {
    // 若运行在云函数环境，以上两个环境变量会自动注入，无需手动配置
    secretId,
    secretKey,
    durationSeconds: 1800,
    bucket: COS_BUCKET,
    region: COS_REGION,
    allowPrefix: prefix, // 使用动态前缀
    policy
  };

  return await new Promise((resolve, reject) => {
    STS.getCredential(opts, (err, tempKeys) => {
      if (err) {
        console.error('STS获取失败:', err);
        return reject(err);
      }
      
      console.log('STS原始返回:', tempKeys);
      
      // 确保返回正确的数据格式
      const result = {
        TmpSecretId: (tempKeys.credentials && tempKeys.credentials.tmpSecretId) || tempKeys.tmpSecretId,
        TmpSecretKey: (tempKeys.credentials && tempKeys.credentials.tmpSecretKey) || tempKeys.tmpSecretKey,
        SessionToken: (tempKeys.credentials && tempKeys.credentials.sessionToken) || tempKeys.sessionToken,
        StartTime: tempKeys.startTime || Math.floor(Date.now() / 1000),
        ExpiredTime: tempKeys.expiredTime || (Math.floor(Date.now() / 1000) + 1800)
      };
      
      console.log('格式化后返回:', result);
      resolve(result);
    });
  });
};