import cloudbase from '@cloudbase/js-sdk';

// 云开发环境ID
const ENV_ID = 'cloudbase-3g4w6lls8a5ce59b';

// 全局单例实例
let globalApp = null;
let globalAuth = null;

/**
 * 初始化云开发实例
 * @param {Object} config - 初始化配置
 * @param {string} config.env - 环境ID，默认使用ENV_ID
 * @param {number} config.timeout - 超时时间，默认15000ms
 * @returns {Object} 云开发实例
 */
export const init = (config = {}) => {
  const appConfig = {
    env: config.env || ENV_ID,
    timeout: config.timeout || 15000,
  };

  return cloudbase.init(appConfig);
};

/**
 * 获取或创建云开发实例（单例模式）
 * @returns {Object} 云开发实例
 */
const getApp = () => {
  if (!globalApp) {
    console.log('🔧 初始化云开发实例...');
    globalApp = init();
    
    // 同时创建全局auth实例
    if (!globalAuth) {
      globalAuth = globalApp.auth();
      console.log('🔐 创建全局auth实例');
    }
  }
  return globalApp;
};

/**
 * 获取全局auth实例（单例模式）
 * @returns {Object} auth实例
 */
const getAuth = () => {
  if (!globalAuth) {
    getApp(); // 确保app已初始化
  }
  return globalAuth;
};

/**
 * 默认的云开发实例
 */
export const app = getApp();

/**
 * 默认的auth实例
 */
export const auth = getAuth();

/**
 * 确保用户已登录（如未登录会执行匿名登录）
 * @returns {Promise} 登录状态
 */
export const ensureLogin = async () => {
  try {
    // 使用全局auth实例，避免重复创建
    const currentAuth = getAuth();
    console.log('🔐 使用全局auth实例:', currentAuth);

    // 检查当前登录状态
    let loginState = await currentAuth.getLoginState();
    console.log('👤 当前登录状态:', loginState);

    if (loginState && loginState.isLoggedIn) {
      // 已登录，返回当前状态
      console.log('✅ 用户已登录');
      return loginState;
    } else {
      // 未登录，执行登录
      console.log('🔐 用户未登录，执行匿名登录...');

      try {
        // 默认采用匿名登录
        await currentAuth.signInAnonymously();
        console.log('✅ 匿名登录成功');

        // 重新获取登录状态
        loginState = await currentAuth.getLoginState();
        console.log('🔄 登录后状态:', loginState);
        
        return loginState;
      } catch (signInError) {
        console.error('❌ 匿名登录失败:', signInError);
        
        // 检查是否是域名白名单问题
        if (signInError.message && signInError.message.includes('domain')) {
          console.warn('⚠️ 可能是域名白名单问题，请检查CloudBase控制台设置');
        }
        
        throw signInError;
      }
    }
  } catch (error) {
    console.error('❌ 确保登录失败:', error);

    // 检查错误类型
    if (error.message && error.message.includes('network')) {
      console.warn('⚠️ 网络连接问题，请检查网络设置');
    } else if (error.message && error.message.includes('domain')) {
      console.warn('⚠️ 域名白名单问题，请检查CloudBase控制台');
    } else {
      console.warn('⚠️ 未知错误，使用降级模式');
    }

    // 即使登录失败，也返回一个降级的登录状态，确保应用可以继续运行
    console.warn('⚠️ 使用降级登录状态，应用将以离线模式运行');
    return {
      isLoggedIn: true,
      user: {
        uid: 'offline_' + Date.now(),
        isAnonymous: true,
        isOffline: true
      }
    };
  }
};

/**
 * 退出登录（注意：匿名登录无法退出）
 * @returns {Promise}
 */
export const logout = async () => {
  try {
    const currentAuth = getAuth();
    const loginScope = await currentAuth.loginScope();

    if (loginScope === 'anonymous') {
      console.warn('⚠️ 匿名登录状态无法退出');
      return { success: false, message: '匿名登录状态无法退出' };
    }

    await currentAuth.signOut();
    return { success: true, message: '已成功退出登录' };
  } catch (error) {
    console.error('❌ 退出登录失败:', error);
    throw error;
  }
};

/**
 * 获取云开发实例（兼容函数）
 * @returns {Object} 云开发实例
 */
export const initCloudBase = () => {
  return getApp();
};

/**
 * 获取数据库实例（便捷函数）
 * @returns {Object} 数据库实例
 */
export const getDatabase = () => {
  return getApp().database();
};

// 默认导出
export default {
  init,
  app,
  auth,
  ensureLogin,
  logout,
  initCloudBase,
  getDatabase
};