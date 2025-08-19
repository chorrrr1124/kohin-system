Page({
  data: {
    customerId: '',
    customerName: '',
    orders: [],
    loading: true,
    orderStatusText: {
      'pending': '待付款',
      'processing': '处理中',
      'shipped': '已发货',
      'completed': '已完成'
    }
  },
  
  onLoad: function(options) {
    // 设置导航栏标题
    if (options.name) {
      const customerName = decodeURIComponent(options.name);
      wx.setNavigationBarTitle({
        title: `${customerName}的订单`
      });
      this.setData({
        customerName: customerName
      });
    } else {
      wx.setNavigationBarTitle({
        title: '客户订单历史'
      });
    }
    
    // 获取客户ID并加载数据
    if (options.id) {
      this.setData({
        customerId: options.id
      });
      this.loadOrders(options.id);
    } else {
      wx.showToast({
        title: '客户信息不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },
  
  // 加载订单数据
  loadOrders: function(customerId) {
    const db = wx.cloud.database();
    
    try {
      // 尝试访问orders集合
      db.collection('orders')
        .where({
          customerId: customerId
        })
        .orderBy('date', 'desc') // 按日期降序排序，最新的排在前面
        .get({
          success: res => {
            // 过滤掉临时记录
            let orders = res.data || [];
            orders = orders.filter(item => !item._isTemporary);
            
            this.setData({
              orders: orders,
              loading: false
            });
          },
          fail: err => {
            console.error('加载订单数据失败：', err);
            this.setData({
              orders: [],
              loading: false
            });
            
            wx.showToast({
              title: '加载失败',
              icon: 'none'
            });
          }
        });
    } catch (error) {
      console.error('访问orders集合异常：', error);
      this.setData({
        orders: [],
        loading: false
      });
      
      wx.showToast({
        title: '系统异常',
        icon: 'none'
      });
    }
  },
  
  // 查看订单详情
  viewOrder: function(e) {
    const orderId = e.currentTarget.dataset.id;
    if (!orderId) {
      wx.showToast({
        title: '订单ID不存在',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: `/pages/orders/orderDetail/orderDetail?id=${orderId}`
    });
  }
}); 