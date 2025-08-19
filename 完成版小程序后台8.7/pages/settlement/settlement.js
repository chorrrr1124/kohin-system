Page({
  data: {
    cartItems: [],
    totalPrice: '0.00',
    selectedCustomer: null,
    shippingContact: {
      name: '',
      phone: '',
      address: ''
    },
    paymentMethod: 'cash',
    paymentMethods: [
      { id: 'cash', name: '现金支付' },
      { id: 'prepaid', name: '预存抵扣' }
    ],
    // 客户选择相关
    showCustomerModal: false,
    customerList: [],
    searchValue: '',
    filteredCustomers: [],
    loadingCustomers: false,
    // 新建客户相关
    showNewCustomerForm: false,
    newCustomer: {
      name: '',
      type: '个人客户',
      nature: '零售客户',
      source: '微信',
      remark: ''
    },
    newCustomerContact: { name: '', phone: '', address: '' }
  },

  onLoad: function(options) {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    // 获取购物车数据
    const eventChannel = this.getOpenerEventChannel();
    if (eventChannel && typeof eventChannel.on === 'function') {
      eventChannel.on('acceptCartData', (data) => {
        this.setData({
          cartItems: data.cartItems,
          totalPrice: data.totalPrice
        });
      });
    }
  },

  // 选择客户
  selectCustomer: function(e) {
    console.log('选择客户按钮被点击');
    // 阻止事件冒泡和默认行为
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    // 加载客户数据
    this.loadCustomerData();
    
    // 确保不会设置customerSelectMode，这可能导致跳转
    if(wx.getStorageSync('customerSelectMode')) {
      wx.removeStorageSync('customerSelectMode');
      console.log('清除了customerSelectMode标志，防止跳转');
    }
    
    // 强制设置为false，然后再设置为true，确保UI刷新
    this.setData({
      showCustomerModal: false
    }, () => {
      // 显示客户选择弹窗
      setTimeout(() => {
        this.setData({
          showCustomerModal: true
        }, () => {
          console.log('客户选择弹窗设置完成，当前状态:', this.data.showCustomerModal);
        });
      }, 100); // 添加短暂延时确保UI更新
    });
    
    // 返回false阻止可能的页面跳转
    return false;
  },

  // 加载客户数据
  loadCustomerData: function() {
    console.log('开始加载客户数据');
    this.setData({ loadingCustomers: true });
    
    // 先从本地缓存加载
    const cachedCustomers = wx.getStorageSync('customers') || [];
    console.log('本地缓存客户数量:', cachedCustomers.length);
    
    if (cachedCustomers.length > 0) {
      // 只显示前5个客户
      const limitedList = cachedCustomers.slice(0, 5);
      this.setData({
        customerList: cachedCustomers, // 保存完整列表用于搜索
        filteredCustomers: limitedList,
        loadingCustomers: false
      }, () => {
        console.log('已从缓存加载客户数据:', limitedList.length, '条');
      });
      return;
    }
    
    // 从云数据库加载
    const db = wx.cloud.database();
    db.collection('customers').limit(5).get({
      success: res => {
        this.setData({
          customerList: res.data,
          filteredCustomers: res.data,
          loadingCustomers: false
        });
        // 缓存数据
        wx.setStorageSync('customers', res.data);
      },
      fail: err => {
        console.error('加载客户数据失败:', err);
        this.setData({ loadingCustomers: false });
        wx.showToast({
          title: '加载客户失败',
          icon: 'none'
        });
      }
    });
  },

  // 搜索客户
  searchCustomers: function(e) {
    const value = e.detail.value;
    this.setData({ searchValue: value });
    
    if (!value) {
      // 搜索框为空，显示前5个客户
      this.setData({
        filteredCustomers: this.data.customerList.slice(0, 5)
      });
      return;
    }
    
    // 根据搜索关键字过滤客户
    const keyword = value.toLowerCase();
    const filtered = this.data.customerList.filter(customer => {
      // 检查客户名称和电话
      if ((customer.name && customer.name.toLowerCase().includes(keyword)) ||
          (customer.phone && customer.phone.includes(keyword))) {
        return true;
      }
      
      // 检查联系人信息
      if (customer.contacts) {
        let contacts = [];
        
        // 处理contacts字段，可能是字符串也可能是数组
        if (typeof customer.contacts === 'string') {
          try {
            contacts = JSON.parse(customer.contacts);
          } catch (e) {
            console.error('搜索过滤时解析contacts JSON失败:', e);
            contacts = [];
          }
        } else if (Array.isArray(customer.contacts)) {
          contacts = customer.contacts;
        }
        
        // 搜索联系人信息
        return contacts.some(contact => 
          (contact.name && contact.name.toLowerCase().includes(keyword)) ||
          (contact.phone && contact.phone.includes(keyword))
        );
      }
      
      return false;
    }).slice(0, 5); // 限制显示5个结果
    
    this.setData({
      filteredCustomers: filtered
    });
  },

  // 选择客户项
  selectCustomerItem: function(e) {
    const customerId = e.currentTarget.dataset.id;
    const customer = this.data.customerList.find(c => c._id === customerId);
    
    if (customer) {
      // 更新选中的客户
      this.setData({
        selectedCustomer: customer,
        showCustomerModal: false  // 关闭弹窗
      });
      
      // 如果客户有联系人信息，自动填充收货信息
      // 处理contacts字段，可能是字符串也可能是数组
      let contacts = [];
      if (customer && customer.contacts) {
        console.log('settlement页面-原始contacts数据:', customer.contacts, '类型:', typeof customer.contacts);
        
        if (typeof customer.contacts === 'string') {
          try {
            contacts = JSON.parse(customer.contacts);
            console.log('settlement页面-解析JSON字符串后的contacts:', contacts);
          } catch (e) {
            console.error('settlement页面-解析contacts JSON失败:', e);
            contacts = [];
          }
        } else if (Array.isArray(customer.contacts)) {
          contacts = customer.contacts;
          console.log('settlement页面-contacts已经是数组:', contacts);
        }
      }
      
      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        console.log('settlement页面-选择的联系人:', contact);
        
        // 组合完整地址
        let fullAddress = '';
        const addressParts = [];
        
        if (contact.province) addressParts.push(contact.province);
        if (contact.city) addressParts.push(contact.city);
        // 处理区域信息，可能是district字段或region数组
        if (contact.district) {
          addressParts.push(contact.district);
        } else if (contact.region && Array.isArray(contact.region) && contact.region.length >= 3) {
          addressParts.push(contact.region[2]); // 取第三个元素作为区域
        }
        if (contact.address || contact.addressDetail) {
          addressParts.push(contact.address || contact.addressDetail);
        }
        
        fullAddress = addressParts.join(' ');
        console.log('settlement页面-组合后的完整地址:', fullAddress);
        
        this.setData({
          shippingContact: {
            name: contact.name || '',
            phone: contact.phone || '',
            address: fullAddress || contact.address || contact.addressDetail || ''
          }
        });
        console.log('settlement页面-设置的收货信息:', this.data.shippingContact);
      }
    }
  },

  // 新建客户
  createNewCustomer: function() {
    console.log('点击新建客户按钮');
    
    // 修改弹窗内容为新建客户表单
    this.setData({
      showCustomerModal: true,
      showNewCustomerForm: true,
      newCustomer: {
        name: '',
        type: '个人客户',
        nature: '零售客户',
        source: '微信',
        remark: ''
      },
      newCustomerContact: { name: '', phone: '', address: '' }
    });
  },
  
  // 取消新建客户
  cancelNewCustomer: function() {
    this.setData({
      showNewCustomerForm: false
    });
  },
  
  // 输入新客户信息
  inputNewCustomerName: function(e) {
    this.setData({
      'newCustomer.name': e.detail.value
    });
  },
  
  inputNewCustomerContactName: function(e) {
    this.setData({
      'newCustomerContact.name': e.detail.value
    });
  },
  
  inputNewCustomerContactPhone: function(e) {
    this.setData({
      'newCustomerContact.phone': e.detail.value
    });
  },
  
  inputNewCustomerContactAddress: function(e) {
    this.setData({
      'newCustomerContact.address': e.detail.value
    });
  },
  
  // 保存新客户
  saveNewCustomer: function() {
    // 表单验证
    if (!this.data.newCustomer.name) {
      wx.showToast({
        title: '请输入客户名称',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.newCustomerContact.name || !this.data.newCustomerContact.phone) {
      wx.showToast({
        title: '请填写联系人姓名和电话',
        icon: 'none'
      });
      return;
    }
    
    // 构建客户数据
    const customerData = {
      name: this.data.newCustomer.name,
      type: this.data.newCustomer.type,
      nature: this.data.newCustomer.nature,
      source: this.data.newCustomer.source,
      contacts: [this.data.newCustomerContact],
      remark: this.data.newCustomer.remark || '',
      createDate: this.formatDate(new Date()),
      _isTemporary: true
    };
    
    // 添加到客户列表
    const updatedList = [customerData].concat(this.data.customerList);
    
    this.setData({
      customerList: updatedList,
      filteredCustomers: updatedList.slice(0, 5),
      selectedCustomer: customerData,
      showNewCustomerForm: false,
      showCustomerModal: false
    });
    
    // 更新本地缓存
    wx.setStorageSync('customers', updatedList);
    
    // 自动填充收货信息
    this.setData({
      shippingContact: {
        name: this.data.newCustomerContact.name || '',
        phone: this.data.newCustomerContact.phone || '',
        address: this.data.newCustomerContact.address || ''
      }
    });
  },

  // 关闭客户选择弹窗
  closeCustomerModal: function() {
    console.log('关闭客户选择弹窗');
    this.setData({
      showCustomerModal: false,
      showNewCustomerForm: false
    }, () => {
      console.log('客户选择弹窗已关闭，当前状态:', this.data.showCustomerModal);
    });
  },

  // 收货人信息输入处理
  inputContactName: function(e) {
    this.setData({
      'shippingContact.name': e.detail.value
    });
  },

  inputContactPhone: function(e) {
    // 限制只能输入数字
    const value = e.detail.value;
    const numericValue = value.replace(/\D/g, '');
    
    this.setData({
      'shippingContact.phone': numericValue
    });
    
    // 当用户输入完成且长度不为11位时给出提示
    if (numericValue.length > 0 && numericValue.length !== 11 && numericValue.length === value.length) {
      wx.showToast({
        title: '手机号必须为11位',
        icon: 'none'
      });
    }
  },

  inputContactAddress: function(e) {
    this.setData({
      'shippingContact.address': e.detail.value
    });
  },

  // 选择支付方式
  selectPaymentMethod: function(e) {
    const method = e.currentTarget.dataset.method;
    this.setData({
      paymentMethod: method
    });
  },

  // 格式化日期为 YYYY-MM-DD
  formatDate: function(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 提交订单
  submitOrder: function() {
    // 验证必要信息
    if (!this.data.selectedCustomer) {
      wx.showToast({
        title: '请选择客户',
        icon: 'none'
      });
      return;
    }

    if (!this.data.shippingContact.name || !this.data.shippingContact.phone || !this.data.shippingContact.address) {
      wx.showToast({
        title: '请填写完整收货信息',
        icon: 'none'
      });
      return;
    }

    if (!this.data.paymentMethod) {
      wx.showToast({
        title: '请选择支付方式',
        icon: 'none'
      });
      return;
    }

    // 获取客户信息
    const customerId = this.data.selectedCustomer._id;
    const customerPhone = this.data.selectedCustomer.phone;
    
    wx.showLoading({
      title: '提交中...'
    });
    
    // 检查是否为临时客户，如果是，则需要先保存到数据库
    if (this.data.selectedCustomer._isTemporary) {
      const db = wx.cloud.database();
      // 移除临时标记
      const customerData = Object.assign({}, this.data.selectedCustomer);
      delete customerData._isTemporary;
      
      db.collection('customers').add({
        data: customerData,
        success: res => {
          console.log('临时客户保存成功:', res);
          // 更新客户ID
          customerData._id = res._id;
          this.setData({
            selectedCustomer: customerData
          });
          
          // 更新本地缓存
          const cachedCustomers = wx.getStorageSync('customers') || [];
          const updatedCache = cachedCustomers.map(c => {
            if (c._id === this.data.selectedCustomer._id) {
              return customerData;
            }
            return c;
          });
          wx.setStorageSync('customers', updatedCache);
          
          // 继续提交订单流程
          this.checkPrepaidAndCreateOrder(customerData._id, customerData.phone);
        },
        fail: err => {
          console.error('保存临时客户失败:', err);
          wx.hideLoading();
          wx.showToast({
            title: '创建客户失败',
            icon: 'none'
          });
        }
      });
    } else {
      // 已有客户，直接检查预存并创建订单
      this.checkPrepaidAndCreateOrder(customerId, customerPhone);
    }
  },

  // 检查预存并创建订单
  checkPrepaidAndCreateOrder: function(customerId, customerPhone) {
    // 检查是否为预存产品订单
    let isPrepaidProduct = false;
    if (this.data.cartItems.length === 1 && this.data.paymentMethod === 'prepaid') {
      const item = this.data.cartItems[0];
      // 检查商品名称是否与预存记录匹配
      const db = wx.cloud.database();
      db.collection('prepaidRecords').where({
        customerPhone: customerPhone,
        productName: item.name,
        type: 'product',
        balance: db.command.gt(0)
      }).get({
        success: res => {
          console.log('查询预存记录结果:', res.data);
          if (res.data && res.data.length > 0) {
            // 检查预存余额是否足够
            const totalBalance = res.data.reduce((sum, record) => sum + record.balance, 0);
            if (totalBalance >= item.quantity) {
              isPrepaidProduct = true;
              console.log('检测到预存产品订单:', {
                productName: item.name,
                quantity: item.quantity,
                totalBalance: totalBalance
              });
              this.createOrder(customerId, customerPhone, isPrepaidProduct, res.data);
            } else {
              console.warn('预存产品余额不足:', {
                productName: item.name,
                quantity: item.quantity,
                totalBalance: totalBalance
              });
              wx.hideLoading();
              wx.showModal({
                title: '提示',
                content: `预存产品余额不足，当前余额: ${totalBalance}，需要: ${item.quantity}`,
                showCancel: false
              });
            }
          } else {
            // 没有找到预存记录，作为普通订单处理
            this.createOrder(customerId, customerPhone, false);
          }
        },
        fail: err => {
          console.error('查询预存记录失败:', err);
          wx.hideLoading();
          wx.showToast({
            title: '查询预存记录失败',
            icon: 'none'
          });
        }
      });
    } else {
      // 多个商品或非预存支付，直接创建普通订单
      this.createOrder(customerId, customerPhone, false);
    }
  },

  // 创建订单
  createOrder: function(customerId, customerPhone, isPrepaidProduct, prepaidRecords) {
    const app = getApp();
    
    // 获取北京时间（UTC+8）
    const now = new Date();
    const utc8Offset = 8 * 60 * 60 * 1000;  
    const beijingTime = new Date(now.getTime() + utc8Offset);
    const beijingDateStr = beijingTime.toISOString().split('T')[0];
    
    console.log("结算页面 - 系统当前时间:", now.toString());
    console.log("结算页面 - 转换后北京日期:", beijingDateStr);
    
    // 准备订单数据
    const orderData = {
      customer: this.data.selectedCustomer.name,
      customerId: customerId,
      customerPhone: customerPhone,
      shipping: this.data.shippingContact,
      paymentMethod: this.data.paymentMethod,
      items: this.data.cartItems,
      total: isPrepaidProduct ? 0 : parseFloat(this.data.totalPrice), // 预存扣除订单金额为0
      isPrepaidProduct: isPrepaidProduct,
      date: beijingDateStr, // 使用北京时间日期
      paymentStatus: 'pending' // 添加支付状态字段
    };
    
    console.log('提交订单数据:', JSON.stringify(orderData));
    
    // 如果是预存订单，需要扣减预存余额
    if (isPrepaidProduct && prepaidRecords) {
      const item = this.data.cartItems[0];
      let remainingQuantity = item.quantity;
      const db = wx.cloud.database();
      const _ = db.command;
      
      // 按记录创建日期排序，优先使用较早的预存记录
      const sortedRecords = prepaidRecords.slice().sort((a, b) => 
        new Date(a.createDate) - new Date(b.createDate)
      );
      
      // 逐条扣减预存记录
      sortedRecords.forEach(record => {
        if (remainingQuantity <= 0) return;
        
        const deduction = Math.min(record.balance, remainingQuantity);
        remainingQuantity -= deduction;
        
        // 更新预存记录
        db.collection('prepaidRecords').doc(record._id).update({
          data: {
            balance: _.subtract(deduction),
            lastUseDate: beijingDateStr,  // 使用北京时间
            usageRecords: _.push({
              date: beijingDateStr,  // 使用北京时间
              quantity: deduction,
              orderInfo: `订单使用 ${item.name} x${deduction}`
            })
          },
          success: () => {
            console.log('预存记录更新成功:', record._id, '扣减数量:', deduction);
          },
          fail: err => {
            console.error('预存记录更新失败:', err);
          }
        });
      });
    }
    
    // 调用全局保存订单方法
    const orderId = app.saveOrder(orderData);
    
    // 根据支付方式处理 - 移除微信支付，所有订单都直接创建成功
    this.handleOrderSuccess(orderId);
  },

  
  // 处理订单创建成功
  handleOrderSuccess: function(orderId) {
    // 清空购物车
    wx.setStorageSync('cartItems', []);
    
    setTimeout(() => {
      wx.showModal({
        title: '订单提交成功',
        content: '您的订单已提交，订单号：' + orderId + '\n总金额：¥' + this.data.totalPrice,
        showCancel: false,
        success: (res) => {
          if (res.confirm) {
            // 返回上一页
            wx.navigateBack({
              delta: 2 // 返回两层，回到商城页面
            });
          }
        }
      });
    }, 1000);
  },
  
  // 跳转到订单管理页面
  navigateToOrders: function() {
    wx.switchTab({
      url: '/pages/orders/orders'
    });
  }
});