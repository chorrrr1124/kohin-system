// 产品管理页面
Page({
  data: {
    products: [],
    loading: false
  },

  onLoad: function() {
    this.loadProducts();
  },

  // 加载产品列表
  loadProducts: function() {
    const db = wx.cloud.database();
    this.setData({ loading: true });
    
    db.collection('products').get().then(res => {
      this.setData({
        products: res.data,
        loading: false
      });
    }).catch(err => {
      console.error('加载产品列表失败：', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    });
  },

  // 删除产品
  async deleteProduct(e) {
    const id = e.currentTarget.dataset.id;
    const db = wx.cloud.database();
    
    try {
      // 显示加载提示
      wx.showLoading({
        title: '删除中...',
      });

      // 开始云函数调用，确保事务性删除
      await wx.cloud.callFunction({
        name: 'deleteProduct',
        data: {
          productId: id
        }
      });

      // 删除成功后刷新列表
      this.loadProducts();
      
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    } catch (err) {
      console.error('删除产品失败：', err);
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  }
});