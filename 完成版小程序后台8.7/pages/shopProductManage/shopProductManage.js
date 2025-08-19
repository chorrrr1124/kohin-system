// pages/shopProductManage/shopProductManage.js
Page({
  data: {
    products: [],
    categories: [],
    currentCategory: '全部',
    brands: [],
    currentBrand: '全部',
    stats: {
      total: 0,
      onSale: 0,
      categoryCount: 0
    },
    // 自定义弹窗数据
    showModal: false,
    modalTitle: '',
    modalContent: '',
    modalShowCancel: false,
    modalCancelText: '取消',
    modalConfirmText: '知道了',
    currentProduct: null // 当前操作的产品
  },

  onLoad: function (options) {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    this.loadProducts();
  },

  onShow: function () {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    this.loadProducts();
  },

  // 加载产品数据
  loadProducts: function () {
    wx.showLoading({
      title: '加载中...'
    });
    
    // 先尝试从全局数据获取商城产品
    const app = getApp();
    let products = app.globalData.shopProducts || [];
    
    if (products && products.length > 0) {
      console.log('从全局数据加载商城产品:', products.length + '条记录');
      this.processProductData(products);
      wx.hideLoading();
      return;
    }
    
    // 如果全局数据为空，尝试从本地存储加载
    products = wx.getStorageSync('shopProducts') || [];
    if (products && products.length > 0) {
      console.log('从本地存储加载商城产品:', products.length + '条记录');
      app.globalData.shopProducts = products; // 更新全局数据
      this.processProductData(products);
      wx.hideLoading();
      return;
    }
    
    // 如果本地存储也没有，从数据库加载
    const db = wx.cloud.database();
    
    // 从shopProducts集合加载商城产品
    db.collection('shopProducts').get({
      success: res => {
        console.log('从数据库加载商城产品成功:', res.data.length + '条记录');
        const products = res.data || [];
        
        // 更新全局数据和本地存储
        app.globalData.shopProducts = products;
        wx.setStorageSync('shopProducts', products);
        
        this.processProductData(products);
      },
      fail: err => {
        console.error('加载商城产品失败：', err);
        
        // 检查错误类型，如果是集合不存在，则创建该集合
        if (err.errCode === -502005) { // DATABASE_COLLECTION_NOT_EXIST
          console.log('shopProducts集合不存在，尝试初始化...');
          this.initShopProductsCollection();
        } else {
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          });
        }
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },
  
  // 处理产品数据
  processProductData: function(products) {
    // 统计数据
    const onSaleCount = products.filter(p => p.onSale).length;
    
    // 提取所有产品类型
    const allTypes = products.map(p => p.type);
    const uniqueCategories = ['全部'].concat(Array.from(new Set(allTypes))).filter(Boolean);
    
    // 根据当前选择的类型筛选产品
    let filteredProducts = products;
    if (this.data.currentCategory !== '全部') {
      filteredProducts = products.filter(p => p.type === this.data.currentCategory);
      
      // 提取当前类别下的所有品牌
      const allBrands = filteredProducts.map(p => p.brand);
      const uniqueBrands = ['全部'].concat(Array.from(new Set(allBrands))).filter(Boolean);
      this.setData({ brands: uniqueBrands });
      
      // 根据选中的品牌进行二次筛选
      if (this.data.currentBrand !== '全部') {
        filteredProducts = filteredProducts.filter(p => p.brand === this.data.currentBrand);
      }
    } else {
      // 全部类别时，提取所有品牌
      const allBrands = products.map(p => p.brand);
      const uniqueBrands = ['全部'].concat(Array.from(new Set(allBrands))).filter(Boolean);
      this.setData({ brands: uniqueBrands });
      
      // 根据选中的品牌进行筛选
      if (this.data.currentBrand !== '全部') {
        filteredProducts = filteredProducts.filter(p => p.brand === this.data.currentBrand);
      }
    }
    
    console.log('筛选后商城产品:', filteredProducts.length + '条记录');
    
    this.setData({
      products: filteredProducts,
      categories: uniqueCategories,
      stats: {
        total: products.length,
        onSale: onSaleCount,
        categoryCount: uniqueCategories.length - 1 // 减去"全部"
      }
    });
  },
  
  // 初始化商城产品集合
  initShopProductsCollection: function() {
    const db = wx.cloud.database();
    
    // 尝试创建集合
    wx.cloud.callFunction({
      name: 'initShopProducts',
      success: res => {
        console.log('初始化shopProducts集合成功：', res);
        
        // 集合创建成功后显示空数据
        this.setData({
          products: [],
          categories: ['全部'],
          brands: ['全部'],
          stats: {
            total: 0,
            onSale: 0,
            categoryCount: 0
          }
        });
        
        wx.showToast({
          title: '商城为空',
          icon: 'none'
        });
      },
      fail: err => {
        console.error('初始化shopProducts集合失败：', err);
        
        // 显示空数据
        this.setData({
          products: [],
          categories: ['全部'],
          brands: ['全部'],
          stats: {
            total: 0,
            onSale: 0,
            categoryCount: 0
          }
        });
        
        wx.showToast({
          title: '系统错误',
          icon: 'error'
        });
      }
    });
  },
  
  // 切换产品分类
  switchCategory: function(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category,
      currentBrand: '全部' // 重置品牌筛选
    });
    this.loadProducts();
  },
  
  // 切换产品品牌
  switchBrand: function(e) {
    const brand = e.currentTarget.dataset.brand;
    this.setData({
      currentBrand: brand
    });
    this.loadProducts();
  },
  
  // 查看产品详情
  viewProductDetail: function(e) {
    const index = e.currentTarget.dataset.index;
    const product = this.data.products[index];
    
    if (product) {
      // 使用自定义弹窗显示产品详细信息
      this.setData({
        showModal: true,
        modalTitle: product.name,
        modalContent: `🏷️ 品牌：${product.brand || '暂无'}
📦 类型：${product.type || '暂无'}
🏗️ 品类：${product.category || '暂无'}
📏 规格：${product.specification || '暂无'}

📊 当前库存：${product.stock || 0} 件

🔖 原价：¥${product.originalPrice || 0}
💵 现价：¥${product.price || 0}
🎯 销售状态：${product.onSale ? '🟢 在售' : '🔴 下架'}

🎪 促销信息：${product.promotionInfo || '暂无'}
📝 备注：${product.remark || '暂无备注'}`,
        modalShowCancel: false,
        modalConfirmText: '知道了',
        currentProduct: product
      });
    } else {
      wx.showToast({
        title: '商品信息不存在',
        icon: 'none'
      });
    }
  },
  
  // 编辑产品信息
  editProductInfo: function(e) {
    const index = e.currentTarget.dataset.index;
    const product = this.data.products[index];
    
    // 跳转到产品编辑页面
    wx.navigateTo({
      url: `/pages/admin/addProduct/addProduct?id=${product._id}&isEdit=true`
    });
  },
  
  // 切换商品上下架状态
  toggleProductStatus: function(e) {
    const index = e.currentTarget.dataset.index;
    const product = this.data.products[index];
    
    const db = wx.cloud.database();
    const newStatus = !product.onSale;
    
    // 显示确认对话框
    wx.showModal({
      title: '确认操作',
      content: `确定要${product.onSale ? '下架' : '上架'}商品"${product.name}"吗？${product.onSale ? '\n下架后商品将不在商城显示' : '\n上架后商品将在商城正常显示'}`,
      success: (result) => {
        if (result.confirm) {
          // 先立即更新本地状态，提供即时反馈
          const updatedProducts = this.data.products.slice();
          updatedProducts[index].onSale = newStatus;
          this.setData({
            products: updatedProducts
          });

          // 再更新数据库
          db.collection('shopProducts').doc(product._id).update({
            data: {
              onSale: newStatus
            },
            success: res => {
              console.log('商品状态更新成功:', res);
              wx.showToast({
                title: newStatus ? '商品已上架' : '商品已下架',
                icon: 'success'
              });
              
              // 更新全局数据
              const app = getApp();
              if (app.globalData.shopProducts) {
                const globalIndex = app.globalData.shopProducts.findIndex(p => 
                  p._id === product._id || p.id === product.id
                );
                if (globalIndex !== -1) {
                  app.globalData.shopProducts[globalIndex].onSale = newStatus;
                  wx.setStorageSync('shopProducts', app.globalData.shopProducts);
                }
              }
              
              // 延迟重新加载确保数据同步
              setTimeout(() => {
                this.loadProducts();
              }, 1000);
            },
            fail: err => {
              console.error('更新商品状态失败：', err);
              // 如果更新失败，恢复原状态
              updatedProducts[index].onSale = product.onSale;
              this.setData({
                products: updatedProducts
              });
              wx.showToast({
                title: '操作失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 原编辑商品方法（保留原有功能）
  editProduct: function(e) {
    const index = e.currentTarget.dataset.index;
    const product = this.data.products[index];
    
    // 切换商品上下架状态
    const db = wx.cloud.database();
    db.collection('shopProducts').doc(product._id).update({
      data: {
        onSale: !product.onSale
      },
      success: res => {
        wx.showToast({
          title: product.onSale ? '商品已下架' : '商品已上架',
          icon: 'success'
        });
        // 重新加载产品列表
        this.loadProducts();
      },
      fail: err => {
        console.error('更新商品状态失败：', err);
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 强制刷新所有相关页面
  forceRefreshAllPages: function() {
    // 获取当前所有页面
    const pages = getCurrentPages();
    console.log('当前打开的页面:', pages.map(p => p.route));
    
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
    setTimeout(() => {
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
            ['loadData', 'onShow', 'onLoad', 'refreshData'].forEach(method => {
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
  
  // 跳转到添加产品页面
  navigateToAddProduct: function() {
    wx.navigateTo({
      url: '/pages/admin/addProduct/addProduct'
    });
  },
  
  // 返回商城页面
  navigateBackToShop: function() {
    wx.navigateBack();
  },

  // 自定义弹窗事件处理
  onModalConfirm: function() {
    // 确认按钮点击事件
    console.log('弹窗确认');
  },

  onModalCancel: function() {
    // 取消按钮点击事件
    console.log('弹窗取消');
  },

  onModalClose: function() {
    // 关闭弹窗
    this.setData({
      showModal: false,
      currentProduct: null
    });
  }
})