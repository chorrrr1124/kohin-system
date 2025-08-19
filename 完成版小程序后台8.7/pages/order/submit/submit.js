// 订单提交页面
Page({
  data: {
    cartItems: [],
    selectedAddress: null,
    totalAmount: 0
  },

  onLoad: function(options) {
    // 加载购物车数据和地址信息
    this.loadCartItems();
    this.loadAddress();
  },

  // 加载购物车数据
  loadCartItems: function() {
    const db = wx.cloud.database();
    db.collection('cart').where({
      _openid: wx.getStorageSync('openid')
    }).get().then(res => {
      this.setData({
        cartItems: res.data,
        totalAmount: this.calculateTotal(res.data)
      });
    });
  },

  // 加载地址信息
  loadAddress: function() {
    // 实现加载用户默认地址的逻辑
  },

  // 计算总金额
  calculateTotal: function(items) {
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  },

  // 提交订单
  async submitOrder() {
    try {
      wx.showLoading({
        title: '提交中...'
      });

      // 获取用户信息，检查是否为预存客户
      const userInfo = wx.getStorageSync('userInfo') || {};
      const customerId = userInfo.customerId;
      
      // 检查是否为预存产品订单
      let isPrepaidProduct = false;
      if (customerId && this.data.cartItems.length === 1) {
        // 如果用户是预存客户且只购买了一种产品，可能是预存产品
        const item = this.data.cartItems[0];
        // 这里可以添加更多的判断逻辑，例如检查产品类型等
        isPrepaidProduct = true;
        console.log('检测到预存产品订单:', item.name);
      }

      // 调用云函数处理订单提交和库存更新
      const result = await wx.cloud.callFunction({
        name: 'submitOrder',
        data: {
          cartItems: this.data.cartItems,
          address: this.data.selectedAddress,
          totalAmount: this.data.totalAmount,
          customerId: customerId,
          isPrepaidProduct: isPrepaidProduct
        }
      });

      if (result.result.success) {
        // 清空购物车
        await wx.cloud.callFunction({
          name: 'clearCart'
        });

        wx.showToast({
          title: '下单成功',
          icon: 'success'
        });

        // 跳转到订单列表页
        wx.redirectTo({
          url: '/pages/orders/orders'
        });
      } else {
        throw new Error(result.result.message);
      }
    } catch (err) {
      console.error('提交订单失败：', err);
      wx.showToast({
        title: err.message || '下单失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  }
});