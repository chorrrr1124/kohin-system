const CloudBase = require('@cloudbase/manager-node');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 初始化 CloudBase 管理端SDK
const { storage } = new CloudBase({
  secretId: process.env.TENCENTCLOUD_SECRETID,
  secretKey: process.env.TENCENTCLOUD_SECRETKEY,
  envId: 'cloudbase-3g4w6lls8a5ce59b'
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
    // 生成云存储路径
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `${timestamp}_${randomStr}.${fileExtension}`;
    
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
    const cloudPath = `${uploadPath}${uniqueFileName}`;

    // 创建临时文件
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, uniqueFileName);
    
    // 将base64数据写入临时文件
    fs.writeFileSync(tempFilePath, Buffer.from(fileBuffer, 'base64'));

    // 使用管理端SDK上传文件到云存储
    await storage.uploadFile({
      localPath: tempFilePath,
      cloudPath: cloudPath,
      onProgress: (data) => {
        console.log(`上传进度: ${Math.round(data.percent || 0)}%`);
      }
    });

    // 清理临时文件
    fs.unlinkSync(tempFilePath);

    // 构建访问URL
    const imageUrl = `https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/${cloudPath}`;

    return {
      success: true,
      message: '上传成功',
      data: {
        cloudPath: cloudPath,
        url: imageUrl,
        category: category,
        fileName: uniqueFileName,
        originalFileName: fileName,
        uploadTime: new Date().toISOString(),
        cloudStorageId: '636c-cloudbase-3g4w6lls8a5ce59b'
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
