Page({
  data: {
    customerId: '',
    customer: {
      name: '',
      remark: '',
      contacts: [{
        name: '',
        phone: '',
        province: '',
        city: '',
        district: '',
        address: '',
        region: ['', '', '']
      }]
    }
  },

  onLoad: function(options) {
    wx.setNavigationBarTitle({
      title: '编辑客户'
    });
    
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
    
    // 监听新增地址事件
    this.checkForNewAddress();
  },

  onShow: function() {
    // 每次页面显示时检查是否有新增地址
    this.checkForNewAddress();
  },

  // 检查购物车新增地址数据
  checkForNewAddress: function() {
    const newAddressData = wx.getStorageSync('new_address_for_customer');
    if (newAddressData && newAddressData.customerId === this.data.customerId) {
      // 添加新联系人
      this.addContactFromAddress(newAddressData);
      // 清除存储的数据
      wx.removeStorageSync('new_address_for_customer');
    }
  },

  // 从地址数据添加联系人
  addContactFromAddress: function(addressData) {
    const newContact = {
      name: addressData.name || '',
      phone: addressData.phone || '',
      province: addressData.province || '',
      city: addressData.city || '',
      district: addressData.district || '',
      address: addressData.address || '',
      region: [addressData.province || '', addressData.city || '', addressData.district || '']
    };

    const contacts = this.data.customer.contacts.concat([newContact]);
    
    this.setData({
      'customer.contacts': contacts
    });

    wx.showToast({
      title: '已添加新联系人',
      icon: 'success'
    });
  },

  // 加载客户数据
  loadCustomerData: function(customerId) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    const db = wx.cloud.database();
    
    db.collection('customers').doc(customerId).get({
      success: res => {
        wx.hideLoading();
        
        const customer = res.data;
        let contacts = [];
        
        // 处理联系人数据兼容性
        if (customer.contacts && customer.contacts.length > 0) {
          // 如果有contacts数组，使用它
          contacts = customer.contacts.map(contact => ({
            name: contact.name || contact.contact || '',
            phone: contact.phone || '',
            province: contact.province || '',
            city: contact.city || '',
            district: contact.district || '',
            address: contact.address || contact.addressDetail || '',
            region: [
              contact.province || '',
              contact.city || '',
              contact.district || ''
            ]
          }));
        } else {
          // 兼容旧数据格式，创建一个联系人
          contacts = [{
            name: customer.contact || '',
            phone: customer.phone || '',
            province: customer.province || '',
            city: customer.city || '',
            district: customer.district || '',
            address: customer.address || customer.addressDetail || '',
            region: [
              customer.province || '',
              customer.city || '',
              customer.district || ''
            ]
          }];
        }
        
        // 确保至少有一个联系人
        if (contacts.length === 0) {
          contacts = [{
            name: '',
            phone: '',
            province: '',
            city: '',
            district: '',
            address: '',
            region: ['', '', '']
          }];
        }
        
        this.setData({
          customer: {
            name: customer.name || '',
            remark: customer.remark || '',
            contacts: contacts
          }
        });
      },
      fail: err => {
        wx.hideLoading();
        console.error('加载客户数据失败：', err);
        
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
        
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    });
  },

  // 输入客户名称
  onNameInput: function(e) {
    this.setData({
      'customer.name': e.detail.value
    });
  },

  // 输入备注
  onRemarkInput: function(e) {
    this.setData({
      'customer.remark': e.detail.value
    });
  },

  // 输入联系人姓名
  onContactNameInput: function(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      [`customer.contacts[${index}].name`]: e.detail.value
    });
  },

  // 输入联系电话
  onContactPhoneInput: function(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value.replace(/\D/g, ''); // 只保留数字
    this.setData({
      [`customer.contacts[${index}].phone`]: value
    });
  },

  // 地区选择
  onRegionChange: function(e) {
    const index = e.currentTarget.dataset.index;
    const region = e.detail.value;
    
    this.setData({
      [`customer.contacts[${index}].region`]: region,
      [`customer.contacts[${index}].province`]: region[0],
      [`customer.contacts[${index}].city`]: region[1],
      [`customer.contacts[${index}].district`]: region[2]
    });
  },

  // 输入详细地址
  onContactAddressInput: function(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      [`customer.contacts[${index}].address`]: e.detail.value
    });
  },

  // 新增联系人
  onAddContact: function() {
    const newContact = {
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      address: '',
      region: ['', '', '']
    };

    const contacts = this.data.customer.contacts.concat([newContact]);
    
    this.setData({
      'customer.contacts': contacts
    });

    wx.showToast({
      title: '已添加新联系人',
      icon: 'success'
    });
  },

  // 删除联系人
  onDeleteContact: function(e) {
    const index = e.currentTarget.dataset.index;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个联系人吗？',
      success: res => {
        if (res.confirm) {
          const contacts = this.data.customer.contacts.slice();
          contacts.splice(index, 1);
          
          this.setData({
            'customer.contacts': contacts
          });

          wx.showToast({
            title: '联系人已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 取消编辑
  onCancel: function() {
    wx.navigateBack();
  },

  // 保存客户
  onSave: function() {
    const { customer } = this.data;
    
    // 表单验证
    if (!customer.name.trim()) {
      wx.showToast({
        title: '请输入客户名称',
        icon: 'none'
      });
      return;
    }
    
    // 验证联系人信息
    let hasValidContact = false;
    for (let i = 0; i < customer.contacts.length; i++) {
      const contact = customer.contacts[i];
      
      if (contact.name.trim() && contact.phone.trim()) {
        // 验证手机号格式
        if (!/^1\d{10}$/.test(contact.phone)) {
          wx.showToast({
            title: `联系人${i + 1}手机号格式不正确`,
            icon: 'none'
          });
          return;
        }
        hasValidContact = true;
      } else if (contact.name.trim() || contact.phone.trim()) {
        // 部分填写的联系人
        if (!contact.name.trim()) {
          wx.showToast({
            title: `请输入联系人${i + 1}的姓名`,
            icon: 'none'
          });
          return;
        }
        if (!contact.phone.trim()) {
          wx.showToast({
            title: `请输入联系人${i + 1}的电话`,
            icon: 'none'
          });
          return;
        }
      }
    }
    
    if (!hasValidContact) {
      wx.showToast({
        title: '请至少完善一个联系人信息',
        icon: 'none'
      });
      return;
    }
    
    this.saveCustomer();
  },

  // 保存到数据库
  saveCustomer: function() {
    wx.showLoading({
      title: '保存中...',
      mask: true
    });
    
    const db = wx.cloud.database();
    const { customer } = this.data;
    
    // 过滤掉空的联系人
    const validContacts = customer.contacts.filter(contact => 
      contact.name.trim() && contact.phone.trim()
    );
    
    // 构建更新数据
    const updateData = {
      name: customer.name.trim(),
      remark: customer.remark.trim(),
      contacts: validContacts,
      updateTime: db.serverDate()
    };
    
    // 保持兼容性，使用第一个联系人的数据
    if (validContacts.length > 0) {
      const firstContact = validContacts[0];
      updateData.contact = firstContact.name;
      updateData.phone = firstContact.phone;
      updateData.province = firstContact.province;
      updateData.city = firstContact.city;
      updateData.district = firstContact.district;
      updateData.address = firstContact.address;
      updateData.addressDetail = firstContact.address;
    }
    
    db.collection('customers').doc(this.data.customerId).update({
      data: updateData,
      success: res => {
        wx.hideLoading();
        
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
        
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      },
      fail: err => {
        wx.hideLoading();
        console.error('保存失败：', err);
        
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    });
  }
}) 