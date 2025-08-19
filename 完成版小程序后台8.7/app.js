App({
  globalData: {
    userInfo: null,
    products: [],
    records: [],
    orders: [],
    shopProducts: [],
    customers: [],
    prepaidRecords: [],
    // 添加标志位跟踪初始化状态
    isInitialized: false,
    ordersDbOptimized: false,
    ordersIntegrityChecked: false,
    // 🚀 性能优化：缓存管理
    cache: {
      products: { data: null, timestamp: 0, duration: 30000 }, // 30秒缓存
      customers: { data: null, timestamp: 0, duration: 60000 }, // 1分钟缓存
      orders: { data: null, timestamp: 0, duration: 10000 }, // 10秒缓存
      records: { data: null, timestamp: 0, duration: 30000 } // 30秒缓存
    },
    // 请求去重管理
    requestQueue: {},
    eventBus: {
      events: {},
      emit: function(eventName, data) {
        if (this.events[eventName]) {
          this.events[eventName].forEach(callback => {
            callback(data);
          });
        }
      },
      on: function(eventName, callback) {
        if (!this.events[eventName]) {
          this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
      },
      off: function(eventName, callback) {
        if (this.events[eventName]) {
          if (callback) {
            this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
          } else {
            delete this.events[eventName];
          }
        }
      }
    },
    // 云开发可用状态
    cloudAvailable: false
  },
  onLaunch: function() {
    // 检测网络状态
    this.checkNetworkAndInitCloud();
  },

  // 🌐 网络检测和云开发初始化
  checkNetworkAndInitCloud: function() {
    // 检查网络状态
    wx.getNetworkType({
      success: (res) => {
        console.log('网络类型:', res.networkType);
        if (res.networkType === 'none') {
          console.warn('无网络连接，启用离线模式');
          this.initOfflineMode();
          return;
        }
        // 有网络连接，尝试初始化云开发
        this.initCloudWithRetry();
      },
      fail: () => {
        console.warn('无法获取网络状态，尝试初始化云开发');
        this.initCloudWithRetry();
      }
    });
  },

  // 🔄 重试机制初始化云开发
  initCloudWithRetry: function(retryCount = 0) {
    const maxRetries = 3;
    const retryDelay = [1000, 3000, 5000]; // 递增延迟

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      this.initOfflineMode();
      return;
    }

    console.log(`尝试初始化云开发 (第${retryCount + 1}次)`);

    try {
      wx.cloud.init({
        env: 'cloudbase-3g4w6lls8a5ce59b',
        traceUser: true,
      });
      
      // 测试云开发连接
      this.testCloudConnection().then(() => {
        console.log('云开发初始化成功');
        this.globalData.cloudAvailable = true;
        this.initializeWithCloud();
      }).catch((error) => {
        console.error('云开发连接测试失败:', error);
        this.handleCloudInitError(retryCount, maxRetries, retryDelay);
      });

    } catch (error) {
      console.error('云开发初始化异常:', error);
      this.handleCloudInitError(retryCount, maxRetries, retryDelay);
    }
  },

  // 🧪 测试云开发连接
  testCloudConnection: function() {
    return new Promise((resolve, reject) => {
      // 简单的云开发连接测试
      const db = wx.cloud.database();
      const timeout = setTimeout(() => {
        reject(new Error('连接超时'));
      }, 5000); // 5秒超时

      db.collection('products').limit(1).get({
        success: () => {
          clearTimeout(timeout);
          resolve();
        },
        fail: (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      });
    });
  },

  // ⚠️ 处理云开发初始化错误
  handleCloudInitError: function(retryCount, maxRetries, retryDelay) {
    if (retryCount < maxRetries) {
      const delay = retryDelay[retryCount];
      console.log(`${delay}ms 后重试云开发初始化`);
      setTimeout(() => {
        this.initCloudWithRetry(retryCount + 1);
      }, delay);
    } else {
      console.warn('云开发初始化失败，启用离线模式');
      this.globalData.cloudAvailable = false;
      this.initOfflineMode();
    }
  },

  // 🔄 云开发可用时的初始化
  initializeWithCloud: function() {
      if (this.globalData.isInitialized) {
        console.log('应用已初始化，跳过重复操作');
        return;
      }
      
      this.globalData.isInitialized = true;
      
    // 也要监听网络状态变化
    this.startNetworkMonitoring();
    
      this.ensureCollectionsExist();
    console.log('应用启动完成，云开发已就绪');
  },

  // 📱 离线模式初始化
  initOfflineMode: function() {
    console.log('启动离线模式');
    this.globalData.cloudAvailable = false;
    this.globalData.isInitialized = true;
    
    // 显示离线提示
    wx.showToast({
      title: '当前为离线模式',
      icon: 'none',
      duration: 3000
    });
    
    // 启动网络状态监听
    this.startNetworkMonitoring();
    
    console.log('离线模式启动完成，数据将从本地存储读取');
  },

  // 🌐 开始网络状态监听
  startNetworkMonitoring: function() {
    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      console.log('网络状态变化:', res);
      
      if (res.isConnected && !this.globalData.cloudAvailable) {
        console.log('网络已恢复，尝试重新初始化云开发');
        wx.showToast({
          title: '网络已恢复',
          icon: 'success',
          duration: 2000
        });
        
        // 延迟一秒后尝试重新初始化云开发
        setTimeout(() => {
          this.retryCloudInit();
        }, 1000);
      } else if (!res.isConnected && this.globalData.cloudAvailable) {
        console.log('网络连接丢失');
        this.globalData.cloudAvailable = false;
        wx.showToast({
          title: '网络连接丢失',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 🔄 重试云开发初始化
  retryCloudInit: function() {
    if (this.globalData.cloudAvailable) {
      return; // 已经可用，无需重试
    }
    
    this.testCloudConnection().then(() => {
      console.log('云开发连接恢复成功');
      this.globalData.cloudAvailable = true;
      
      // 清除缓存，强制刷新数据
      this.clearAllCache();
      
      wx.showToast({
        title: '已恢复云端同步',
        icon: 'success',
        duration: 2000
      });
    }).catch((error) => {
      console.log('云开发连接仍未恢复:', error);
    });
  },

  // 🗑️ 清除所有缓存
  clearAllCache: function() {
    const types = ['products', 'customers', 'orders', 'records'];
    types.forEach(type => {
      this.globalData.cache[type] = {
        data: null,
        timestamp: 0,
        duration: this.globalData.cache[type].duration
      };
    });
    console.log('已清除所有缓存');
  },

  // 🌐 检测是否为网络错误
  isNetworkError: function(error) {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString() || '';
    const errorCode = error.errCode || error.code;
    
    // 检查常见的网络错误标识
    const networkErrorIndicators = [
      'Failed to fetch',
      'Network Error',
      'fetch fail',
      'connectTimeOut',
      'timeout',
      'NETWORK_ERROR',
      'INTERNET_DISCONNECTED',
      'CONNECTION_FAIL'
    ];
    
    // 检查错误码
    const networkErrorCodes = [
      -1,      // 系统错误
      600001,  // 网络错误
      600002,  // 网络超时
      600003,  // 网络中断
    ];
    
    return networkErrorIndicators.some(indicator => 
      errorMessage.toLowerCase().includes(indicator.toLowerCase())
    ) || networkErrorCodes.includes(errorCode);
  },

  // 🚀 智能缓存数据加载方法
  getCachedData: function(type, forceRefresh = false) {
    const cache = this.globalData.cache[type];
    const now = Date.now();
    
    // 如果云开发不可用，直接使用本地数据
    if (!this.globalData.cloudAvailable) {
      console.log(`云开发不可用，从本地存储加载${type}数据`);
      return this.loadDataFromLocal(type);
    }
    
    // 检查缓存是否有效
    if (!forceRefresh && cache.data && (now - cache.timestamp < cache.duration)) {
      console.log(`使用${type}缓存数据，还有${Math.round((cache.duration - (now - cache.timestamp)) / 1000)}秒过期`);
      return Promise.resolve(cache.data);
    }
    
    // 检查是否已有相同请求在进行中
    if (this.globalData.requestQueue[type]) {
      console.log(`${type}数据请求已在队列中，等待结果`);
      return this.globalData.requestQueue[type];
    }
    
    // 创建新的请求
    const promise = this.loadDataFromCloud(type);
    this.globalData.requestQueue[type] = promise;
    
    promise.finally(() => {
      // 请求完成后移除队列
      delete this.globalData.requestQueue[type];
    });
    
    return promise;
  },

  // 📱 从本地存储加载数据
  loadDataFromLocal: function(type) {
    return new Promise((resolve) => {
      try {
        const localData = wx.getStorageSync(type) || [];
        console.log(`从本地存储恢复${type}数据：${localData.length}条`);
        
        // 更新全局数据
        this.globalData[type] = localData;
        
        // 更新缓存（设置较短的过期时间，以便网络恢复后及时刷新）
        this.globalData.cache[type] = {
          data: localData,
          timestamp: Date.now(),
          duration: 30000 // 30秒后过期，便于网络恢复时刷新
        };
        
        resolve(localData);
      } catch (error) {
        console.error(`从本地存储加载${type}数据失败：`, error);
        resolve([]);
      }
    });
  },

  // 🚀 优化的云数据加载方法
  loadDataFromCloud: function(type) {
    const db = wx.cloud.database();
    let query;
    let limit = 100; // 默认限制
    
    switch (type) {
      case 'products':
        query = db.collection('products');
        limit = 200;
        break;
      case 'customers':
        query = db.collection('customers');
        limit = 300;
        break;
      case 'orders':
        // 加载所有订单，不限制日期
        query = db.collection('orders');
        limit = 500;
        break;
      case 'records':
        // 只加载最近7天的记录
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query = db.collection('records').where({
          createTime: db.command.gte(sevenDaysAgo)
        });
        limit = 200;
        break;
      default:
        return Promise.reject(new Error('未知的数据类型'));
    }
    
    console.log(`开始加载${type}数据，限制${limit}条`);
    
    // 对于orders，尝试多种排序方式
    let queryPromise;
    if (type === 'orders') {
      // 先尝试按createTime排序
      queryPromise = query.limit(limit).orderBy('createTime', 'desc').get().catch(err => {
        console.warn('按createTime排序失败，尝试按date排序:', err);
        // 如果失败，尝试按date排序
        return query.limit(limit).orderBy('date', 'desc').get().catch(err => {
          console.warn('按date排序也失败，获取无排序数据:', err);
          // 如果还是失败，直接获取数据
          return query.limit(limit).get();
        });
      });
    } else {
      queryPromise = query.limit(limit).orderBy('createTime', 'desc').get();
    }
    
    return queryPromise.then(res => {
      const data = res.data || [];
      console.log(`加载${type}数据成功：${data.length}条`);
      
      // 更新缓存
      this.globalData.cache[type] = {
        data: data,
        timestamp: Date.now(),
        duration: this.globalData.cache[type].duration
      };
      
      // 更新全局数据
      this.globalData[type] = data;
      
      // 保存到本地存储
      wx.setStorageSync(type, data);
      
      return data;
    }).catch(err => {
      console.error(`加载${type}数据失败：`, err);
      
      // 检查是否为网络错误
      if (this.isNetworkError(err)) {
        console.warn('检测到网络错误，标记云开发为不可用');
        this.globalData.cloudAvailable = false;
        
        wx.showToast({
          title: '网络连接异常',
          icon: 'none',
          duration: 2000
        });
      }
      
      // 尝试从本地存储恢复
      const localData = wx.getStorageSync(type) || [];
      if (localData.length > 0) {
        console.log(`从本地存储恢复${type}数据：${localData.length}条`);
        this.globalData[type] = localData;
        
        // 更新缓存为本地数据
        this.globalData.cache[type] = {
          data: localData,
          timestamp: Date.now(),
          duration: 30000 // 30秒后过期
        };
        
        return localData;
      }
      
      throw err;
    });
  },

  // 🚀 清除缓存方法
  clearCache: function(type) {
    if (type) {
      this.globalData.cache[type] = { data: null, timestamp: 0, duration: this.globalData.cache[type].duration };
    } else {
      // 清除所有缓存
      Object.keys(this.globalData.cache).forEach(key => {
        this.globalData.cache[key].data = null;
        this.globalData.cache[key].timestamp = 0;
      });
    }
  },

  // 创建必要的集合
  createCollections: function() {
    // 注意：客户端SDK不支持直接创建集合
    // 集合会在第一次使用时自动创建
    console.log('集合将在首次使用时自动创建');
    
    // 检查集合是否存在
    const db = wx.cloud.database();
    
    // 尝试查询products集合
    db.collection('products').count().then(res => {
      console.log('products集合已存在，记录数：', res.total);
    }).catch(err => {
      console.error('查询products集合失败：', err);
    });
    
    // 尝试查询records集合
    db.collection('records').count().then(res => {
      console.log('records集合已存在，记录数：', res.total);
    }).catch(err => {
      console.error('查询records集合失败：', err);
    });
    
    // 尝试查询orders集合
    db.collection('orders').count().then(res => {
      console.log('orders集合已存在，记录数：', res.total);
    }).catch(err => {
      console.error('查询orders集合失败：', err);
    });
    
    // 尝试查询shopProducts集合
    db.collection('shopProducts').count().then(res => {
      console.log('shopProducts集合已存在，记录数：', res.total);
    }).catch(err => {
      console.error('查询shopProducts集合失败：', err);
      // 如果集合不存在，调用云函数初始化shopProducts集合
      this.initShopProductsCollection();
    });
    
    // 尝试查询prepaidRecords集合
    db.collection('prepaidRecords').count().then(res => {
      console.log('prepaidRecords集合已存在，记录数：', res.total);
      // 加载预存记录数据
      this.loadPrepaidRecordsFromCloud();
    }).catch(err => {
      console.error('查询prepaidRecords集合失败：', err);
      // 如果集合不存在，尝试创建
      this.createExampleRecord(db, 'prepaidRecords');
    });
  },
  
  // 初始化商城产品集合
  initShopProductsCollection: function() {
    console.log('正在初始化shopProducts集合...');
    wx.cloud.callFunction({
      name: 'initShopProducts',
      success: res => {
        console.log('初始化shopProducts集合成功：', res.result);
      },
      fail: err => {
        console.error('初始化shopProducts集合失败：', err);
      }
    });
  },

  // 从云数据库加载产品数据
  loadProductsFromCloud: function() {
    const db = wx.cloud.database();
    
    console.log('开始从云数据库加载产品数据...');
    
    // 加载基础产品数据
    db.collection('products').get({
      success: res => {
        console.log('成功加载products集合数据:', res.data.length + '条记录');
        this.globalData.products = res.data;
        // 同时更新本地存储
        wx.setStorageSync('products', res.data);
      },
      fail: err => {
        console.error('加载products集合数据失败：', err);
        // 如果云数据库加载失败，尝试从本地存储加载
        const products = wx.getStorageSync('products') || [];
        this.globalData.products = products;
      }
    });
    
    // 加载商城产品数据
    db.collection('shopProducts').get({
      success: res => {
        console.log('成功加载shopProducts集合数据:', res.data.length + '条记录');
        this.globalData.shopProducts = res.data;
        // 同时更新本地存储
        wx.setStorageSync('shopProducts', res.data);
      },
      fail: err => {
        console.error('加载shopProducts集合数据失败：', err);
        if (err.errCode === -502005) { // DATABASE_COLLECTION_NOT_EXIST
          console.log('shopProducts集合不存在，尝试初始化...');
          this.initShopProductsCollection();
        }
        // 如果云数据库加载失败，尝试从本地存储加载
        const shopProducts = wx.getStorageSync('shopProducts') || [];
        this.globalData.shopProducts = shopProducts;
      }
    });
  },

  // 添加同步库存的方法
  syncInventory: function(productId, newStock) {
    if (!productId) {
      console.error('同步库存失败：无效的产品ID');
      wx.showToast({
        title: '同步库存失败：无效的产品ID',
        icon: 'none'
      });
      return;
    }
    
    // 增加对productId类型的检查
    if (typeof productId !== 'string' && typeof productId !== 'number') {
      console.error(`同步库存失败：产品ID类型无效 [${typeof productId}]`);
      wx.showToast({
        title: '同步库存失败：产品ID类型无效',
        icon: 'none'
      });
      return;
    }
    
    // 确保newStock是有效的数字
    if (isNaN(newStock) || newStock < 0) {
      console.error(`同步库存失败：无效的库存数量 [${newStock}]`);
      wx.showToast({
        title: '同步库存失败：无效的库存数量',
        icon: 'none'
      });
      return;
    }
    
    console.log(`开始同步库存，商品ID: [${productId}]，新库存: [${newStock}]`);
    
    const db = wx.cloud.database();
    const _ = db.command;
    
    // 构建查询条件，匹配任意可能的ID格式
    let condition;
    
    // 检查是否是MongoDB ObjectId格式（24位十六进制字符）
    if (typeof productId === 'string' && /^[0-9a-f]{24}$/i.test(productId)) {
      console.log(`检测到MongoDB ObjectId格式: [${productId}]`);
      condition = _.or([
        { _id: productId },
        { id: productId }
      ]);
    } else {
      // 其他格式的ID
      condition = _.or([
        { id: productId },
        { _id: productId }
      ]);
    }
    
    // 第一步：更新products集合
    db.collection('products').where(condition).get().then(res => {
      if (!res.data || res.data.length === 0) {
        console.error(`未找到产品记录，ID: [${productId}]`);
        wx.showToast({
          title: '未找到产品记录',
          icon: 'none'
        });
        return;
      }
      
      const product = res.data[0];
      console.log(`找到产品: [${product.name}]，当前库存: [${product.stock}]，数据库ID: [${product._id}]`);
      
      // 更新products集合
      db.collection('products').where(condition).update({
        data: {
          stock: newStock
        },
        success: res => {
          if (res.stats.updated > 0) {
            console.log(`产品库存更新成功，ID: [${productId}]，新库存: [${newStock}]，更新了${res.stats.updated}条记录`);
          } else {
            console.warn(`未找到要更新的产品记录，ID: [${productId}]`);
          }
          
          // 第二步：更新shopProducts集合
          db.collection('shopProducts').where(condition).update({
            data: {
              stock: newStock
            },
            success: shopRes => {
              if (shopRes.stats.updated > 0) {
                console.log(`商城产品库存更新成功，ID: [${productId}]，新库存: [${newStock}]，更新了${shopRes.stats.updated}条记录`);
              } else {
                console.warn(`未找到要更新的商城产品记录，ID: [${productId}]`);
                
                // 尝试查找商品详细信息，用于后续处理
                db.collection('products').where(condition).get().then(findRes => {
                  if (findRes.data && findRes.data.length > 0) {
                    const product = findRes.data[0];
                    console.log(`找到产品: [${product.name}]，但未找到对应的商城产品`);
                    
                    // 尝试在shopProducts中查找同名商品
                    db.collection('shopProducts').where({
                      name: product.name
                    }).get().then(nameRes => {
                      if (nameRes.data && nameRes.data.length > 0) {
                        const shopProduct = nameRes.data[0];
                        console.log(`通过名称在商城中找到产品: [${shopProduct.name}]，更新其库存`);
                        
                        db.collection('shopProducts').doc(shopProduct._id).update({
                          data: { stock: newStock },
                          success: () => console.log(`成功更新商城产品 [${shopProduct.name}] 的库存为 ${newStock}`),
                          fail: err => console.error(`更新商城产品库存失败: ${err.message || err}`)
                        });
                      } else {
                        console.log(`在商城中未找到同名产品 [${product.name}]`);
                      }
                    });
                  }
                });
              }
              
              // 不管如何，都重新加载产品数据到全局状态
              this.loadProductsFromCloud();
              
              // 发送通知，告知页面刷新数据（仅在有实际更新时）
              if (res.stats.updated > 0 || shopRes.stats.updated > 0) {
                wx.showToast({
                  title: '库存已更新',
                  icon: 'success',
                  duration: 1000
                });
              }
            },
            fail: err => {
              console.error(`同步商城产品库存失败: ${err.message || err}`);
              wx.showToast({
                title: '同步商城库存失败',
                icon: 'none'
              });
            }
          });
        },
        fail: err => {
          console.error(`同步产品库存失败: ${err.message || err}`);
          wx.showToast({
            title: '同步产品库存失败',
            icon: 'none'
          });
        }
      });
    }).catch(err => {
      console.error(`查找产品失败: ${err.message || err}`);
      wx.showToast({
        title: '查找产品失败',
        icon: 'none'
      });
    });
  },

  // 从云数据库加载记录数据
  loadRecordsFromCloud: function() {
    const db = wx.cloud.database()
    db.collection('records').get({
      success: res => {
        this.globalData.records = res.data
        // 同时更新本地存储
        wx.setStorageSync('records', res.data)
      },
      fail: err => {
        console.error('加载记录数据失败：', err)
        // 如果云数据库加载失败，尝试从本地存储加载
        const records = wx.getStorageSync('records') || []
        this.globalData.records = records
      }
    })
  },
  
  // 从云数据库加载订单数据
  loadOrdersFromCloud: function() {
    const db = wx.cloud.database();
    const _ = db.command;
    
    console.log('开始从云数据库加载订单数据...');
    
    // 尝试按createTime排序方式获取数据
    db.collection('orders')
      .orderBy('createTime', 'desc')
      .limit(200)
      .get()
      .then(res => {
        console.log('按createTime排序加载订单成功:', res.data.length, '条记录');
        processOrders(res.data);
      })
      .catch(err => {
        console.warn('按createTime排序加载失败，尝试按date排序:', err);
        // 如果失败，尝试按date排序
        db.collection('orders')
          .orderBy('date', 'desc')
          .limit(200)
          .get()
          .then(res => {
            console.log('按date排序加载订单成功:', res.data.length, '条记录');
            processOrders(res.data);
          })
          .catch(err => {
            console.error('所有排序方式都失败，尝试不排序获取:', err);
            // 如果仍然失败，尝试不排序获取
            db.collection('orders')
              .limit(200)
              .get()
              .then(res => {
                console.log('无排序加载订单成功:', res.data.length, '条记录');
                processOrders(res.data);
              })
              .catch(err => {
                console.error('加载订单数据全部失败:', err);
                // 如果云数据库加载失败，尝试从本地存储加载
                const orders = wx.getStorageSync('orders') || [];
                this.globalData.orders = orders;
              });
          });
      });
      
    // 处理订单数据
    const processOrders = (orders) => {
      // 确保所有订单有createTime字段，并收集需要更新的订单
      const ordersToUpdate = [];
      
      orders = orders.map(order => {
        if (!order.createTime) {
          // 使用日期字段或当前时间创建createTime
          order.createTime = order.date ? new Date(order.date).toISOString() : new Date().toISOString();
          
          // 将需要更新的订单添加到列表
          if (order._id) {
            ordersToUpdate.push({
              id: order._id,
              createTime: order.createTime
            });
          }
        }
        return order;
      });
      
      // 确保订单按最新时间排序
      orders.sort((a, b) => {
        // 如果有createTime，优先使用
        if (a.createTime && b.createTime) {
          return new Date(b.createTime) - new Date(a.createTime);
        }
        // 其次使用日期字段
        return new Date(b.date) - new Date(a.date);
      });
      
      console.log('排序后第一个订单日期:', orders.length > 0 ? orders[0].date : '无订单');
      console.log('排序后最后一个订单日期:', orders.length > 0 ? orders[orders.length-1].date : '无订单');
      
      // 更新全局数据和本地存储
      this.globalData.orders = orders;
      wx.setStorageSync('orders', orders);
      
      // 批量更新没有createTime字段的订单
      if (ordersToUpdate.length > 0) {
        console.log(`需要更新${ordersToUpdate.length}个订单的createTime字段`);
        
        // 使用本地方法更新订单，而不是调用云函数
        this.batchUpdateOrders(ordersToUpdate);
      }
    }
  },
  
  // 保存订单数据
  saveOrder: function(orderData) {
    // 生成订单ID
    const timestamp = new Date().getTime();
    const randomNum = Math.floor(Math.random() * 1000);
    const orderId = 'ORD' + timestamp.toString().slice(-8) + randomNum;
    
    // 获取北京时间（UTC+8）
    const now = new Date();
    // 中国时区偏移量：8小时
    const utc8Offset = 8 * 60 * 60 * 1000;
    const beijingTime = new Date(now.getTime() + utc8Offset);
    
    // 格式化为YYYY-MM-DD
    const beijingDateStr = beijingTime.toISOString().split('T')[0];
    
    console.log("系统当前时间:", now.toString());
    console.log("转换后北京日期:", beijingDateStr);
    
    // 创建完整的订单对象
    const order = Object.assign({
      id: orderId,
      date: beijingDateStr, // 使用北京时间日期
      status: this.getInitialOrderStatus(orderData), // 根据支付方式确定初始状态
      createTime: beijingTime.toISOString() // 使用北京时间的ISO格式
    }, orderData);
    
    // 确保订单项中的商品ID有效
    if (order.items && order.items.length > 0) {
      order.items = order.items.map(item => {
        // 添加客户信息到每个商品项
        item.customerInfo = order.customer || '未知客户';
        item.orderId = orderId;
        
        // 如果有_id字段，优先使用它
        if (item._id) {
          return Object.assign({}, item, {
            validId: item._id // 使用数据库_id作为有效ID
          });
        } else {
          return Object.assign({}, item, {
            validId: item.id // 否则使用自定义id
          });
        }
      });
    }
    
    // 添加到全局订单数据
    const orders = this.globalData.orders || [];
    orders.unshift(order); // 添加到订单列表开头
    this.globalData.orders = orders;
    
    // 更新本地存储
    wx.setStorageSync('orders', orders);
    
    // 如果使用云数据库，还应该同步到云端
    const db = wx.cloud.database();
    db.collection('orders').add({
      data: order,
      success: res => {
        console.log('订单保存成功', res)
        
        // 更新订单在全局数据中的云端ID
        const orders = this.globalData.orders || [];
        const orderIndex = orders.findIndex(o => o.id === order.id);
        if (orderIndex !== -1) {
          orders[orderIndex]._id = res._id;
          this.globalData.orders = orders;
          wx.setStorageSync('orders', orders);
          console.log('订单云端ID已更新:', res._id);
        }
        
        // 尝试刷新订单页面
        const pages = getCurrentPages();
        const ordersPage = pages.find(p => p.route === 'pages/orders/orders');
        if (ordersPage && ordersPage.manualRefresh) {
          console.log('找到订单页面，刷新数据');
          setTimeout(() => {
            ordersPage.manualRefresh();
          }, 500);
        }
        
        // 如果是预存产品订单且状态变为已完成，调用云函数扣减预存产品数量
        // 注意：预存扣除的订单初始状态是pending_shipment，需要在从shipped变为completed时扣减
        if (order.isPrepaidProduct && order.customerId && order.status === 'completed') {
          console.log('检测到预存产品订单完成，准备扣减预存产品数量');
          
          // 提取收货人信息
          const receiverInfo = {
            receiver: order.address && order.address.name ? order.address.name : order.customer,
            phone: order.address && order.address.phone ? order.address.phone : order.customerPhone,
            address: order.address && order.address.detail ? order.address.detail : '暂无地址'
          };
          
          console.log('收货人信息:', receiverInfo);
          
          wx.cloud.callFunction({
            name: 'updatePrepaidProduct',
            data: {
              customerId: order.customerId,
              productName: order.items[0].name,
              quantity: order.items[0].quantity,
              orderId: res._id,
              receiver: receiverInfo.receiver,
              phone: receiverInfo.phone,
              address: receiverInfo.address
            },
            success: prepaidRes => {
              console.log('预存产品数量扣减成功:', prepaidRes);
            },
            fail: prepaidErr => {
              console.error('预存产品数量扣减失败:', prepaidErr);
              // 即使扣减失败，也继续处理订单
            }
          });
        }
        
        // 检查是否需要跳过库存扣减
        if (order.skipInventoryDeduction) {
          console.log('订单标记为跳过库存扣减，不更新库存');
        } else {
          // 扣减库存
          this.updateStockForOrder(order.items);
        }
      },
      fail: err => {
        console.error('订单保存失败：', err)
      }
    });
    
    // 返回订单ID
    return orderId;
  },
  
  // 为订单中的商品扣减库存
  updateStockForOrder: function(orderItems) {
    if (!orderItems || orderItems.length === 0) {
      console.log('订单中没有商品，无需更新库存');
      return;
    }
    
    console.log('开始更新订单商品库存，共', orderItems.length, '个商品');
    
    const db = wx.cloud.database();
    const _ = db.command;
    
    // 遍历订单中的每个商品，更新库存
    orderItems.forEach(item => {
      // 检查商品是否有有效ID
      if (!item.id && !item._id && !item.validId) {
        console.error('商品没有有效ID，无法更新库存:', item.name);
        return; // 跳过此商品
      }
      
      // 获取有效ID，优先使用validId，然后是_id，最后是id
      const itemId = item.validId || item._id || item.id;
      
      // 输出详细日志
      console.log(`正在处理商品库存更新，商品:[${item.name}]，ID:[${itemId}]，数量:[${item.quantity}]`);
      
      // 构建查询条件，尝试多种ID匹配
      const condition = _.or([
        { id: itemId },
        { _id: itemId }
      ]);
      
      if (item.id && item.id !== itemId) {
        condition.push({ id: item.id });
      }
      
      if (item._id && item._id !== itemId) {
        condition.push({ _id: item._id });
      }
      
      // 获取当前产品的最新库存数据
      db.collection('products').where(condition).get().then(res => {
        if (res.data && res.data.length > 0) {
          const product = res.data[0];
          console.log(`找到商品: [${product.name}]，当前库存: [${product.stock}]，数据库ID: [${product._id}]`);
          
          const newStock = Math.max(0, product.stock - item.quantity);
          if (product.stock < item.quantity) {
            console.warn(`警告: 商品 [${product.name}] 库存不足，当前: [${product.stock}]，需要: [${item.quantity}]`);
          }
          
          // 记录实际产品ID，优先使用数据库自动生成的_id
          const actualProductId = product._id || product.id;
          
          // 使用同步库存方法更新所有相关集合
          this.syncInventory(actualProductId, newStock);
          
          // 添加出库记录
          db.collection('records').add({
            data: {
              productId: actualProductId,
              productName: product.name, // 使用找到的商品名称，避免不一致
              quantity: item.quantity,
              type: 'out',
              createTime: db.serverDate(), // 使用服务器时间戳
              orderId: item.orderId || '', // 关联订单ID
              orderNote: '商城订单出库',
              customerInfo: item.customerInfo || '' // 客户信息
            },
            success: res => {
              console.log('出库记录添加成功', res);
            },
            fail: err => {
              console.error('出库记录添加失败：', err);
            }
          });
        } else {
          console.error(`未找到商品，ID: [${itemId}]，名称: [${item.name}]`);
          
          // 尝试用名称查找商品
          if (item.name) {
            console.log(`尝试通过名称查找商品: [${item.name}]`);
            db.collection('products').where({
              name: item.name
            }).get().then(nameRes => {
              if (nameRes.data && nameRes.data.length > 0) {
                const productByName = nameRes.data[0];
                console.log(`通过名称找到商品: [${productByName.name}]，ID: [${productByName._id || productByName.id}]`);
                
                const newStock = Math.max(0, productByName.stock - item.quantity);
                const actualProductId = productByName._id || productByName.id;
                
                // 使用同步库存方法更新所有相关集合
                this.syncInventory(actualProductId, newStock);
              } else {
                console.error(`通过名称[${item.name}]也未找到商品`);
              }
            }).catch(nameErr => {
              console.error('通过名称查找商品失败', nameErr);
            });
          }
        }
      }).catch(err => {
        console.error('获取产品数据失败', err);
      });
    });
  },

  // 确保重要集合存在
  ensureCollectionsExist: function() {
    console.log('确保重要集合存在...');
    
    wx.cloud.callFunction({
      name: 'createCollection',
      data: {
        collections: ['products', 'records', 'orders', 'shopProducts', 'customers', 'prepaidRecords']
      },
      success: res => {
        console.log('集合检查和创建结果:', res.result);
      },
      fail: err => {
        console.error('集合检查和创建失败:', err);
      }
    });
  },
  
  // 检查并创建集合
  checkAndCreateCollection: function(collectionName, db) {
    db.collection(collectionName).count()
      .then(res => {
        console.log(`集合 ${collectionName} 已存在，包含 ${res.total} 条记录`);
      })
      .catch(err => {
        console.log(`检测到集合 ${collectionName} 不存在，尝试创建...`);
        
        // 创建示例记录，以初始化集合
        if (collectionName === 'records') {
          this.createExampleRecord(db, collectionName);
        } else {
          console.log(`集合 ${collectionName} 将在首次使用时自动创建`);
        }
      });
  },
  
  // 创建示例记录，用于初始化集合
  createExampleRecord: function(db, collectionName) {
    let record = {};
    
    if (collectionName === 'records') {
      record = {
        productName: '示例产品',
        quantity: 1,
        type: 'in',
        createTime: db.serverDate(),
        orderNote: '系统自动创建的示例记录',
        _isSystemCreated: true // 标记系统创建的示例记录
      };
    } else if (collectionName === 'prepaidRecords') {
      record = {
        customerName: '系统示例',
        customerPhone: '00000000000',
        customerId: 'system_example',
        amount: 0,
        balance: 0,
        type: 'cash',
        productName: '预存金额',
        createTime: db.serverDate(),
        updateTime: db.serverDate(),
        status: 'active',
        _isSystemCreated: true // 标记系统创建的示例记录
      };
    }
    
    db.collection(collectionName).add({
      data: record,
      success: function(res) {
        console.log(`成功创建集合 ${collectionName} 示例记录`);
      },
      fail: function(err) {
        console.error(`创建集合 ${collectionName} 示例记录失败`, err);
      }
    });
  },
  
  // 确保orders集合有索引 - 添加检查避免重复执行
  ensureOrdersIndex: function() {
    if (this.globalData.ordersDbOptimized) {
      console.log('orders集合已优化，跳过');
      return;
    }
    
    console.log('优化orders集合查询性能');
    
    // 标记为已优化
    this.globalData.ordersDbOptimized = true;
    
    // 不使用云函数，而是通过批量查询和修复来提高性能
    const db = wx.cloud.database();
    
    // 延迟检查订单数据
    setTimeout(() => {
      this.checkOrdersDataIntegrityOnce();
    }, 3000);
  },

  // 新方法: 确保订单完整性检查只执行一次
  checkOrdersDataIntegrityOnce: function() {
    if (this.globalData.ordersIntegrityChecked) {
      console.log('订单数据完整性已检查，跳过重复检查');
      return;
    }
    
    // 标记为已检查
    this.globalData.ordersIntegrityChecked = true;
    
    // 执行实际的检查逻辑
    this.checkOrdersDataIntegrity();
  },

  // 检查订单数据完整性 - 原逻辑保持不变
  checkOrdersDataIntegrity: function() {
    console.log('开始检查订单数据完整性...');
    
    // 不依赖云函数，使用客户端SDK创建索引
    // this.ensureOrdersIndex(); // 移除这一行，防止循环调用
    
    // 延迟执行，确保订单数据已经加载
    setTimeout(() => {
      const orders = this.globalData.orders || [];
      let hasFixedData = false;
      
      // 创建数据库实例
      const db = wx.cloud.database();
      
      // 修复订单数据
      const fixedOrders = orders.map(order => {
        let changed = false;
        
        // 修复订单ID
        if (!order.id || order.id === 'undefined' || order.id === 'null') {
          changed = true;
          hasFixedData = true;
          
          // 生成新ID
          const now = new Date();
          const dateStr = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0');
          const randomStr = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
          order.id = 'DD' + dateStr + randomStr;
          
          console.log(`修复订单ID: ${order._id || '未知'} -> ${order.id}`);
          
          // 如果有_id，更新数据库
          if (order._id) {
            db.collection('orders').doc(order._id).update({
              data: { id: order.id }
            }).then(res => {
              console.log(`订单ID更新成功: ${order._id}`);
            }).catch(err => {
              console.error(`订单ID更新失败: ${order._id}`, err);
            });
          }
        }
        
        // 修复订单日期
        if (!order.date || order.date === 'undefined' || order.date === 'null') {
          changed = true;
          hasFixedData = true;
          
          // 尝试从createTime提取日期
          if (order.createTime) {
            try {
              if (typeof order.createTime === 'string') {
                order.date = order.createTime.split('T')[0];
              } else if (order.createTime instanceof Date) {
                order.date = order.createTime.toISOString().split('T')[0];
              }
            } catch(e) {
              // 如果提取失败，使用当前日期
              const now = new Date();
              order.date = now.toISOString().split('T')[0];
            }
          } else {
            // 如果没有createTime，使用当前日期
            const now = new Date();
            order.date = now.toISOString().split('T')[0];
            order.createTime = now.toISOString();
          }
          
          console.log(`修复订单日期: ${order._id || '未知'} -> ${order.date}`);
          
          // 如果有_id，更新数据库
          if (order._id) {
            db.collection('orders').doc(order._id).update({
              data: { 
                date: order.date,
                createTime: order.createTime
              }
            }).then(res => {
              console.log(`订单日期更新成功: ${order._id}`);
            }).catch(err => {
              console.error(`订单日期更新失败: ${order._id}`, err);
            });
          }
        }
        
        return order;
      });
      
      if (hasFixedData) {
        // 更新全局数据
        this.globalData.orders = fixedOrders;
        // 更新本地存储
        wx.setStorageSync('orders', fixedOrders);
        console.log('订单数据修复完成，共修复', fixedOrders.length, '条记录');
      } else {
        console.log('订单数据检查完成，未发现问题');
      }
    }, 3000); // 延迟3秒执行，确保数据已加载
  },

  // 处理批量更新订单
  batchUpdateOrders: function(ordersToUpdate) {
    if (!ordersToUpdate || ordersToUpdate.length === 0) {
      console.log('没有需要更新的订单');
      return;
    }
    
    console.log(`需要更新${ordersToUpdate.length}个订单`);
    
    const db = wx.cloud.database();
    
    // 单个处理而非批量，避免使用云函数
    ordersToUpdate.forEach(order => {
      try {
        db.collection('orders').doc(order.id).update({
          data: {
            createTime: order.createTime
          }
        }).then(res => {
          console.log(`订单${order.id}更新成功`);
        }).catch(err => {
          console.error(`订单${order.id}更新失败:`, err);
        });
      } catch (err) {
        console.error('更新订单出错:', err);
      }
    });
  },

  // 从云数据库加载预存记录数据
  loadPrepaidRecordsFromCloud: function(forceRefresh) {
    console.log('开始从云数据库加载预存记录...');
    
    if (forceRefresh) {
      console.log('强制刷新模式，忽略缓存');
    } else if (this.globalData.prepaidRecords && this.globalData.prepaidRecords.length > 0) {
      console.log('已有预存记录缓存，跳过加载');
      return;
    }
    
    const db = wx.cloud.database();
    db.collection('prepaidRecords').get({
      success: res => {
        console.log('成功加载预存记录，数量:', res.data.length);
        console.log('预存记录详情:', JSON.stringify(res.data));
        
        this.globalData.prepaidRecords = res.data;
        wx.setStorageSync('prepaidRecords', res.data);
        
        // 发送事件通知
        if (this.globalData.eventBus) {
          this.globalData.eventBus.emit('prepaidRecordsUpdated', res.data);
        }
      },
      fail: err => {
        console.error('加载预存记录失败：', err);
        const prepaidRecords = wx.getStorageSync('prepaidRecords') || [];
        this.globalData.prepaidRecords = prepaidRecords;
      }
    });
  },

  // 根据支付方式确定订单的初始状态
  getInitialOrderStatus: function(orderData) {
    if (orderData.paymentMethod === 'prepaid') {
      return 'pending_shipment'; // 预存扣除的产品订单直接到待发货
    }
    return 'pending'; // 其他支付方式的订单到待付款
  },

  // 全局登录状态检查函数（30天过期）
  checkLoginStatus: function() {
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    const expireTime = wx.getStorageSync('loginExpireTime');
    const now = new Date().getTime();
    
    // 检查是否登录且未过期
    if (!isLoggedIn || !expireTime || now > expireTime) {
      // 清除过期的登录信息
      wx.removeStorageSync('isLoggedIn');
      wx.removeStorageSync('username');
      wx.removeStorageSync('loginTime');
      wx.removeStorageSync('loginExpireTime');
      
      // 跳转到登录页面
      wx.reLaunch({
        url: '/pages/login/login'
      });
      return false;
    }
    return true;
  }
});