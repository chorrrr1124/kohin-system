// pages/index/index.js
const app = getApp()
const imageService = require('../../utils/imageService')

Page({
  data: {
    loading: false,
    statusBarHeight: 44, // 状态栏高度默认值

    userInfo: {
      nickName: '张程僖',
      avatarUrl: 'data:image/svg+xml;charset=utf-8,%3Csvg width="80" height="80" xmlns="http://www.w3.org/2000/svg"%3E%3Ccircle cx="40" cy="40" r="40" fill="%234CAF50"/%3E%3Ctext x="40" y="50" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle"%3E张%3C/text%3E%3C/svg%3E',
      points: 288,
      balance: 0,
      coupons: 0,
      vipLevel: 6
    },
    promoData: {
      title: '夏日消暑·就喝「丘大叔」',
      subtitle: 'Lemon tea for Uncle Q',
      heroImageUrl: '/images/default-banner.jpg',
      prices: [
        { price: 30, originalPrice: 30 },
        { price: 86, originalPrice: 100 },
        { price: 66, originalPrice: 66 },
        { price: 168, originalPrice: 200 }
      ],
      giftNote: '【赠6元代金券×1】',
      validityNote: '*自购买之日起3年内有效，可转赠可自用'
    },
    // 轮播图数据 
    carouselImages: [
      {
        url: '/images/banners/banner1.jpg',
        gradient: 'linear-gradient(135deg, rgba(76, 175, 80, 0.85) 0%, rgba(139, 195, 74, 0.85) 50%, rgba(205, 220, 57, 0.85) 100%)',
        title: '夏日消暑·就喝「丘大叔」',
        subtitle: 'Lemon tea for Uncle Q'
      },
      {
        url: '/images/banners/banner2.jpg',
        gradient: 'linear-gradient(135deg, rgba(33, 150, 243, 0.85) 0%, rgba(63, 81, 181, 0.85) 50%, rgba(103, 58, 183, 0.85) 100%)',
        title: '新品推荐',
        subtitle: 'Fresh & Natural'
      },
      {
        url: '/images/banners/banner3.jpg',
        gradient: 'linear-gradient(135deg, rgba(255, 152, 0, 0.85) 0%, rgba(255, 87, 34, 0.85) 50%, rgba(244, 67, 54, 0.85) 100%)',
        title: '会员专享',
        subtitle: 'VIP Exclusive'
      }
    ],
    // 推广轮播图数据
    promoSwiperImages: [
      {
        value: 'data:image/svg+xml;charset=utf-8,%3Csvg width="400" height="200" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="400" height="200" fill="%23FF6B6B"/%3E%3Ctext x="200" y="100" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle" dominant-baseline="middle"%3E夏日特惠%3C/text%3E%3C/svg%3E',
        ariaLabel: '夏日特惠活动'
      },
      {
        value: 'data:image/svg+xml;charset=utf-8,%3Csvg width="400" height="200" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="400" height="200" fill="%234ECDC4"/%3E%3Ctext x="200" y="100" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle" dominant-baseline="middle"%3E新品上市%3C/text%3E%3C/svg%3E',
        ariaLabel: '新品上市推广'
      },
      {
        value: 'data:image/svg+xml;charset=utf-8,%3Csvg width="400" height="200" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="400" height="200" fill="%23A8E6CF"/%3E%3Ctext x="200" y="100" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle" dominant-baseline="middle"%3E会员专享%3C/text%3E%3C/svg%3E',
        ariaLabel: '会员专享优惠'
      }
    ],
    promoSwiperCurrent: 0, // 推广轮播图当前索引
    recommendProducts: []
  },

  onLoad() {
    console.log('页面加载成功');
    // 获取系统信息，设置状态栏高度
    this.setStatusBarHeight();
    this.loadPageData();
    this.loadUserInfo();
  },

  // 设置状态栏高度
  setStatusBarHeight() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 44;
    // 设置CSS变量
    wx.setNavigationBarTitle({
      title: '' // 隐藏标题
    });
    
    // 通过动态设置样式变量
    const query = wx.createSelectorQuery();
    query.select('.page-container').boundingClientRect();
    query.exec((res) => {
      this.setData({
        statusBarHeight: statusBarHeight
      });
    });
  },

  onShow() {
    console.log('页面显示');
    this.refreshUserInfo();
  },

  onPullDownRefresh() {
    this.loadPageData();
    this.loadUserInfo();
    wx.stopPullDownRefresh();
  },

  // 加载页面数据
  loadPageData() {
    console.log('开始加载页面数据');
    this.setData({ loading: true });
    
    // 加载首页配置
    this.loadHomepageConfig();
    // 加载轮播图数据
    this.loadCarouselImages();
    // 加载推荐商品数据
    this.loadRecommendProducts();
  },

  // 加载首页配置
  loadHomepageConfig() {
    wx.cloud.callFunction({
      name: 'manageHomepageConfig',
      data: {
        action: 'get'
      },
      success: (res) => {
        console.log('加载首页配置成功:', res);
        if (res.result.success) {
          this.setData({
            promoData: { ...this.data.promoData, ...res.result.data }
          });
        }
      },
      fail: (error) => {
        console.error('加载首页配置失败:', error);
        // 使用默认配置，不影响页面显示
      }
    });
  },

  // 加载轮播图数据
  async loadCarouselImages() {
    try {
      // 使用imageService获取轮播图数据
      const bannerImages = await imageService.getBannerImages();
      
      if (bannerImages && bannerImages.length > 0) {
        this.setData({
          carouselImages: bannerImages.map(item => ({
            url: item.imageUrl,
            gradient: item.gradient || 'linear-gradient(135deg, rgba(76, 175, 80, 0.85) 0%, rgba(139, 195, 74, 0.85) 50%, rgba(205, 220, 57, 0.85) 100%)',
            title: item.title,
            subtitle: item.subtitle,
            link: item.link
          }))
        });
        
        // 预加载轮播图图片
        const imageUrls = bannerImages.map(item => item.imageUrl).filter(url => url);
        if (imageUrls.length > 0) {
          imageService.preloadImages(imageUrls).catch(err => {
            console.warn('轮播图预加载失败:', err);
          });
        }
      }
    } catch (error) {
      console.error('加载轮播图失败:', error);
      // 使用默认数据
    }
  },

  // 轮播图切换事件
  onCarouselChange(e) {
    const { current, item } = e.detail;
    console.log('主轮播图切换到:', current, item);
    
    // 同步切换推广轮播图
    this.syncPromoSwiper(current);
    
    // 可以根据当前轮播图更新推广内容
    if (item) {
      this.setData({
        promoData: {
          ...this.data.promoData,
          title: item.title,
          subtitle: item.subtitle
        }
      });
    }
  },

  // 轮播图加载完成
  onCarouselLoaded(e) {
    console.log('轮播图加载完成:', e.detail);
  },

  // 服务选择事件
  onServiceSelect(e) {
    const { type } = e.detail;
    console.log('选择服务类型:', type);
    
    // 设置全局服务模式
    getApp().globalData.serviceMode = type;
    
    wx.showToast({
      title: type === 'pickup' ? '已切换到自取模式' : '已切换到外卖模式',
      icon: 'success'
    });
  },

  // 功能选择事件
  onFunctionSelect(e) {
    const { type } = e.detail;
    console.log('选择功能:', type);
    
    // 根据功能类型跳转到相应页面
    const functionPages = {
      gift: '/pages/gift/gift',
      group: '/pages/group/group', 
      card: '/pages/card/card',
      exchange: '/pages/exchange/exchange'
    };
    
    if (functionPages[type]) {
      wx.navigateTo({
        url: functionPages[type]
      });
    }
  },

  // 立即购买
  onBuyNow() {
    wx.showToast({
      title: '跳转到购买页面',
      icon: 'none'
    });
    
    // 这里可以跳转到购买页面
    // wx.navigateTo({
    //   url: '/pages/purchase/purchase'
    // });
  },

  // 加载用户信息
  loadUserInfo() {
    try {
      // 从本地存储获取用户信息
      const userInfo = wx.getStorageSync('userInfo') || this.data.userInfo;
      this.setData({ userInfo });
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  },

  // 刷新用户信息
  refreshUserInfo() {
    this.loadUserInfo();
  },

  // 促销购买点击
  onBuyPromo() {
    console.log('促销购买点击');
    wx.showModal({
      title: '购买确认',
      content: '是否购买此促销套餐？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '购买成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 服务类型点击
  onServiceTap(e) {
    const serviceType = e.currentTarget.dataset.type;
    console.log('服务类型点击:', serviceType);
    
    const serviceNames = {
      pickup: '自取服务',
      delivery: '外卖服务'
    };
    
    wx.showToast({
      title: `选择${serviceNames[serviceType]}`,
      icon: 'none'
    });
  },

  // 功能按钮点击
  onFunctionTap(e) {
    const functionType = e.currentTarget.dataset.type;
    console.log('功能按钮点击:', functionType);
    
    const functionNames = {
      gift: '添加有礼',
      group: '团单优惠',
      card: '心意礼卡',
      exchange: '团购兑换'
    };
    
    wx.showToast({
      title: functionNames[functionType],
      icon: 'none'
    });
  },

  // 商品点击
  onProductTap(e) {
    const productId = e.currentTarget.dataset.id;
    console.log('商品点击', productId);
    wx.navigateTo({
      url: `/pages/product-detail/product-detail?id=${productId}`
    });
  },

  // 添加到购物车
  onAddToCart(e) {
    const productId = e.currentTarget.dataset.id;
    const product = this.data.recommendProducts.find(p => p._id === productId);
    
    if (!product) {
      wx.showToast({
        title: '商品不存在',
        icon: 'error'
      });
      return;
    }
    
    console.log('添加到购物车', product);
    
    // 检查库存
    if (product.stock <= 0) {
      wx.showToast({
        title: '商品缺货',
        icon: 'error'
      });
      return;
    }

    // 添加到购物车
    const app = getApp()
    app.addToCart(product)

    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    });
  },

  // 加载推荐商品
  async loadRecommendProducts() {
    try {
      console.log('开始调用云函数 getShopProducts...');
      
      const result = await wx.cloud.callFunction({
        name: 'getShopProducts',
        data: {
          pageSize: 6,
          onSale: true
        }
      });
      
      console.log('云函数调用成功:', result);
      
      if (result.result && result.result.success && result.result.data) {
        const products = result.result.data;
        
        // 处理商品图片URL
        const processedProducts = products.map(product => ({
          ...product,
          image: imageService.buildImageUrl(product.image || product.imagePath),
          images: product.images ? product.images.map(img => imageService.buildImageUrl(img)) : []
        }));
        
        // 一次性更新数据，避免多次setData导致闪烁
        this.setData({
          recommendProducts: processedProducts,
          loading: false
        });
        
        // 预加载商品图片
        const productImageUrls = processedProducts
          .map(product => product.image)
          .filter(url => url)
          .slice(0, 6); // 只预加载前6个商品的图片
        
        if (productImageUrls.length > 0) {
          imageService.preloadImages(productImageUrls).catch(err => {
            console.warn('商品图片预加载失败:', err);
          });
        }
        
        console.log('商品数据加载成功，共', processedProducts.length, '个商品');
      } else {
        console.warn('云函数返回数据格式异常:', result.result);
        this.loadDefaultProducts();
      }
      
    } catch (error) {
      console.error('调用云函数失败:', error);
      console.error('错误详情:', {
        errCode: error.errCode,
        errMsg: error.errMsg,
        message: error.message
      });
      
      // 显示更友好的错误提示（只在首次加载时显示）
      if (error.errCode === -501000 && this.data.recommendProducts.length === 0) {
        wx.showToast({
          title: '云函数未部署，显示默认数据',
          icon: 'none',
          duration: 2000
        });
      }
      
      this.loadDefaultProducts();
    }
  },

  // 加载默认商品数据（当云函数调用失败时使用）
  loadDefaultProducts() {
    console.log('加载默认商品数据');
    
    // 创建本地SVG图片
    const createColorImage = (color, text) => {
      const svg = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" fill="${color}"/>
        <text x="150" y="150" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
      </svg>`;
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    };
    
    const defaultProducts = [
      {
        _id: 'drink1',
        name: '柠檬蜂蜜茶',
        price: 28,
        currentPrice: 25,
        image: '/images/products/drink1.jpg',
        images: ['/images/products/drink1.jpg'],
        stock: 100,
        sales: 1500,
        description: '清香柠檬配蜂蜜，夏日消暑必备',
        category: '茶饮',
        brand: 'apple',
        tags: ['热销', '清香'],
        onSale: true
      },
      {
        _id: 'drink2',
        name: '芒果奶昔',
        price: 32,
        currentPrice: 28,
        image: '/images/products/drink2.jpg',
        images: ['/images/products/drink2.jpg'],
        stock: 80,
        sales: 800,
        description: '新鲜芒果制作，香甜可口',
        category: '奶昔',
        brand: 'samsung',
        tags: ['新品', '香甜'],
        onSale: true
      },
      {
        _id: 'drink3',
        name: '抹茶拿铁',
        price: 35,
        currentPrice: 32,
        image: '/images/products/drink3.jpg',
        images: ['/images/products/drink3.jpg'],
        stock: 60,
        sales: 600,
        description: '日式抹茶配香浓牛奶',
        category: '咖啡',
        brand: 'huawei',
        tags: ['经典', '香浓'],
        onSale: true
      },
      {
        _id: 'drink4',
        name: '草莓气泡水',
        price: 25,
        currentPrice: 22,
        image: '/images/products/drink4.jpg',
        images: ['/images/products/drink4.jpg'],
        stock: 120,
        sales: 900,
        description: '清爽草莓味，带气泡口感',
        category: '气泡水',
        brand: 'xiaomi',
        tags: ['清爽', '气泡'],
        onSale: true
      },
      {
        _id: 'drink5',
        name: '经典美式',
        price: 30,
        currentPrice: 26,
        image: '/images/products/drink1.jpg',
        images: ['/images/products/drink1.jpg'],
        stock: 90,
        sales: 700,
        description: '经典美式咖啡，苦香醇厚',
        category: '咖啡',
        brand: 'nike',
        tags: ['经典', '醇厚'],
        onSale: true
      },
      {
        _id: 'drink6',
        name: '蓝莓司康饼',
        price: 18,
        currentPrice: 15,
        image: '/images/products/drink2.jpg',
        images: ['/images/products/drink2.jpg'],
        stock: 50,
        sales: 300,
        description: '新鲜蓝莓制作，酥脆可口',
        category: '烘焙',
        brand: 'adidas',
        tags: ['新鲜', '酥脆'],
        onSale: true
      }
    ];
    
    this.setData({
      recommendProducts: defaultProducts,
      loading: false
    });
    
    console.log('默认商品数据加载完成:', defaultProducts.length + '个商品');
  },

  // 推广轮播图切换事件
  onPromoSwiperChange(e) {
    const current = e.detail.current;
    console.log('推广轮播图切换到:', current);
    
    // 更新当前索引
    this.setData({
      promoSwiperCurrent: current
    });
    
    // 同步切换主背景轮播图
    this.syncMainCarousel(current);
    
    // 可以在这里添加轮播图切换的业务逻辑
    // 比如切换背景色、更新统计等
  },

  // 同步主轮播图切换
  syncMainCarousel(index) {
    // 获取主轮播图组件实例
    const mainCarousel = this.selectComponent('#main-carousel');
    if (mainCarousel && mainCarousel.switchToIndex) {
      // 调用主轮播图的静默切换方法，避免触发change事件
      mainCarousel.switchToIndex(index, true);
      console.log('主轮播图已同步切换到索引:', index);
    }
  },

  // 同步推广轮播图切换
  syncPromoSwiper(index) {
    // 直接设置推广轮播图的当前索引
    this.setData({ 
      promoSwiperCurrent: index
    });
    
    console.log('推广轮播图已同步切换到索引:', index);
  },

  // 图片加载错误处理
  onImageError(e) {
    console.warn('首页商品图片加载失败:', e.detail);
    // image-placeholder组件已经内置了错误处理机制
    // 这里只需要记录日志即可
  }
});