import cloudbase from '@cloudbase/js-sdk';

// 云开发环境ID
const ENV_ID = 'cloudbase-3g4w6lls8a5ce59b';

// 全局单例实例
let globalApp = null;

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
    console.log('初始化云开发实例');
    globalApp = init();
  }
  return globalApp;
};

/**
 * 默认的云开发实例
 */
export const app = getApp();

/**
 * 确保用户已登录（如未登录会执行匿名登录）
 * @returns {Promise} 登录状态
 */
export const ensureLogin = async () => {
  try {
    const currentApp = getApp();
    const auth = currentApp.auth();

    // 检查当前登录状态
    let loginState = await auth.getLoginState();

    if (loginState && loginState.isLoggedIn) {
      // 已登录，返回当前状态
      console.log('用户已登录');
      return loginState;
    } else {
      // 未登录，执行登录
      console.log('用户未登录，执行登录...');

      // 默认采用匿名登录
      await auth.signInAnonymously();

      let loginState = await auth.getLoginState()
      return loginState;
    }
  } catch (error) {
    console.error('确保登录失败:', error);

    // 即使登录失败，也返回一个降级的登录状态，确保应用可以继续运行
    console.warn('使用降级登录状态，应用将以离线模式运行');
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
    const currentApp = getApp();
    const auth = currentApp.auth();
    const loginScope = await auth.loginScope();

    if (loginScope === 'anonymous') {
      console.warn('匿名登录状态无法退出');
      return { success: false, message: '匿名登录状态无法退出' };
    }

    await auth.signOut();
    return { success: true, message: '已成功退出登录' };
  } catch (error) {
    console.error('退出登录失败:', error);
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

// 默认导出
export default {
  init,
  app,
  ensureLogin,
  logout,
  initCloudBase
};