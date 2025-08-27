// pages/admin/admin.js
Page({
  data: {
    products: [],
    categories: [],
    currentCategory: '全部',
    brands: [],
    currentBrand: '全部',
    searchKeyword: '',
    stats: {
      total: 0,
      lowStock: 0,
      categoryCount: 0
    },
    // 自定义弹窗相关数据
    showModal: false,
    modalTitle: '',
    modalContent: '',
    showCancel: false,
    deleteProductData: null
  },

  onLoad: function (options) {
    // 检查登录状态
    this.checkLoginStatus();
    
    this.loadProducts();
    this.getLastOutTime();
  },

  onShow: function () {
    this.loadProducts();
    this.getLastOutTime();
  },
  
  // 获取最新出库时间
  getLastOutTime: function() {
    const records = wx.getStorageSync('records') || [];
    const outRecords = records.filter(function(record) { return record.type === 'out' && record.timestamp; });
    
    if (outRecords.length > 0) {
      // 按时间戳排序，获取最新的出库记录
      outRecords.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
      const latestRecord = outRecords[0];
      
      // 验证时间戳有效性
      const date = new Date(latestRecord.timestamp);
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
  },

  // 加载产品数据
  loadProducts: function () {
    const app = getApp();
    const products = app.globalData.products || [];
    
    // 统计数据
    const lowStockCount = products.filter(function(p) { return p.stock <= 10; }).length;
    
    // 提取所有产品类型
    const allTypes = products.map(function(p) { return p.type; });
    // 修复：不过滤"00"等有效值，只过滤null、undefined和空字符串
    const uniqueCategories = ['全部'].concat(Array.from(new Set(allTypes))).filter(type => type !== null && type !== undefined && type !== '');
    
    // 保存当前上下文
    const currentCategory = this.data.currentCategory;
    const currentBrand = this.data.currentBrand;
    const searchKeyword = this.data.searchKeyword;
    
    // 根据当前选择的类型筛选产品
    let filteredProducts = products;
    if (currentCategory !== '全部') {
      filteredProducts = products.filter(function(p) { return p.type === currentCategory; });
      
      // 提取当前类别下的所有品牌
      const allBrands = filteredProducts.map(function(p) { return p.brand; });
      const uniqueBrands = ['全部'].concat(Array.from(new Set(allBrands))).filter(brand => brand !== null && brand !== undefined && brand !== '');
      this.setData({ brands: uniqueBrands });
      
      // 根据选中的品牌进行二次筛选
      if (currentBrand !== '全部') {
        filteredProducts = filteredProducts.filter(function(p) { return p.brand === currentBrand; });
      }
    } else {
      // 全部类别时，提取所有品牌
      const allBrands = products.map(function(p) { return p.brand; });
      const uniqueBrands = ['全部'].concat(Array.from(new Set(allBrands))).filter(brand => brand !== null && brand !== undefined && brand !== '');
      this.setData({ brands: uniqueBrands });
      
      // 根据选中的品牌进行筛选
      if (currentBrand !== '全部') {
        filteredProducts = filteredProducts.filter(function(p) { return p.brand === currentBrand; });
      }
    }
    
    // 根据搜索关键词进行筛选
    if (searchKeyword && searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase();
      filteredProducts = filteredProducts.filter(function(p) {
        return (p.name && p.name.toLowerCase().indexOf(keyword) !== -1) ||
               (p.brand && p.brand.toLowerCase().indexOf(keyword) !== -1) ||
               (p.specification && p.specification.toLowerCase().indexOf(keyword) !== -1);
      });
    }
    
    this.setData({
      products: filteredProducts,
      categories: uniqueCategories,
      stats: {
        total: products.length,
        lowStock: lowStockCount,
        categoryCount: uniqueCategories.length - 1 // 减去"全部"
      }
    });
  },

  // 切换产品类别
  switchCategory: function (e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category,
      currentBrand: '全部'
    });
    this.loadProducts();
  },
  
  // 切换品牌
  switchBrand: function (e) {
    const brand = e.currentTarget.dataset.brand;
    this.setData({
      currentBrand: brand
    });
    this.loadProducts();
  },

  // 搜索输入处理
  onSearchInput: function (e) {
    this.setData({
      searchKeyword: e.detail.value
    });
    this.loadProducts();
  },

  // 查看产品详情
  viewProductDetail: function (e) {
    const index = e.currentTarget.dataset.index;
    const product = this.data.products[index];
    
    this.setData({
      showModal: true,
      modalTitle: product.name,
      modalContent: "🏷️ 品牌：" + (product.brand !== null && product.brand !== undefined && product.brand !== '' ? product.brand : '暂无') + "\n📦 类型：" + (product.type !== null && product.type !== undefined && product.type !== '' ? product.type : '暂无') + "\n🏗️ 品类：" + (product.category !== null && product.category !== undefined && product.category !== '' ? product.category : '暂无') + "\n📏 规格：" + (product.specification !== null && product.specification !== undefined && product.specification !== '' ? product.specification : '暂无') + "\n\n📊 当前库存：" + (product.stock || 0) + " 件\n\n📝 备注：" + (product.remark !== null && product.remark !== undefined && product.remark !== '' ? product.remark : '暂无备注'),
      showCancel: false
    });
  },

  // 编辑产品
  editProduct: function (e) {
    const index = e.currentTarget.dataset.index;
    const product = this.data.products[index];
    
    wx.navigateTo({
      url: `./addProduct/addProduct?id=${product.id}&isEdit=true`
    });
  },

  // 直接从客户端删除产品（备用方法）
  deleteProductDirectly: function(product) {
    wx.showLoading({
      title: '删除中...',
    });
    
    const db = wx.cloud.database();
    const _ = db.command;
    
    // 提取产品的所有可能ID形式
    const productId = product.id || product._id;
    const ids = [productId];
    if (product.id && product.id !== product._id) ids.push(product.id);
    if (product._id && product._id !== product.id) ids.push(product._id);
    
    console.log('开始从客户端删除产品，产品ID列表:', ids);
    
    // 先检查各个集合是否存在
    const checkCollections = function() {
      return new Promise(function(resolve, reject) {
        const collections = [];
        
        Promise.resolve()
          .then(function() {
            return db.collection('products').count();
          })
          .then(function(res) {
            collections.push('products');
          })
          .catch(function(e) {
            console.log('products集合不存在');
          })
          .then(function() {
            return db.collection('inventory').count();
          })
          .then(function(res) {
            collections.push('inventory');
          })
          .catch(function(e) {
            console.log('inventory集合不存在');
          })
          .then(function() {
            return db.collection('stockRecords').count();
          })
          .then(function(res) {
            collections.push('stockRecords');
          })
          .catch(function(e) {
            console.log('stockRecords集合不存在');
          })
          .then(function() {
            return db.collection('shopProducts').count();
          })
          .then(function(res) {
            collections.push('shopProducts');
          })
          .catch(function(e) {
            console.log('shopProducts集合不存在');
          })
          .then(function() {
            resolve(collections);
          });
      });
    };
    
    // 执行删除操作
    var self = this;
    checkCollections().then(function(collections) {
      console.log('存在的集合:', collections);
      
      const deleteOperations = [];
      
      // 只对存在的集合执行删除操作
      if (collections.includes('products')) {
        // 1. 删除产品记录
        ids.forEach(function(id) {
          deleteOperations.push(
            db.collection('products').where({
              _id: id
            }).remove().then(function(res) {
              console.log(`产品记录删除结果(ID: ${id}):`, res);
              return res;
            }).catch(function(err) {
              console.error(`删除产品记录失败(ID: ${id}):`, err);
              return null;
            })
          );
          
          // 2. 删除产品记录 (使用id字段)
          deleteOperations.push(
            db.collection('products').where({
              id: id
            }).remove().then(function(res) {
              console.log(`产品记录删除结果(id字段: ${id}):`, res);
              return res;
            }).catch(function(err) {
              console.error(`删除产品记录失败(id字段: ${id}):`, err);
              return null;
            })
          );
        });
      }
      
      // 3. 删除相关的库存记录
      if (collections.includes('inventory')) {
        deleteOperations.push(
          db.collection('inventory').where({
            productId: _.in(ids)
          }).remove().then(function(res) {
            console.log('库存记录删除结果:', res);
            return res;
          }).catch(function(err) {
            console.error('删除库存记录失败:', err);
            return null;
          })
        );
      }
      
      // 4. 删除相关的出入库记录
      if (collections.includes('stockRecords')) {
        deleteOperations.push(
          db.collection('stockRecords').where({
            productId: _.in(ids)
          }).remove().then(function(res) {
            console.log('出入库记录删除结果:', res);
            return res;
          }).catch(function(err) {
            console.error('删除出入库记录失败:', err);
            return null;
          })
        );
      }
      
      // 5. 删除商城产品记录
      if (collections.includes('shopProducts')) {
        // 精确匹配
        ids.forEach(function(id) {
          deleteOperations.push(
            db.collection('shopProducts').where({
              _id: id
            }).remove().then(function(res) {
              console.log(`商城产品记录删除结果(ID: ${id}):`, res);
              return res;
            }).catch(function(err) {
              console.error(`删除商城产品记录失败(ID: ${id}):`, err);
              return null;
            })
          );
        });
        
        // 关联ID匹配
        deleteOperations.push(
          db.collection('shopProducts').where({
            $or: [
              { id: _.in(ids) },
              { productId: _.in(ids) }
            ]
          }).remove().then(function(res) {
            console.log('关联商城产品删除结果:', res);
            return res;
          }).catch(function(err) {
            console.error('删除关联商城产品失败:', err);
            return null;
          })
        );
      }
      
      // 执行所有删除操作
      return Promise.all(deleteOperations);
    }).then(function(results) {
      console.log('所有删除操作完成，结果:', results.filter(Boolean));
      
      // 更新本地数据
      const app = getApp();
      let products = app.globalData.products || [];
      
      // 过滤掉删除的产品
      products = products.filter(function(p) {
        return !ids.includes(p.id) && !ids.includes(p._id);
      });
      
      console.log(`过滤前产品数量: ${app.globalData.products.length}, 过滤后: ${products.length}`);
      app.globalData.products = products;
      wx.setStorageSync('products', products);
      
      // 强制全局刷新
      this.forceRefreshAllPages();
      
      // 显示成功提示
      wx.hideLoading();
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
      
      // 重新加载产品列表
      self.loadProducts();
    }).catch(function(err) {
      console.error('客户端删除产品失败，详细错误:', err);
      wx.hideLoading();
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
    });
  },
  
  // 强制刷新所有相关页面
  forceRefreshAllPages: function() {
    // 获取当前所有页面
    const pages = getCurrentPages();
    console.log('当前打开的页面:', pages.map(function(p) { return p.route; }));
    
    // 先直接刷新全局数据
    const app = getApp();
    
    // 重新加载数据
    if(app.loadProductsFromCloud) {
      try {
        app.loadProductsFromCloud();
        console.log('成功调用全局loadProductsFromCloud方法');
      } catch(e) {
        console.error('调用全局loadProductsFromCloud方法失败:', e);
      }
    }
    
    if(app.loadRecordsFromCloud) {
      try {
        app.loadRecordsFromCloud();
        console.log('成功调用全局loadRecordsFromCloud方法');
      } catch(e) {
        console.error('调用全局loadRecordsFromCloud方法失败:', e);
      }
    }
    
    // 等待一小段时间让数据加载完成
    setTimeout(function() {
      // 刷新所有产品相关页面
      for(let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if(page && page.route) {
          if(
            page.route.includes('admin') || 
            page.route.includes('totalStock') || 
            page.route.includes('lowStock') ||
            page.route.includes('shopProductManage') ||
            page.route.includes('productIn') ||
            page.route.includes('productOut') ||
            page.route.includes('shop/')
          ) {
            console.log(`正在刷新页面: ${page.route}`);
            if(typeof page.loadProducts === 'function') {
              try {
                page.loadProducts();
                console.log(`页面 ${page.route} 刷新成功`);
              } catch(e) {
                console.error(`刷新页面 ${page.route} 失败:`, e);
              }
            }
            // 刷新其他可能的数据加载方法
            ['loadData', 'onShow', 'onLoad', 'refreshData'].forEach(function(method) {
              if(typeof page[method] === 'function') {
                try {
                  page[method]();
                  console.log(`页面 ${page.route} 的 ${method} 方法执行成功`);
                } catch(e) {
                  console.error(`执行页面 ${page.route} 的 ${method} 方法失败:`, e);
                }
              }
            });
          }
        }
      }
    }, 300); // 给300ms让数据加载完成
  },
  
  // 删除产品
  deleteProduct: function (e) {
    const index = e.currentTarget.dataset.index;
    const product = this.data.products[index];
    
    if (!product || (!product.id && !product._id)) {
      wx.showToast({
        title: '产品数据异常',
        icon: 'error'
      });
      return;
    }
    
    this.setData({
      showModal: true,
      modalTitle: '确认删除',
      modalContent: `确定要删除 ${product.name} 吗？此操作将同时删除相关库存记录和商城产品，且不可恢复。`,
      showCancel: true,
      deleteProductData: product
    });
  },

  // 跳转到添加产品页面
  navigateToAddProduct: function () {
    wx.navigateTo({
      url: './addProduct/addProduct'
    });
  },

  // 跳转到首页设置页面
  navigateToHomepageSettings: function () {
    wx.navigateTo({
      url: './homepageSettings/homepageSettings'
    });
  },
  
  // 跳转到SKU页面
  navigateToTotalStock: function () {
    wx.navigateTo({
      url: '/pages/totalStock/totalStock'
    });
  },
  
  // 跳转到低库存页面
  navigateToLowStock: function () {
    wx.navigateTo({
      url: '/pages/lowStock/lowStock'
    });
  },
  
  // 跳转到产品入库页面
  navigateToProductIn: function () {
    wx.navigateTo({
      url: '/pages/productIn/productIn'
    });
  },
  
  // 跳转到产品出库页面
  navigateToProductOut: function () {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },
  
  // 跳转到出入库日历页面
  navigateToCalendar: function() {
    wx.navigateTo({
      url: '/pages/calendar/calendar'
    });
  },

  // 自定义弹窗事件处理
  onModalConfirm: function() {
    if (this.data.deleteProductData) {
      // 执行删除操作
      this.deleteProductDirectly(this.data.deleteProductData);
      this.setData({
        deleteProductData: null
      });
    }
    this.setData({
      showModal: false
    });
  },

  onModalCancel: function() {
    this.setData({
      showModal: false,
      deleteProductData: null
    });
  },

  onModalClose: function() {
    this.setData({
      showModal: false,
      deleteProductData: null
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
  },

  // 退出登录
  logout: function() {
    this.setData({
      showModal: true,
      modalTitle: '退出登录',
      modalContent: '🚪 确定要退出登录吗？\n\n退出后需要重新输入账号密码',
      showCancel: true,
      confirmText: '退出',
      cancelText: '取消'
    });
  },

  // 重写弹窗确认方法以处理退出登录
  onModalConfirm: function() {
    if (this.data.modalTitle === '退出登录') {
      // 清除登录状态
      wx.removeStorageSync('isLoggedIn');
      wx.removeStorageSync('username');
      wx.removeStorageSync('loginTime');
      wx.removeStorageSync('loginExpireTime');
      
      // 跳转到登录页面
      wx.reLaunch({
        url: '/pages/login/login'
      });
      return;
    }

    // 原有的删除产品逻辑
    if (this.data.deleteProductData) {
      this.deleteProductDirectly(this.data.deleteProductData);
      this.setData({
        deleteProductData: null
      });
    }
    this.setData({
      showModal: false
    });
  }
});