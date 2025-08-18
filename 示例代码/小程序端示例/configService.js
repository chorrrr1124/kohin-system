// services/configService.js
class ConfigService {
  constructor() {
    this.cache = new Map();
    this.baseUrl = 'https://your-api-domain.com/api';
    this.isSocketConnected = false;
    this.retryCount = 0;
    this.maxRetries = 3;
  }
  
  // 获取页面配置
  async getPageConfig(pageId, options = {}) {
    const { useCache = true, version = 'latest', forceRefresh = false } = options;
    const cacheKey = `page_${pageId}_${version}`;
    
    // 检查缓存
    if (useCache && !forceRefresh && this.cache.has(cacheKey)) {
      console.log('从缓存获取页面配置:', pageId);
      return this.cache.get(cacheKey);
    }
    
    try {
      console.log('从服务器获取页面配置:', pageId);
      const result = await this.request(`/pages/${pageId}/config`, {
        version: version === 'latest' ? undefined : version
      });
      
      if (result.code === 200) {
        const config = result.data;
        
        // 验证配置格式
        if (this.validateConfig(config)) {
          // 缓存配置
          this.cache.set(cacheKey, config);
          
          // 保存到本地存储作为备份
          this.saveToLocalStorage(cacheKey, config);
          
          return config;
        } else {
          throw new Error('Invalid configuration format');
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('获取页面配置失败:', error);
      
      // 尝试从本地存储获取
      const localConfig = this.getFromLocalStorage(cacheKey);
      if (localConfig) {
        console.log('使用本地备份配置');
        this.cache.set(cacheKey, localConfig);
        return localConfig;
      }
      
      // 返回默认配置
      console.log('使用默认配置');
      return this.getDefaultConfig(pageId);
    }
  }
  
  // 获取主题配置
  async getThemeConfig(themeId) {
    const cacheKey = `theme_${themeId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const result = await this.request(`/themes/${themeId}`);
      if (result.code === 200) {
        this.cache.set(cacheKey, result.data);
        this.saveToLocalStorage(cacheKey, result.data);
        return result.data;
      }
    } catch (error) {
      console.error('获取主题配置失败:', error);
      
      // 尝试从本地存储获取
      const localTheme = this.getFromLocalStorage(cacheKey);
      if (localTheme) {
        return localTheme;
      }
    }
    
    return this.getDefaultTheme();
  }
  
  // 批量获取配置
  async batchGetConfigs(requests) {
    const results = [];
    
    // 并发请求
    const promises = requests.map(async (req) => {
      try {
        if (req.type === 'page') {
          return await this.getPageConfig(req.id, req.options);
        } else if (req.type === 'theme') {
          return await this.getThemeConfig(req.id);
        }
      } catch (error) {
        console.error(`获取${req.type}配置失败:`, req.id, error);
        return null;
      }
    });
    
    const configs = await Promise.all(promises);
    
    configs.forEach((config, index) => {
      results.push({
        ...requests[index],
        config,
        success: !!config
      });
    });
    
    return results;
  }
  
  // 预加载页面配置
  async preloadPageConfigs(pageIds) {
    console.log('预加载页面配置:', pageIds);
    
    const requests = pageIds.map(pageId => ({
      type: 'page',
      id: pageId,
      options: { useCache: true }
    }));
    
    return await this.batchGetConfigs(requests);
  }
  
  // 监听配置更新
  startConfigWatcher() {
    if (this.isSocketConnected) {
      return;
    }
    
    const socketUrl = 'wss://your-websocket-domain.com/config-updates';
    
    wx.connectSocket({
      url: socketUrl,
      success: () => {
        console.log('配置监听器连接成功');
        this.isSocketConnected = true;
        this.retryCount = 0;
      },
      fail: (error) => {
        console.error('配置监听器连接失败:', error);
        this.retryConnection();
      }
    });
    
    wx.onSocketOpen(() => {
      console.log('WebSocket连接已打开');
      this.isSocketConnected = true;
      this.retryCount = 0;
      
      // 发送心跳
      this.startHeartbeat();
    });
    
    wx.onSocketMessage((res) => {
      try {
        const update = JSON.parse(res.data);
        this.handleMessage(update);
      } catch (error) {
        console.error('处理WebSocket消息失败:', error);
      }
    });
    
    wx.onSocketClose(() => {
      console.log('WebSocket连接已关闭');
      this.isSocketConnected = false;
      this.stopHeartbeat();
      this.retryConnection();
    });
    
    wx.onSocketError((error) => {
      console.error('WebSocket连接错误:', error);
      this.isSocketConnected = false;
    });
  }
  
  // 处理WebSocket消息
  handleMessage(message) {
    switch (message.type) {
      case 'config_updated':
        this.handleConfigUpdate(message.data);
        break;
      case 'config_published':
        this.handleConfigPublished(message.data);
        break;
      case 'theme_updated':
        this.handleThemeUpdate(message.data);
        break;
      case 'pong':
        // 心跳响应
        break;
      default:
        console.log('未知消息类型:', message.type);
    }
  }
  
  // 处理配置更新
  handleConfigUpdate(updateData) {
    const { page_id, version } = updateData;
    console.log('收到配置更新通知:', page_id, version);
    
    // 清除相关缓存
    this.clearPageCache(page_id);
    
    // 通知当前页面刷新
    this.notifyPageRefresh(page_id);
  }
  
  // 处理配置发布
  handleConfigPublished(publishData) {
    const { page_id } = publishData;
    console.log('收到配置发布通知:', page_id);
    
    // 强制刷新配置
    this.clearPageCache(page_id);
    this.notifyPageRefresh(page_id, true);
  }
  
  // 处理主题更新
  handleThemeUpdate(themeData) {
    const { theme_id } = themeData;
    console.log('收到主题更新通知:', theme_id);
    
    // 清除主题缓存
    this.clearThemeCache(theme_id);
    
    // 通知所有使用该主题的页面刷新
    this.notifyThemeRefresh(theme_id);
  }
  
  // 重试连接
  retryConnection() {
    if (this.retryCount >= this.maxRetries) {
      console.log('WebSocket重连次数超限，停止重连');
      return;
    }
    
    const delay = Math.pow(2, this.retryCount) * 1000; // 指数退避
    this.retryCount++;
    
    console.log(`${delay}ms后重连WebSocket (第${this.retryCount}次)`);
    
    setTimeout(() => {
      this.startConfigWatcher();
    }, delay);
  }
  
  // 心跳机制
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.isSocketConnected) {
        wx.sendSocketMessage({
          data: JSON.stringify({ type: 'ping' })
        });
      }
    }, 30000); // 30秒心跳
  }
  
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  // 通知页面刷新
  notifyPageRefresh(pageId, force = false) {
    const pages = getCurrentPages();
    pages.forEach(page => {
      if (page.data.pageId === pageId && page.refreshConfig) {
        page.refreshConfig({ force });
      }
    });
    
    // 发送自定义事件
    wx.eventBus && wx.eventBus.emit('config-updated', {
      pageId,
      force,
      timestamp: Date.now()
    });
  }
  
  // 通知主题刷新
  notifyThemeRefresh(themeId) {
    const pages = getCurrentPages();
    pages.forEach(page => {
      if (page.data.themeId === themeId && page.refreshTheme) {
        page.refreshTheme();
      }
    });
    
    wx.eventBus && wx.eventBus.emit('theme-updated', {
      themeId,
      timestamp: Date.now()
    });
  }
  
  // 清除页面缓存
  clearPageCache(pageId) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`page_${pageId}_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.removeFromLocalStorage(key);
    });
  }
  
