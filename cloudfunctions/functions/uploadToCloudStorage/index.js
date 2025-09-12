const cloudbase = require('@cloudbase/node-sdk');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

const storage = app.storage();

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

    // 使用标准SDK上传文件到云存储
    await storage.uploadFile({
      cloudPath: cloudPath,
      fileContent: fs.readFileSync(tempFilePath)
    });

    // 清理临时文件
    fs.unlinkSync(tempFilePath);

    // 构建访问URL
    const imageUrl = `https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/${cloudPath}`;
    
    // 生成fileID
    const fileID = `cloud://cloudbase-3g4w6lls8a5ce59b.${cloudPath}`;

    return {
      success: true,
      message: '上传成功',
      data: {
        cloudPath: cloudPath,
        url: imageUrl,
        imageUrl: imageUrl,
        fileID: fileID,
        category: category,
        fileName: uniqueFileName,
        originalFileName: fileName,
        title: fileName,
        uploadTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createTime: new Date().toISOString(),
        cloudStorageId: '636c-cloudbase-3g4w6lls8a5ce59b',
        isActive: true,
        sortOrder: 0
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
