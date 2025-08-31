// app.js
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // 云开发环境ID - 如果部署失败，请替换为您的环境ID
        // 在微信开发者工具的云开发控制台可以找到环境ID
        env: 'cloudbase-3g4w6lls8a5ce59b',
        traceUser: true,
      });
    }

    // 检查登录状态
    this.checkLoginStatus();
    
    // 初始化购物车
    this.initCart();
  },

  // 全局数据
  globalData: {
    userInfo: null,
    openid: null,
    cart: [], // 购物车数据
    isLoggedIn: false,
    userProfile: null
  },

  // 全局图片错误处理
  handleImageError(imageSrc) {
    console.warn('图片加载失败:', imageSrc);
    return '/images/placeholder.svg';
  },

  // 确保图片URL的安全性，避免外部URL导致的问题
  validateImageUrl(url) {
    if (!url) return '/images/placeholder.svg';
    
    // 如果是外部URL，替换为本地占位图
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.warn('检测到外部图片URL，已替换为本地占位图:', url);
      return '/images/placeholder.svg';
    }
    
    return url;
  },

  // 检查登录状态
  async checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    const openid = wx.getStorageSync('openid');
    
    if (userInfo && openid) {
      this.globalData.userInfo = userInfo;
      this.globalData.openid = openid;
      this.globalData.isLoggedIn = true;
      
      // 可以在这里调用云函数同步最新的用户信息
      this.syncUserToDatabase(userInfo).catch(err => {
        console.error('同步用户信息失败:', err);
      });
      
      // 初始化购物车（登录后）
      await this.initCart();
    } else {
      // 检查是否是首次启动（没有任何登录信息）
      const hasEverLoggedIn = wx.getStorageSync('hasEverLoggedIn');
      
      if (!hasEverLoggedIn) {
        // 首次启动，静默处理，不弹出弹窗
        console.log('首次启动，静默处理登录');
        // 未登录状态下初始化空购物车
        this.initCart();
      } else {
        // 之前登录过，尝试静默获取 openid
        try {
          await this.loginWithOpenId();
          // 登录成功后初始化购物车
          await this.initCart();
        } catch (err) {
          console.warn('静默登录失败，用户需要手动登录', err);
          // 未登录状态下初始化空购物车
          this.initCart();
        }
      }
    }
    
    // 初始化地址
    this.initAddresses();
  },

  // 一键静默登录（无需先授权用户信息）
  async loginWithOpenId() {
    try {
      const loginResult = await wx.cloud.callFunction({ name: 'login' });
      const openid = loginResult && loginResult.result && loginResult.result.openid;
      if (!openid) throw new Error('未获取到 openid');

      this.globalData.openid = openid;
      this.globalData.isLoggedIn = true;
      wx.setStorageSync('openid', openid);
      wx.setStorageSync('hasEverLoggedIn', true); // 标记用户已经登录过

      // 尝试同步已有的用户基础信息（如果之前授权过本地有缓存）
      const cachedUser = wx.getStorageSync('userInfo');
      await this.syncUserToDatabase(cachedUser || {});

      return { openid };
    } catch (e) {
      console.error('loginWithOpenId 失败:', e);
      throw e;
    }
  },

  // 用户登录
  async login() {
    try {
      // 获取用户授权
      const { userInfo } = await wx.getUserProfile({
        desc: '用于完善用户资料'
      });

      // 调用云函数获取openid
      const loginResult = await wx.cloud.callFunction({
        name: 'login'
      });

      const openid = loginResult.result.openid;

      // 保存用户信息
      this.globalData.userInfo = userInfo;
      this.globalData.openid = openid;
      this.globalData.isLoggedIn = true;

      // 本地存储
      wx.setStorageSync('userInfo', userInfo);
      wx.setStorageSync('openid', openid);
      wx.setStorageSync('hasEverLoggedIn', true); // 标记用户已经登录过

      // 同步用户信息到数据库
      await this.syncUserToDatabase(userInfo);

      // 登录成功提示
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      return { userInfo, openid };
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  },

  // 同步用户信息到数据库
  async syncUserToDatabase(userInfo) {
    try {
      await wx.cloud.callFunction({
        name: 'syncUser',
        data: {
          userInfo
        }
      });
    } catch (error) {
      console.error('同步用户信息失败:', error);
    }
  },

  // 购物车管理
  async addToCart(product) {
    if (!this.globalData.openid) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    try {
      const result = await wx.cloud.callFunction({
        name: 'updateUserCart',
        data: {
          action: 'add',
          productData: {
            ...product,
            quantity: product.quantity || 1
          }
        }
      });

      if (result.result.ok) {
        this.globalData.cart = result.result.data;
        this.updateCartBadge();
        wx.showToast({
          title: '已添加到购物车',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: result.result.message || '添加失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('添加到购物车失败:', error);
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      });
    }
  },

  // 从购物车移除商品
  async removeFromCart(productId) {
    if (!this.globalData.openid) {
      return;
    }

    try {
      const result = await wx.cloud.callFunction({
        name: 'updateUserCart',
        data: {
          action: 'remove',
          productId: productId
        }
      });

      if (result.result.ok) {
        this.globalData.cart = result.result.data;
        this.updateCartBadge();
      }
    } catch (error) {
      console.error('移除商品失败:', error);
    }
  },

  // 更新购物车数量
  async updateCartQuantity(productId, quantity) {
    if (!this.globalData.openid) {
      return;
    }

    try {
      const result = await wx.cloud.callFunction({
        name: 'updateUserCart',
        data: {
          action: 'updateQuantity',
          productId: productId,
          quantity: quantity
        }
      });

      if (result.result.ok) {
        this.globalData.cart = result.result.data;
        this.updateCartBadge();
      }
    } catch (error) {
      console.error('更新数量失败:', error);
    }
  },

  // 清空购物车
  async clearCart() {
    if (!this.globalData.openid) {
      return;
    }

    try {
      const result = await wx.cloud.callFunction({
        name: 'updateUserCart',
        data: {
          action: 'clear'
        }
      });

      if (result.result.ok) {
        this.globalData.cart = result.result.data;
        this.updateCartBadge();
      }
    } catch (error) {
      console.error('清空购物车失败:', error);
    }
  },

  // 更新购物车角标
  updateCartBadge() {
    const totalCount = this.globalData.cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalCount > 0) {
      wx.setTabBarBadge({
        index: 2, // 购物车tab的索引
        text: totalCount.toString()
      });
    } else {
      wx.removeTabBarBadge({
        index: 2
      });
    }
  },

  // 获取购物车总价
  getCartTotal() {
    return this.globalData.cart.reduce((sum, item) => {
      return sum + (item.currentPrice || item.price) * item.quantity;
    }, 0);
  },

  // 获取购物车商品数量
  getCartCount() {
    return this.globalData.cart.reduce((sum, item) => sum + item.quantity, 0);
  },

  // 获取购物车商品列表
  getCartItems() {
    return this.globalData.cart || [];
  },

  // 更新购物车商品列表
  updateCartItems(cartItems) {
    this.globalData.cart = cartItems;
    wx.setStorageSync('cart', this.globalData.cart);
    this.updateCartBadge();
  },

  // 初始化购物车
  async initCart() {
    // 从云端加载用户购物车数据
    if (!this.globalData.openid) {
      this.globalData.cart = [];
      this.updateCartBadge();
      return;
    }

    try {
      const result = await wx.cloud.callFunction({
        name: 'getUserCart'
      });

      if (result.result.ok) {
        this.globalData.cart = result.result.data || [];
      } else {
        this.globalData.cart = [];
      }
    } catch (error) {
      console.error('加载购物车数据失败:', error);
      this.globalData.cart = [];
    }
    this.updateCartBadge();
    
    // 初始化默认地址
    this.initAddresses();
    
    // 初始化测试订单数据
    this.initTestOrders();
  },

  // 初始化地址数据
  initAddresses() {
    const addresses = wx.getStorageSync('addresses');
    if (!addresses || addresses.length === 0) {
      const defaultAddresses = [
        {
          id: 1,
          name: '张三',
          phone: '13800138000',
          province: '广东省',
          city: '深圳市',
          district: '南山区',
          detail: '科技园南区深南大道9999号A座2201',
          isDefault: true
        },
        {
          id: 2,
          name: '李四',
          phone: '13900139000',
          province: '北京市',
          city: '北京市',
          district: '海淀区',
          detail: '中关村大街1号创业大厦8楼',
          isDefault: false
        }
      ];
      wx.setStorageSync('addresses', defaultAddresses);
      
      // 设置默认地址
      const defaultAddress = {
        name: '张三',
        phone: '13800138000',
        address: '广东省深圳市南山区科技园南区深南大道9999号A座2201'
      };
      wx.setStorageSync('defaultAddress', defaultAddress);
    }
  },

  // 初始化测试订单数据
  initTestOrders() {
    const orders = wx.getStorageSync('orders');
    if (!orders || orders.length === 0) {
      const testOrders = [
        {
          id: 'order_001',
          status: 'completed',
          createTime: new Date().getTime() - 86400000, // 1天前
          totalAmount: 68,
          items: [
            {
              id: 'product_001',
              name: '柠檬蜂蜜茶',
              price: 28,
              quantity: 1,
              image: '/images/products/drink1.jpg'
            },
            {
              id: 'product_002',
              name: '芒果奶昔',
              price: 32,
              quantity: 1,
              image: '/images/products/drink2.jpg'
            }
          ]
        }
      ];
      wx.setStorageSync('orders', testOrders);
    }
  },

  onShow() {
    // 应用显示时初始化购物车
    this.initCart();
  }
});