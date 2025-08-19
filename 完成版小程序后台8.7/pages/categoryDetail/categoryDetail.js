// pages/categoryDetail/categoryDetail.js
Page({
  data: {
    category: '',
    products: []
  },

  onLoad: function(options) {
    // 获取传递的分类名称和产品数据
    const category = options.category || '未知分类';
    let products = [];
    
    try {
      if (options.products) {
        products = JSON.parse(decodeURIComponent(options.products));
      }
    } catch (error) {
      console.error('解析产品数据失败:', error);
    }
    
    this.setData({
      category: category,
      products: products
    });
  },

  // 领取产品
  takeProduct: function(e) {
    const index = e.currentTarget.dataset.index;
    const product = this.data.products[index];
    
    wx.showModal({
      title: '领取产品',
      content: `请输入领取 ${product.name} 的数量`,
      editable: true,
      placeholderText: '请输入数字',
      success: (res) => {
        if (res.confirm) {
          const quantity = parseInt(res.content);
          
          if (isNaN(quantity) || quantity <= 0) {
            wx.showToast({
              title: '请输入有效数量',
              icon: 'none'
            });
            return;
          }
          
          if (quantity > product.stock) {
            wx.showToast({
              title: '库存不足',
              icon: 'none'
            });
            return;
          }
          
          // 更新库存
          const app = getApp();
          const allProducts = app.globalData.products;
          const productIndex = allProducts.findIndex(p => p.id === product.id);
          
          if (productIndex !== -1) {
            allProducts[productIndex].stock -= quantity;
            
            // 添加出库记录
            const record = {
              id: Date.now().toString(),
              productId: product.id,
              productName: product.name,
              quantity: quantity,
              timestamp: Date.now(),
              type: 'out' // 标记为出库类型
            };
            
            app.globalData.records.unshift(record);
            
            // 保存到本地存储
            wx.setStorageSync('products', allProducts);
            wx.setStorageSync('records', app.globalData.records);
            
            // 更新当前页面数据
            this.setData({
              [`products[${index}].stock`]: product.stock - quantity
            });
            
            wx.showToast({
              title: '领取成功',
              icon: 'success'
            });
          }
        }
      }
    });
  }
});