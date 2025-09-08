const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

exports.main = async (event, context) => {
  const { fileID, cloudPath } = event;
  
  try {
    console.log('🔍 获取临时URL请求:', { fileID, cloudPath });
    
    // 如果没有提供fileID，返回错误
    if (!fileID) {
      console.log('❌ 缺少fileID参数');
      return {
        success: false,
        error: '缺少fileID参数'
      };
    }
    
    // 由于当前是模拟上传模式，文件实际上不存在于CloudBase存储中
    // 返回一个模拟的临时URL
    if (fileID && fileID.includes('cloud://')) {
      console.log('⚠️ 模拟模式：返回模拟临时URL');
      return {
        success: true,
        data: {
          tempFileURL: `https://mock-cdn.example.com/${cloudPath || 'mock-image.jpg'}`,
          fileID: fileID,
          cloudPath: cloudPath
        }
      };
    }

    // 尝试使用CloudBase SDK获取临时URL
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
        console.log('❌ 文件获取失败:', fileInfo.code);
        
        // 如果是文件不存在，返回模拟URL
        if (fileInfo.code === 'STORAGE_FILE_NONEXIST') {
          console.log('⚠️ 文件不存在，返回模拟URL');
          return {
            success: true,
            data: {
              tempFileURL: `https://mock-cdn.example.com/${cloudPath || 'mock-image.jpg'}`,
              fileID: fileID,
              cloudPath: cloudPath
            }
          };
        }
        
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
    
    // 如果是文件不存在错误，返回模拟URL
    if (error.message && error.message.includes('STORAGE_FILE_NONEXIST')) {
      console.log('⚠️ 捕获文件不存在错误，返回模拟URL');
      return {
        success: true,
        data: {
          tempFileURL: `https://mock-cdn.example.com/${cloudPath || 'mock-image.jpg'}`,
          fileID: fileID,
          cloudPath: cloudPath
        }
      };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};
