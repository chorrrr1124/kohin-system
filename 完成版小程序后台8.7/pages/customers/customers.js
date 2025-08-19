// pages/customers/customers.js
Page({
  data: {
    customers: [],
    filteredCustomers: [],
    loading: true,
    searchValue: '',
    currentType: 'all',
    selectMode: false, // 选择模式标志
  },

  onLoad: function(options) {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    console.log('客户页面加载, 参数:', options);
    this.checkSelectMode();
    
    // 确保预存记录已加载
    this.ensurePrepaidRecordsLoaded();
    
    this.loadCustomers();
  },

  onShow: function() {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    // 检查是否为选择模式
    this.checkSelectMode();
    
    // 确保预存记录已加载
    this.ensurePrepaidRecordsLoaded();
    
    // 页面显示时刷新数据
    this.loadCustomers();
  },

  // 检查是否为客户选择模式
  checkSelectMode: function() {
    // 从storage获取选择模式标志
    const selectMode = wx.getStorageSync('customerSelectMode');
    console.log('从storage获取选择模式:', selectMode);
    
    if (selectMode) {
      console.log('设置为客户选择模式');
      this.setData({ selectMode: true });
      
      // 清除storage中的标志，避免一直处于选择模式
      setTimeout(() => {
        wx.removeStorageSync('customerSelectMode');
      }, 500);
    }
  },

  // 检查并创建集合
  checkAndCreateCollection: function() {
    return new Promise((resolve, reject) => {
      try {
        const db = wx.cloud.database();
        
        // 尝试获取集合信息，如果失败则使用本地缓存
        db.collection('customers').count({
          success: function(res) {
            console.log('集合已存在');
            resolve(true);
          },
          fail: function(err) {
            console.log('无法访问集合，可能是网络问题');
            // 直接返回，不再尝试创建集合
            resolve(false);
          }
        });
      } catch (error) {
        console.error('检查集合异常:', error);
        resolve(false);
      }
    });
  },

  // 🚀 优化的客户数据加载
  loadCustomers: function() {
    this.setData({ loading: true });
    
    const that = this;
    const app = getApp();
    
    // 使用应用级缓存加载客户数据
    app.getCachedData('customers').then(customers => {
      // 过滤掉临时记录并处理contacts字段
      const filteredCustomers = customers.filter(item => !item._isTemporary).map(customer => {
        // 处理contacts字段，可能是字符串也可能是数组
        if (customer.contacts && typeof customer.contacts === 'string') {
          try {
            customer.contacts = JSON.parse(customer.contacts);
            console.log('解析客户', customer.name, '的contacts JSON:', customer.contacts);
          } catch (e) {
            console.error('解析客户', customer.name, '的contacts JSON失败:', e);
            customer.contacts = [];
          }
        }
        
        // 检查客户是否有预存记录，如果有则设置为预存客户
        customer = that.checkAndUpdateCustomerType(customer);
        
        return customer;
      });
      
      that.setData({
        customers: filteredCustomers,
        loading: false
      });
      that.filterCustomers(); // 应用筛选
    }).catch(err => {
      console.error('加载客户数据失败：', err);
      
      // 尝试使用本地存储的数据
      const localCustomers = wx.getStorageSync('customers') || [];
      if (localCustomers.length > 0) {
        const filteredCustomers = localCustomers.filter(item => !item._isTemporary).map(customer => {
          // 处理contacts字段，可能是字符串也可能是数组
          if (customer.contacts && typeof customer.contacts === 'string') {
            try {
              customer.contacts = JSON.parse(customer.contacts);
              console.log('本地数据解析客户', customer.name, '的contacts JSON:', customer.contacts);
            } catch (e) {
              console.error('本地数据解析客户', customer.name, '的contacts JSON失败:', e);
              customer.contacts = [];
            }
          }
          
          // 检查客户是否有预存记录，如果有则设置为预存客户
          customer = that.checkAndUpdateCustomerType(customer);
          
          return customer;
        });
        that.setData({
          customers: filteredCustomers,
          loading: false
        });
        that.filterCustomers();
        wx.showToast({
          title: '使用本地数据',
          icon: 'none',
          duration: 2000
        });
      } else {
        that.setData({
          customers: [],
          loading: false
        });
        that.filterCustomers();
        wx.showToast({
          title: '加载失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 根据当前类型和搜索词筛选客户
  filterCustomers: function() {
    const { customers, currentType, searchValue } = this.data;
    let filtered = customers.slice();
    
    // 按类型筛选
    if (currentType !== 'all') {
      filtered = filtered.filter(customer => {
        // 首先检查natureCategory (预存客户/零售客户)
        if (customer.natureCategory && currentType === customer.natureCategory) {
          return true;
        }
        
        // 检查nature或type
        // 注：预存客户包含"金额预存客户"和"产品预存客户"
        if (currentType === '预存客户') {
          return customer.nature === '金额预存客户' || 
                 customer.nature === '产品预存客户' || 
                 customer.nature === '预存客户' ||
                 customer.type === '金额预存客户' || 
                 customer.type === '产品预存客户' || 
                 customer.type === '预存客户';
        }
        
        // 零售客户直接匹配
        return customer.nature === currentType || customer.type === currentType;
      });
    }
    
    // 按搜索词筛选
    if (searchValue) {
      const keyword = searchValue.toLowerCase();
      filtered = filtered.filter(customer => {
        // 检查客户名称
        if (customer.name && customer.name.toLowerCase().includes(keyword)) {
          return true;
        }
        
        // 检查联系人信息
        if (customer.contacts && customer.contacts.length > 0) {
          for (let contact of customer.contacts) {
            if ((contact.name && contact.name.toLowerCase().includes(keyword)) ||
                (contact.phone && contact.phone.includes(keyword)) ||
                (contact.address && contact.address.toLowerCase().includes(keyword))) {
              return true;
            }
          }
        }
        
        // 兼容旧数据格式
        return (customer.contact && customer.contact.toLowerCase().includes(keyword)) ||
               (customer.phone && customer.phone.includes(keyword));
      });
    }
    
    this.setData({
      filteredCustomers: filtered
    });
  },

  // 类型筛选
  filterByType: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      currentType: type
    });
    this.filterCustomers();
  },

  // 搜索输入处理
  searchCustomers: function(e) {
    const value = e.detail.value;
    this.setData({
      searchValue: value
    });
    this.filterCustomers();
  },

  // 添加客户
  addCustomer: function() {
    wx.navigateTo({
      url: '/pages/customers/addCustomer/addCustomer'
    });
  },

  // 查看客户详情
  viewCustomerDetail: function(e) {
    console.log('点击客户项, 选择模式:', this.data.selectMode);
    const customerId = e.currentTarget.dataset.id;
    const customer = this.data.customers.find(c => c._id === customerId);
    
    // 直接使用页面数据中的选择模式标志
    if (this.data.selectMode && customer) {
      console.log('选择模式：返回客户信息', customer);
      
      try {
        // 使用全局变量中的回调函数
        const app = getApp();
        if (app.globalData && typeof app.globalData.customerSelectCallback === 'function') {
          app.globalData.customerSelectCallback(customer);
          console.log('已调用客户选择回调函数');
          
          // 清除选择模式
          this.setData({ selectMode: false });
          
          // 清除全局回调函数
          setTimeout(() => {
            app.globalData.customerSelectCallback = null;
          }, 100);
          
          // 返回购物车页面
          wx.switchTab({
            url: '/pages/cart/cart',
            fail: (err) => {
              console.error('返回购物车页面失败:', err);
            }
          });
        } else {
          console.error('找不到客户选择回调函数');
          wx.showToast({
            title: '选择失败，请重试',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('处理客户选择失败:', error);
        wx.showToast({
          title: '选择失败，请重试',
          icon: 'none'
        });
      }
      return;
    }
    
    // 正常查看客户详情
    wx.navigateTo({
      url: `/pages/customers/customerDetail/customerDetail?id=${customerId}`
    });
  },

  // 确保预存记录已加载
  ensurePrepaidRecordsLoaded: function() {
    const app = getApp();
    
    // 如果全局数据中没有预存记录，尝试加载
    if (!app.globalData.prepaidRecords || app.globalData.prepaidRecords.length === 0) {
      console.log('预存记录未加载，正在加载...');
      
      // 尝试从本地存储加载
      const localRecords = wx.getStorageSync('prepaidRecords') || [];
      if (localRecords.length > 0) {
        app.globalData.prepaidRecords = localRecords;
        console.log('从本地存储加载预存记录:', localRecords.length, '条');
      } else {
        // 从云端加载
        if (app.loadPrepaidRecordsFromCloud) {
          app.loadPrepaidRecordsFromCloud(false);
        }
      }
    }
  },

  // 检查并更新客户类型（根据预存记录判断是否为预存客户）
  checkAndUpdateCustomerType: function(customer) {
    const app = getApp();
    
    // 获取预存记录数据
    let prepaidRecords = [];
    if (app && app.globalData && app.globalData.prepaidRecords) {
      prepaidRecords = app.globalData.prepaidRecords;
    } else {
      // 如果全局数据中没有，尝试从本地存储获取
      prepaidRecords = wx.getStorageSync('prepaidRecords') || [];
    }
    
    // 检查该客户是否有预存记录
    const customerPrepaidRecords = prepaidRecords.filter(record => {
      return record.customerId === customer._id || 
             (record.customerPhone && customer.phone && record.customerPhone === customer.phone) ||
             (record.customerName && record.customerName === customer.name);
    });
    
    // 如果客户有预存记录，且当前不是预存客户，则更新为预存客户
    if (customerPrepaidRecords.length > 0) {
      const hasActiveRecords = customerPrepaidRecords.some(record => {
        // 检查是否有余额大于0的记录
        return record.balance && record.balance > 0;
      });
      
      // 如果有有效的预存记录，且客户类型不是预存客户，则更新类型
      if (hasActiveRecords && 
          customer.type !== '预存客户' && 
          customer.type !== '金额预存客户' && 
          customer.type !== '产品预存客户' &&
          customer.nature !== '预存客户' && 
          customer.nature !== '金额预存客户' && 
          customer.nature !== '产品预存客户') {
        
        console.log(`检测到客户 ${customer.name} 有预存记录，更新为预存客户`);
        
        // 更新客户类型
        customer.type = '预存客户';
        customer.nature = '预存客户';
        customer.natureCategory = '预存客户';
        
        // 异步更新数据库中的客户信息
        this.updateCustomerTypeInDatabase(customer._id, '预存客户');
      }
    }
    
    return customer;
  },

  // 异步更新数据库中的客户类型
  updateCustomerTypeInDatabase: function(customerId, customerType) {
    const db = wx.cloud.database();
    
    db.collection('customers').doc(customerId).update({
      data: {
        type: customerType,
        nature: customerType,
        natureCategory: customerType,
        updateTime: db.serverDate()
      },
      success: res => {
        console.log(`客户类型更新成功: ${customerId} -> ${customerType}`);
      },
      fail: err => {
        console.error('客户类型更新失败:', err);
      }
    });
  },

  // 编辑客户
  editCustomer: function(e) {
    const customerId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/customers/editCustomer/editCustomer?id=${customerId}`
    });
  }
})