// pages/cart/cart.js
const imageService = require('../../utils/imageService')
Page({
  data: {
    // 选中的分类
    selectedCategory: 'all',
    sectionTitle: '全部商品',
    cartCount: 0,
    brandName: 'KOHIN',
    
    // 分类菜单（初始化为默认）
    categories: [
      { id: 'all', name: '全部', icon: '/images/category/all.png' }
    ],
    
    // 商品列表
    products: [],
    allProducts: []
  },

  onLoad(options) {
    if (options && options.brand) {
      this.setData({ brandName: options.brand })
    }
    this.loadMallData();
  },

  onShow() {
    this.updateCartCount();
  },

  // 加载商城数据
  async loadMallData() {
    this.updateCartCount();
    await Promise.all([
      this.loadCategories(),
      this.loadProducts()
    ])
    this.applyCategoryFilter(this.data.selectedCategory)
  },

  // 加载分类（从 getShopProducts 的 getCategories 或独立 getCategories 获取）
  async loadCategories() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getShopProducts',
        data: { getCategories: true }
      })
      if (res && res.result && res.result.success && Array.isArray(res.result.categories)) {
        const dynamicCategories = res.result.categories
          .filter(cat => !!cat && String(cat).trim() !== '')
          .map(cat => ({ id: cat, name: cat }))

        const categories = [
          { id: 'all', name: '全部', icon: '/images/category/all.png' },
          ...dynamicCategories
        ]
        this.setData({ categories })
        return
      }
    } catch (e) {
      console.warn('getShopProducts.getCategories 失败，尝试调用独立 getCategories', e)
    }

    // 兜底：调用独立云函数 getCategories
    try {
      const res2 = await wx.cloud.callFunction({ name: 'getCategories', data: { limit: 100 } })
      if (res2 && res2.result && res2.result.success && Array.isArray(res2.result.data)) {
        const categories = [{ id: 'all', name: '全部', icon: '/images/category/all.png' }].concat(
          res2.result.data.map(c => ({ id: c.type || c._id || c.name, name: c.name, icon: c.icon }))
        )
        this.setData({ categories })
      }
    } catch (err) {
      console.error('获取分类失败，使用默认分类:', err)
      this.setData({
        categories: [ { id: 'all', name: '全部', icon: '/images/category/all.png' } ]
      })
    }
  },

  // 从shopProducts集合加载商品（与8.7下单一致）
  async loadProducts(category = '') {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getShopProducts',
        data: { limit: 200, skip: 0, onSale: true, category: category === 'all' ? '' : category }
      });

      if (res && res.result && res.result.success) {
        const list = (res.result.data || []).map(item => ({
          id: item._id,
          _id: item._id,
          name: item.name || '未命名商品',
          description: item.description || item.specification || '',
          price: item.price || 0,
          image: imageService && imageService.buildImageUrl ? imageService.buildImageUrl(item.image) : (item.image || '/images/placeholder.png'),
          detail: item.description || '' ,
          stock: item.stock || 0,
          category: item.category || item.type || ''
        }));

        this.setData({ allProducts: list, products: list });
      } else {
        console.warn('getShopProducts 无有效数据');
      }
    } catch (err) {
      console.error('加载商品失败:', err);
      wx.showToast({ title: '网络异常，使用占位数据', icon: 'none' });
    }
  },

  // 应用分类筛选
  applyCategoryFilter(categoryId) {
    const all = this.data.allProducts || []
    if (!categoryId || categoryId === 'all') {
      this.setData({ products: all, sectionTitle: '全部商品' })
      return
    }
    const filtered = all.filter(p => p.category === categoryId)
    this.setData({ products: filtered, sectionTitle: categoryId })
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
    this.setData({ selectedCategory: categoryId });
    this.applyCategoryFilter(categoryId)

    // 如需从后端按类分页，可切换为重新加载：
    // this.loadProducts(categoryId)
  },

  // 添加到购物车
  onAddToCart(e) {
    const productId = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p.id === productId || p._id === productId);
    
    if (!product) return;

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
      _id: (product._id || product.id || Date.now().toString()),
      id: (product.id || product._id),
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      quantity: 1,
      selected: true,
      stock: product.stock || 999
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