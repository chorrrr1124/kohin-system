// 产品管理页面
Page({
  data: {
    products: [],
    loading: false,
    searchKeyword: '',
    showDeleteModal: false,
    deleteProductId: '',
    deleteProductName: '',
    lowStockCount: 0
  },

  onLoad: function() {
    this.loadProducts();
  },

  // 加载产品列表
  loadProducts: function() {
    const db = wx.cloud.database();
    this.setData({ loading: true });
    
    db.collection('products').get().then(res => {
      const products = res.data;
      const lowStockCount = products.filter(p => p.stock <= 10).length;
      
      this.setData({
        products: products,
        loading: false,
        lowStockCount: lowStockCount
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

  // 搜索输入
  onSearchInput: function(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
    this.filterProducts();
  },

  // 过滤产品
  filterProducts: function() {
    const keyword = this.data.searchKeyword.toLowerCase();
    if (!keyword) {
      this.loadProducts();
      return;
    }

    const db = wx.cloud.database();
    const _ = db.command;
    
    db.collection('products').where(_.or([
      {
        name: db.RegExp({
          regexp: keyword,
          options: 'i'
        })
      },
      {
        brand: db.RegExp({
          regexp: keyword,
          options: 'i'
        })
      },
      {
        specification: db.RegExp({
          regexp: keyword,
          options: 'i'
        })
      }
    ])).get().then(res => {
      const products = res.data;
      const lowStockCount = products.filter(p => p.stock <= 10).length;
      
      this.setData({
        products: products,
        lowStockCount: lowStockCount
      });
    }).catch(err => {
      console.error('搜索产品失败：', err);
      wx.showToast({
        title: '搜索失败',
        icon: 'error'
      });
    });
  },

  // 查看产品详情
  viewProductDetail: function(e) {
    const product = e.currentTarget.dataset.product;
    wx.navigateTo({
      url: `/pages/admin/productDetail/productDetail?id=${product._id}`
    });
  },

  // 编辑产品
  editProduct: function(e) {
    const product = e.currentTarget.dataset.product;
    wx.navigateTo({
      url: `/pages/admin/editProduct/editProduct?id=${product._id}`
    });
  },

  // 删除产品
  deleteProduct: function(e) {
    const id = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p._id === id);
    
    this.setData({
      showDeleteModal: true,
      deleteProductId: id,
      deleteProductName: product ? product.name : '未知产品'
    });
  },

  // 隐藏删除弹窗
  hideDeleteModal: function() {
    this.setData({
      showDeleteModal: false,
      deleteProductId: '',
      deleteProductName: ''
    });
  },

  // 阻止事件冒泡
  stopPropagation: function() {
    // 阻止事件冒泡
  },

  // 确认删除
  async confirmDelete() {
    const id = this.data.deleteProductId;
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
      
      // 隐藏弹窗
      this.hideDeleteModal();
      
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
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadProducts().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 页面显示时刷新数据
  onShow: function() {
    this.loadProducts();
  }
});