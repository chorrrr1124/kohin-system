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
  console.log('🚀 uploadToCloudStorage 函数开始执行');
  
  console.log('📊 接收到的参数:', {
    hasFileBuffer: !!event.fileBuffer,
    fileName: event.fileName,
    category: event.category,
    contentType: event.contentType,
    fileBufferType: typeof event.fileBuffer,
    fileBufferLength: event.fileBuffer ? event.fileBuffer.length : 0,
    isChunked: Array.isArray(event.fileBuffer),
    chunkCount: Array.isArray(event.fileBuffer) ? event.fileBuffer.length : 0,
    fileSize: event.fileSize,
    cloudPath: event.cloudPath
  });

  const { fileBuffer, fileName, category = 'general', contentType = 'image/jpeg', cloudPath, fileSize, chunkCount } = event;
  
  if (!fileBuffer || !fileName) {
    console.error('❌ 缺少必要参数:', { fileBuffer: !!fileBuffer, fileName: !!fileName });
    return {
      success: false,
      message: '缺少必要参数：fileBuffer 或 fileName'
    };
  }

  try {
    // 确定云存储路径
    let finalCloudPath = cloudPath;
    
    if (!finalCloudPath) {
      // 如果没有提供cloudPath，则生成新的路径
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
      finalCloudPath = `${uploadPath}${uniqueFileName}`;
    }

    console.log('📁 使用的文件路径:', { cloudPath: finalCloudPath, fileName });

    // 创建临时文件
    const tempDir = os.tmpdir();
    const tempFileName = finalCloudPath.split('/').pop();
    const tempFilePath = path.join(tempDir, tempFileName);
    
    console.log('💾 开始处理文件数据...');
    
    let bufferData;
    
    // 检查是否为分块数据
    if (Array.isArray(fileBuffer)) {
      console.log(`📦 处理分块数据，共 ${fileBuffer.length} 个块`);
      
      // 合并所有分块
      const allChunks = [];
      for (let i = 0; i < fileBuffer.length; i++) {
        const chunk = fileBuffer[i];
        const chunkBuffer = Buffer.from(chunk, 'base64');
        allChunks.push(chunkBuffer);
        console.log(`📊 处理第 ${i + 1}/${fileBuffer.length} 块，大小: ${chunkBuffer.length} bytes`);
      }
      
      // 合并所有分块
      bufferData = Buffer.concat(allChunks);
      console.log(`✅ 分块合并完成，总大小: ${bufferData.length} bytes`);
      
    } else if (typeof fileBuffer === 'string') {
      // 如果是字符串，直接转换为Buffer
      bufferData = Buffer.from(fileBuffer, 'base64');
      console.log('📊 单块数据处理完成:', { bufferSize: bufferData.length });
    } else if (Buffer.isBuffer(fileBuffer)) {
      // 如果已经是Buffer，直接使用
      bufferData = fileBuffer;
      console.log('📊 Buffer数据处理完成:', { bufferSize: bufferData.length });
    } else {
      // 其他情况，尝试转换
      bufferData = Buffer.from(fileBuffer.toString(), 'base64');
      console.log('📊 其他类型数据处理完成:', { bufferSize: bufferData.length });
    }
    
    console.log('📊 文件数据处理完成:', {
      bufferSize: bufferData.length,
      tempFilePath: tempFilePath,
      expectedSize: fileSize
    });
    
    // 验证文件大小
    if (fileSize && bufferData.length !== fileSize) {
      console.warn(`⚠️ 文件大小不匹配: 期望 ${fileSize} bytes，实际 ${bufferData.length} bytes`);
    }
    
    // 将数据写入临时文件
    fs.writeFileSync(tempFilePath, bufferData);

    console.log('☁️ 开始上传到云存储...');
    
    // 使用旧版本SDK上传文件到云存储
    const uploadResult = await storage.uploadFile({
      cloudPath: finalCloudPath,
      fileContent: fs.readFileSync(tempFilePath)
    });
    
    console.log('📤 上传结果:', uploadResult);

    console.log('✅ 云存储上传成功');

    // 清理临时文件
    try {
      fs.unlinkSync(tempFilePath);
      console.log('🗑️ 临时文件清理完成');
    } catch (cleanupError) {
      console.warn('⚠️ 清理临时文件失败:', cleanupError.message);
    }

    // 构建访问URL
    const imageUrl = `https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/${finalCloudPath}`;
    
    // 生成fileID
    const fileID = `cloud://cloudbase-3g4w6lls8a5ce59b.${finalCloudPath}`;

    const result = {
      success: true,
      message: '上传成功',
      fileID: fileID,
      cloudPath: finalCloudPath,
      url: imageUrl,
      imageUrl: imageUrl,
      data: {
        cloudPath: finalCloudPath,
        url: imageUrl,
        imageUrl: imageUrl,
        fileID: fileID,
        category: category,
        fileName: finalCloudPath.split('/').pop(),
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

    console.log('🎉 上传完成，返回结果:', result);
    return result;

  } catch (error) {
    console.error('❌ 上传失败:', error);
    console.error('❌ 错误堆栈:', error.stack);
    return {
      success: false,
      message: '上传失败: ' + error.message,
      error: error.message
    };
  }
};
