// pages/orders/orders.js
Page({
  data: {
    activeTab: 0,
    tabs: ['全部', '待付款', '待发货', '待收货', '已完成'],
    orders: [],
    displayOrders: []
  },

  onLoad(options) {
    this.loadOrders();
  },

  onShow() {
    this.loadOrders();
  },

  // 加载订单列表
  async loadOrders() {
    const app = getApp();
    
    // 检查登录状态
    if (!app.globalData.isLoggedIn || !app.globalData.openid) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      this.setData({ orders: [], displayOrders: [] });
      return;
    }

    try {
      wx.showLoading({ title: '加载中...' });
      
      // 调用云函数获取用户订单
      const result = await wx.cloud.callFunction({
        name: 'getUserOrders'
      });
      
      if (result.result && result.result.ok) {
        const orders = result.result.data || [];
        
        // 格式化时间
        const formattedOrders = orders.map(order => ({
          ...order,
          formattedTime: order.createTime ? new Date(order.createTime).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }) : ''
        }));
        
        this.setData({ orders: formattedOrders });
      } else {
        console.error('获取订单失败:', result.result);
        this.setData({ orders: [] });
      }
    } catch (error) {
      console.error('加载订单失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({ orders: [] });
    } finally {
      wx.hideLoading();
      this.updateDisplayOrders();
    }
  },

  // 切换tab
  onTabChange(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      activeTab: index
    });
    this.updateDisplayOrders();
  },

  // 更新显示的订单列表
  updateDisplayOrders() {
    const filteredOrders = this.getFilteredOrders();
    this.setData({
      displayOrders: filteredOrders
    });
  },

  // 获取过滤后的订单
  getFilteredOrders() {
    const { activeTab, orders } = this.data;
    
    if (activeTab === 0) {
      return orders; // 全部
    }
    
    const statusMap = {
      1: 'pending',    // 待付款
      2: 'paid',       // 待发货
      3: 'shipped',    // 待收货
      4: 'completed'   // 已完成
    };
    
    const targetStatus = statusMap[activeTab];
    return orders.filter(order => order.status === targetStatus);
  },

  // 查看订单详情
  viewOrderDetail(e) {
    const orderId = e.currentTarget.dataset.orderId;
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?orderId=${orderId}`
    });
  },

  // 取消订单
  async cancelOrder(e) {
    const orderId = e.currentTarget.dataset.orderId;
    
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中...' });
            
            // 调用云函数更新订单状态
            const result = await wx.cloud.callFunction({
              name: 'updateOrderStatus',
              data: {
                orderId,
                status: 'cancelled'
              }
            });
            
            if (result.result && result.result.ok) {
              wx.showToast({ title: '订单已取消', icon: 'success' });
              this.loadOrders(); // 重新加载订单列表
            } else {
              wx.showToast({ title: '取消失败', icon: 'none' });
            }
          } catch (error) {
            console.error('取消订单失败:', error);
            wx.showToast({ title: '取消失败', icon: 'none' });
          } finally {
             wx.hideLoading();
           }
         }
       }
     });
   },

  // 确认收货
  async confirmReceive(e) {
    const orderId = e.currentTarget.dataset.orderId;
    
    wx.showModal({
      title: '确认收货',
      content: '确定已收到商品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中...' });
            
            // 调用云函数更新订单状态
            const result = await wx.cloud.callFunction({
              name: 'updateOrderStatus',
              data: {
                orderId,
                status: 'completed'
              }
            });
            
            if (result.result && result.result.ok) {
              wx.showToast({ title: '确认收货成功', icon: 'success' });
              this.loadOrders(); // 重新加载订单列表
            } else {
              wx.showToast({ title: '操作失败', icon: 'none' });
            }
          } catch (error) {
            console.error('确认收货失败:', error);
            wx.showToast({ title: '操作失败', icon: 'none' });
          } finally {
             wx.hideLoading();
           }
         }
       }
     });
   },

  // 获取订单状态文本
  getStatusText(status) {
    const statusMap = {
      'pending': '待付款',
      'paid': '待发货',
      'shipped': '待收货',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || '未知状态';
  },

     // 格式化时间
   formatTime(timestamp) {
     const date = new Date(timestamp);
     const year = date.getFullYear();
     const month = String(date.getMonth() + 1).padStart(2, '0');
     const day = String(date.getDate()).padStart(2, '0');
     const hours = String(date.getHours()).padStart(2, '0');
     const minutes = String(date.getMinutes()).padStart(2, '0');
     
     return `${year}-${month}-${day} ${hours}:${minutes}`;
   },

   // 去购物
   goShopping() {
     wx.switchTab({
       url: '/pages/index/index'
     });
   }
})