Page({
  data: {
    isEdit: false,
    order: {
      id: '',
      date: '',
      status: '',
      customer: '',
      customerId: '',
      address: null,
      items: [],
      total: 0,
      remark: ''
    },
    customers: [],
    customerNames: [],
    customerIndex: -1,
    selectedCustomer: null,
    contacts: [],
    contactNames: [],
    contactIndex: 0,
    selectedContact: null,
    statusList: [
      { id: 'pending', name: '待付款' },
      { id: 'pending_shipment', name: '待发货' },
      { id: 'shipped', name: '已发货' },
      { id: 'completed', name: '已完成' }
    ],
    statusNames: [],
    statusIndex: 0,
    products: [],
    totalAmount: 0,
    noCustomer: false, // 新增：客户为空标志
    customerDeleted: false, // 新增：客户已被删除标志
  },

  onLoad: function(options) {
    // 设置状态列表
    const statusNames = this.data.statusList.map(item => item.name);
    this.setData({
      statusNames: statusNames
    });
    
    // 检查是否是编辑模式
    if (options.id) {
      wx.setNavigationBarTitle({
        title: '编辑订单'
      });
      
      this.setData({
        isEdit: true
      });
      
      // 加载订单数据
      this.loadOrderData(options.id);
    } else {
      // 新建订单，调用云函数获取唯一订单号
      wx.cloud.callFunction({
        name: 'generateOrderId',
        success: res => {
          const orderId = res.result.orderId;
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      this.setData({
        'order.id': orderId,
        'order.date': today,
        'order.status': 'pending',
        statusIndex: 0
          });
        },
        fail: err => {
          wx.showToast({ title: '订单号生成失败', icon: 'none' });
        }
      });
    }
    
    // 加载客户列表
    this.loadCustomers();
  },
  
  // 检查并创建集合
  checkAndCreateCollection: function(collectionName) {
    return new Promise((resolve, reject) => {
      const db = wx.cloud.database();
      
      // 尝试获取集合信息，如果失败则尝试创建
      db.collection(collectionName).count({
        success: function(res) {
          console.log(`集合 ${collectionName} 已存在`);
          resolve();
        },
        fail: function(err) {
          console.log(`集合 ${collectionName} 不存在，正在创建...`);
          
          // 调用云函数创建集合
          wx.cloud.callFunction({
            name: 'createCollection',
            data: {
              collectionName: collectionName
            },
            success: function(res) {
              console.log(`创建集合 ${collectionName} 成功`, res);
              resolve();
            },
            fail: function(err) {
              console.error(`通过云函数创建集合 ${collectionName} 失败`, err);
              // 即使创建失败也继续执行
              resolve();
            }
          });
        }
      });
    });
  },
  
  // 加载客户列表
  loadCustomers: function() {
    const that = this;
    
    // 检查并确保customers集合存在
    this.checkAndCreateCollection('customers').then(() => {
      const db = wx.cloud.database();
      
      db.collection('customers').get({
        success: res => {
          // 过滤掉临时记录
          let customers = res.data || [];
          customers = customers.filter(item => !item._isTemporary);
          
          // 生成客户名称列表
          const customerNames = customers.map(item => item.name);
          
          that.setData({
            customers: customers,
            customerNames: customerNames,
            noCustomer: customers.length === 0 // 新增：客户为空标志
          });
        },
        fail: err => {
          console.error('加载客户数据失败：', err);
          wx.showToast({
            title: '加载客户失败',
            icon: 'none'
          });
          that.setData({
            noCustomer: true // 加载失败也视为无客户
          });
        }
      });
    });
  },
  
  // 新增：跳转到添加客户页面
  addCustomerRedirect: function() {
    wx.navigateTo({
      url: '/pages/customers/addCustomer/addCustomer'
    });
  },
  
  // 加载订单数据
  loadOrderData: function(orderId) {
    const that = this;
    
    // 先检查并确保orders集合存在
    this.checkAndCreateCollection('orders').then(() => {
      const db = wx.cloud.database();
      
      // 尝试使用订单号查询
      db.collection('orders').where({
        id: orderId
      }).get({
        success: res => {
          if (res.data && res.data.length > 0) {
            const order = res.data[0];
            
            // 设置订单数据
            that.setData({
              order: order,
              products: order.items || []
            });
            
            // 计算总金额
            that.calculateTotal();
            
            // 设置订单状态
            const statusIndex = that.data.statusList.findIndex(item => item.id === order.status);
            if (statusIndex !== -1) {
              that.setData({
                statusIndex: statusIndex
              });
            }
            
            // 加载客户信息
            that.loadCustomerById(order.customerId);
          } else {
            // 尝试从本地存储获取
            const app = getApp();
            let orders = app.globalData.orders || [];
            
            // 如果全局数据为空，尝试从本地存储获取
            if (orders.length === 0) {
              orders = wx.getStorageSync('orders') || [];
            }
            
            // 查找订单
            const order = orders.find(o => o.id === orderId);
            
            if (order) {
              // 设置订单数据
              that.setData({
                order: order,
                products: order.items || []
              });
              
              // 计算总金额
              that.calculateTotal();
              
              // 设置订单状态
              const statusIndex = that.data.statusList.findIndex(item => item.id === order.status);
              if (statusIndex !== -1) {
                that.setData({
                  statusIndex: statusIndex
                });
              }
            } else {
              wx.showToast({
                title: '订单不存在',
                icon: 'none'
              });
              
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            }
          }
        },
        fail: err => {
          console.error('加载订单数据失败：', err);
          wx.showToast({
            title: '加载订单失败',
            icon: 'none'
          });
        }
      });
    });
  },
  
  // 根据ID加载客户信息
  loadCustomerById: function(customerId) {
    if (!customerId) return;
    
    const that = this;
    const db = wx.cloud.database();
    
    db.collection('customers').doc(customerId).get({
      success: res => {
        const customer = res.data;
        
        // 查找客户在列表中的索引
        const customerIndex = that.data.customers.findIndex(item => item._id === customerId);
        
        if (customerIndex !== -1) {
          // 设置客户信息
          that.setData({
            customerIndex: customerIndex,
            selectedCustomer: customer,
            customerDeleted: false // 找到客户，标志为 false
          });
          
          // 设置联系人信息
          that.setContactInfo(customer);
        } else {
          // 客户已被删除
          that.setData({
            customerDeleted: true
          });
        }
      },
      fail: err => {
        // 客户已被删除或加载失败
        that.setData({
          customerDeleted: true
        });
        console.error('加载客户详情失败：', err);
      }
    });
  },
  
  // 设置联系人信息
  setContactInfo: function(customer) {
    if (!customer) return;
    
    const contacts = customer.contacts || [];
    const contactNames = contacts.map(item => item.name);
    
    this.setData({
      contacts: contacts,
      contactNames: contactNames,
      contactIndex: 0
    });
    
    if (contacts.length > 0) {
      this.setData({
        selectedContact: contacts[0]
      });
    }
  },
  
  // 客户选择变更
  onCustomerChange: function(e) {
    const index = e.detail.value;
    const customer = this.data.customers[index];
    
    this.setData({
      customerIndex: index,
      selectedCustomer: customer,
      'order.customer': customer.name,
      'order.customerId': customer._id
    });
    
    // 设置联系人信息
    this.setContactInfo(customer);
  },
  
  // 联系人选择变更
  onContactChange: function(e) {
    const index = e.detail.value;
    const contact = this.data.contacts[index];
    
    this.setData({
      contactIndex: index,
      selectedContact: contact,
      'order.address': {
        name: contact.name,
        phone: contact.phone,
        detail: contact.address
      }
    });
  },
  
  // 日期选择变更
  onDateChange: function(e) {
    const date = e.detail.value;
    
    this.setData({
      'order.date': date
    });
  },
  
  // 状态选择变更
  onStatusChange: function(e) {
    const index = e.detail.value;
    const status = this.data.statusList[index].id;
    
    this.setData({
      statusIndex: index,
      'order.status': status
    });
  },
  
  // 添加商品
  addProduct: function() {
    const products = this.data.products;
    
    products.push({
      name: '',
      price: '',
      quantity: 1
    });
    
    this.setData({
      products: products
    });
  },
  
  // 移除商品
  removeProduct: function(e) {
    const index = e.currentTarget.dataset.index;
    const products = this.data.products;
    
    products.splice(index, 1);
    
    this.setData({
      products: products
    });
    
    // 重新计算总金额
    this.calculateTotal();
  },
  
  // 商品输入变更
  onProductInput: function(e) {
    const index = e.currentTarget.dataset.index;
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    const key = `products[${index}].${field}`;
    
    this.setData({
      [key]: value
    });
    
    // 重新计算总金额
    this.calculateTotal();
  },
  
  // 计算总金额
  calculateTotal: function() {
    const products = this.data.products;
    let total = 0;
    
    products.forEach(item => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      total += price * quantity;
    });
    
    this.setData({
      totalAmount: total.toFixed(2),
      'order.total': total
    });
  },
  
  // 取消添加/编辑
  cancelAdd: function() {
    wx.navigateBack();
  },
  
  // 提交表单
  submitForm: function(e) {
    const formData = e.detail.value;
    const order = this.data.order;
    const products = this.data.products;
    
    // 表单验证
    if (!order.customer) {
      wx.showToast({
        title: '请选择客户',
        icon: 'none'
      });
      return;
    }
    
    if (!order.date) {
      wx.showToast({
        title: '请选择下单日期',
        icon: 'none'
      });
      return;
    }
    
    if (!order.status) {
      wx.showToast({
        title: '请选择订单状态',
        icon: 'none'
      });
      return;
    }
    
    if (products.length === 0) {
      wx.showToast({
        title: '请添加商品',
        icon: 'none'
      });
      return;
    }
    
    // 验证商品信息
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      if (!product.name) {
        wx.showToast({
          title: `请输入商品${i + 1}名称`,
          icon: 'none'
        });
        return;
      }
      
      if (!product.price) {
        wx.showToast({
          title: `请输入商品${i + 1}单价`,
          icon: 'none'
        });
        return;
      }
      
      if (!product.quantity) {
        wx.showToast({
          title: `请输入商品${i + 1}数量`,
          icon: 'none'
        });
        return;
      }
    }
    
    // 构建订单数据
    const orderData = {
      id: order.id,
      date: order.date,
      status: order.status,
      customer: order.customer,
      customerId: order.customerId,
      address: order.address,
      items: products,
      total: parseFloat(this.data.totalAmount),
      remark: formData.remark || ''
    };
    
    // 显示加载提示
    wx.showLoading({
      title: this.data.isEdit ? '更新中...' : '保存中...',
      mask: true
    });
    
    // 保存到云数据库
    this.checkAndCreateCollection('orders').then(() => {
      const db = wx.cloud.database();
      
      if (this.data.isEdit && order._id) {
        // 更新订单
        db.collection('orders').doc(order._id).update({
          data: orderData,
          success: res => {
            console.log('更新订单成功', res);
            this.updateLocalData(orderData, order._id);
          },
          fail: err => {
            console.error('更新订单失败：', err);
            wx.hideLoading();
            wx.showToast({
              title: '云端更新失败',
              icon: 'none'
            });
          }
        });
      } else {
        // 新增订单
        db.collection('orders').add({
          data: orderData,
          success: res => {
            console.log('添加订单成功', res);
            orderData._id = res._id;
            this.updateLocalData(orderData);
          },
          fail: err => {
            console.error('添加订单失败：', err);
            wx.hideLoading();
            wx.showToast({
              title: '云端添加失败',
              icon: 'none'
            });
          }
        });
      }
    });
  },
  
  // 更新本地数据
  updateLocalData: function(orderData, orderId) {
    // 更新全局数据和本地存储
    const app = getApp();
    let orders = app.globalData.orders || [];
    
    // 如果全局数据为空，尝试从本地存储获取
    if (orders.length === 0) {
      orders = wx.getStorageSync('orders') || [];
    }
    
    if (this.data.isEdit) {
      // 更新现有订单
      const orderIndex = orders.findIndex(o => o.id === orderData.id || o._id === orderId);
      
      if (orderIndex !== -1) {
        // 保留原有的_id
        if (orders[orderIndex]._id && !orderData._id) {
          orderData._id = orders[orderIndex]._id;
        }
        
        orders[orderIndex] = orderData;
      } else {
        orders.push(orderData);
      }
    } else {
      // 添加新订单
      orders.push(orderData);
    }
    
    // 更新全局数据
    app.globalData.orders = orders;
    
    // 更新本地存储
    wx.setStorageSync('orders', orders);
    
    // 隐藏加载提示
    wx.hideLoading();
    
    wx.showToast({
      title: this.data.isEdit ? '更新成功' : '添加成功',
      icon: 'success'
    });
    
    // 返回上一页
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  }
}) 