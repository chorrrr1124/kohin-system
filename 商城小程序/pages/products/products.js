// pages/products/products.js
const imageService = require('../../utils/imageService')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    products: [],
    filteredProducts: [],
    searchKeyword: '',
    activeCategory: 'all',
    activeBrand: 'all',
    loading: false,
    hasMore: true,
    page: 1,
    limit: 10,
    categories: [
      { id: 'all', name: '全部' }
    ],
    brands: [
      { id: 'all', name: '全部品牌' }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadCategories()
    this.loadBrands()
    this.loadProducts()
    this.loadProductImages()
  },

  /**
   * 加载商品图片
   */
  loadProductImages: function() {
    wx.cloud.callFunction({
      name: 'getImages',
      data: { type: 'products' }
    }).then(res => {
      if (res.result && res.result.success) {
        // 将图片URL存储到全局数据中，供商品使用
        getApp().globalData.productImages = res.result.data;
        console.log('商品图片加载成功:', res.result.data.length, '张');
      }
    }).catch(err => {
      console.error('加载商品图片失败:', err);
    });
  },

  /**
   * 加载商品分类
   */
  loadCategories: function() {
    // 先获取所有商品，从中提取实际存在的分类
    wx.cloud.callFunction({
      name: 'getShopProducts',
      data: {
        limit: 1000, // 获取足够多的商品来分析分类
        onSale: true // 只获取上架商品
      },
      success: (res) => {
        if (res.result && res.result.success && res.result.data) {
          const products = res.result.data
          const categorySet = new Set()
          
          // 从商品中提取分类
          products.forEach(product => {
            if (product.category && product.category.trim()) {
              categorySet.add(product.category.trim())
            }
          })
          
          // 构建分类列表
          const categories = [
            { id: 'all', name: '全部' }
          ]
          
          // 添加实际存在的分类
          Array.from(categorySet).sort().forEach(categoryName => {
            categories.push({
              id: categoryName.toLowerCase(),
              name: categoryName
            })
          })
          
          // 如果有商品但没有分类，添加基本分类
          if (products.length > 0 && categorySet.size === 0) {
            // 根据商品特征添加动态分类
            const hotProducts = products.filter(p => (p.sales || 0) > 100)
            const newProducts = products.filter(p => this.isNewProduct(p.createTime))
            
            if (hotProducts.length > 0) {
              categories.push({ id: 'hot', name: '热销' })
            }
            if (newProducts.length > 0) {
              categories.push({ id: 'new', name: '新品' })
            }
          }
          
          this.setData({
            categories: categories
          })
        } else {
          // 如果没有商品数据，只显示全部分类
          this.setData({
            categories: [
              { id: 'all', name: '全部' }
            ]
          })
        }
      },
      fail: (err) => {
        console.error('获取商品数据失败:', err)
        // 失败时只显示全部分类
        this.setData({
          categories: [
            { id: 'all', name: '全部' }
          ]
        })
      }
    })
  },

  /**
   * 加载商品品牌
   */
  loadBrands: function() {
    // 调用云函数获取商品品牌
    wx.cloud.callFunction({
      name: 'getBrands',
      data: {
        limit: 20,
        status: 'active'
      },
      success: (res) => {
        if (res.result && res.result.success && res.result.data) {
          const brands = [
            { id: 'all', name: '全部品牌' }
          ]
          
          // 添加从云端获取的品牌
          res.result.data.forEach(brand => {
            if (brand && brand.name) {
              brands.push({
                id: brand.code || brand.name.toLowerCase(),
                name: brand.name,
                _id: brand._id
              })
            }
          })
          
          this.setData({
            brands: brands
          })
        }
      },
      fail: (err) => {
        console.error('获取品牌失败:', err)
        // 使用默认品牌
        this.setData({
          brands: [
            { id: 'all', name: '全部品牌' },
            { id: 'apple', name: 'Apple' },
            { id: 'samsung', name: 'Samsung' },
            { id: 'huawei', name: 'Huawei' },
            { id: 'xiaomi', name: 'Xiaomi' },
            { id: 'nike', name: 'Nike' },
            { id: 'adidas', name: 'Adidas' }
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
        if (res.result && res.result.success) {
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
            image: imageService.buildImageUrl(item.image || item.imagePath) || '/images/placeholder.svg',
          imageUrl: imageService.buildImageUrl(item.image || item.imagePath) || '/images/placeholder.svg',
          images: item.images ? item.images.map(img => imageService.buildImageUrl(img)) : [imageService.buildImageUrl(item.image || item.imagePath) || '/images/placeholder.svg'],
            stock: item.stock || 0,
            sales: item.sales || 0,
            category: item.category,
            isHot: (item.sales || 0) > 100, // 根据销量判断是否热销
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

          // 一次性更新所有数据，避免多次setData导致闪烁
          const updateData = {
            products: allProducts,
            loading: false,
            hasMore: newProducts.length === this.data.limit,
            page: this.data.page + 1
          }
          
          // 只有在有搜索或筛选条件时才更新filteredProducts
          if (this.data.searchKeyword || this.data.activeFilter !== 'all') {
            updateData.filteredProducts = this.filterProducts(allProducts)
          }
          
          this.setData(updateData)
        } else {
          console.error('获取商品数据失败:', res.result ? res.result.message : '未知错误')
          this.loadDefaultProducts() // 加载默认商品数据
        }
      },
      fail: err => {
        console.error('调用云函数失败:', err)
        // 云函数调用失败时加载默认数据，避免页面空白
        this.loadDefaultProducts()
        
        // 只在首次加载失败时显示提示
        if (this.data.page === 1) {
          wx.showToast({
            title: '云函数未部署，显示默认数据',
            icon: 'none',
            duration: 2000
          })
        }
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

  // 加载默认商品数据（云函数调用失败时使用）
  loadDefaultProducts: function() {
    const defaultProducts = [
      {
        _id: 'default_1',
        id: 'default_1',
        productName: '夏日柠檬茶',
        name: '夏日柠檬茶',
        currentPrice: 25,
        price: 25,
        originalPrice: 30,
        image: '/images/products/drink1.jpg',
        imageUrl: '/images/products/drink1.jpg',
        images: ['/images/products/drink1.jpg'],
        stock: 100,
        sales: 150,
        category: '饮品',
        isHot: true,
        isNew: false,
        description: '清香柠檬茶，夏日消暑必备',
        brand: 'apple',
        specification: '500ml',
        onSale: true,
        tags: ['热销']
      },
      {
        _id: 'default_2',
        id: 'default_2',
        productName: '经典奶茶',
        name: '经典奶茶',
        currentPrice: 20,
        price: 20,
        originalPrice: 20,
        image: '/images/products/drink2.jpg',
        imageUrl: '/images/products/drink2.jpg',
        images: ['/images/products/drink2.jpg'],
        stock: 80,
        sales: 80,
        category: '饮品',
        isHot: false,
        isNew: true,
        description: '香浓奶茶，经典口味',
        brand: 'samsung',
        specification: '500ml',
        onSale: true,
        tags: ['新品']
      },
      {
        _id: 'default_3',
        id: 'default_3',
        productName: '水果沙拉',
        name: '水果沙拉',
        currentPrice: 35,
        price: 35,
        originalPrice: 40,
        image: '/images/products/drink3.jpg',
        imageUrl: '/images/products/drink3.jpg',
        images: ['/images/products/drink3.jpg'],
        stock: 50,
        sales: 60,
        category: '轻食',
        isHot: false,
        isNew: false,
        description: '新鲜水果沙拉，健康美味',
        brand: 'huawei',
        specification: '300g',
        onSale: true,
        tags: []
      }
    ]

    const updateData = {
      products: defaultProducts,
      loading: false,
      hasMore: false,
      page: 1
    }
    
    // 只有在有搜索或筛选条件时才更新filteredProducts
    if (this.data.searchKeyword || this.data.activeFilter !== 'all') {
      updateData.filteredProducts = this.filterProducts(defaultProducts)
    }
    
    this.setData(updateData)
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
    // 实时搜索过滤
    this.filterProducts()
  },

  /**
   * 搜索确认
   */
  onSearchConfirm: function() {
    this.filterProducts()
  },

  /**
   * 分类点击
   */
  onCategoryTap: function(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      activeCategory: category
    })
    this.filterProducts()
  },

  /**
   * 品牌点击
   */
  onBrandTap: function(e) {
    const brand = e.currentTarget.dataset.brand
    this.setData({
      activeBrand: brand
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
        (product.productName || product.name || '').toLowerCase().includes(keyword) ||
        (product.description || '').toLowerCase().includes(keyword)
      )
    }
    
    // 分类筛选
    if (this.data.activeCategory !== 'all') {
      filtered = filtered.filter(product => {
        const category = product.category || product.type || ''
        return category.toLowerCase() === this.data.activeCategory.toLowerCase()
      })
    }
    
    // 品牌筛选
    if (this.data.activeBrand !== 'all') {
      filtered = filtered.filter(product => {
        const brand = product.brand || ''
        return brand.toLowerCase() === this.data.activeBrand.toLowerCase()
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
    app.updateCartBadge()
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
          [updateKey]: '/images/placeholder.svg'
        });
      }
      
      // 更新filteredProducts数组
      const filteredIndex = this.data.filteredProducts.findIndex(p => p._id === productId || p.id === productId);
      if (filteredIndex !== -1) {
        const updateKey = `filteredProducts[${filteredIndex}].image`;
        this.setData({
          [updateKey]: '/images/placeholder.svg'
        });
      }
    }
  }
})