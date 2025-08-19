Page({
  data: {
    customer: {
      name: '',
      nature: '',
      source: '',
      remark: ''
    },
    natureTypes: ['金额预存客户', '产品预存客户', '零售客户'],
    sourcesTypes: ['淘宝', '微信', '其他'],
    natureIndex: null,
    sourceIndex: null,
    contacts: [{ name: '', phone: '', province: '', city: '', district: '', addressDetail: '', region: ['', '', ''] }],
    fromCart: false // 是否从购物车页面跳转来
  },

  onLoad: function(options) {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '添加客户'
    });
    
    // 判断是否从购物车页面跳转来
    if (options.from === 'cart') {
      this.setData({
        fromCart: true
      });
      
      // 默认选择零售客户
      this.setData({
        natureIndex: 2,
        'customer.nature': this.data.natureTypes[2],
        sourceIndex: 1,
        'customer.source': this.data.sourcesTypes[1]
      });
    }
  },

  // 客户性质选择
  onNatureChange: function(e) {
    const index = e.detail.value;
    this.setData({
      natureIndex: index,
      'customer.nature': this.data.natureTypes[index]
    });
  },

  // 客户来源选择
  onSourceChange: function(e) {
    const index = e.detail.value;
    this.setData({
      sourceIndex: index,
      'customer.source': this.data.sourcesTypes[index]
    });
  },

  // 添加联系人
  addContact: function() {
    const contacts = this.data.contacts;
    contacts.push({ name: '', phone: '', province: '', city: '', district: '', addressDetail: '', region: ['', '', ''] });
    this.setData({
      contacts: contacts
    });
  },

  // 删除联系人
  deleteContact: function(e) {
    const index = e.currentTarget.dataset.index;
    const contacts = this.data.contacts;
    if (contacts.length > 1) {
      contacts.splice(index, 1);
      this.setData({
        contacts: contacts
      });
    } else {
      wx.showToast({
        title: '至少保留一个联系人',
        icon: 'none'
      });
    }
  },

  // 输入客户名称
  inputCustomerName: function(e) {
    const value = e.detail.value;
    this.setData({
      'customer.name': value
    });
  },

  // 输入客户备注
  inputCustomerRemark: function(e) {
    const value = e.detail.value;
    this.setData({
      'customer.remark': value
    });
  },

  // 输入联系人姓名
  inputContactName: function(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const key = `contacts[${index}].name`;
    this.setData({
      [key]: value
    });
  },

  // 输入联系人电话
  inputContactPhone: function(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    
    // 限制只能输入数字
    const numericValue = value.replace(/\D/g, '');
    
    const key = `contacts[${index}].phone`;
    this.setData({
      [key]: numericValue
    });
    
    // 当用户输入完成且长度不为11位时给出提示
    if (numericValue.length > 0 && numericValue.length !== 11 && numericValue.length === value.length) {
      wx.showToast({
        title: '手机号必须为11位',
        icon: 'none'
      });
    }
  },

  // 联系人地区选择
  bindContactRegionChange: function(e) {
    const index = e.currentTarget.dataset.index;
    const region = e.detail.value;
    
    this.setData({
      [`contacts[${index}].region`]: region,
      [`contacts[${index}].province`]: region[0],
      [`contacts[${index}].city`]: region[1],
      [`contacts[${index}].district`]: region[2]
    });
  },
  
  // 输入联系人详细地址
  inputContactAddressDetail: function(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    this.setData({
      [`contacts[${index}].addressDetail`]: value
    });
  },

  // 保持原有的inputContactAddress方法用于兼容性，但内部实现修改为更新addressDetail
  inputContactAddress: function(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    this.setData({
      [`contacts[${index}].addressDetail`]: value,
      [`contacts[${index}].address`]: value // 同时更新旧字段保持兼容性
    });
  },

  // 取消添加
  cancelAdd: function() {
    wx.navigateBack();
  },

  // 提交表单
  submitForm: function(e) {
    // 从页面数据中获取表单数据
    const formData = {
      name: this.data.customer.name,
      remark: this.data.customer.remark
    };
    
    // 表单验证
    if (!formData.name) {
      wx.showToast({
        title: '请输入客户名称',
        icon: 'none'
      });
      return;
    }

    if (!this.data.customer.nature) {
      wx.showToast({
        title: '请选择客户性质',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.customer.source) {
      wx.showToast({
        title: '请选择客户来源',
        icon: 'none'
      });
      return;
    }

    // 验证联系人
    const contacts = this.data.contacts;
    let hasValidContact = false;
    
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      
      // 验证手机号是否为11位
      if (contact.phone && contact.phone.length !== 11) {
        wx.showToast({
          title: '手机号必须为11位',
          icon: 'none'
        });
        return;
      }
      
      // 从购物车跳转时，姓名、电话和地址都必填
      if (this.data.fromCart) {
        // 更新地址验证逻辑，检查是否填写了详细地址
        if (contact.name && contact.phone && contact.phone.length === 11 && 
            (contact.addressDetail || contact.address)) {
          // 为了兼容性，确保contact.address字段存在
          if (contact.addressDetail && !contact.address) {
            contact.address = contact.addressDetail;
          }
          hasValidContact = true;
          break;
        }
      } else {
        // 普通添加时，只验证姓名和电话
        if (contact.name && contact.phone && contact.phone.length === 11) {
        hasValidContact = true;
        break;
        }
      }
    }
    
    if (!hasValidContact) {
      wx.showToast({
        title: this.data.fromCart ? '请完整填写联系人信息' : '至少填写一个联系人信息',
        icon: 'none'
      });
      return;
    }
    
    // 提交到云数据库
    const db = wx.cloud.database();
    
    // 处理联系人数据，确保兼容性
    const processedContacts = this.data.contacts.map(contact => {
      // 创建联系人对象副本
      const processedContact = Object.assign({}, contact);
      
      // 确保addressDetail和address字段一致
      if (processedContact.addressDetail && !processedContact.address) {
        processedContact.address = processedContact.addressDetail;
      } else if (processedContact.address && !processedContact.addressDetail) {
        processedContact.addressDetail = processedContact.address;
      }
      
      // 如果有详细地址但没有选择地区，就使用空字符串作为省市区
      if ((processedContact.addressDetail || processedContact.address) && 
          (!processedContact.province || !processedContact.city || !processedContact.district)) {
        processedContact.province = processedContact.province || '';
        processedContact.city = processedContact.city || '';
        processedContact.district = processedContact.district || '';
      }
      
      return processedContact;
    });
    
    // 构建客户数据
    const customerData = {
      name: formData.name,
      type: this.data.customer.nature, // 使用客户性质作为类型
      nature: this.data.customer.nature,
      natureCategory: this.getNatureCategory(this.data.customer.nature), // 添加客户性质分类
      source: this.data.customer.source,
      contacts: processedContacts,
      remark: formData.remark || '',
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
        
        // 获取添加后的客户信息
        if (this.data.fromCart) {
          // 客户数据添加成功后，获取_id
          const newCustomerId = res._id;
          console.log('新创建的客户ID:', newCustomerId);
          
          // 构建一个包含关键信息的对象直接使用
          const simpleCustomerInfo = {
            _id: newCustomerId,
            name: formData.name,
            contacts: this.data.contacts,
            nature: this.data.customer.nature,
            source: this.data.customer.source,
            createDate: this.formatDate(new Date())
          };
          
          console.log('准备传递的客户信息:', simpleCustomerInfo);
          
          try {
            // 使用小程序全局变量
            const app = getApp();
            if (!app.globalData) {
              app.globalData = {};
            }
            
            // 直接保存完整信息对象
            app.globalData.newCustomer = simpleCustomerInfo;
            console.log('客户信息已保存到全局变量');
            
            // 同时保存到本地存储
            wx.setStorageSync('newCreatedCustomer', simpleCustomerInfo);
            console.log('客户信息已保存到本地存储');
            
            // 延迟返回
            setTimeout(() => {
              wx.navigateBack({
                success: function() {
                  console.log('成功返回上一页');
                },
                fail: function(err) {
                  console.error('返回上一页失败:', err);
                }
              });
            }, 1000);
          } catch (err) {
            console.error('保存客户信息时发生错误:', err);
            wx.navigateBack();
          }
        } else {
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
        }
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
  }
}) 