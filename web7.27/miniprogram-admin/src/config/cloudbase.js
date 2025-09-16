// CloudBase 配置文件
export const CLOUDBASE_CONFIG = {
  // 环境ID - 使用正确的环境ID
  env: 'cloudbase-3g4w6lls8a5ce59b',
  
  // Publishable Key (客户端密钥，可以暴露在浏览器中)
  // 从 CloudBase 控制台 -> 系统配置 -> API Key 配置 获取
  // 格式: JWT 格式的长期有效密钥
  publishableKey: import.meta.env.VITE_CLOUDBASE_PUBLISHABLE_KEY || null,
  
  // 是否启用 API Key 认证（默认关闭，使用匿名登录）
  enableApiKey: import.meta.env.VITE_ENABLE_CLOUDBASE_API_KEY === 'true' || false,
  
  // 是否启用匿名登录（默认开启）
  enableAnonymousAuth: import.meta.env.VITE_ENABLE_ANONYMOUS_AUTH !== 'false',
};

// 获取 CloudBase 初始化配置
export function getCloudBaseConfig() {
  const config = {
    env: CLOUDBASE_CONFIG.env,
    // 添加超时配置
    timeout: 30000,
    // 添加重试配置
    retry: 3,
    // 添加请求配置来处理SSL问题
    request: {
      timeout: 30000,
      retry: 3
    }
  };

  // 优先使用匿名登录，更简单可靠
  console.log('🔐 使用匿名登录进行 CloudBase 认证');
  
  // 如果启用了 API Key 认证且有 Publishable Key，则使用 API Key
  if (CLOUDBASE_CONFIG.enableApiKey && CLOUDBASE_CONFIG.publishableKey) {
    config.accessKey = CLOUDBASE_CONFIG.publishableKey;
    console.log('🔑 同时配置了 Publishable Key，但优先使用匿名登录');
  }

  return config;
}

// 验证配置
export function validateConfig() {
  const errors = [];

  if (!CLOUDBASE_CONFIG.env) {
    errors.push('环境ID (env) 未配置');
  }

  if (CLOUDBASE_CONFIG.enableApiKey && !CLOUDBASE_CONFIG.publishableKey) {
    errors.push('启用了 API Key 认证但未配置 Publishable Key');
  }

  if (errors.length > 0) {
    console.warn('⚠️ CloudBase 配置警告:', errors);
  }

  return errors.length === 0;
}
