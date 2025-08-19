Page({
  data: {
    addressId: '',
    customerId: '',
    isEdit: false,
    address: {
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      isDefault: false,
      customerId: ''
    },
    loading: false,
    region: ['', '', '']
  },

  onLoad: function (options) {
    console.log('地址编辑页面onLoad', options);
    if (options.customerId) {
      this.setData({
        customerId: options.customerId,
        'address.customerId': options.customerId
      });
    }
    
    if (options.id) {
      this.setData({
        addressId: options.id,
        isEdit: true
      });
      this.loadAddressDetail(options.id);
    } else {
      this.setData({
        isEdit: false
      });
    }
  },
  
  // 加载地址详情
  loadAddressDetail: function (addressId) {
    // 检查是否为临时地址ID
    if (addressId.startsWith('temp_')) {
      console.log('检测到临时地址ID:', addressId);
      
      let tempAddress = null;
      const app = getApp();
      
      // 尝试从全局变量获取临时地址
      if (app.globalData && app.globalData.tempAddresses && app.globalData.tempAddresses[addressId]) {
        tempAddress = app.globalData.tempAddresses[addressId];
        console.log('从全局变量获取临时地址:', tempAddress);
      }
      
      // 如果全局变量中没有，尝试从本地存储获取
      if (!tempAddress) {
        const storedAddresses = wx.getStorageSync('tempAddresses') || {};
        if (storedAddresses[addressId]) {
          tempAddress = storedAddresses[addressId];
          console.log('从本地存储获取临时地址:', tempAddress);
        }
      }
      
      if (tempAddress) {
        // 设置地区选择器的值
        const region = [
          tempAddress.province || '',
          tempAddress.city || '',
          tempAddress.district || ''
        ];
        
        this.setData({
          address: tempAddress,
          region: region,
          loading: false
        });
        return;
      } else {
        // 未找到临时地址数据，显示错误提示
        wx.showToast({
          title: '临时地址数据已失效',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
        return;
      }
    }
    
    // 正常从数据库获取地址
    const db = wx.cloud.database();
    
    this.setData({ loading: true });
    
    db.collection('customerAddresses').doc(addressId).get({
      success: res => {
        console.log('获取地址详情成功:', res.data);
        const addressData = res.data;
        
        // 设置地区选择器的值
        const region = [
          addressData.province || '',
          addressData.city || '',
          addressData.district || ''
        ];
        
        this.setData({
          address: addressData,
          region: region,
          loading: false
        });
      },
      fail: err => {
        console.error('获取地址详情失败:', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '加载地址失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 输入收货人姓名
  inputName: function (e) {
    this.setData({
      'address.name': e.detail.value
    });
  },
  
  // 输入联系电话
  inputPhone: function (e) {
    this.setData({
      'address.phone': e.detail.value
    });
  },
  
  // 选择地区
  bindRegionChange: function (e) {
    this.setData({
      region: e.detail.value,
      'address.province': e.detail.value[0],
      'address.city': e.detail.value[1],
      'address.district': e.detail.value[2]
    });
  },
  
  // 输入详细地址
  inputDetail: function (e) {
    this.setData({
      'address.detail': e.detail.value
    });
  },
  
  // 设置是否默认地址
  switchDefaultAddress: function (e) {
    this.setData({
      'address.isDefault': e.detail.value
    });
  },
  
  // 保存地址
  saveAddress: function () {
    // 验证表单
    if (!this.data.address.name) {
      wx.showToast({
        title: '请输入收货人姓名',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.address.phone) {
      wx.showToast({
        title: '请输入联系电话',
        icon: 'none'
      });
      return;
    }
    
    // 验证手机号格式
    if (!/^1\d{10}$/.test(this.data.address.phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.address.province || !this.data.address.city || !this.data.address.district) {
      wx.showToast({
        title: '请选择所在地区',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.address.detail) {
      wx.showToast({
        title: '请输入详细地址',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '保存中...',
    });
    
    const db = wx.cloud.database();
    
    // 如果设置为默认地址，需要先将该用户其他默认地址取消默认
    const handleDefaultAddress = () => {
      if (this.data.address.isDefault) {
        return db.collection('customerAddresses')
          .where({
            customerId: this.data.customerId,
            isDefault: true,
            _id: db.command.neq(this.data.addressId || '')
          })
          .update({
            data: {
              isDefault: false
            }
          });
      } else {
        return Promise.resolve();
      }
    };
    
    // 添加或更新地址
    const saveAddressData = () => {
      if (this.data.isEdit) {
        // 更新地址
        return db.collection('customerAddresses').doc(this.data.addressId).update({
          data: {
            name: this.data.address.name,
            phone: this.data.address.phone,
            province: this.data.address.province,
            city: this.data.address.city,
            district: this.data.address.district,
            detail: this.data.address.detail,
            isDefault: this.data.address.isDefault,
            updateTime: db.serverDate()
          }
        });
      } else {
        // 新增地址
        return db.collection('customerAddresses').add({
          data: {
            name: this.data.address.name,
            phone: this.data.address.phone,
            province: this.data.address.province,
            city: this.data.address.city,
            district: this.data.address.district,
            detail: this.data.address.detail,
            isDefault: this.data.address.isDefault,
            customerId: this.data.customerId,
            createTime: db.serverDate()
          }
        });
      }
    };
    
    // 执行保存操作
    handleDefaultAddress()
      .then(() => {
        return saveAddressData();
      })
      .then((res) => {
        wx.hideLoading();
        
        // 获取新保存的地址完整信息
        const savedAddress = {
          _id: res._id || this.data.addressId,
          name: this.data.address.name,
          phone: this.data.address.phone,
          province: this.data.address.province,
          city: this.data.address.city,
          district: this.data.address.district,
          detail: this.data.address.detail,
          isDefault: this.data.address.isDefault,
          customerId: this.data.customerId
        };
        
        console.log('地址保存成功，准备同步和返回:', savedAddress);
        
        // 同步到客户联系人信息中
        this.syncAddressToCustomerContact(savedAddress);
        
        // 通知编辑客户页面有新地址数据
        wx.setStorageSync('new_address_for_customer', {
          customerId: savedAddress.customerId,
          name: savedAddress.name,
          phone: savedAddress.phone,
          province: savedAddress.province,
          city: savedAddress.city,
          district: savedAddress.district,
          address: savedAddress.detail
        });
        
        // 将新地址保存到全局变量
        const app = getApp();
        if (!app.globalData) app.globalData = {};
        app.globalData.selectedAddress = savedAddress;
        
        // 同时保存到本地存储作为备份
        wx.setStorageSync('selectedAddress', savedAddress);
        
        // 尝试通过事件通道将新地址传回上一页面
        try {
          const pages = getCurrentPages();
          if (pages.length > 1) {
            const prevPage = pages[pages.length - 2];
            // 检查上一页是否为地址列表页面
            if (prevPage.route && (prevPage.route.includes('addressList') || prevPage.route.includes('cart'))) {
              console.log('尝试通过事件通道将地址传递到上一页面:', prevPage.route);
              
              // 如果上一页是地址列表页，可以直接调用其方法刷新
              if (prevPage.route.includes('addressList') && typeof prevPage.loadAddressList === 'function') {
                prevPage.loadAddressList(this.data.customerId, false);
              }
              
              // 如果上一页是购物车页面，直接设置选中地址并刷新
              if (prevPage.route.includes('cart')) {
                console.log('检测到上一页是购物车，设置选中地址');
                if (typeof prevPage.setData === 'function') {
                  prevPage.setData({
                    selectedAddress: savedAddress
                  });
                  console.log('购物车选中地址已更新');
                }
                
                // 刷新购物车的地址数据
                if (typeof prevPage.loadCustomerAddress === 'function') {
                  prevPage.loadCustomerAddress(this.data.customerId, false);
                }
              }
            }
          }
        } catch (err) {
          console.error('尝试传递地址到上一页面失败:', err);
        }
        
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
        
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        wx.hideLoading();
        console.error('保存地址失败:', err);
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      });
  },
  
  // 同步地址到客户联系人信息
  syncAddressToCustomerContact: function(address) {
    if (!address || !address.customerId) {
      console.error('无法同步地址: 缺少客户ID');
      return;
    }
    
    console.log('准备将地址同步到客户联系人:', address);
    
    const db = wx.cloud.database();
    
    // 先获取客户信息
    db.collection('customers').doc(address.customerId).get().then(res => {
      const customer = res.data;
      if (!customer) {
        console.error('未找到客户:', address.customerId);
        return;
      }
      
      console.log('成功获取客户数据进行同步:', customer);
      
      // 检查是否已有联系人信息
      let contacts = customer.contacts || [];
      let contactExists = false;
      
      // 检查是否已存在具有相同电话的联系人
      for (let i = 0; i < contacts.length; i++) {
        if (contacts[i].phone === address.phone) {
          // 更新现有联系人地址
          contactExists = true;
          
          // 确保保留联系人的其他信息
          const updatedContact = Object.assign({}, contacts[i], {
            name: address.name,
            phone: address.phone,
            province: address.province,
            city: address.city,
            district: address.district,
            address: address.detail,
            addressDetail: address.detail
          });
          
          contacts[i] = updatedContact;
          console.log('更新现有联系人地址:', i, updatedContact);
          break;
        }
      }
      
      // 如果不存在，添加新联系人
      if (!contactExists) {
        const newContact = {
          name: address.name,
          phone: address.phone,
          province: address.province,
          city: address.city,
          district: address.district,
          address: address.detail,
          addressDetail: address.detail
        };
        
        contacts.push(newContact);
        console.log('添加新联系人:', contacts.length - 1, newContact);
      }
      
      console.log('准备更新客户联系人数据，客户ID:', address.customerId, '联系人数量:', contacts.length);
      
      // 更新客户信息
      return db.collection('customers').doc(address.customerId).update({
        data: {
          contacts: contacts
        }
      });
    }).then(updateRes => {
      // 检查是否成功更新
      if (updateRes && updateRes.stats && updateRes.stats.updated) {
        console.log('更新客户联系人成功:', updateRes);
        
        // 显示成功提示 
        wx.showToast({
          title: '地址已同步',
          icon: 'success',
          duration: 1000
        });
        
        // 获取打开的页面栈
        const pages = getCurrentPages();
        
        // 查找是否有客户详情页面并刷新
        for (let i = 0; i < pages.length; i++) {
          if (pages[i].route && pages[i].route.includes('customerDetail')) {
            console.log('找到客户详情页面，发送刷新通知');
            // 如果详情页在栈中，通知它刷新
            if (typeof pages[i].loadCustomerData === 'function') {
              try {
                // 尝试直接调用详情页的刷新方法
                pages[i].loadCustomerData(address.customerId);
                console.log('客户详情页面数据已刷新');
              } catch (err) {
                console.error('刷新客户详情页面失败:', err);
              }
            }
            break;
          }
        }
        
        // 触发一个全局事件，让可能的客户详情页监听并刷新
        const app = getApp();
        if (app.globalData) {
          app.globalData.refreshCustomerDetail = {
            customerId: address.customerId,
            timestamp: new Date().getTime()
          };
        }
      } else {
        console.warn('更新客户联系人可能未成功:', updateRes);
      }
    }).catch(err => {
      console.error('更新客户联系人失败:', err);
      
      // 尝试备用方法更新
      this.tryBackupAddressSync(address);
    });
  },
  
  // 备用地址同步方法
  tryBackupAddressSync: function(address) {
    if (!address || !address.customerId) {
      console.error('备用同步失败: 缺少客户ID');
      return;
    }
    
    console.log('尝试备用方法同步地址到客户联系人:', address);
    
    const db = wx.cloud.database();
    
    // 使用transaction或更简单的方法尝试再次更新
    db.collection('customers').doc(address.customerId).get()
      .then(res => {
        const customer = res.data;
        if (!customer) {
          throw new Error('备用方法: 未找到客户');
        }
        
        // 获取现有联系人
        let contacts = customer.contacts || [];
        let updated = false;
        
        // 查找匹配的联系人
        for (let i = 0; i < contacts.length; i++) {
          if (contacts[i].phone === address.phone) {
            // 更新现有联系人
            contacts[i] = Object.assign({}, contacts[i], {
              name: address.name,
              phone: address.phone,
              province: address.province,
              city: address.city,
              district: address.district,
              address: address.detail,
              addressDetail: address.detail
            });
            updated = true;
            console.log('备用方法: 更新现有联系人');
            break;
          }
        }
        
        // 如果没有找到匹配的联系人，添加新联系人
        if (!updated) {
          contacts.push({
            name: address.name,
            phone: address.phone,
            province: address.province,
            city: address.city,
            district: address.district,
            address: address.detail,
            addressDetail: address.detail
          });
          console.log('备用方法: 添加新联系人');
        }
        
        // 更新客户记录
        return db.collection('customers').doc(address.customerId).update({
          data: {
            contacts: contacts
          }
        });
      })
      .then(res => {
        console.log('备用方法: 更新客户联系人结果:', res);
        
        // 检查是否成功更新
        if (res && res.stats && res.stats.updated) {
          console.log('备用方法: 更新客户联系人成功');
          
          // 获取打开的页面栈
          const pages = getCurrentPages();
          
          // 查找是否有客户详情页面并刷新
          for (let i = 0; i < pages.length; i++) {
            if (pages[i].route && pages[i].route.includes('customerDetail')) {
              console.log('备用方法: 找到客户详情页面，发送刷新通知');
              // 如果详情页在栈中，通知它刷新
              if (typeof pages[i].loadCustomerData === 'function') {
                try {
                  // 尝试直接调用详情页的刷新方法
                  pages[i].loadCustomerData(address.customerId);
                  console.log('备用方法: 客户详情页面数据已刷新');
                } catch (err) {
                  console.error('备用方法: 刷新客户详情页面失败:', err);
                }
              }
              break;
            }
          }
          
          // 触发一个全局事件，让可能的客户详情页监听并刷新
          const app = getApp();
          if (app.globalData) {
            app.globalData.refreshCustomerDetail = {
              customerId: address.customerId,
              timestamp: new Date().getTime()
            };
          }
        }
      })
      .catch(err => {
        console.error('备用方法: 更新客户联系人最终失败:', err);
      });
  }
}) 