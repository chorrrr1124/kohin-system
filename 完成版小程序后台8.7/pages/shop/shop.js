// pages/shop/shop.js
Page({
  data: {
    products: [],
    loading: true,
    categories: ['全部'],
    currentCategory: '全部',
    brands: ['全部'], // 品牌列表
    currentBrand: '全部', // 当前选中的品牌
    allProducts: [],  // 存储所有产品，用于分类筛选
    cart: [], // 购物车数据
    cartItemCount: 0, // 购物车商品总数量
    searchKeyword: '', // 搜索关键词
    // 自定义弹窗数据
    showModal: false,
    modalTitle: '',
    modalContent: '',
    modalShowCancel: true,
    modalCancelText: '取消',
    modalConfirmText: '确定',
    currentProduct: null // 当前操作的产品
  },

  onLoad: function(options) {
    // 检查登录状态
    this.checkLoginStatus();
    
    this.loadProducts();
  },

  onShow: function() {
    // 页面显示时刷新数据
    this.setData({ loading: true }); // 强制显示加载状态
    this.loadProducts();
  },
    
  // 同步购物车数量到产品列表
  syncCartQuantity: function() {
    const cartItems = wx.getStorageSync('cartItems') || [];
    const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    
    // 更新产品列表中的购物车数量
    const products = this.data.products.map(product => {
      const actualProductId = product.id || product._id;
      const cartItem = cartItems.find(item => 
        (item.id && (item.id === actualProductId || item.id === product._id)) || 
        (item._id && (item._id === product._id || item._id === actualProductId))
      );
      
      return Object.assign({}, product, {
        cartQuantity: cartItem ? cartItem.quantity : 0
      });
    });
    
    this.setData({
      products: products,
      cart: cartItems,
      cartItemCount: cartItemCount
    });
  },

  loadProducts: function() {
    const that = this;
    const db = wx.cloud.database();
    
    // 先检查是否有本地缓存的商品数据
    const cachedProducts = wx.getStorageSync('shopProducts') || [];
    let hasLocalData = false;
    
    // 如果本地有缓存数据，先用缓存数据渲染界面
    if (cachedProducts.length > 0) {
      console.log("使用本地缓存数据显示商品:", cachedProducts.length + "条记录");
      hasLocalData = true;
      
      // 提取所有产品类型作为分类
      const allTypes = cachedProducts.map(p => p.type);
      const uniqueCategories = ['全部'].concat(Array.from(new Set(allTypes))).filter(Boolean);
      
      // 根据当前选择的分类筛选产品
      let filteredProducts = cachedProducts;
      if (that.data.currentCategory !== '全部') {
        filteredProducts = cachedProducts.filter(product => product.type === that.data.currentCategory);
      }
      
      // 更新全局数据
      const app = getApp();
      app.globalData.shopProducts = cachedProducts;
      
      that.setData({
        allProducts: cachedProducts,
        products: filteredProducts,
        categories: uniqueCategories,
        loading: false
      }, () => {
        // 数据设置完成后同步购物车数量
        that.syncCartQuantity();
      });
    }
    
    // 尝试从云数据库加载最新数据
    try {
      // 从shopProducts集合加载商城产品
      db.collection('shopProducts').where({
        onSale: true // 只加载上架的商品
      }).get({
        success: res => {
          console.log("商城获取最新产品数据:", res.data.length + "条记录");
          const allProducts = res.data || [];
          
          // 提取所有产品类型作为分类
          const allTypes = allProducts.map(p => p.type);
          const uniqueCategories = ['全部'].concat(Array.from(new Set(allTypes))).filter(Boolean);
          
          // 提取所有产品品牌
          const allBrands = allProducts.map(p => p.brand).filter(Boolean);
          const uniqueBrands = ['全部'].concat(Array.from(new Set(allBrands)));
          
          // 使用filterProducts方法进行筛选
          that.setData({
            allProducts: allProducts,
            categories: uniqueCategories,
            brands: uniqueBrands
          }, () => {
            that.filterProducts();
          });
          
          // 更新全局数据
          const app = getApp();
          app.globalData.shopProducts = allProducts;
          wx.setStorageSync('shopProducts', allProducts);
        },
        fail: err => {
          console.error('加载商城产品失败：', err);
          
          // 如果没有本地数据，显示提示
          if (!hasLocalData) {
            wx.showToast({
              title: '网络连接失败，无法加载商品',
              icon: 'none',
              duration: 2000
            });
            that.setData({ loading: false });
          } else {
            // 已经显示本地数据，只提示刷新失败
            wx.showToast({
              title: '数据刷新失败，显示本地数据',
              icon: 'none',
              duration: 2000
            });
          }
        }
      });
    } catch (error) {
      console.error('访问云数据库异常:', error);
      // 如果没有本地数据，显示错误
      if (!hasLocalData) {
        that.setData({ loading: false });
        wx.showToast({
          title: '系统异常，请稍后再试',
          icon: 'none',
          duration: 2000
        });
      }
    }
  },

  addToCart: function(e) {
    const productId = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p.id === productId || p._id === productId);
    
    if (product) {
      // 检查库存
      if (product.stock <= 0) {
        wx.showToast({
          title: '库存不足',
          icon: 'none'
        });
        return;
      }
      
      // 直接使用updateProductQuantity函数来处理
      this.updateProductQuantity(productId, 1);
      
      wx.showToast({
        title: '已加入购物车',
        icon: 'success'
      });
    } else {
      console.error('未找到商品:', productId);
      wx.showToast({
        title: '添加失败，商品不存在',
        icon: 'none'
      });
    }
  },

  // 增加数量
  increaseQuantity: function(e) {
    const productId = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p.id === productId || p._id === productId);
    
    if (product && product.stock > (product.cartQuantity || 0)) {
      this.updateProductQuantity(productId, (product.cartQuantity || 0) + 1);
    } else {
      wx.showToast({
        title: '库存不足',
        icon: 'none'
      });
    }
  },

  // 减少数量
  decreaseQuantity: function(e) {
    const productId = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p.id === productId || p._id === productId);
    
    if (product && (product.cartQuantity || 0) > 0) {
      this.updateProductQuantity(productId, (product.cartQuantity || 0) - 1);
    }
  },

  // 更新产品数量
  updateProductQuantity: function(productId, newQuantity) {
    const products = this.data.products;
    const productIndex = products.findIndex(p => p.id === productId || p._id === productId);
    
    if (productIndex !== -1) {
      const product = products[productIndex];
      const actualProductId = product.id || product._id;
      
      // 更新产品显示的数量
      products[productIndex].cartQuantity = newQuantity;
      
      // 更新购物车数据
      let cart = this.data.cart || [];
      const existItemIndex = cart.findIndex(item => 
        (item.id && (item.id === actualProductId || item.id === product._id)) || 
        (item._id && (item._id === product._id || item._id === actualProductId))
      );
      
      if (newQuantity > 0) {
        if (existItemIndex !== -1) {
          // 更新已存在的商品数量
          cart[existItemIndex].quantity = newQuantity;
        } else {
          // 添加新商品到购物车
          cart.push({
            id: actualProductId,
            _id: product._id,
            name: product.name,
            price: product.price || 0,
            quantity: newQuantity,
            stock: product.stock
          });
        }
      } else {
        // 数量为0时从购物车移除
        if (existItemIndex !== -1) {
          cart.splice(existItemIndex, 1);
        }
      }
      
      // 计算购物车总数量
      const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
      
      // 更新页面数据
      this.setData({
        products: products,
        cart: cart,
        cartItemCount: cartItemCount
      });
      
      // 保存到本地存储
      wx.setStorageSync('cartItems', cart);
    }
  },

  goToDetail: function(e) {
    const productId = e.currentTarget.dataset.id;
    // 同时检查id和_id属性，适应数据库更换后的情况
    const product = this.data.products.find(p => p.id === productId || p._id === productId);
    
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

  goToCart: function() {
    // 保存购物车数据到本地存储
    wx.setStorageSync('cartItems', this.data.cart);
    
    // 跳转到购物车页面
    wx.navigateTo({
      url: '/pages/cart/cart'
    });
  },

  placeOrder: function() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
    // 实际应用中应该跳转到下单页面
    // wx.navigateTo({
    //   url: '/pages/checkout/checkout'
    // });
  },
  
  // 跳转到产品信息管理页面
  goToProductManage: function() {
    wx.navigateTo({
      url: '/pages/shopProductManage/shopProductManage'
    });
  },
  
  // 切换产品分类
  switchCategory: function(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category
    });
    
    // 重新筛选产品（考虑分类、品牌和搜索）
    this.filterProducts();
  },

  // 切换产品品牌
  switchBrand: function(e) {
    const brand = e.currentTarget.dataset.brand;
    this.setData({
      currentBrand: brand
    });
    
    // 重新筛选产品（考虑分类、品牌和搜索）
    this.filterProducts();
  },

  // 搜索输入处理
  onSearchInput: function(e) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword
    });
    
    // 防抖处理
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    
    this.searchTimer = setTimeout(() => {
      this.filterProducts();
    }, 300);
  },

  // 搜索确认处理
  onSearchConfirm: function(e) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword
    });
    this.filterProducts();
  },

  // 统一的产品筛选方法（支持分类、品牌和搜索）
  filterProducts: function() {
    let filteredProducts = this.data.allProducts;
    
    // 根据分类筛选
    if (this.data.currentCategory !== '全部') {
      filteredProducts = filteredProducts.filter(product => 
        product.type === this.data.currentCategory
      );
    }
    
    // 根据品牌筛选
    if (this.data.currentBrand !== '全部') {
      filteredProducts = filteredProducts.filter(product => 
        product.brand === this.data.currentBrand
      );
    }
    
    // 根据搜索关键词筛选（匹配产品名称、品牌、规格）
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase();
      filteredProducts = filteredProducts.filter(product => {
        const name = (product.name || '').toLowerCase();
        const brand = (product.brand || '').toLowerCase();
        const specification = (product.specification || '').toLowerCase();
        const type = (product.type || '').toLowerCase();
        
        return name.includes(keyword) || 
               brand.includes(keyword) || 
               specification.includes(keyword) ||
               type.includes(keyword);
      });
    }
    
    this.setData({
      products: filteredProducts,
      loading: false
    }, () => {
      // 数据设置完成后同步购物车数量
      this.syncCartQuantity();
    });
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
})