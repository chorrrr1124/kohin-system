Page({
  data: {
    record: {
      customerName: '',
      customerPhone: '',
      customerId: '',
      type: 'money', // 默认为金额预存
      amount: '',
      productName: '',
      quantity: '',
      remark: ''
    },
    customers: [], // 预存客户列表
    filteredCustomers: [], // 搜索过滤后的客户列表
    customerIndex: null,
    products: [],
    productIndex: null,
    loading: true,
    searchKey: '', // 搜索关键词
    showCustomerList: false, // 是否显示客户列表
    
    // 新建客户相关数据
    showNewCustomerForm: false,
    newCustomer: {
      name: '',
      nature: '',
      source: '',
      remark: ''
    },
    newCustomerContact: {
      name: '',
      phone: '',
      address: ''
    },
    natureTypes: ['金额预存客户', '产品预存客户', '零售客户'],
    sourcesTypes: ['淘宝', '微信', '其他'],
    natureIndex: null,
    sourceIndex: null
  },

  onLoad: function(options) {
    this.loadCustomers();
    this.loadProducts();
  },

  // 加载预存客户列表
  loadCustomers: function() {
    const db = wx.cloud.database();
    db.collection('customers')
      .where({
        natureCategory: '预存客户'
      })
      .get({
        success: res => {
          this.setData({
            customers: res.data,
            filteredCustomers: res.data,
            loading: false
          });
        },
        fail: err => {
          console.error('加载客户列表失败：', err);
          wx.showToast({
            title: '加载客户失败',
            icon: 'none'
          });
          this.setData({
            loading: false
          });
        }
      });
  },

  // 搜索客户
  searchCustomer: function(e) {
    // 处理点击输入框的情况
    if (!e.detail || !e.detail.value) {
      this.setData({
        showCustomerList: true,
        filteredCustomers: this.data.customers
      });
      return;
    }
    
    const searchKey = e.detail.value.toLowerCase();
    this.setData({
      searchKey: searchKey,
      showCustomerList: true
    });
    
    if (!searchKey) {
      this.setData({
        filteredCustomers: this.data.customers
      });
      return;
    }
    
    // 过滤客户列表
    const filtered = this.data.customers.filter(customer => {
      // 搜索客户名称
      if (customer.name.toLowerCase().includes(searchKey)) {
        return true;
      }
      // 搜索客户主要电话
      if (customer.phone && customer.phone.includes(searchKey)) {
        return true;
      }
      // 搜索联系人电话
      if (customer.contacts && customer.contacts.length > 0) {
      for (let contact of customer.contacts) {
          if (contact.phone && contact.phone.includes(searchKey)) {
          return true;
          }
        }
      }
      return false;
    });
    
    this.setData({
      filteredCustomers: filtered
    });
  },

  // 选择客户
  selectCustomer: function(e) {
    const index = e.currentTarget.dataset.index;
    const customer = this.data.filteredCustomers[index];
    
    // 安全获取客户电话号码
    let customerPhone = '';
    if (customer.phone) {
      // 优先使用客户主要电话
      customerPhone = customer.phone;
    } else if (customer.contacts && customer.contacts.length > 0 && customer.contacts[0].phone) {
      // 其次使用第一个联系人电话
      customerPhone = customer.contacts[0].phone;
    }
    
    this.setData({
      'record.customerName': customer.name,
      'record.customerPhone': customerPhone,
      'record.customerId': customer._id,
      searchKey: customer.name,
      showCustomerList: false
    });
  },

  // 隐藏客户列表
  hideCustomerList: function() {
    this.setData({
      showCustomerList: false
    });
  },

  // 显示新建客户表单
  showNewCustomerForm: function() {
    this.setData({
      showNewCustomerForm: true,
      showCustomerList: false,
      natureIndex: null,
      sourceIndex: null,
      newCustomer: {
        name: '',
        nature: '',
        source: '',
        remark: ''
      },
      newCustomerContact: {
        name: '',
        phone: '',
        address: ''
      }
    });
  },
  
  // 隐藏新建客户表单
  hideNewCustomerForm: function() {
    this.setData({
      showNewCustomerForm: false
    });
  },
  
  // 客户性质选择
  onNatureChange: function(e) {
    const index = e.detail.value;
    this.setData({
      natureIndex: index,
      'newCustomer.nature': this.data.natureTypes[index]
    });
  },

  // 客户来源选择
  onSourceChange: function(e) {
    const index = e.detail.value;
    this.setData({
      sourceIndex: index,
      'newCustomer.source': this.data.sourcesTypes[index]
    });
  },
  
  // 输入新客户名称
  inputNewCustomerName: function(e) {
    this.setData({
      'newCustomer.name': e.detail.value
    });
  },
  
  // 输入新客户备注
  inputNewCustomerRemark: function(e) {
    this.setData({
      'newCustomer.remark': e.detail.value
    });
  },
  
  // 输入联系人姓名
  inputNewCustomerContactName: function(e) {
    this.setData({
      'newCustomerContact.name': e.detail.value
    });
  },
  
  // 输入联系人电话
  inputNewCustomerContactPhone: function(e) {
    // 限制只能输入数字
    const value = e.detail.value;
    const numericValue = value.replace(/\D/g, '');
    
    this.setData({
      'newCustomerContact.phone': numericValue
    });
    
    // 当用户输入完成且长度不为11位时给出提示
    if (numericValue.length > 0 && numericValue.length !== 11 && numericValue.length === value.length) {
      wx.showToast({
        title: '手机号必须为11位',
        icon: 'none'
      });
    }
  },
  
  // 输入联系人地址
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

    if (!this.data.newCustomer.nature) {
      wx.showToast({
        title: '请选择客户性质',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.newCustomer.source) {
      wx.showToast({
        title: '请选择客户来源',
        icon: 'none'
      });
      return;
    }

    if (!this.data.newCustomerContact.name || !this.data.newCustomerContact.phone) {
      wx.showToast({
        title: '请填写联系人信息',
        icon: 'none'
      });
      return;
    }
    
    // 提交到云数据库
    const db = wx.cloud.database();
    
    // 构建客户数据
    const customerData = {
      name: this.data.newCustomer.name,
      type: this.data.newCustomer.nature, // 使用客户性质作为类型
      nature: this.data.newCustomer.nature,
      natureCategory: this.getNatureCategory(this.data.newCustomer.nature), // 添加客户性质分类
      source: this.data.newCustomer.source,
      contacts: [this.data.newCustomerContact],
      remark: this.data.newCustomer.remark || '',
      createDate: this.formatDate(new Date()),
      createTime: db.serverDate()
    };
    
    // 保存到云数据库
    wx.showLoading({
      title: '保存中...',
      mask: true
    });
    
    db.collection('customers').add({
      data: customerData,
      success: res => {
        wx.hideLoading();
        
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        });
        
        // 添加到客户列表并选中
        customerData._id = res._id;
        const customers = this.data.customers;
        customers.unshift(customerData);
        
        this.setData({
          customers: customers,
          showNewCustomerForm: false,
          'record.customerName': customerData.name,
          'record.customerPhone': customerData.contacts[0].phone,
          'record.customerId': customerData._id,
          searchKey: customerData.name
        });
      },
      fail: err => {
        wx.hideLoading();
        console.error('添加客户失败：', err);
        
        wx.showToast({
          title: '添加失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 获取客户性质分类
  getNatureCategory: function(nature) {
    if (nature === '金额预存客户' || nature === '产品预存客户') {
      return '预存客户';
    } else {
      return nature;
    }
  },
  
  // 格式化日期为 YYYY-MM-DD
  formatDate: function(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  loadProducts: function() {
    const db = wx.cloud.database();
    db.collection('shopProducts').get({
      success: res => {
        const products = res.data.map(item => item.name);
        this.setData({
          products: products
        });
      },
      fail: err => {
        console.error('加载产品列表失败：', err);
        wx.showToast({
          title: '加载产品失败',
          icon: 'none'
        });
      }
    });
  },

  // 预存类型切换
  onTypeChange: function(e) {
    this.setData({
      'record.type': e.detail.value
    });
  },

  // 产品选择
  onProductChange: function(e) {
    const index = e.detail.value;
    this.setData({
      productIndex: index,
      'record.productName': this.data.products[index]
    });
  },

  // 表单提交
  submitForm: function(e) {
    const formData = e.detail.value;
    
    // 表单验证
    if (!this.data.record.customerId || !this.data.record.customerName) {
      wx.showToast({
        title: '请选择客户',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.record.type === 'money' && (!formData.amount || formData.amount <= 0)) {
      wx.showToast({
        title: '请输入正确的金额',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.record.type === 'product') {
      if (!this.data.record.productName) {
        wx.showToast({
          title: '请选择预存产品',
          icon: 'none'
        });
        return;
      }
      
      if (!formData.quantity || formData.quantity <= 0) {
        wx.showToast({
          title: '请输入正确的数量',
          icon: 'none'
        });
        return;
      }
    }
    
    // 使用增强的保存方法，确保数据同步
    this.syncAndSaveRecord(formData);
  },
  
  // 增强的保存记录方法，确保客户信息与预存记录同步
  syncAndSaveRecord: function(formData) {
    if (!this.data.record.customerId || !this.data.record.customerName) {
      wx.showToast({
        title: '请选择客户',
        icon: 'none'
      });
      return;
    }
    
    // 构建记录数据
    const db = wx.cloud.database();
    const recordData = {
      customerId: this.data.record.customerId,
      customerName: this.data.record.customerName,
      customerPhone: this.data.record.customerPhone,
      createTime: db.serverDate(),
      updateTime: db.serverDate(),
      remark: formData.remark || '',
      usageRecords: [] // 初始化使用记录数组
    };
    
    // 根据记录类型处理不同字段
    if (this.data.record.type === 'money') {
      recordData.type = 'cash'; // 金额预存统一保存为 'cash' 类型
      recordData.amount = parseFloat(formData.amount);
      recordData.expireDate = formData.expireDate || this.getDefaultExpireDate();
      recordData.balance = recordData.amount;
    } else if (this.data.record.type === 'product') {
      recordData.type = 'product'; // 产品预存保存为 'product' 类型
      recordData.productName = this.data.record.productName;
      recordData.quantity = parseInt(formData.quantity);
      recordData.balance = recordData.quantity;
      recordData.expireDate = formData.expireDate || this.getDefaultExpireDate();
    }
    
    console.log('保存预存记录:', recordData);
    
    // 确保客户信息完整性
    const ensureCustomerData = () => {
      // 检查客户是否存在完整信息
      db.collection('customers').doc(recordData.customerId).get({
        success: res => {
          const customerData = res.data;
          console.log('获取到的客户信息:', customerData);
          
          // 如果客户记录不存在电话，但预存记录有电话，则更新客户记录
          if ((!customerData.phone || customerData.phone === '') && recordData.customerPhone) {
            console.log('正在同步客户电话信息到客户记录');
            
            const updateData = {};
            
            // 更新客户电话信息
            if (!customerData.phone) {
              updateData.phone = recordData.customerPhone;
            }
            
            // 如果没有联系人信息，也添加联系人
            if (!customerData.contacts || customerData.contacts.length === 0) {
              updateData.contacts = [{
                name: customerData.name || '默认联系人',
                phone: recordData.customerPhone,
                isDefault: true
              }];
            }
            
            // 更新客户记录
            if (Object.keys(updateData).length > 0) {
              db.collection('customers').doc(recordData.customerId).update({
                data: updateData,
                success: res => {
                  console.log('客户信息已同步更新:', res);
                  saveRecordToDb();
                },
                fail: err => {
                  console.error('客户信息同步失败:', err);
                  saveRecordToDb(); // 即使更新失败也继续保存记录
                }
              });
            } else {
              saveRecordToDb();
            }
          } else {
            saveRecordToDb();
          }
        },
        fail: err => {
          console.error('获取客户信息失败:', err);
          saveRecordToDb(); // 获取失败也继续保存
        }
      });
    };
    
    // 保存预存记录到数据库
    const saveRecordToDb = () => {
      // 保存到数据库
      wx.showLoading({
        title: '保存中...',
        mask: true
      });
      
      db.collection('prepaidRecords').add({
        data: recordData,
        success: res => {
          wx.hideLoading();
          
          // 触发预存记录更新事件
          const app = getApp();
          if (app && app.globalData && app.globalData.eventBus) {
            // 重新加载数据并触发事件
            app.loadPrepaidRecordsFromCloud(true);
          }
          
          wx.showToast({
            title: '添加成功',
            icon: 'success',
            duration: 1500,
            mask: true,
            complete: () => {
              // 确保1.5秒后返回上一页
              setTimeout(() => {
                wx.navigateBack({
                  delta: 1,
                  fail: (err) => {
                    console.error('导航返回失败:', err);
                    // 如果导航返回失败，尝试重定向
                    wx.redirectTo({
                      url: '/pages/members/members'
                    });
                  }
                });
              }, 1600);
            }
          });
        },
        fail: err => {
          wx.hideLoading();
          console.error('添加预存记录失败：', err);
          wx.showToast({
            title: '添加失败',
            icon: 'none'
          });
        }
      });
    };
    
    // 开始执行客户信息同步流程
    ensureCustomerData();
  },
  
  // 获取默认到期日期
  getDefaultExpireDate: function() {
    // 默认设置一年后到期
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // 返回 YYYY-MM-DD 格式
  },

  // 取消添加
  cancelAdd: function() {
    wx.navigateBack();
  }
}); 