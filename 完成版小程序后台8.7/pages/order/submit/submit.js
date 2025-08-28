// 订单提交页面
Page({
  data: {
    cartItems: [],
    selectedAddress: null,
    totalAmount: 0,
    remark: '',
    canSubmit: false,
    submitting: false
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
      const cartItems = res.data;
      const totalAmount = this.calculateTotal(cartItems);
      
      this.setData({
        cartItems: cartItems,
        totalAmount: totalAmount
      });
      
      this.checkCanSubmit();
    }).catch(err => {
      console.error('加载购物车失败：', err);
      wx.showToast({
        title: '加载购物车失败',
        icon: 'error'
      });
    });
  },

  // 加载地址信息
  loadAddress: function() {
    // 从本地存储获取默认地址
    const defaultAddress = wx.getStorageSync('defaultAddress');
    if (defaultAddress) {
      this.setData({
        selectedAddress: defaultAddress
      });
      this.checkCanSubmit();
    }
  },

  // 选择地址
  selectAddress: function() {
    wx.navigateTo({
      url: '/pages/address/address?select=true'
    });
  },

  // 计算总金额
  calculateTotal: function(items) {
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  },

  // 备注输入
  onRemarkInput: function(e) {
    this.setData({
      remark: e.detail.value
    });
  },

  // 检查是否可以提交
  checkCanSubmit: function() {
    const canSubmit = this.data.cartItems.length > 0 && this.data.selectedAddress;
    this.setData({ canSubmit });
  },

  // 提交订单
  async submitOrder() {
    if (!this.data.canSubmit) {
      wx.showToast({
        title: '请选择收货地址',
        icon: 'none'
      });
      return;
    }

    try {
      this.setData({ submitting: true });

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
          isPrepaidProduct: isPrepaidProduct,
          remark: this.data.remark
        }
      });

      if (result.result.success) {
        // 清空购物车
        try {
        await wx.cloud.callFunction({
          name: 'clearCart'
        });
        } catch (err) {
          console.warn('清空购物车失败：', err);
        }

        wx.showToast({
          title: '下单成功',
          icon: 'success'
        });

        // 跳转到订单列表页
        setTimeout(() => {
        wx.redirectTo({
          url: '/pages/orders/orders'
        });
        }, 1500);
      } else {
        throw new Error(result.result.message || '下单失败');
      }
    } catch (err) {
      console.error('提交订单失败：', err);
      wx.showToast({
        title: err.message || '下单失败',
        icon: 'error'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 页面显示时刷新数据
  onShow: function() {
    // 检查是否有新选择的地址
    const selectedAddress = wx.getStorageSync('selectedAddress');
    if (selectedAddress) {
      this.setData({
        selectedAddress: selectedAddress
      });
      this.checkCanSubmit();
      // 清除临时选择的地址
      wx.removeStorageSync('selectedAddress');
    }
  },

  // 页面隐藏时清理数据
  onHide: function() {
    // 清理临时数据
  }
});