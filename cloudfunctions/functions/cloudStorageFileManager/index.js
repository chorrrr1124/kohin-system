const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

exports.main = async (event, context) => {
  const { action, data } = event;
  
  try {
    switch (action) {
      case 'listFiles':
        return await listFiles(data);
      case 'getFileInfo':
        return await getFileInfo(data);
      case 'deleteFile':
        return await deleteFile(data);
      case 'deleteDirectory':
        return await deleteDirectory(data);
      case 'getTemporaryUrl':
        return await getTemporaryUrl(data);
      case 'getStorageAcl':
        return await getStorageAcl();
      case 'setStorageAcl':
        return await setStorageAcl(data);
      default:
        return {
          success: false,
          error: '未知的操作类型'
        };
    }
  } catch (error) {
    console.error('云存储文件管理错误:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 列出文件夹下的所有文件
async function listFiles(data) {
  const { cloudPath = 'images/' } = data;
  
  try {
    // CloudBase Node.js SDK 不直接支持列出文件，返回提示信息
    return {
      success: false,
      error: 'CloudBase Node.js SDK 不支持直接列出文件，请使用控制台或前端SDK'
    };
  } catch (error) {
    console.error('获取文件列表失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 获取文件信息
async function getFileInfo(data) {
  const { cloudPath } = data;
  
  if (!cloudPath) {
    return {
      success: false,
      error: '缺少cloudPath参数'
    };
  }
  
  try {
    // CloudBase Node.js SDK 不直接支持获取文件信息，返回提示信息
    return {
      success: false,
      error: 'CloudBase Node.js SDK 不支持直接获取文件信息，请使用控制台或前端SDK'
    };
  } catch (error) {
    console.error('获取文件信息失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 删除文件
async function deleteFile(data) {
  const { cloudPathList } = data;
  
  if (!cloudPathList || !Array.isArray(cloudPathList)) {
    return {
      success: false,
      error: '缺少cloudPathList参数或参数格式错误'
    };
  }
  
  try {
    // CloudBase Node.js SDK 不直接支持删除文件，返回提示信息
    return {
      success: false,
      error: 'CloudBase Node.js SDK 不支持直接删除文件，请使用控制台或前端SDK'
    };
  } catch (error) {
    console.error('删除文件失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 删除文件夹
async function deleteDirectory(data) {
  const { cloudPath } = data;
  
  if (!cloudPath) {
    return {
      success: false,
      error: '缺少cloudPath参数'
    };
  }
  
  try {
    // CloudBase Node.js SDK 不直接支持删除文件夹，返回提示信息
    return {
      success: false,
      error: 'CloudBase Node.js SDK 不支持直接删除文件夹，请使用控制台或前端SDK'
    };
  } catch (error) {
    console.error('删除文件夹失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 获取文件临时下载链接
async function getTemporaryUrl(data) {
  const { fileList, maxAge = 3600 } = data;
  
  if (!fileList || !Array.isArray(fileList)) {
    return {
      success: false,
      error: '缺少fileList参数或参数格式错误'
    };
  }
  
  try {
    // 转换文件列表格式
    const tempUrlInfoList = fileList.map(file => {
      if (typeof file === 'string') {
        return {
          fileID: `cloud://cloudbase-3g4w6lls8a5ce59b.${file}`,
          maxAge: maxAge
        };
      } else {
        return {
          fileID: `cloud://cloudbase-3g4w6lls8a5ce59b.${file.cloudPath || file.key}`,
          maxAge: file.maxAge || maxAge
        };
      }
    });
    
    const result = await app.getTempFileURL({
      fileList: tempUrlInfoList
    });
    
    return {
      success: true,
      data: result.fileList || [],
      count: result.fileList ? result.fileList.length : 0
    };
  } catch (error) {
    console.error('获取临时链接失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 获取存储权限（标准SDK不支持，返回提示信息）
async function getStorageAcl() {
  return {
    success: false,
    error: '标准SDK不支持获取存储权限，请在CloudBase控制台查看'
  };
}

// 设置存储权限（标准SDK不支持，返回提示信息）
async function setStorageAcl(data) {
  return {
    success: false,
    error: '标准SDK不支持设置存储权限，请在CloudBase控制台设置'
  };
}
