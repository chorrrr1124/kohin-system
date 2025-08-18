const cloud = require('wx-server-sdk');
const COS = require('cos-nodejs-sdk-v5');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const COS_BUCKET = 'kohin-1327524326';
const COS_REGION = 'ap-guangzhou';

// 初始化 COS 客户端
const cos = new COS({
  SecretId: process.env.TENCENTCLOUD_SECRETID,
  SecretKey: process.env.TENCENTCLOUD_SECRETKEY
});

exports.main = async (event, context) => {
  const { fileBuffer, fileName, category = 'general', contentType = 'image/jpeg' } = event;
  
  if (!fileBuffer || !fileName) {
    return {
      success: false,
      message: '缺少必要参数：fileBuffer 或 fileName'
    };
  }

  try {
    // 根据分类确定上传路径
    const categoryPath = {
      'banner': 'images/banner/',
      'banners': 'images/banners/',
      'category': 'images/category/',
      'products': 'images/products/',
      'icons': 'images/icons/',
      'tab': 'images/tab/',
      'general': 'images/general/'
    };

    const uploadPath = categoryPath[category] || 'images/general/';
    const key = `${uploadPath}${fileName}`;

    // 上传文件到 COS
    const result = await new Promise((resolve, reject) => {
      cos.putObject({
        Bucket: COS_BUCKET,
        Region: COS_REGION,
        Key: key,
        Body: Buffer.from(fileBuffer, 'base64'),
        ContentType: contentType,
        Headers: {
          'Cache-Control': 'max-age=31536000' // 缓存一年
        }
      }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    // 构建访问URL（公有读权限）
    const imageUrl = `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${key}`;

    return {
      success: true,
      message: '上传成功',
      data: {
        url: imageUrl,
        key: key,
        category: category,
        fileName: fileName,
        uploadTime: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('上传失败:', error);
    return {
      success: false,
      message: '上传失败: ' + error.message,
      error: error
    };
  }
};