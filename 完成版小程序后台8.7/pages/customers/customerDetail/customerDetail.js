Page({
  data: {
    customerId: '',
    customer: {},
    orders: [],
    displayOrders: [], // 用于显示的订单列表（限制数量）
    allOrders: [], // 存储所有订单
    showAllOrders: false, // 控制是否显示所有订单
    loading: true,
    mergeHistory: [],
    showMergeHistory: false,
    orderStatusText: {
      'pending': '待付款',
      'pending_shipment': '待发货',
      'shipped': '已发货',
      'completed': '已完成'
    }
  },

  onLoad: function(options) {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '客户详情'
    });
    
    // 获取客户ID并加载数据
    if (options.id) {
      this.setData({
        customerId: options.id
      });
      this.loadCustomerData(options.id);
    } else {
      wx.showToast({
        title: '客户信息不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
    
    // 设置定时器，定期检查是否需要刷新页面
    this.refreshCheckTimer = setInterval(() => {
      const app = getApp();
      if (app.globalData && app.globalData.refreshCustomerDetail) {
        const refreshData = app.globalData.refreshCustomerDetail;
        
        // 检查刷新请求是否针对当前客户
        if (refreshData.customerId === this.data.customerId) {
          // 检查时间戳，避免重复刷新
          const lastRefreshTime = this.lastRefreshTime || 0;
          if ((refreshData.timestamp - lastRefreshTime) > 2000) { // 2秒内不重复刷新
            console.log('收到全局刷新请求，刷新客户详情页面');
            this.loadCustomerData(this.data.customerId);
            this.lastRefreshTime = refreshData.timestamp;
          }
          
          // 清除已处理的刷新请求
          app.globalData.refreshCustomerDetail = null;
        }
      }
    }, 1000); // 每秒检查一次
  },
  
  onShow: function() {
    // 页面显示时刷新数据，以获取可能的更新
    if (this.data.customerId) {
      console.log('客户详情页面onShow重新加载数据:', this.data.customerId);
      // 强制刷新客户数据，确保获取最新的联系人信息
      this.loadCustomerData(this.data.customerId);
      
      // 显示刷新提示
      wx.showToast({
        title: '刷新数据',
        icon: 'none',
        duration: 1000
      });
    }
  },

  onUnload: function() {
    // 页面卸载时清除定时器
    if (this.refreshCheckTimer) {
      clearInterval(this.refreshCheckTimer);
      this.refreshCheckTimer = null;
    }
  },

  // 加载客户数据
  loadCustomerData: function(customerId) {
    if (!customerId) {
      console.error('无效的客户ID');
      wx.showToast({
        title: '客户信息不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    console.log('开始加载客户详情数据:', customerId);
    
    this.setData({
      loading: true
    });
    
    const db = wx.cloud.database();
    
    // 从云数据库加载客户数据
    db.collection('customers').doc(customerId).get({
      success: res => {
        const customer = res.data;
        console.log('成功获取客户数据:', customer);
        
        // 处理contacts字段，可能是字符串也可能是数组
        let contacts = [];
        if (customer && customer.contacts) {
          console.log('customerDetail页面-原始contacts数据:', customer.contacts, '类型:', typeof customer.contacts);
          
          if (typeof customer.contacts === 'string') {
            try {
              contacts = JSON.parse(customer.contacts);
              console.log('customerDetail页面-解析JSON字符串后的contacts:', contacts);
              // 将解析后的数组重新赋值给customer.contacts
              customer.contacts = contacts;
            } catch (e) {
              console.error('customerDetail页面-解析contacts JSON失败:', e);
              contacts = [];
              customer.contacts = [];
            }
          } else if (Array.isArray(customer.contacts)) {
            contacts = customer.contacts;
            console.log('customerDetail页面-contacts已经是数组:', contacts);
          }
        }
        
        console.log('客户联系人数据:', contacts ? contacts.length + '个' : '无');
        
        if (contacts && contacts.length > 0) {
          // 处理联系人地址显示
          contacts.forEach((contact, index) => {
            console.log(`处理联系人${index+1}数据:`, contact);
            // 确保地址字段一致
            if (contact.address && !contact.addressDetail) {
              contact.addressDetail = contact.address;
            } else if (contact.addressDetail && !contact.address) {
              contact.address = contact.addressDetail;
            }
          });
          
          // 更新customer.contacts为处理后的数组
          customer.contacts = contacts;
        }
        
        this.setData({
          customer: customer,
          loading: false
        });
        
        // 加载相关订单
        this.loadCustomerOrders(customerId);
        
        // 加载合并历史记录
        this.loadMergeHistory(customerId);
      },
      fail: err => {
        console.error('加载客户数据失败：', err);
        
        this.setData({
          loading: false
        });
        
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 加载客户合并历史
  loadMergeHistory: function(customerId) {
    if (!customerId) {
      console.log('无效的客户ID，无法加载合并历史');
      this.setData({
        mergeHistory: []
      });
      return;
    }
    
    // 先尝试从客户自身的合并历史获取数据
    if (this.data.customer && this.data.customer.mergeHistory && this.data.customer.mergeHistory.length > 0) {
      this.setData({
        mergeHistory: this.data.customer.mergeHistory
      });
      return;
    }
    
    const db = wx.cloud.database();
    
    // 尝试读取集合
    try {
      db.collection('customerMergeHistory')
        .where({
          primaryCustomerId: customerId
        })
        .get()
        .then(res => {
          const history = res.data || [];
          this.setData({
            mergeHistory: history
          });
        })
        .catch(err => {
          console.log('读取customerMergeHistory失败，显示空数据', err);
          // 无法读取集合时，简单地设置为空数组
          this.setData({
            mergeHistory: []
          });
        });
    } catch (error) {
      console.log('customerMergeHistory集合访问异常', error);
      // 在异常情况下也确保设置空数组
      this.setData({
        mergeHistory: []
      });
    }
  },
  
  // 切换显示合并历史
  toggleMergeHistory: function() {
    this.setData({
      showMergeHistory: !this.data.showMergeHistory
    });
  },
  
  // 加载客户订单
  loadCustomerOrders: function(customerId) {
    const db = wx.cloud.database();
    
    try {
      // 直接尝试访问orders集合
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
            
            // 存储所有订单
            this.setData({
              allOrders: orders,
              orders: orders, // 保持兼容性
              displayOrders: orders.slice(0, 5) // 只显示前5条记录
            });
          },
          fail: err => {
            console.error('加载订单数据失败：', err);
            // 出错时初始化为空数组
            this.setData({
              allOrders: [],
              orders: [],
              displayOrders: []
            });
          }
        });
    } catch (error) {
      console.error('访问orders集合异常：', error);
      this.setData({
        allOrders: [],
        orders: [],
        displayOrders: []
      });
    }
  },
  
  // 添加查看更多订单的方法
  viewMoreOrders: function() {
    wx.navigateTo({
      url: `/pages/customers/customerOrders/customerOrders?id=${this.data.customerId}&name=${encodeURIComponent(this.data.customer.name)}`
    });
  },
  

  
  // 查看订单详情
  viewOrder: function(e) {
    const orderId = e.currentTarget.dataset.id;
    console.log('跳转到订单详情，订单ID:', orderId);
    // 确保orderId有值
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
  },
  
  // 编辑客户
  editCustomer: function() {
    wx.navigateTo({
      url: `/pages/customers/editCustomer/editCustomer?id=${this.data.customerId}`
    });
  },
  
  // 删除客户
  deleteCustomer: function() {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除客户"${this.data.customer.name}"吗？此操作无法撤销。`,
      confirmColor: '#ff4d4f',
      success: res => {
        if (res.confirm) {
          this.confirmDeleteCustomer();
        }
      }
    });
  },
  
  // 确认删除客户
  confirmDeleteCustomer: function() {
    const db = wx.cloud.database();
    
    wx.showLoading({
      title: '删除中...',
      mask: true
    });
    
    db.collection('customers').doc(this.data.customerId).remove({
      success: res => {
        wx.hideLoading();
        
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        
        // 返回客户列表页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      },
      fail: err => {
        wx.hideLoading();
        console.error('删除客户失败：', err);
        
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        });
      }
    });
  },

  // 检查并创建集合
  checkAndCreateCollection: function(collectionName) {
    const that = this; // 保存this引用
    
    return new Promise((resolve, reject) => {
      const db = wx.cloud.database();
      
      // 尝试获取集合信息，如果失败则尝试创建
      db.collection(collectionName).count({
        success: function(res) {
          console.log(`集合 ${collectionName} 已存在`);
          resolve();
        },
        fail: function(err) {
          console.log(`集合 ${collectionName} 不存在，正在直接创建...`);
          
          // 由于云函数createCollection不存在，直接尝试通过添加记录来创建集合
          // 注意：此方法仅在用户有数据库写入权限时有效
          if (collectionName === 'orders') {
            db.collection('orders').add({
              data: {
                _createMethod: 'direct',
                _createTime: db.serverDate(),
                _isTemporary: true,
                customerId: 'system',
                orderNo: 'TEMP0001',
                status: 'pending',
                date: new Date().toISOString().split('T')[0],
                total: 0,
                remark: '此记录由系统自动创建，用于初始化数据库集合，可以删除。'
              },
              success: () => {
                console.log(`成功创建集合 ${collectionName}（通过添加记录）`);
                resolve();
              },
              fail: (addErr) => {
                console.error(`无法创建集合 ${collectionName}`, addErr);
                // 即使创建失败也继续执行
                resolve();
              }
            });
          } else if (collectionName === 'customerMergeHistory') {
            db.collection('customerMergeHistory').add({
              data: {
                _createMethod: 'direct',
                _createTime: db.serverDate(),
                _isTemporary: true,
                primaryCustomerId: 'system',
                mergedCustomerId: 'system',
                mergedCustomerName: '系统初始化记录',
                mergeTime: db.serverDate(),
                remark: '此记录由系统自动创建，用于初始化数据库集合，可以删除。'
              },
              success: () => {
                console.log(`成功创建集合 ${collectionName}（通过添加记录）`);
                resolve();
              },
              fail: (addErr) => {
                console.error(`无法创建集合 ${collectionName}，将直接继续`, addErr);
                // 无需在这里设置数据，应在调用方处理
                resolve();
              }
            });
          } else {
            // 通用集合创建方案
            try {
              db.collection(collectionName).add({
                data: {
                  _createMethod: 'direct',
                  _createTime: db.serverDate(),
                  _isTemporary: true,
                  _systemInitRecord: true,
                  remark: '此记录由系统自动创建，用于初始化数据库集合，可以删除。'
                },
                success: () => {
                  console.log(`成功创建集合 ${collectionName}（通过添加记录）`);
                  resolve();
                },
                fail: (addErr) => {
                  console.error(`无法创建集合 ${collectionName}，将跳过该步骤`, addErr);
                  // 即使创建失败也继续执行
                  resolve();
                }
              });
            } catch (e) {
              console.error(`尝试创建集合 ${collectionName} 发生异常`, e);
              resolve(); // 继续执行
            }
          }
        }
      });
    });
  },

  // 统一的错误处理
  handleError: function(errorMessage, error) {
    console.error(errorMessage, error);
    // 生产环境下可以使用更友好的提示
    if (wx.getSystemInfoSync().platform === 'devtools') {
      // 开发环境下，显示详细错误
      wx.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000
      });
    } else {
      // 生产环境中，显示简化错误信息
      wx.showToast({
        title: '数据加载失败，请重试',
        icon: 'none',
        duration: 2000
      });
    }
  }
})