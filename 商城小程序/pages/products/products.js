// pages/products/products.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    products: [],
    filteredProducts: [],
    searchKeyword: '',
    activeFilter: 'all',
    priceSort: '',
    loading: false,
    hasMore: true,
    page: 1,
    limit: 10,
    categories: [
      { id: 'all', name: '全部' },
      { id: 'hot', name: '热销' },
      { id: 'new', name: '新品' }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadCategories()
    this.loadProducts()
  },

  /**
   * 加载商品分类
   */
  loadCategories: function() {
    // 调用云函数获取商品分类
    wx.cloud.callFunction({
      name: 'getShopProducts',
      data: {
        getCategories: true
      },
      success: (res) => {
        if (res.result && res.result.success && res.result.categories) {
          const categories = [
            { id: 'all', name: '全部' },
            { id: 'hot', name: '热销' },
            { id: 'new', name: '新品' },
            ...res.result.categories.map(cat => ({
              id: cat,
              name: cat
            }))
          ]
          this.setData({ categories })
        }
      },
      fail: (err) => {
        console.error('获取分类失败：', err)
        // 使用默认分类
        this.setData({
          categories: [
            { id: 'all', name: '全部' },
            { id: 'hot', name: '热销' },
            { id: 'new', name: '新品' },
            { id: '服装', name: '服装' },
            { id: '数码', name: '数码' },
            { id: '家居', name: '家居' },
            { id: '美妆', name: '美妆' }
          ]
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 更新购物车数量
    this.updateCartCount()
  },

  /**
   * 加载商品列表
   */
  loadProducts: function() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })

    // 调用云函数获取商品数据
    wx.cloud.callFunction({
      name: 'getShopProducts',
      data: {
        limit: this.data.limit,
        skip: (this.data.page - 1) * this.data.limit,
        category: (this.data.activeFilter === 'all' || this.data.activeFilter === 'hot' || this.data.activeFilter === 'new') ? '' : this.data.activeFilter,
        onSale: true // 只获取上架商品
      },
      success: res => {
        console.log('获取商品数据成功:', res.result)
        if (res.result.success) {
          const newProducts = res.result.data || []
          
          // 处理商品数据，确保格式兼容
          const processedProducts = newProducts.map(item => ({
            id: item._id,
            _id: item._id,
            productName: item.name || item.productName,
            name: item.name,
            currentPrice: item.price,
            price: item.price,
            originalPrice: item.originalPrice || item.price,
            image: item.image || '/images/placeholder.png',
            imageUrl: item.image || '/images/placeholder.png',
            images: item.images || [item.image || '/images/placeholder.png'],
            stock: item.stock,
            sales: item.sales || 0,
            category: item.category,
            isHot: item.sales > 100, // 根据销量判断是否热销
            isNew: this.isNewProduct(item.createTime), // 根据创建时间判断是否新品
            description: item.description,
            brand: item.brand,
            specification: item.specification,
            onSale: item.onSale,
            tags: item.isHot ? ['热销'] : (item.isNew ? ['新品'] : [])
          }))

          let allProducts = []
          if (this.data.page === 1) {
            allProducts = processedProducts
          } else {
            allProducts = [...this.data.products, ...processedProducts]
          }

          this.setData({
            products: allProducts,
            filteredProducts: this.filterProducts(allProducts),
            loading: false,
            hasMore: newProducts.length === this.data.limit,
            page: this.data.page + 1
          })
        } else {
          console.error('获取商品数据失败:', res.result.message)
          this.setData({ loading: false })
          wx.showToast({
            title: res.result.message || '加载失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        console.error('调用云函数失败:', err)
        this.setData({ loading: false })
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
      }
    })
  },

  // 判断是否为新品（7天内创建的商品）
  isNewProduct: function(createTime) {
    if (!createTime) return false
    const now = new Date().getTime()
    const productTime = new Date(createTime).getTime()
    const daysDiff = (now - productTime) / (1000 * 60 * 60 * 24)
    return daysDiff <= 7
  },

  // 加载商品分类
  loadCategories: function() {
    wx.cloud.callFunction({
      name: 'getShopProducts',
      data: {
        limit: 1000, // 获取所有商品来提取分类
        skip: 0,
        onSale: true
      },
      success: res => {
        if (res.result.success) {
          const products = res.result.data || []
          const categorySet = new Set()
          
          // 提取所有分类
          products.forEach(product => {
            if (product.type) {
              categorySet.add(product.type)
            }
            if (product.category && product.category !== product.type) {
              categorySet.add(product.category)
            }
          })
          
          // 构建分类数组
          const dynamicCategories = Array.from(categorySet).map(cat => ({
            id: cat,
            name: cat
          }))
          
          // 合并默认分类和动态分类
          const allCategories = [
            { id: 'all', name: '全部' },
            { id: 'hot', name: '热销' },
            { id: 'new', name: '新品' },
            ...dynamicCategories
          ]
          
          this.setData({
            categories: allCategories
          })
        }
      },
      fail: err => {
        console.error('加载分类失败:', err)
      }
    })
  },

  /**
   * 搜索输入
   */
  onSearchInput: function(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  /**
   * 搜索确认
   */
  onSearchConfirm: function() {
    this.filterProducts()
  },

  /**
   * 筛选点击
   */
  onFilterTap: function(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({
      activeFilter: filter,
      priceSort: ''
    })
    this.filterProducts()
  },

  /**
   * 价格排序
   */
  onSortByPrice: function() {
    let priceSort = ''
    if (this.data.priceSort === '') {
      priceSort = 'asc'
    } else if (this.data.priceSort === 'asc') {
      priceSort = 'desc'
    } else {
      priceSort = ''
    }
    
    this.setData({
      priceSort: priceSort,
      activeFilter: priceSort ? 'price' : 'all'
    })
    this.filterProducts()
  },

  /**
   * 筛选商品
   */
  filterProducts: function(products) {
    const sourceProducts = products || this.data.products
    let filtered = [...sourceProducts]
    
    // 关键词搜索
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase()
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(keyword)
      )
    }
    
    // 分类筛选
    if (this.data.activeFilter !== 'all' && this.data.activeFilter !== 'price') {
      switch (this.data.activeFilter) {
        case 'hot':
          filtered = filtered.filter(product => product.isHot)
          break
        case 'new':
          filtered = filtered.filter(product => product.isNew)
          break
        default:
          // 按商品类型或分类筛选
          filtered = filtered.filter(product => 
            product.category === this.data.activeFilter || 
            product.type === this.data.activeFilter
          )
      }
    }
    
    // 价格排序
    if (this.data.priceSort) {
      filtered.sort((a, b) => {
        if (this.data.priceSort === 'asc') {
          return a.price - b.price
        } else {
          return b.price - a.price
        }
      })
    }
    
    // 如果传入了products参数，则返回过滤结果；否则更新data
    if (products) {
      return filtered
    } else {
      this.setData({
        filteredProducts: filtered
      })
    }
  },

  /**
   * 商品点击
   */
  onProductTap: function(e) {
    const productId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product-detail/product-detail?id=${productId}`
    })
  },

  /**
   * 添加到购物车
   */
  onAddToCart: function(e) {
    const productId = e.currentTarget.dataset.id
    const product = this.data.products.find(p => p._id === productId || p.id === productId)
    
    if (!product) return
    
    if (product.stock <= 0) {
      wx.showToast({
        title: '商品已售罄',
        icon: 'none'
      })
      return
    }
    
    // 添加到购物车
    const app = getApp()
    app.addToCart(product)
    
    wx.showToast({
      title: '已添加到购物车',
      icon: 'success'
    })
    
    this.updateCartCount()
  },

  /**
   * 更新购物车数量
   */
  updateCartCount: function() {
    const app = getApp()
    const cartCount = app.getCartCount()
    
    if (cartCount > 0) {
      wx.setTabBarBadge({
        index: 2,
        text: cartCount.toString()
      })
    } else {
      wx.removeTabBarBadge({
        index: 2
      })
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.setData({
      products: [],
      filteredProducts: [],
      page: 1,
      hasMore: true
    })
    this.loadProducts()
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.loadProducts()
  },

  // 图片加载错误处理
  onImageError(e) {
    console.warn('商品图片加载失败:', e.detail);
    const index = e.currentTarget.dataset.index;
    if (index !== undefined) {
      // 获取商品ID来准确定位商品
      const productId = e.currentTarget.dataset.id;
      
      // 更新products数组
      const productsIndex = this.data.products.findIndex(p => p._id === productId || p.id === productId);
      if (productsIndex !== -1) {
        const updateKey = `products[${productsIndex}].image`;
        this.setData({
          [updateKey]: '/images/placeholder.png'
        });
      }
      
      // 更新filteredProducts数组
      const filteredIndex = this.data.filteredProducts.findIndex(p => p._id === productId || p.id === productId);
      if (filteredIndex !== -1) {
        const updateKey = `filteredProducts[${filteredIndex}].image`;
        this.setData({
          [updateKey]: '/images/placeholder.png'
        });
      }
    }
  }
}) 