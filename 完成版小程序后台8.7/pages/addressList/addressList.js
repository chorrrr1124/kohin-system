Page({
  data: {
    customerId: '',
    addressList: [],
    loading: false,
    isEmpty: true,
    hasLoadedContacts: false // 添加标志，避免重复加载联系人
  },

  onLoad: function (options) {
    console.log('地址列表页面onLoad', options);
    
    // 获取上一个页面传递的客户ID
    let customerId = '';
    if (options.customerId) {
      customerId = options.customerId;
    }
    
    // 如果URL参数中没有客户ID，尝试从事件通道获取
    if (!customerId) {
      try {
        const eventChannel = this.getOpenerEventChannel();
        if (eventChannel) {
          // 尝试从事件通道获取客户信息
          eventChannel.on('getCustomerInfo', (data) => {
            if (data && data.customerId) {
              customerId = data.customerId;
              console.log('从事件通道获取客户ID:', customerId);
            }
          });
        }
      } catch (err) {
        console.error('获取事件通道失败:', err);
      }
    }
    
    if (customerId) {
      this.setData({
        customerId: customerId
      });
      console.log('开始加载客户地址列表，客户ID:', customerId);
      this.loadAddressList(customerId);
    } else {
      console.error('未能获取有效的客户ID');
      wx.showToast({
        title: '客户ID无效',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  onShow: function () {
    console.log('地址列表页面onShow');
    // 避免重复加载，只在必要时重新加载
    // 只有在没有加载过联系人且地址列表为空时才重新加载
    if (this.data.customerId && this.data.addressList.length === 0 && !this.data.hasLoadedContacts) {
      this.loadAddressList(this.data.customerId);
    }
  },

  // 加载地址列表
  loadAddressList: function (customerId, allowCreateTemp = true) {
    if (!customerId) {
      console.error('加载地址列表失败: 客户ID无效');
      return;
    }
    
    this.setData({ loading: true });
    console.log('正在查询客户地址，客户ID:', customerId);
    
    const db = wx.cloud.database();
    
    // 为调试目的，先记录客户ID长度和值
    console.log('查询参数客户ID:', customerId, '长度:', customerId.length, '类型:', typeof customerId);
    
    // 改进查询方式
    db.collection('customers').doc(customerId).get({
      success: (customerRes) => {
        console.log('获取客户信息成功:', customerRes.data);
        
        // 接下来查询地址
        db.collection('customerAddresses')
          .where({
            customerId: customerId
          })
          .orderBy('isDefault', 'desc')
          .get({
            success: res => {
              console.log('获取地址列表成功:', res.data);
              
              // 即使查询结果为空，也尝试从客户对象中获取联系人信息作为地址
              // 但只有在还没有加载过联系人的情况下才创建临时地址，且允许创建临时地址
              if (res.data.length === 0 && customerRes.data && customerRes.data.contacts && customerRes.data.contacts.length > 0 && !this.data.hasLoadedContacts && allowCreateTemp) {
                console.log('尝试从客户联系人创建地址');
                
                // 检查是否已经有临时地址，避免重复创建
                const app = getApp();
                const existingTempAddresses = app.globalData && app.globalData.tempAddresses ? Object.values(app.globalData.tempAddresses) : [];
                const hasExistingTempAddresses = existingTempAddresses.some(addr => addr.customerId === customerId);
                
                if (hasExistingTempAddresses) {
                  console.log('已存在临时地址，跳过创建');
                  this.setData({
                    addressList: existingTempAddresses,
                    loading: false,
                    hasLoadedContacts: true
                  });
                  return;
                }
                
                // 创建临时地址数组，避免重复
                const tempAddresses = [];
                const processedPhones = new Set(); // 用于去重
                
                customerRes.data.contacts.forEach((contact, index) => {
                  // 检查联系人是否有地址信息且电话号码不重复
                  if (contact.name && contact.phone && 
                      (contact.address || contact.addressDetail || 
                      (contact.province && contact.city)) &&
                      !processedPhones.has(contact.phone)) {
                    
                    processedPhones.add(contact.phone);
                    
                    const tempId = 'temp_' + new Date().getTime() + '_' + index;
                    const tempAddress = {
                      _id: tempId,
                      name: contact.name || customerRes.data.name,
                      phone: contact.phone || '',
                      province: contact.province || '',
                      city: contact.city || '',
                      district: contact.district || '',
                      detail: contact.addressDetail || contact.address || '',
                      isDefault: tempAddresses.length === 0, // 第一个有效联系人默认选中
                      customerId: customerId,
                      isTemporary: true
                    };
                    
                    console.log('从联系人创建临时地址:', tempAddress);
                    tempAddresses.push(tempAddress);
                    
                    // 保存临时地址到全局变量
                    const app = getApp();
                    if (!app.globalData) app.globalData = {};
                    if (!app.globalData.tempAddresses) app.globalData.tempAddresses = {};
                    app.globalData.tempAddresses[tempId] = tempAddress;
                  }
                });
                
                // 同时保存到本地存储作为备份
                try {
                  const storedAddresses = wx.getStorageSync('tempAddresses') || {};
                  tempAddresses.forEach(addr => {
                    storedAddresses[addr._id] = addr;
                  });
                  wx.setStorageSync('tempAddresses', storedAddresses);
                  console.log('临时地址已保存到本地存储');
                } catch (err) {
                  console.error('保存临时地址到本地存储失败:', err);
                }
                
                if (tempAddresses.length > 0) {
                  this.setData({
                    addressList: tempAddresses,
                    isEmpty: false,
                    loading: false,
                    hasLoadedContacts: true // 标记已加载联系人
                  });
                  return;
                }
              }
              
              this.setData({
                addressList: res.data,
                isEmpty: res.data.length === 0,
                loading: false
              });
              
              // 如果没有地址记录，可以自动跳转到添加地址页面
              if (res.data.length === 0) {
                wx.showModal({
                  title: '未找到地址',
                  content: '该客户还没有收货地址，是否立即添加？',
                  confirmText: '添加地址',
                  cancelText: '取消',
                  success: (result) => {
                    if (result.confirm) {
                      this.addAddress();
                    }
                  }
                });
              }
            },
            fail: err => {
              console.error('获取地址列表失败:', err);
              this.setData({ 
                loading: false,
                isEmpty: true
              });
              wx.showToast({
                title: '加载地址失败',
                icon: 'none'
              });
            }
          });
      },
      fail: (err) => {
        console.error('获取客户信息失败:', err);
        
        // 虽然获取客户信息失败，仍尝试直接查询地址
        db.collection('customerAddresses')
          .where({
            customerId: customerId
          })
          .orderBy('isDefault', 'desc')
          .get({
            success: res => {
              console.log('直接查询地址列表结果:', res.data.length);
              
              this.setData({
                addressList: res.data,
                isEmpty: res.data.length === 0,
                loading: false
              });
              
              // 如果没有地址记录，显示提示
              if (res.data.length === 0) {
                wx.showModal({
                  title: '未找到地址',
                  content: '该客户还没有收货地址，是否立即添加？',
                  confirmText: '添加地址',
                  cancelText: '取消',
                  success: (result) => {
                    if (result.confirm) {
                      this.addAddress();
                    }
                  }
                });
              }
            },
            fail: addressErr => {
              console.error('直接查询地址列表失败:', addressErr);
              this.setData({ 
                loading: false,
                isEmpty: true
              });
              wx.showToast({
                title: '加载地址失败',
                icon: 'none'
              });
            }
          });
      }
    });
  },

  // 选择地址
  selectAddress: function (e) {
    const index = e.currentTarget.dataset.index;
    const address = this.data.addressList[index];
    
    console.log('用户选择了地址:', address);
    
    // 确保地址对象完整
    if (!address) {
      console.error('选择的地址无效');
      wx.showToast({
        title: '地址信息无效',
        icon: 'none'
      });
      return;
    }
    
    // 对临时地址进行特殊处理
    if (address.isTemporary) {
      console.log('用户选择了临时地址，准备保存到数据库');
      
      // 将临时地址保存到数据库
      const db = wx.cloud.database();
      
      // 移除临时标记字段
      const addressToSave = Object.assign({}, address);
      delete addressToSave.isTemporary;
      const tempId = addressToSave._id; // 保存临时ID用于后续清理
      delete addressToSave._id;  // 删除临时ID
      
      // 添加时间戳
      addressToSave.createTime = db.serverDate();
      
      // 同步到客户的联系人信息中
      this.syncAddressToCustomerContact(addressToSave);
      
      db.collection('customerAddresses').add({
        data: addressToSave,
        success: (res) => {
          console.log('临时地址保存成功:', res);
          
          // 更新地址对象的ID为新创建的ID
          const savedAddress = Object.assign({}, addressToSave, {
            _id: res._id
          });
          
          // 清理临时地址数据
          this.cleanupTempAddress(tempId);
          
          // 将保存后的地址传回购物车页面
          this.returnAddressToCart(savedAddress);
        },
        fail: (err) => {
          console.error('临时地址保存失败:', err);
          
          // 即使保存失败，仍尝试将地址信息传回购物车
          this.returnAddressToCart(address);
        }
      });
      return;
    }
    
    // 常规地址也同步到客户的联系人信息中
    console.log('用户选择了保存的地址，同步到客户联系人');
    this.syncAddressToCustomerContact(address);
    
    // 直接传递常规地址
    this.returnAddressToCart(address);
  },
  
  // 同步地址到客户联系人
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
        
        // 同样尝试刷新客户详情页面
        if (res && res.stats && res.stats.updated) {
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
          
          // 显示成功提示
          wx.showToast({
            title: '地址已同步(备用)',
            icon: 'success',
            duration: 1000
          });
        }
      })
      .catch(err => {
        console.error('备用方法: 更新客户联系人最终失败:', err);
      });
  },
  
  // 清理临时地址数据
  cleanupTempAddress: function(tempId) {
    if (!tempId || !tempId.startsWith('temp_')) {
      return; // 不是临时ID，不需要清理
    }
    
    console.log('清理临时地址数据:', tempId);
    
    // 清理全局变量中的临时地址
    try {
      const app = getApp();
      if (app.globalData && app.globalData.tempAddresses) {
        if (app.globalData.tempAddresses[tempId]) {
          delete app.globalData.tempAddresses[tempId];
          console.log('已从全局变量清理临时地址');
        }
      }
    } catch (err) {
      console.error('清理全局变量中的临时地址失败:', err);
    }
    
    // 清理本地存储中的临时地址
    try {
      const storedAddresses = wx.getStorageSync('tempAddresses') || {};
      if (storedAddresses[tempId]) {
        delete storedAddresses[tempId];
        wx.setStorageSync('tempAddresses', storedAddresses);
        console.log('已从本地存储清理临时地址');
      }
    } catch (err) {
      console.error('清理本地存储中的临时地址失败:', err);
    }
  },
  
  // 将地址信息传回购物车页面
  returnAddressToCart: function(address) {
    try {
      // 通过事件通道将选择的地址传回到购物车页面
      const eventChannel = this.getOpenerEventChannel();
      if (eventChannel && typeof eventChannel.emit === 'function') {
        // 尝试多个事件名称，确保兼容性
        eventChannel.emit('selectAddress', address);
        eventChannel.emit('addressSelected', address);
        console.log('已发送地址选择事件');
        
        // 返回购物车页面
        setTimeout(() => {
          wx.navigateBack();
        }, 500);
      } else {
        console.error('事件通道不可用');
        // 尝试使用全局数据传递
        const app = getApp();
        if (!app.globalData) app.globalData = {};
        app.globalData.selectedAddress = address;
        
        // 触发全局地址选择事件
        if (app.globalData.onAddressSelected) {
          app.globalData.onAddressSelected(address);
        }
        
        wx.navigateBack();
      }
    } catch (err) {
      console.error('传递地址数据失败:', err);
      // 作为备份，保存到本地存储
      wx.setStorageSync('selectedAddress', address);
      
      // 尝试触发全局事件
      const app = getApp();
      if (app.globalData && app.globalData.onAddressSelected) {
        app.globalData.onAddressSelected(address);
      }
      
      wx.navigateBack();
    }
  },
  
  // 添加新地址
  addAddress: function () {
    if (!this.data.customerId) {
      console.error('添加地址失败: 客户ID无效');
      wx.showToast({
        title: '客户信息无效',
        icon: 'none'
      });
      return;
    }
    
    console.log('跳转到添加地址页面, 客户ID:', this.data.customerId);
    
    wx.navigateTo({
      url: '/pages/editAddress/editAddress?customerId=' + this.data.customerId,
      success: () => {
        console.log('成功跳转到地址编辑页面');
      },
      fail: (err) => {
        console.error('跳转到地址编辑页面失败:', err);
      }
    });
  },

  // 编辑地址
  editAddress: function (e) {
    const index = e.currentTarget.dataset.index;
    const address = this.data.addressList[index];
    
    wx.navigateTo({
      url: '/pages/editAddress/editAddress?id=' + address._id + '&customerId=' + this.data.customerId,
    });
  },

  // 删除地址
  deleteAddress: function (e) {
    const index = e.currentTarget.dataset.index;
    const address = this.data.addressList[index];
    
    wx.showModal({
      title: '提示',
      content: '确定要删除此地址吗？',
      success: (res) => {
        if (res.confirm) {
          const db = wx.cloud.database();
          db.collection('customerAddresses').doc(address._id).remove({
            success: res => {
              console.log('删除地址成功');
              
              // 刷新地址列表，不允许创建临时地址
              this.loadAddressList(this.data.customerId, false);
              
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            },
            fail: err => {
              console.error('删除地址失败:', err);
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 设为默认地址
  setDefaultAddress: function (e) {
    const index = e.currentTarget.dataset.index;
    const address = this.data.addressList[index];
    
    // 如果已经是默认地址，则不需要操作
    if (address.isDefault) {
      return;
    }
    
    wx.showLoading({
      title: '设置中...',
    });
    
    const db = wx.cloud.database();
    const _ = db.command;
    
    // 先将所有地址设为非默认
    db.collection('customerAddresses')
      .where({
        customerId: this.data.customerId,
        isDefault: true
      })
      .update({
        data: {
          isDefault: false
        }
      })
      .then(() => {
        // 然后将选中的地址设为默认
        return db.collection('customerAddresses').doc(address._id).update({
          data: {
            isDefault: true
          }
        });
      })
      .then(() => {
        wx.hideLoading();
        wx.showToast({
          title: '设置成功',
          icon: 'success'
        });
        
        // 刷新地址列表，不允许创建临时地址
        this.loadAddressList(this.data.customerId, false);
      })
      .catch(err => {
        wx.hideLoading();
        console.error('设置默认地址失败:', err);
        wx.showToast({
          title: '设置失败',
          icon: 'none'
        });
      });
  }
}) 