  // 清除主题缓存
  clearThemeCache(themeId) {
    const key = `theme_${themeId}`;
    this.cache.delete(key);
    this.removeFromLocalStorage(key);
  }
  
  // 本地存储操作
  saveToLocalStorage(key, data) {
    try {
      wx.setStorageSync(`config_${key}`, {
        data,
        timestamp: Date.now(),
        version: '1.0.0'
      });
    } catch (error) {
      console.error('保存到本地存储失败:', error);
    }
  }
  
  getFromLocalStorage(key) {
    try {
      const stored = wx.getStorageSync(`config_${key}`);
      if (stored && stored.data) {
        // 检查是否过期（24小时）
        const age = Date.now() - stored.timestamp;
        if (age < 24 * 60 * 60 * 1000) {
          return stored.data;
        }
      }
    } catch (error) {
      console.error('从本地存储获取失败:', error);
    }
    return null;
  }
  
  removeFromLocalStorage(key) {
    try {
      wx.removeStorageSync(`config_${key}`);
    } catch (error) {
      console.error('从本地存储删除失败:', error);
    }
  }
  
  // 网络请求
  async request(url, params = {}, options = {}) {
    const { timeout = 10000, retries = 2 } = options;
    
    for (let i = 0; i <= retries; i++) {
      try {
        return await new Promise((resolve, reject) => {
          const requestTask = wx.request({
            url: `${this.baseUrl}${url}`,
            data: params,
            method: 'GET',
            timeout,
            header: {
              'content-type': 'application/json',
              'x-client-version': wx.getAccountInfoSync().miniProgram.version || '1.0.0'
            },
            success: (res) => {
              if (res.statusCode === 200) {
                resolve(res.data);
              } else {
                reject(new Error(`HTTP ${res.statusCode}: ${res.data?.message || 'Request failed'}`));
              }
            },
            fail: (error) => {
              reject(new Error(`Network error: ${error.errMsg}`));
            }
          });
          
          // 设置超时
          setTimeout(() => {
            requestTask.abort();
            reject(new Error('Request timeout'));
          }, timeout);
        });
      } catch (error) {
        if (i === retries) {
          throw error;
        }
        console.log(`请求失败，第${i + 1}次重试:`, error.message);
        await this.delay(1000 * (i + 1));
      }
    }
  }
  
  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // 验证配置格式
  validateConfig(config) {
    if (!config || typeof config !== 'object') {
      return false;
    }
    
    if (!config.config || !config.config.components || !Array.isArray(config.config.components)) {
      return false;
    }
    
    return config.config.components.every(component => {
      return component.id && 
             component.type && 
             component.position &&
             typeof component.position.x === 'number' &&
             typeof component.position.y === 'number';
    });
  }
  
