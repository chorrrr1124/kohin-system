// pages/lowStock/lowStock.js
Page({
  data: {
    products: []
  },

  onLoad: function() {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    this.loadLowStockProducts()
  },

  // 加载低库存产品
  loadLowStockProducts: function() {
    // 这里应该从全局数据或云数据库中获取低库存产品
    // 示例数据
    const products = getApp().globalData.products || []
    const lowStockProducts = products.filter(product => product.stock <= 10)
    this.setData({
      products: lowStockProducts
    })
  },

  // 领取产品
  takeProduct: function(e) {
    const index = e.currentTarget.dataset.index
    const product = this.data.products[index]
    
    // 这里应该处理产品领取逻辑
    wx.showModal({
      title: '确认领取',
      content: `是否确认领取${product.name}？`,
      success: (res) => {
        if (res.confirm) {
          // 更新库存
          product.stock--
          this.setData({
            [`products[${index}].stock`]: product.stock
          })
          
          // 添加出库记录
          const record = {
            id: Date.now().toString(),
            productId: product.id,
            productName: product.name,
            quantity: 1,
            timestamp: Date.now(),
            type: 'out' // 标记为出库类型
          };
          
          wx.showToast({
            title: '领取成功',
            icon: 'success'
          })
        }
      }
    })
  }
})