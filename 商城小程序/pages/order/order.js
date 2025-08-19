Page({
  data: {
    orderInfo: {},
    products: [],
    totalPrice: 0,
    address: {
      name: '',
      phone: '',
      address: ''
    },
    paymentMethod: 'wechat',
    remark: ''
  },

  onLoad: function(options) {
    // 从购物车传递过来的商品信息
    if (options.products) {
      const products = JSON.parse(decodeURIComponent(options.products));
      this.calculateTotal(products);
    }
    
    // 获取用户默认地址
    this.getDefaultAddress();
  },

  // 计算总价
  calculateTotal: function(products) {
    let total = 0;
    products.forEach(item => {
      total += item.price * item.quantity;
    });
    
    this.setData({
      products: products,
      totalPrice: total
    });
  },

  // 获取默认地址
  getDefaultAddress: function() {
    // 这里应该从本地存储或服务器获取用户默认地址
    const address = wx.getStorageSync('defaultAddress') || {
      name: '请选择收货地址',
      phone: '',
      address: ''
    };
    
    this.setData({
      address: address
    });
  },

  // 选择地址
  selectAddress: function() {
    wx.navigateTo({
      url: '/pages/address/address'
    });
  },

  // 支付方式选择
  onPaymentChange: function(e) {
    this.setData({
      paymentMethod: e.detail.value
    });
  },

  // 备注输入
  onRemarkInput: function(e) {
    this.setData({
      remark: e.detail.value
    });
  },

  // 提交订单
  submitOrder: async function() {
    // 检查登录状态
    const app = getApp();
    if (!app.globalData.isLoggedIn || !app.globalData.openid) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    if (!this.data.address.name || this.data.address.name === '请选择收货地址') {
      wx.showToast({
        title: '请选择收货地址',
        icon: 'none'
      });
      return;
    }

    if (this.data.products.length === 0) {
      wx.showToast({
        title: '购物车为空',
        icon: 'none'
      });
      return;
    }

    const orderData = {
      products: this.data.products,
      totalPrice: this.data.totalPrice,
      address: this.data.address,
      paymentMethod: this.data.paymentMethod,
      remark: this.data.remark,
      status: 'pending'
    };

    wx.showLoading({
      title: '正在提交订单...'
    });

    try {
      // 调用云函数提交订单
      const result = await wx.cloud.callFunction({
        name: 'submitOrder',
        data: orderData
      });

      if (result.result.success) {
        // 清空购物车
        wx.setStorageSync('cart', []);
        app.globalData.cart = [];

        wx.showToast({
          title: '订单提交成功',
          icon: 'success'
        });

        // 跳转到订单列表页面
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/orders/orders'
          });
        }, 1500);
      } else {
        throw new Error(result.result.message || '订单提交失败');
      }
    } catch (error) {
      console.error('提交订单失败:', error);
      wx.showToast({
        title: error.message || '订单提交失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  }
});