  // 获取默认配置
  getDefaultConfig(pageId) {
    const defaultConfigs = {
      'pages/index/index': {
        page_id: pageId,
        config: {
          type: 'vertical',
          components: [
            {
              id: 'default_banner',
              type: 'banner',
              position: { x: 0, y: 0, width: 375, height: 200 },
              config: {
                images: ['/images/default-banner.jpg'],
                autoplay: true,
                duration: 3000,
                indicatorDots: true
              },
              style: {
                borderRadius: '8rpx'
              }
            },
            {
              id: 'default_text',
              type: 'text',
              position: { x: 20, y: 220, width: 335, height: 60 },
              config: {
                content: '欢迎来到丘大叔茶饮',
                textAlign: 'center'
              },
              style: {
                fontSize: '36rpx',
                fontWeight: 'bold',
                color: '#333333'
              }
            }
          ]
        },
        theme_id: 'default_theme',
        version: '1.0.0'
      },
      'pages/products/products': {
        page_id: pageId,
        config: {
          type: 'vertical',
          components: [
            {
              id: 'product_grid_default',
              type: 'product_grid',
              position: { x: 0, y: 0, width: 375, height: 600 },
              config: {
                columns: 2,
                showPrice: true,
                showStock: false,
                products: []
              }
            }
          ]
        },
        theme_id: 'default_theme',
        version: '1.0.0'
      }
    };
    
    return defaultConfigs[pageId] || {
      page_id: pageId,
      config: { type: 'vertical', components: [] },
      theme_id: 'default_theme',
      version: '1.0.0'
    };
  }
  
  // 获取默认主题
  getDefaultTheme() {
    return {
      theme_id: 'default_theme',
      config: {
        colors: {
          primary: '#4CAF50',
          secondary: '#2196F3',
          success: '#4CAF50',
          warning: '#FF9800',
          error: '#F44336',
          text_primary: '#333333',
          text_secondary: '#666666',
          background: '#FFFFFF',
          border: '#E0E0E0'
        },
        fonts: {
          primary: 'PingFang SC',
          sizes: {
            xs: '24rpx',
            sm: '28rpx',
            md: '32rpx',
            lg: '36rpx',
            xl: '40rpx'
          }
        },
        spacing: {
          xs: '8rpx',
          sm: '16rpx',
          md: '24rpx',
          lg: '32rpx',
          xl: '48rpx'
        },
        border_radius: {
          sm: '4rpx',
          md: '8rpx',
          lg: '12rpx',
          xl: '16rpx'
        }
      }
    };
  }
  
  // 清除所有缓存
  clearAllCache() {
    this.cache.clear();
    
    // 清除本地存储
    try {
      const storageInfo = wx.getStorageInfoSync();
      const configKeys = storageInfo.keys.filter(key => key.startsWith('config_'));
      configKeys.forEach(key => {
        wx.removeStorageSync(key);
      });
    } catch (error) {
      console.error('清除本地存储缓存失败:', error);
    }
  }
  
  // 获取缓存统计
  getCacheStats() {
    const stats = {
      memory_cache_size: this.cache.size,
      local_storage_keys: 0
    };
    
    try {
      const storageInfo = wx.getStorageInfoSync();
      stats.local_storage_keys = storageInfo.keys.filter(key => key.startsWith('config_')).length;
    } catch (error) {
      console.error('获取本地存储统计失败:', error);
    }
    
    return stats;
  }
}

module.exports = new ConfigService(); 