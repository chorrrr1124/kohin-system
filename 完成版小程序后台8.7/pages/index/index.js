// pages/index/index.js
Page({
  data: {
    products: [],
    categories: [],
    currentCategory: '全部',
    subCategories: [],
    currentSubCategory: '全部',
    brands: [],
    currentBrand: '全部',
    searchKeyword: '',
    cloudAvailable: false, // 云开发连接状态
    stats: {
      total: 0,
      lowStock: 0,
      categoryCount: 0
    },
    // 自定义弹窗相关数据
    showModal: false,
    modalTitle: '',
    modalContent: '',
    modalShowCancel: false,
    modalCancelText: '取消',
    modalConfirmText: '知道了',
    currentProduct: null
  },

  onLoad: function (options) {
    // 检查登录状态
    this.checkLoginStatus();
    
    // 获取网络状态
    this.updateNetworkStatus();
    
    // 监听网络状态变化
    this.setupNetworkListener();
    
    this.loadProducts();
    this.getLastOutTime();
  },

  onShow: function () {
    // 更新网络状态
    this.updateNetworkStatus();
    
    this.loadProducts();
    this.getLastOutTime();
  },

  onUnload: function () {
    // 页面卸载时移除网络监听
    wx.offNetworkStatusChange();
    
    // 清理定时器
    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval);
      this.networkCheckInterval = null;
    }
  },

  // 🌐 更新网络状态
  updateNetworkStatus: function() {
    const app = getApp();
    this.setData({
      cloudAvailable: app.globalData.cloudAvailable || false
    });
  },

  // 🔗 设置网络状态监听
  setupNetworkListener: function() {
    // 监听应用级的网络状态变化
    const app = getApp();
    
    // 定期检查网络状态（每5秒检查一次）
    this.networkCheckInterval = setInterval(() => {
      const currentStatus = app.globalData.cloudAvailable || false;
      if (this.data.cloudAvailable !== currentStatus) {
        console.log('网络状态发生变化:', currentStatus);
        this.setData({
          cloudAvailable: currentStatus
        });
      }
    }, 5000);
  },
  
  // 获取最新出库时间
  getLastOutTime: function() {
    const app = getApp();
    
    // 优先使用缓存数据
    app.getCachedData('records').then(records => {
      const outRecords = records.filter(record => record.type === 'out' && (record.timestamp || record.createTime));
      
      if (outRecords.length > 0) {
        // 按时间戳排序，获取最新的出库记录
        outRecords.sort((a, b) => {
          const timeA = new Date(a.timestamp || a.createTime);
          const timeB = new Date(b.timestamp || b.createTime);
          return timeB - timeA;
        });
        
        const latestRecord = outRecords[0];
        const date = new Date(latestRecord.timestamp || latestRecord.createTime);
        
        // 验证时间戳有效性
        if (!isNaN(date.getTime())) {
          const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          
          this.setData({
            lastOutTime: formattedDate
          });
        } else {
          this.setData({
            lastOutTime: ''
          });
        }
      } else {
        this.setData({
          lastOutTime: ''
        });
      }
    }).catch(err => {
      console.error('获取出库时间失败:', err);
      this.setData({
        lastOutTime: ''
      });
    });
  },

  // 🚀 优化的搜索输入处理（防抖）
  onSearchInput: function(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
    
    // 清除之前的定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    
    // 设置防抖定时器
    this.searchTimer = setTimeout(() => {
      const app = getApp();
      if (app.globalData.cache.products.data) {
        this.processProductsData(app.globalData.cache.products.data);
      } else {
        this.loadProducts();
      }
    }, 500); // 500ms 防抖
  },

  // 🚀 优化的产品数据加载
  loadProducts: function() {
    const app = getApp();
    
    // 使用应用级缓存加载数据
    app.getCachedData('products').then(products => {
      this.processProductsData(products);
    }).catch(err => {
      console.error('加载产品数据失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  // 🚀 处理产品数据（分离数据加载和处理逻辑）
  processProductsData: function(allProducts) {
    if (!allProducts || allProducts.length === 0) {
      this.setData({
        products: [],
        stats: { total: 0, lowStock: 0, categoryCount: 0 },
        categories: ['全部'],
        brands: ['全部']
      });
      return;
    }

    // 前端筛选（已优化）
    let filteredProducts = allProducts;

    // 根据搜索关键词筛选（匹配产品名称、品牌、规格）
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase();
      filteredProducts = filteredProducts.filter(p => {
        const name = (p.name || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const specification = (p.specification || '').toLowerCase();
        
        return name.includes(keyword) || 
               brand.includes(keyword) || 
               specification.includes(keyword);
      });
    }

    // 根据分类筛选
    if (this.data.currentCategory !== '全部') {
      filteredProducts = filteredProducts.filter(p => String(p.type || '') === this.data.currentCategory);
    }

    // 根据品牌筛选
    if (this.data.currentBrand !== '全部') {
      filteredProducts = filteredProducts.filter(p => String(p.brand || '') === this.data.currentBrand);
    }

    // 提取分类和品牌（只计算一次，确保数据类型正确）
    const uniqueCategories = ['全部'].concat(Array.from(new Set(allProducts.map(p => String(p.type || '')).filter(Boolean))));
    const uniqueBrands = ['全部'].concat(Array.from(new Set(allProducts.map(p => String(p.brand || '')).filter(Boolean))));

    // 计算统计数据
    const stats = {
      total: filteredProducts.length,
      lowStock: filteredProducts.filter(p => p.stock <= 10).length,
      categoryCount: new Set(filteredProducts.map(p => p.type)).size
    };

    this.setData({
      products: filteredProducts,
      stats: stats,
      categories: uniqueCategories,
      brands: uniqueBrands
    });
  },

  // 🚀 优化的类别切换（避免重复查询数据库）
  switchCategory: function (e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category,
      currentSubCategory: '全部',
      currentBrand: '全部',
      subCategories: []
    });
    
    // 直接处理已加载的数据，无需重新查询数据库
    const app = getApp();
    if (app.globalData.cache.products.data) {
      this.processProductsData(app.globalData.cache.products.data);
    } else {
      this.loadProducts();
    }
  },
  
  // 🚀 优化的品牌切换
  switchBrand: function (e) {
    const brand = e.currentTarget.dataset.brand;
    this.setData({
      currentBrand: brand
    });
    
    // 直接处理已加载的数据
    const app = getApp();
    if (app.globalData.cache.products.data) {
      this.processProductsData(app.globalData.cache.products.data);
    } else {
      this.loadProducts();
    }
  },

  // 🚀 优化的二级分类切换
  switchSubCategory: function (e) {
    const subCategory = e.currentTarget.dataset.subcategory;
    this.setData({
      currentSubCategory: subCategory,
      searchKeyword: ''
    });
    
    // 直接处理已加载的数据
    const app = getApp();
    if (app.globalData.cache.products.data) {
      this.processProductsData(app.globalData.cache.products.data);
    } else {
      this.loadProducts();
    }
  },

  // 跳转到低库存页面
  navigateToLowStock: function() {
    wx.navigateTo({
      url: '/pages/lowStock/lowStock'
    });
  },

  // 跳转到SKU详情页面
  navigateToTotalStock: function() {
    wx.navigateTo({
      url: '/pages/totalStock/totalStock'
    });
  },

  // 跳转到分类详情页面
  // 跳转到当月领取日历页面
  navigateToCategories: function() {
    wx.navigateTo({
      url: '/pages/calendar/calendar'
    });
  },

  // 搜索按钮点击事件
  onSearch: function() {
    this.loadProducts();
  },

  // 查看产品详情
  viewProductDetail: function (e) {
    const index = e.currentTarget.dataset.index;
    const product = this.data.products[index];
    
    // 添加日志以便调试
    console.log('产品点击事件触发', index, product);
    
    // 确保事件正确触发
    if (!product) {
      console.error('产品数据不存在', index);
      return;
    }
    
    wx.showActionSheet({
      itemList: ['查看产品详情', '查看出入库日历'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 查看产品详情 - 使用自定义弹窗
          this.setData({
            showModal: true,
            modalTitle: product.name,
            modalContent: `🏷️ 品牌：${product.brand || '暂无'}
📦 类型：${product.type || '暂无'}
🏗️ 品类：${product.category || '暂无'}
📏 规格：${product.specification || '暂无'}

📊 当前库存：${product.stock || 0} 件

📝 备注：${product.remark || '暂无备注'}`,
            modalShowCancel: false,
            modalConfirmText: '知道了',
            currentProduct: product
          });
        } else if (res.tapIndex === 1) {
          // 查看出入库日历
          wx.navigateTo({
            url: `/pages/productCalendar/productCalendar?id=${product._id}&name=${encodeURIComponent(product.name)}`
          });
        }
        
        // 已注释掉"查看出入库记录"选项
        /*
        原来的菜单项为：
        itemList: ['查看产品详情', '查看出入库记录', '查看出入库日历']
        
        原来的处理代码为：
        else if (res.tapIndex === 1) {
          // 查看出入库记录
          wx.navigateTo({
            url: `/pages/productRecords/productRecords?id=${product._id}&name=${encodeURIComponent(product.name)}`
          });
        } else if (res.tapIndex === 2) {
          // 查看出入库日历
          wx.navigateTo({
            url: `/pages/productCalendar/productCalendar?id=${product._id}&name=${encodeURIComponent(product.name)}`
          });
        }
        */
      }
    });
  },

  // 领取产品
  takeProduct: function (e) {
    const index = e.currentTarget.dataset.index;
    const product = this.data.products[index];
    
    wx.showModal({
      title: '领取产品',
      content: '',
      editable: true,
      placeholderText: `请输入领取 ${product.name} 的数量`,
      success: (res) => {
        if (res.confirm) {
          const quantity = parseInt(res.content);
          
          if (isNaN(quantity) || quantity <= 0) {
            wx.showToast({
              title: '请输入有效数量',
              icon: 'none'
            });
            return;
          }
          
          if (quantity > product.stock) {
            wx.showToast({
              title: '库存不足',
              icon: 'none'
            });
            return;
          }
          
          const db = wx.cloud.database();
          const _ = db.command;
          
          // 更新产品库存
          db.collection('products').doc(product._id).update({
            data: {
              stock: _.inc(-quantity)
            },
            success: () => {
              // 添加出库记录
              const record = {
                productId: product._id,
                productName: product.name,
                quantity: quantity,
                type: 'out',
                createTime: db.serverDate()
              };
              
              db.collection('records').add({
                data: record,
                success: res => {
                  record._id = res._id;
                  
                  // 更新本地数据
                  const app = getApp();
                  const productIndex = app.globalData.products.findIndex(p => p._id === product._id);
                  if (productIndex !== -1) {
                    app.globalData.products[productIndex].stock -= quantity;
                    wx.setStorageSync('products', app.globalData.products);
                  }
                  
                  app.globalData.records.unshift(record);
                  wx.setStorageSync('records', app.globalData.records);
                  
                  // 刷新页面
                  this.loadProducts();
                  
                  wx.showToast({
                    title: '领取成功',
                    icon: 'success'
                  });
                }
              });
            },
            fail: err => {
              console.error('更新库存失败：', err);
              wx.showToast({
                title: '领取失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  onPullDownRefresh() {
    this.loadProducts();
  },

  // 自定义弹窗事件处理
  onModalConfirm: function() {
    this.setData({
      showModal: false
    });
  },

  onModalCancel: function() {
    this.setData({
      showModal: false
    });
  },

  onModalClose: function() {
    this.setData({
      showModal: false
    });
  },

  // 检查登录状态
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
      
      wx.reLaunch({
        url: '/pages/login/login'
      });
    }
  }
});