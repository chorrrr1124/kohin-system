import COS from 'cos-js-sdk-v5';
import { initCloudBase } from './cloudbase.js';

// COS 配置（根据用户提供信息）
export const COS_BUCKET = 'kohin-1327524326';
export const COS_REGION = 'ap-guangzhou';

/**
 * 创建 COS 客户端，使用 CloudBase 云函数签发 STS
 * 需要在云端提供名为 getCosSts 的云函数，返回 { tmpSecretId, tmpSecretKey, sessionToken, expiredTime } 或兼容大写格式
 */
export function createCosClient() {
  const app = initCloudBase();

  const cos = new COS({
    getAuthorization: async (options, callback) => {
      try {
        console.log('正在获取COS临时密钥...');
        
        // 确保用户已登录
        const auth = app.auth();
        let loginState = await auth.getLoginState();
        
        if (!loginState || !loginState.isLoggedIn) {
          console.log('用户未登录，执行匿名登录...');
          await auth.signInAnonymously();
          loginState = await auth.getLoginState();
        }
        
        console.log('登录状态:', loginState?.isLoggedIn ? '已登录' : '未登录');
        
        let res, creds, cloudFunctionResult;
        
        try {
          res = await app.callFunction({ 
            name: 'getCosSts',
            data: {
              prefix: 'images/'
            }
          });
          
          console.log('云函数返回的完整数据:', res);
          
          cloudFunctionResult = res?.result;
          
          if (cloudFunctionResult?.success === false) {
            throw new Error(`云函数执行失败: ${cloudFunctionResult?.error || '未知错误'}`);
          }
          
          // 正确解析嵌套的数据结构：result.data.credentials
          creds = cloudFunctionResult?.data?.credentials;
          
          if (!creds) {
            console.error('未找到credentials数据:', {
              hasResult: !!res?.result,
              hasData: !!cloudFunctionResult?.data,
              dataKeys: cloudFunctionResult?.data ? Object.keys(cloudFunctionResult.data) : 'N/A'
            });
            throw new Error('云函数返回数据格式错误：缺少credentials');
          }
          
          console.log('解析的凭证数据:', {
            tmpSecretId: creds?.tmpSecretId ? '已获取' : '缺失',
            tmpSecretKey: creds?.tmpSecretKey ? '已获取' : '缺失',
            sessionToken: creds?.sessionToken ? '已获取' : '缺失'
          });
          
        } catch (cloudFunctionError) {
          console.error('云函数调用失败:', cloudFunctionError);
          throw new Error(`云函数调用失败: ${cloudFunctionError.message}`);
        }
        
        // 兼容不同的字段名称格式（小写和大写）
        const tmpSecretId = creds?.tmpSecretId || creds?.TmpSecretId;
        const tmpSecretKey = creds?.tmpSecretKey || creds?.TmpSecretKey;
        const sessionToken = creds?.sessionToken || creds?.SessionToken || creds?.Token || creds?.SecurityToken;
        
        if (!creds || !tmpSecretId) {
          throw new Error(`获取临时密钥失败: ${res?.code || '云函数调用失败'}`);
        }
        
        const authData = {
          TmpSecretId: tmpSecretId,
          TmpSecretKey: tmpSecretKey,
          SecurityToken: sessionToken,
          StartTime: cloudFunctionResult?.data?.StartTime || cloudFunctionResult?.data?.startTime || Math.floor(Date.now() / 1000) - 30,
          ExpiredTime: cloudFunctionResult?.data?.expiredTime || cloudFunctionResult?.data?.ExpiredTime || Math.floor(Date.now() / 1000) + 1800,
        };
        
        console.log('返回的认证数据: TmpSecretId', authData?.TmpSecretId ? '已设置' : '缺失', 'ExpiredTime', authData?.ExpiredTime);
        console.log('完整的authData对象:', JSON.stringify(authData, null, 2));
        
        // 验证必需字段
        if (!authData.TmpSecretId) {
          console.error('TmpSecretId缺失！authData:', authData);
          callback(new Error('TmpSecretId字段缺失'), null);
          return;
        }
        
        callback(null, authData);
      } catch (e) {
        console.error('获取 COS STS 失败:', e);
        console.error('错误详情:', e.message, e.stack);
        callback(e, null);
      }
    },
  });

  return cos;
}

/**
 * 上传文件到 COS
 * @param {File} file - 要上传的文件
 * @param {string} key - 文件在 COS 中的路径
 * @param {Function} onProgress - 进度回调函数
 * @returns {Promise} 上传结果
 */
export async function uploadToCos(file, key, onProgress) {
  const cos = createCosClient();
  
  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: COS_BUCKET,
      Region: COS_REGION,
      Key: key,
      Body: file,
      onProgress: (progressData) => {
        if (onProgress) {
          onProgress(progressData);
        }
      }
    }, (err, data) => {
      if (err) {
        console.error('COS上传失败:', err);
        reject(err);
      } else {
        console.log('COS上传成功:', data);
        resolve(data);
      }
    });
  });
}

/**
 * 生成唯一的文件键名
 * @param {string} filename - 原始文件名
 * @param {string} prefix - 路径前缀
 * @returns {string} 唯一的文件键名
 */
export function generateFileKey(filename, prefix = 'images/') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = filename.split('.').pop();
  return `${prefix}${timestamp}_${random}.${extension}`;
}

/**
 * 获取文件的公开访问URL
 * @param {string} key - 文件在 COS 中的路径
 * @returns {string} 公开访问URL
 */
export function getFileUrl(key) {
  return `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${key}`;
}
