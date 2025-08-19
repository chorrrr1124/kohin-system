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
    return '/images/placeholder.png';
  },

  // 确保图片URL的安全性，避免外部URL导致的问题
  validateImageUrl(url) {
    if (!url) return '/images/placeholder.png';
    
    // 如果是外部URL，替换为本地占位图
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.warn('检测到外部图片URL，已替换为本地占位图:', url);
      return '/images/placeholder.png';
    }
    
    return url;
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    const openid = wx.getStorageSync('openid');
    
    if (userInfo && openid) {
      this.globalData.userInfo = userInfo;
      this.globalData.openid = openid;
      this.globalData.isLoggedIn = true;
    } else {
      // 检查是否是首次启动（没有任何登录信息）
      const hasEverLoggedIn = wx.getStorageSync('hasEverLoggedIn');
      
      if (!hasEverLoggedIn) {
        // 首次启动，延迟弹出登录弹窗
        setTimeout(() => {
          this.showLoginModal();
        }, 1000);
      } else {
        // 之前登录过，尝试静默获取 openid
        this.loginWithOpenId().catch(err => {
          console.warn('静默登录失败，将弹出授权登录弹窗', err);
          // 延迟一下再弹出登录弹窗，确保小程序完全启动
          setTimeout(() => {
            this.showLoginModal();
          }, 1000);
        });
      }
    }
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

  // 显示登录授权弹窗
  showLoginModal() {
    // 获取当前页面
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    if (currentPage && currentPage.setData) {
      // 显示登录弹窗组件
      currentPage.setData({
        showLoginModal: true
      });
    } else {
      // 如果无法获取当前页面，使用原有的系统弹窗作为备选
      wx.showModal({
        title: '登录提示',
        content: '为了给您提供更好的服务，请先登录授权',
        confirmText: '立即登录',
        cancelText: '稍后再说',
        success: (res) => {
          if (res.confirm) {
            this.login().catch(err => {
              console.error('用户授权登录失败:', err);
              wx.showToast({
                title: '登录失败，请稍后重试',
                icon: 'none'
              });
            });
          }
        }
      });
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
  addToCart(product) {
    const existingItem = this.globalData.cart.find(item => item._id === product._id);
    
    if (existingItem) {
      existingItem.quantity += product.quantity || 1;
    } else {
      this.globalData.cart.push({
        ...product,
        quantity: product.quantity || 1,
        selected: true // 默认选中
      });
    }

    // 保存到本地存储
    wx.setStorageSync('cart', this.globalData.cart);
    
    // 更新购物车角标
    this.updateCartBadge();
  },

  // 从购物车移除商品
  removeFromCart(productId) {
    this.globalData.cart = this.globalData.cart.filter(item => item._id !== productId);
    wx.setStorageSync('cart', this.globalData.cart);
    this.updateCartBadge();
  },

  // 更新购物车数量
  updateCartQuantity(productId, quantity) {
    const item = this.globalData.cart.find(item => item._id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        wx.setStorageSync('cart', this.globalData.cart);
        this.updateCartBadge();
      }
    }
  },

  // 清空购物车
  clearCart() {
    this.globalData.cart = [];
    wx.setStorageSync('cart', this.globalData.cart);
    this.updateCartBadge();
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
  initCart() {
    const cart = wx.getStorageSync('cart');
    if (cart) {
      this.globalData.cart = cart;
      this.updateCartBadge();
    }
    
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
          orderId: 'ORD2024010101',
          status: 'pending',
          totalPrice: 299.00,
          createTime: Date.now() - 86400000, // 1天前
          items: [
            {
              _id: '1',
              name: '苹果iPhone 15',
              currentPrice: 299.00,
              quantity: 1,
              image: '/images/placeholder.png'
            }
          ],
          address: {
            name: '张三',
            phone: '13800138000',
            address: '广东省深圳市南山区科技园南区深南大道9999号A座2201'
          }
        },
        {
          orderId: 'ORD2024010102',
          status: 'paid',
          totalPrice: 1588.00,
          createTime: Date.now() - 172800000, // 2天前
          items: [
            {
              _id: '2',
              name: '华为Mate 60',
              currentPrice: 1588.00,
              quantity: 1,
              image: '/images/placeholder.png'
            }
          ],
          address: {
            name: '李四',
            phone: '13900139000',
            address: '北京市北京市海淀区中关村大街1号创业大厦8楼'
          }
        },
        {
          orderId: 'ORD2024010103',
          status: 'completed',
          totalPrice: 188.00,
          createTime: Date.now() - 259200000, // 3天前
          items: [
            {
              _id: '3',
              name: '小米手环8',
              currentPrice: 188.00,
              quantity: 1,
              image: '/images/placeholder.png'
            }
          ],
          address: {
            name: '王五',
            phone: '13700137000',
            address: '上海市上海市浦东新区陆家嘴金融中心'
          }
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