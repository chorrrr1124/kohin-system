// pages/cart/cart.js
Page({
  data: {
    // 选中的分类
    selectedCategory: 1,
    cartCount: 0,
    
    // 分类菜单
    categories: [
      { id: 1, name: '新品抢先喝', icon: '/images/placeholder.png', isNew: true },
      { id: 2, name: '爆款柠檬茶', icon: '/images/placeholder.png', isNew: false },
      { id: 3, name: '超大杯柠檬茶', icon: '/images/placeholder.png', isNew: false },
      { id: 4, name: '气泡柠檬茶', icon: '/images/placeholder.png', isNew: false },
      { id: 5, name: '甄选纯茶', icon: '/images/placeholder.png', isNew: false }
    ],
    
    // 商品列表
    products: [
      {
        id: 1,
        name: '醺醺瓜柠檬茶',
        description: '夏日解暑醺醺瓜新品',
        price: 21,
        image: '/images/placeholder.png',
        detail: '满杯西瓜·鲜活盛夏，当季醺醺瓜现播，入口清甜透心凉'
      },
      {
        id: 2,
        name: '醺醺瓜柠檬茶（超大杯）',
        description: '超大杯    畅饮吃瓜超满足',
        price: 28,
        image: '/images/placeholder.png',
        detail: '新鲜现榨醺醺瓜西瓜，大口果肉脆甜爆汁，夏日必备解腻神器'
      },
      {
        id: 3,
        name: '招牌柠檬茶',
        description: '经典口味，回味无穷',
        price: 18,
        image: '/images/placeholder.png',
        detail: '精选优质柠檬，手工现榨，茶香柠香完美融合'
      }
    ]
  },

  onLoad(options) {
    this.loadMallData();
  },

  onShow() {
    this.updateCartCount();
  },

  // 加载商城数据
  loadMallData() {
    // 这里可以从服务器获取商品数据
    console.log('加载商城数据');
    this.updateCartCount();
  },

  // 更新购物车数量
  updateCartCount() {
    const app = getApp();
    const cartItems = app.getCartItems();
    const count = cartItems.reduce((total, item) => total + item.quantity, 0);
    
    this.setData({
      cartCount: count
    });
  },

  // 选择分类
  onSelectCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    this.setData({
      selectedCategory: categoryId
    });
    
    // 根据分类加载对应商品
    this.loadProductsByCategory(categoryId);
  },

  // 根据分类加载商品
  loadProductsByCategory(categoryId) {
    // 这里可以根据分类ID从服务器获取对应的商品
    console.log('加载分类商品:', categoryId);
  },

  // 添加到购物车
  onAddToCart(e) {
    const productId = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p.id === productId);
    
    if (!product) return;

    // 这里应该跳转到商品详情或规格选择页面
    wx.showModal({
      title: '选择规格',
      content: `${product.name}\n${product.description}\n¥${product.price}`,
      confirmText: '加入购物车',
      success: (res) => {
        if (res.confirm) {
          this.addToCart(product);
        }
      }
    });
  },

  // 添加商品到购物车
  addToCart(product) {
    const app = getApp();
    const cartItem = {
      _id: Date.now().toString(),
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      quantity: 1,
      selected: true,
      stock: 999
    };

    app.addToCart(cartItem);
    this.updateCartCount();
    
    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    });
  },

  // 搜索商品
  onSearch(e) {
    const keyword = e.detail.value;
    console.log('搜索关键词:', keyword);
    // 实现搜索逻辑
  },

  // 跳转到购物车
  onGoToCart() {
    wx.navigateTo({
      url: '/pages/cart/cart'
    });
  },

  // 店铺详情
  onStoreDetail() {
    wx.showToast({
      title: '查看店铺详情',
      icon: 'none'
    });
  },

  // 选择配送方式
  onSelectDelivery(e) {
    const type = e.currentTarget.dataset.type;
    console.log('选择配送方式:', type);
  },

  // 立即解锁优惠
  onUnlockPromotion() {
    wx.showToast({
      title: '优惠已解锁',
      icon: 'success'
    });
  },

  // VIP下单
  onVipOrder() {
    wx.showToast({
      title: 'VIP专享优惠',
      icon: 'none'
    });
  }
});