// pages/product-detail/product-detail.js
const imageService = require('../../utils/imageService')

Page({
  data: {
    product: {},
    reviews: [],
    coupons: [],
    selectedSpecs: {},
    selectedSpecsText: '',
    quantity: 1,
    currentPrice: 0,
    currentStock: 0,
    showSpecModal: false,
    loading: true
  },

  onLoad(options) {
    const productId = options.id
    if (productId) {
      this.loadProductDetail(productId)
      this.loadProductReviews(productId)
      this.loadCoupons()
    }
  },

  // 加载商品详情
  async loadProductDetail(productId) {
    try {
      wx.showLoading({ title: '加载中...' })
      
      const res = await wx.cloud.callFunction({
        name: 'getProductDetail',
        data: { productId }
      })

      if (res.result.success) {
        const product = res.result.data
        
        // 处理商品图片URL
        if (product.image) {
          product.image = imageService.buildImageUrl(product.image)
        }
        
        // 处理商品图片数组
        if (product.images && product.images.length > 0) {
          product.images = product.images.map(img => imageService.buildImageUrl(img))
        } else {
          // 确保图片数组存在
          product.images = [product.image || '/images/placeholder.png']
        }

        this.setData({
          product,
          currentPrice: product.price,
          currentStock: product.stock,
          loading: false
        })
        
        // 预加载商品图片
        if (product.images && product.images.length > 0) {
          imageService.preloadImages(product.images).catch(err => {
            console.warn('商品图片预加载失败:', err)
          })
        }

        // 设置页面标题
        wx.setNavigationBarTitle({
          title: product.name
        })
      } else {
        wx.showToast({
          title: '商品不存在',
          icon: 'none'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    } catch (error) {
      console.error('加载商品详情失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 加载商品评价
  async loadProductReviews(productId) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getProductReviews',
        data: { productId }
      })

      if (res.result.success) {
        this.setData({
          reviews: res.result.data
        })
      }
    } catch (error) {
      console.error('加载评价失败:', error)
    }
  },

  // 加载优惠券
  async loadCoupons() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getCoupons',
        data: {}
      })

      if (res.result.success) {
        this.setData({
          coupons: res.result.data.slice(0, 3) // 只显示前3个优惠券
        })
      }
    } catch (error) {
      console.error('加载优惠券失败:', error)
    }
  },

  // 规格选择
  onSpecTap(e) {
    const { specName, option } = e.currentTarget.dataset
    const selectedSpecs = { ...this.data.selectedSpecs }
    selectedSpecs[specName] = option

    // 更新选中的规格文本
    const selectedSpecsText = Object.keys(selectedSpecs)
      .map(key => `${key}: ${selectedSpecs[key]}`)
      .join(', ')

    this.setData({
      selectedSpecs,
      selectedSpecsText
    })

    // 根据规格更新价格和库存
    this.updatePriceAndStock()
  },

  // 更新价格和库存
  updatePriceAndStock() {
    // 这里应该根据选中的规格计算实际价格和库存
    // 简化处理，使用基础价格和库存
    this.setData({
      currentPrice: this.data.product.price,
      currentStock: this.data.product.stock
    })
  },

  // 数量变更
  onQuantityChange(e) {
    const type = e.currentTarget.dataset.type
    let quantity = this.data.quantity

    if (type === 'plus') {
      if (quantity < this.data.currentStock) {
        quantity++
      } else {
        wx.showToast({
          title: '库存不足',
          icon: 'none'
        })
      }
    } else if (type === 'minus') {
      if (quantity > 1) {
        quantity--
      }
    }

    this.setData({ quantity })
  },

  // 数量输入
  onQuantityInput(e) {
    let quantity = parseInt(e.detail.value) || 1
    if (quantity < 1) quantity = 1
    if (quantity > this.data.currentStock) {
      quantity = this.data.currentStock
      wx.showToast({
        title: '库存不足',
        icon: 'none'
      })
    }
    this.setData({ quantity })
  },

  // 加入购物车
  onAddToCart() {
    if (this.data.product.specs && this.data.product.specs.length > 0) {
      this.setData({ showSpecModal: true })
    } else {
      this.addToCart()
    }
  },

  // 立即购买
  onBuyNow() {
    if (this.data.product.specs && this.data.product.specs.length > 0) {
      this.setData({ showSpecModal: true })
    } else {
      this.buyNow()
    }
  },

  // 确认加入购物车
  async onConfirmAddToCart() {
    await this.addToCart()
    this.setData({ showSpecModal: false })
  },

  // 确认立即购买
  async onConfirmBuyNow() {
    await this.buyNow()
    this.setData({ showSpecModal: false })
  },

  // 添加到购物车
  async addToCart() {
    try {
      wx.showLoading({ title: '添加中...' })

      const res = await wx.cloud.callFunction({
        name: 'addToCart',
        data: {
          productId: this.data.product._id,
          quantity: this.data.quantity,
          specs: this.data.selectedSpecs
        }
      })

      if (res.result.success) {
        wx.showToast({
          title: '已添加到购物车',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: res.result.message || '添加失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('添加购物车失败:', error)
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 立即购买
  async buyNow() {
    try {
      // 跳转到订单确认页面
      wx.navigateTo({
        url: `/pages/order-confirm/order-confirm?type=buy&productId=${this.data.product._id}&quantity=${this.data.quantity}&specs=${JSON.stringify(this.data.selectedSpecs)}`
      })
    } catch (error) {
      console.error('立即购买失败:', error)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  },

  // 关闭规格弹窗
  onCloseSpecModal() {
    this.setData({ showSpecModal: false })
  },

  // 优惠券点击
  onCouponTap(e) {
    const coupon = e.currentTarget.dataset.coupon
    // 领取优惠券逻辑
    wx.showToast({
      title: '领取成功',
      icon: 'success'
    })
  },

  // 图片预览
  onPreviewImage(e) {
    const { src, urls } = e.currentTarget.dataset
    
    // 确保预览的图片URL是完整的
    const processedUrls = urls.map(url => imageService.buildImageUrl(url))
    const processedCurrent = imageService.buildImageUrl(src)
    
    wx.previewImage({
      current: processedCurrent,
      urls: processedUrls
    })
  },

  // 分享
  onShareAppMessage() {
    return {
      title: this.data.product.name,
      path: `/pages/product-detail/product-detail?id=${this.data.product._id}`,
      imageUrl: this.data.product.image
    }
  }
})