const CloudBase = require('@cloudbase/manager-node');

// 初始化 CloudBase 管理端SDK
const { storage } = new CloudBase({
  secretId: process.env.TENCENTCLOUD_SECRETID,
  secretKey: process.env.TENCENTCLOUD_SECRETKEY,
  envId: 'cloudbase-3g4w6lls8a5ce59b'
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
    const files = await storage.listDirectoryFiles(cloudPath);
    
    return {
      success: true,
      data: files,
      cloudPath: cloudPath,
      count: files.length
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
    const fileInfo = await storage.getFileInfo(cloudPath);
    
    return {
      success: true,
      data: fileInfo
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
    await storage.deleteFile(cloudPathList);
    
    return {
      success: true,
      message: `成功删除 ${cloudPathList.length} 个文件`,
      deletedFiles: cloudPathList
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
    await storage.deleteDirectory(cloudPath);
    
    return {
      success: true,
      message: `成功删除文件夹: ${cloudPath}`,
      cloudPath: cloudPath
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
          cloudPath: file,
          maxAge: maxAge
        };
      } else {
        return file;
      }
    });
    
    const urls = await storage.getTemporaryUrl(tempUrlInfoList);
    
    return {
      success: true,
      data: urls,
      count: urls.length
    };
  } catch (error) {
    console.error('获取临时链接失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 获取存储权限
async function getStorageAcl() {
  try {
    const acl = await storage.getStorageAcl();
    
    return {
      success: true,
      data: {
        acl: acl
      }
    };
  } catch (error) {
    console.error('获取存储权限失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 设置存储权限
async function setStorageAcl(data) {
  const { acl } = data;
  
  if (!acl) {
    return {
      success: false,
      error: '缺少acl参数'
    };
  }
  
  const validAcls = ['READONLY', 'PRIVATE', 'ADMINWRITE', 'ADMINONLY'];
  if (!validAcls.includes(acl)) {
    return {
      success: false,
      error: `无效的权限类型: ${acl}，支持的类型: ${validAcls.join(', ')}`
    };
  }
  
  try {
    const result = await storage.setStorageAcl(acl);
    
    return {
      success: true,
      message: `存储权限设置成功: ${acl}`,
      data: result
    };
  } catch (error) {
    console.error('设置存储权限失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
