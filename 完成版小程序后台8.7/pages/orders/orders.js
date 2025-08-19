// pages/orders/orders.js
Page({
  data: {
    orders: [],
    loading: false,
    activeTab: 'today',
    startDate: '',
    endDate: '',
    allOrders: [], // 存储所有订单的原始数据
    tabs: [
      { id: 'today', name: '今天' },
      { id: 'all', name: '全部' },
      { id: 'pending', name: '待付款' },
      { id: 'pending_shipment', name: '待发货' },
      { id: 'shipped', name: '已发货' },
      { id: 'completed', name: '已完成' }
    ],
    hasMoreOrders: false, // 是否还有更多订单
    page: 0, // 当前页码
    pageSize: 20, // 每页数量
    isLoadingOrders: false, // 添加新的加载状态标志
    lastLoadTime: 0, // 记录最后一次加载时间
    showEmptyTip: true, // 是否显示空提示
    lastTabChange: 0, // 最后一次选项卡切换时间
    searchKeyword: '', // 搜索关键词
    // showMoreMenu, selectedOrders 字段已移除
  },

  onLoad: function(options) {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    // 设置默认显示今天的订单
    this.setData({
      activeTab: 'today',
      loading: false,  // 初始不显示加载状态
      lastLoadTime: Date.now(), // 初始化最后加载时间
      isLoadingOrders: false,  // 确保初始未加载
      showEmptyTip: true
    });
    
    console.log('订单页面已加载，自动加载数据');
    const hasOrders = app.globalData.orders && app.globalData.orders.length > 0;
    
    if (hasOrders) {
      console.log(`发现${app.globalData.orders.length}条全局订单数据`);
      this.loadOrdersFromGlobal();
    } else {
      // 自动刷新一次数据
      console.log('没有缓存数据，自动刷新');
      this.manualRefresh();
    }
  },

  onShow: function() {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    console.log('onShow被调用，已禁用自动刷新');
    // 完全禁用自动刷新，不再加载数据
  },
  
  // 从全局数据加载订单
  loadOrdersFromGlobal: function() {
    const app = getApp();
    let allOrders = app.globalData.orders || [];
    
    if (allOrders.length === 0) {
      console.log('全局订单数据为空');
      this.setData({
        orders: [],
        allOrders: [],
        loading: false,
        isLoadingOrders: false,
        showEmptyTip: true
      });
      return;
    }
    
    console.log(`从全局获取到${allOrders.length}条订单数据`);
    
    // 根据当前选中的标签筛选订单
    this.filterAndDisplayOrders(allOrders);
  },
  
  // 筛选并显示订单数据
  filterAndDisplayOrders: function(allOrders) {
    if (!allOrders || allOrders.length === 0) {
      this.setData({
        orders: [],
        allOrders: [],
        loading: false,
        showEmptyTip: true
      });
      console.log('没有订单数据可显示');
      return;
    }
    
    // 先对所有订单按日期降序排序
    allOrders.sort((a, b) => {
      if (a.createTime && b.createTime) {
        return new Date(b.createTime) - new Date(a.createTime);
      }
      return new Date(b.date || 0) - new Date(a.date || 0);
    });
    
    // 根据标签和日期范围筛选
    let filteredOrders = allOrders.slice();
    const tabId = this.data.activeTab;
    console.log(`按标签 [${tabId}] 筛选订单`);
    
    // 根据标签筛选
    if (tabId === 'today') {
      // 获取北京时间的今天日期字符串 YYYY-MM-DD
      const now = new Date();
      const utc8Offset = 8 * 60 * 60 * 1000; // 北京时间偏移量
      const beijingTime = new Date(now.getTime() + utc8Offset);
      const today = beijingTime.toISOString().split('T')[0];
      console.log(`北京时间今天日期: ${today}`);
      console.log(`UTC今天日期: ${new Date().toISOString().split('T')[0]}`);
      
      filteredOrders = allOrders.filter(order => {
        console.log(`订单日期: ${order.date}, 今天日期: ${today}, 匹配: ${order.date === today}`);
        return order.date === today;
      });
      console.log(`今天的订单数量: ${filteredOrders.length}`);
    } else if (tabId !== 'all') {
      filteredOrders = allOrders.filter(order => order.status === tabId);
    }
    
    // 根据日期范围筛选
    if (this.data.startDate && this.data.endDate) {
      const startDate = new Date(this.data.startDate);
      const endDate = new Date(this.data.endDate);
      endDate.setHours(23, 59, 59, 999); // 设置为当天结束时间
      
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }
    
    // 根据搜索关键词筛选（匹配订单号、客户姓名、电话、商品名称、地址等）
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase();
      filteredOrders = filteredOrders.filter(order => {
        const orderNumber = (order.orderNumber || order.id || '').toLowerCase();
        const customerName = (order.customer?.name || order.customerName || order.customer || '').toLowerCase();
        const customerPhone = (order.customer?.phone || order.customerPhone || '').toLowerCase();
        const customerAddress = (order.customer?.address || order.customerAddress || '').toLowerCase();
        
        // 搜索商品名称
        let productNames = '';
        if (order.items && Array.isArray(order.items)) {
          productNames = order.items.map(item => (item.name || '')).join(' ').toLowerCase();
        }
        
        // 搜索备注信息
        const notes = (order.notes || order.remark || '').toLowerCase();
        
        return orderNumber.includes(keyword) || 
               customerName.includes(keyword) || 
               customerPhone.includes(keyword) ||
               customerAddress.includes(keyword) ||
               productNames.includes(keyword) ||
               notes.includes(keyword);
      });
    }
    
    console.log(`筛选后剩余 ${filteredOrders.length} 条订单`);
    
    // 更新显示
    this.setData({
      orders: filteredOrders.slice(0, this.data.pageSize),
      allOrders: filteredOrders,
      hasMoreOrders: filteredOrders.length > this.data.pageSize,
      loading: false,
      isLoadingOrders: false,
      showEmptyTip: filteredOrders.length === 0
    });
    
    if (filteredOrders.length === 0) {
      wx.showToast({
        title: '没有找到符合条件的订单',
        icon: 'none'
      });
    }
  },

  // 🚀 优化的手动刷新（使用缓存管理）
  manualRefresh: function() {
    const that = this;
    wx.showLoading({ title: '正在刷新...', mask: true });
    
    // 使用应用级缓存，强制刷新
    const app = getApp();
    app.getCachedData('orders', true).then(orders => {
      that.filterAndDisplayOrders(orders);
      wx.hideLoading();
      wx.showToast({ title: '刷新成功', icon: 'success' });
    }).catch(err => {
      wx.hideLoading();
      console.error('刷新订单数据失败:', err);
      
      // 尝试使用本地存储的数据
      const localOrders = wx.getStorageSync('orders') || [];
      if (localOrders.length > 0) {
        console.log('使用本地存储数据');
        that.filterAndDisplayOrders(localOrders);
        wx.showToast({ title: '使用本地数据', icon: 'none' });
      } else {
        wx.showToast({ title: '刷新失败', icon: 'none' });
      }
    });
  },

  // 切换订单状态选项卡
  switchTab: function(e) {
    const tabId = e.currentTarget.dataset.id;
    
    // 防抖动：过滤快速多次点击
    const now = Date.now();
    const lastTabChange = this.data.lastTabChange || 0;
    if (now - lastTabChange < 500) { // 500ms内不响应重复点击
      console.log('点击过于频繁，跳过');
      return;
    }
    
    if (tabId === this.data.activeTab) {
      console.log('点击了当前已激活的选项卡，忽略');
      return;
    }
    
    console.log(`切换到订单状态: ${tabId}`);
    
    this.setData({
      activeTab: tabId,
      lastTabChange: now,
      loading: true  // 切换时显示加载状态
    });
    
    // 直接从现有数据筛选，不重新加载
    const app = getApp();
    const allOrders = app.globalData.orders || [];
    
    // 延迟执行筛选，给UI一点时间更新
    setTimeout(() => {
      this.filterAndDisplayOrders(allOrders);
    }, 100);
  },

  // 查看订单详情
  viewOrderDetail: function(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/orders/orderDetail/orderDetail?id=${orderId}`
    });
  },

  // 订单状态变更处理
  processOrder: function(e) {
    const orderId = e.currentTarget.dataset.id;
    console.log('处理订单：', orderId);
    
    // 获取当前选定的订单
    const ordersList = this.data.orders;
    let targetOrder = null;
    
    for (let i = 0; i < ordersList.length; i++) {
      if (ordersList[i].id === orderId) {
        targetOrder = ordersList[i];
        // 给订单添加一个处理中标志
        targetOrder.processing = true;
        targetOrder.processingId = orderId;
        break;
      }
    }
    
    if (!targetOrder) {
      console.error('未找到要处理的订单：', orderId);
      wx.showToast({
        title: '未找到订单',
        icon: 'none'
      });
      return;
    }
    
    // 更新UI状态，显示处理中
    this.setData({
      orders: ordersList
    });
    
    // 如果是待付款状态，提供支付选项
    if (targetOrder.status === 'pending') {
      this.showPaymentOptions(targetOrder);
      return;
    }
    
    // 其他状态的正常流转
    this.updateOrderStatus(targetOrder);
  },
  
  // 显示支付选项
  showPaymentOptions: function(order) {
    // 直接确认付款，不再显示微信支付选项
    this.confirmPayment(order);
  },

  
  // 确认已付款
  confirmPayment: function(order) {
    wx.showModal({
      title: '确认付款',
      content: '确认该订单已经付款？',
      success: res => {
        if (res.confirm) {
          this.updateOrderStatus(order);
        } else {
          this.clearProcessingState(order.id);
        }
      }
    });
  },
  
  // 更新订单状态
  updateOrderStatus: function(targetOrder) {
    // 确定下一个状态
    const currentStatus = targetOrder.status;
    let newStatus = '';
    let statusText = '';
    
    if (currentStatus === 'pending') {
      newStatus = 'pending_shipment';
      statusText = '已确认付款';
    } else if (currentStatus === 'pending_shipment') {
      newStatus = 'shipped';
      statusText = '已发货';
    } else if (currentStatus === 'shipped') {
      newStatus = 'completed';
      statusText = '已完成';
    } else {
      // 订单已经是完成状态，不再处理
      wx.showToast({
        title: '订单已完成',
        icon: 'none'
      });
      return;
    }
    
    this.performStatusUpdate(targetOrder, newStatus, statusText);
  },
  
  // 执行状态更新
  performStatusUpdate: function(targetOrder, newStatus, statusText) {
    const db = wx.cloud.database();
    const that = this;
    
    db.collection('orders').where({
      id: targetOrder.id
    }).update({
      data: {
        status: newStatus
      },
      success: function(res) {
        if (res.stats.updated > 0) {
          console.log('订单状态更新成功:', targetOrder.id, newStatus);
          
          // 同时更新全局数据和本地存储
          const app = getApp();
          const allOrders = app.globalData.orders || [];
          
          allOrders.forEach(item => {
            if (item.id === targetOrder.id) {
              item.status = newStatus;
            }
          });
          
          app.globalData.orders = allOrders;
          wx.setStorageSync('orders', allOrders);
          
          // 提示用户
          wx.showToast({
            title: statusText,
            icon: 'success'
          });
          
          // 修改这里，不要重新加载，而是直接在内存中更新订单状态
          const ordersList = that.data.orders;
          ordersList.forEach(item => {
            if (item.id === targetOrder.id) {
              item.status = newStatus;
              item.processing = false;
              item.processingId = '';
            }
          });
          that.setData({
            orders: ordersList
          });
        } else {
          console.error('未找到要更新的订单:', targetOrder.id);
          wx.showToast({
            title: '更新失败，未找到订单',
            icon: 'none'
          });
          
          // 清除处理中标志
          const ordersList = that.data.orders;
          ordersList.forEach(item => {
            if (item.id === targetOrder.id) {
              item.processing = false;
              item.processingId = '';
            }
          });
          that.setData({
            orders: ordersList
          });
        }
      },
      fail: function(err) {
        console.error('订单状态更新失败:', err);
        wx.showToast({
          title: '更新失败，请重试',
          icon: 'none'
        });
        
        // 清除处理中标志
        const ordersList = that.data.orders;
        ordersList.forEach(item => {
          if (item.id === targetOrder.id) {
            item.processing = false;
            item.processingId = '';
          }
        });
        that.setData({
          orders: ordersList
        });
      }
    });
  },
  
  // 清除处理中状态
  clearProcessingState: function(orderId) {
    const ordersList = this.data.orders;
    ordersList.forEach(item => {
      if (item.id === orderId) {
        item.processing = false;
        item.processingId = '';
      }
    });
    this.setData({
      orders: ordersList
    });
  },

  // 删除订单
  deleteOrder: function(e) {
    const orderId = e.currentTarget.dataset.id;
    const that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该订单及其相关出库记录吗？此操作不可恢复。',
      success(res) {
        if (res.confirm) {
          wx.showLoading({ title: '正在删除...', mask: true });
          const db = wx.cloud.database();
          db.collection('orders').where({ id: orderId }).remove({
            success: function() {
              // 同步删除相关出库记录
              db.collection('records').where({ orderId: orderId }).remove({
                complete: function() {
                  // 更新全局缓存和本地缓存
                  const app = getApp();
                  let orders = app.globalData.orders || [];
                  orders = orders.filter(o => o.id !== orderId);
                  app.globalData.orders = orders;
                  wx.setStorageSync('orders', orders);
                  // 刷新页面
                  that.filterAndDisplayOrders(orders);
                  wx.hideLoading();
                  wx.showToast({ title: '删除成功', icon: 'success' });
                }
              });
            },
            fail: function(err) {
              wx.hideLoading();
              wx.showToast({ title: '删除失败', icon: 'none' });
              console.error('订单删除失败:', err);
            }
          });
        }
      }
    });
  },

  // 筛选按日期范围
  filterByDate: function() {
    const startDate = this.data.startDate;
    const endDate = this.data.endDate;
    
    if (!startDate || !endDate) {
      wx.showToast({
        title: '请选择日期范围',
        icon: 'none'
      });
      return;
    }
    
    // 检查日期范围是否有效
    const startDateTime = new Date(startDate).getTime();
    const endDateTime = new Date(endDate).getTime();
    
    if (startDateTime > endDateTime) {
      wx.showToast({
        title: '开始日期不能晚于结束日期',
        icon: 'none'
      });
      return;
    }
    
    console.log(`按日期范围筛选: ${startDate} 至 ${endDate}`);
    
    // 直接使用现有数据筛选，不重新加载
    const app = getApp();
    const allOrders = app.globalData.orders || [];
    this.filterAndDisplayOrders(allOrders);
    
    wx.showToast({
      title: '日期筛选已应用',
      icon: 'success'
    });
  },
  
  // 重置日期筛选
  resetDateFilter: function() {
    this.setData({
      startDate: '',
      endDate: '',
      loading: true
    });
    
    // 重新筛选当前选项卡的数据
    const app = getApp();
    const allOrders = app.globalData.orders || [];
    this.filterAndDisplayOrders(allOrders);
    
    wx.showToast({
      title: '已重置日期筛选',
      icon: 'success'
    });
  },

  // 搜索输入处理
  onSearchInput: function(e) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword
    });
    
    // 防抖处理
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    
    this.searchTimer = setTimeout(() => {
      this.applySearchFilter();
    }, 300);
  },

  // 搜索确认处理
  onSearchConfirm: function(e) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword
    });
    this.applySearchFilter();
  },

  // 清除搜索
  clearSearch: function() {
    this.setData({
      searchKeyword: ''
    });
    this.applySearchFilter();
  },

  // 应用搜索筛选
  applySearchFilter: function() {
    this.setData({
      loading: true
    });
    
    const app = getApp();
    const allOrders = app.globalData.orders || [];
    this.filterAndDisplayOrders(allOrders);
  },
  
  // 加载更多订单
  loadMoreOrders: function() {
    // 直接改用全局数据，不再分页加载
    if (this.data.allOrders.length <= this.data.orders.length) {
      wx.showToast({
        title: '已加载全部订单',
        icon: 'none'
      });
      return;
    }
    
    const currentSize = this.data.orders.length;
    const moreOrders = this.data.allOrders.slice(currentSize, currentSize + this.data.pageSize);
    
    const updatedOrders = this.data.orders.concat(moreOrders);
    this.setData({
      orders: updatedOrders,
      hasMoreOrders: updatedOrders.length < this.data.allOrders.length
    });
  },
  
  // 日期选择器事件处理
  onStartDateChange: function(e) {
    this.setData({
      startDate: e.detail.value
    });
  },
  
  onEndDateChange: function(e) {
    this.setData({
      endDate: e.detail.value
    });
  }
})