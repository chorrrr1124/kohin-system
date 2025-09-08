const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

exports.main = async (event, context) => {
  const { fileID, cloudPath } = event;
  
  try {
    // 使用CloudBase SDK获取临时URL
    const result = await app.getTempFileURL({
      fileList: [{
        fileID: fileID,
        maxAge: 3600 // 1小时有效期
      }]
    });

    if (result.fileList && result.fileList.length > 0) {
      const fileInfo = result.fileList[0];
      
      if (fileInfo.code === 'SUCCESS') {
        return {
          success: true,
          data: {
            tempFileURL: fileInfo.tempFileURL,
            fileID: fileID,
            cloudPath: cloudPath
          }
        };
      } else {
        return {
          success: false,
          error: fileInfo.code || '获取临时URL失败'
        };
      }
    } else {
      return {
        success: false,
        error: '获取临时URL失败'
      };
    }
  } catch (error) {
    console.error('获取临时URL失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
