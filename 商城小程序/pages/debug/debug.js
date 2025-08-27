// pages/debug/debug.js
const imageService = require('../../utils/imageService')

Page({
  data: {
    testImages: [
      '/images/products/drink1.jpg',
      '/images/products/drink2.jpg', 
      '/images/placeholder.svg',
      'images/products/drink1.jpg', // 测试不带前缀的路径
      'https://via.placeholder.com/300x300?text=测试图片' // 测试外部URL
    ],
    processedImages: [],
    loadResults: []
  },

  onLoad() {
    this.testImageProcessing()
    this.testCloudFunction()
  },

  // 测试图片处理
  testImageProcessing() {
    const processedImages = this.data.testImages.map(img => {
      const processed = imageService.buildImageUrl(img)
      console.log(`原始: ${img} -> 处理后: ${processed}`)
      return processed
    })
    
    this.setData({ processedImages })
  },

  // 测试云函数
  async testCloudFunction() {
    try {
      console.log('开始测试云函数...')
      const result = await wx.cloud.callFunction({
        name: 'getShopProducts',
        data: {
          limit: 3,
          onSale: true
        }
      })
      
      console.log('云函数返回结果:', result)
      
      if (result.result && result.result.success) {
        const products = result.result.data
        console.log('商品数据:', products)
        
        // 检查每个商品的图片字段
        products.forEach((product, index) => {
          console.log(`商品${index + 1}:`, {
            name: product.name,
            image: product.image,
            imagePath: product.imagePath,
            images: product.images
          })
        })
      }
    } catch (error) {
      console.error('云函数调用失败:', error)
    }
  },

  // 图片加载成功
  onImageLoad(e) {
    const index = e.currentTarget.dataset.index
    console.log(`图片${index}加载成功:`, e.detail)
    
    const loadResults = [...this.data.loadResults]
    loadResults[index] = { status: 'success', detail: e.detail }
    this.setData({ loadResults })
  },

  // 图片加载失败
  onImageError(e) {
    const index = e.currentTarget.dataset.index
    console.log(`图片${index}加载失败:`, e.detail)
    
    const loadResults = [...this.data.loadResults]
    loadResults[index] = { status: 'error', detail: e.detail }
    this.setData({ loadResults })
  }
})