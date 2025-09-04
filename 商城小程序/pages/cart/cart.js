// pages/cart/cart.js
Page({
  data: {
    cartItems: [],
    totalPrice: 0,
    isEmpty: true,
    loading: true
  },

  onLoad() {
    this.loadCartData();
  },

  onShow() {
    this.loadCartData();
  },

  // 加载购物车数据
  async loadCartData() {
    const app = getApp();
    
    if (!app.globalData.openid) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      this.setData({
        loading: false,
        isEmpty: true,
        cartItems: []
      });
      return;
    }

    try {
      this.setData({ loading: true });
      
      const app = getApp();
      const result = await app.cloudCallWithRetry('getUserCart');

      if (result.result.ok) {
        const cartItems = result.result.data || [];
        const totalPrice = this.calculateTotalPrice(cartItems);
        
        this.setData({
          cartItems,
          totalPrice: totalPrice.toFixed(2),
          isEmpty: cartItems.length === 0,
          loading: false
        });
        
        // 更新全局购物车数据
        app.globalData.cart = cartItems;
        app.updateCartBadge();
      } else {
        this.setData({
          cartItems: [],
          totalPrice: '0.00',
          isEmpty: true,
          loading: false
        });
      }
    } catch (error) {
      console.error('加载购物车失败:', error);
      this.setData({
        cartItems: [],
        totalPrice: '0.00',
        isEmpty: true,
        loading: false
      });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 计算总价
  calculateTotalPrice(cartItems) {
    return cartItems.reduce((total, item) => {
      if (item.selected !== false) {
        return total + (item.price || 0) * (item.quantity || 0);
      }
      return total;
    }, 0);
  },

  // 增加商品数量
  async increaseQuantity(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.cartItems[index];
    
    if (!item) return;
    
    try {
      const app = getApp();
      const result = await app.cloudCallWithRetry('updateUserCart', {
          action: 'updateQuantity',
          productId: item._id,
          quantity: item.quantity + 1
      });

      if (result.result.ok) {
        this.loadCartData();
      } else {
        wx.showToast({
          title: result.result.message || '更新失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('更新数量失败:', error);
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      });
    }
  },

  // 减少商品数量
  async decreaseQuantity(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.cartItems[index];
    
    if (!item) return;
    
    if (item.quantity <= 1) {
      this.removeItem(e);
      return;
    }
    
    try {
      const app = getApp();
      const result = await app.cloudCallWithRetry('updateUserCart', {
          action: 'updateQuantity',
          productId: item._id,
          quantity: item.quantity - 1
      });

      if (result.result.ok) {
        this.loadCartData();
      } else {
        wx.showToast({
          title: result.result.message || '更新失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('更新数量失败:', error);
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      });
    }
  },

  // 移除商品
  async removeItem(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.cartItems[index];
    
    if (!item) return;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要从购物车中移除"${item.name}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const app = getApp();
            const result = await app.cloudCallWithRetry('updateUserCart', {
                action: 'remove',
                productId: item._id
            });

            if (result.result.ok) {
              this.loadCartData();
              wx.showToast({
                title: '已移除',
                icon: 'success'
              });
            } else {
              wx.showToast({
                title: result.result.message || '移除失败',
                icon: 'none'
              });
            }
          } catch (error) {
            console.error('移除商品失败:', error);
            wx.showToast({
              title: '移除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 切换商品选中状态
  async toggleSelection(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.cartItems[index];
    
    if (!item) return;
    
    try {
      const app = getApp();
      const result = await app.cloudCallWithRetry('updateUserCart', {
          action: 'updateSelection',
          productId: item._id
      });

      if (result.result.ok) {
        this.loadCartData();
      }
    } catch (error) {
      console.error('更新选中状态失败:', error);
    }
  },

  // 清空购物车
  async clearCart() {
    if (this.data.isEmpty) return;
    
    wx.showModal({
      title: '确认清空',
      content: '确定要清空购物车吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const app = getApp();
            const result = await app.cloudCallWithRetry('updateUserCart', {
                action: 'clear'
            });

            if (result.result.ok) {
              this.loadCartData();
              wx.showToast({
                title: '购物车已清空',
                icon: 'success'
              });
            } else {
              wx.showToast({
                title: result.result.message || '清空失败',
                icon: 'none'
              });
            }
          } catch (error) {
            console.error('清空购物车失败:', error);
            wx.showToast({
              title: '清空失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 去结算
  goToCheckout() {
    const selectedItems = this.data.cartItems.filter(item => item.selected !== false);
    
    if (selectedItems.length === 0) {
      wx.showToast({
        title: '请选择商品',
        icon: 'none'
      });
      return;
    }
    
    // 跳转到订单确认页面
    wx.navigateTo({
      url: '/pages/order/order'
    });
  },

  // 继续购物
  continueShopping() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});