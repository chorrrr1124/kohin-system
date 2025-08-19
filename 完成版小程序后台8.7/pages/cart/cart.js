// pages/cart/cart.js
Page({
  data: {
    cartItems: [],
    totalPrice: 0,
    isEmpty: true,
    selectedCustomer: null,
    selectedAddress: null,
    paymentMethod: 'cash', // 默认现金支付
    paymentMethods: [
      { id: 'cash', name: '现金支付' },
      { id: 'prepaid', name: '预存抵扣' }
    ],
    // 客户管理相关
    showCustomerModal: false,
    customerList: [],
    filteredCustomers: [],
    searchValue: '',
    loadingCustomers: false,
    contactAddresses: [],
    savedAddresses: [],
    allAddresses: [],
    showAddressModal: false
  },

  onLoad: function (options) {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    this.loadCartData();
  },

  onShow: function () {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    // 每次显示页面时重新加载购物车数据
    this.loadCartData();
    
    console.log('购物车页面显示，检查是否有新客户或地址数据');
    
    try {
      // 首先检查是否有从地址列表页面选择的地址
      let selectedAddress = null;
      
      // 先从全局变量中获取
      if (app.globalData && app.globalData.selectedAddress) {
        selectedAddress = app.globalData.selectedAddress;
        console.log('从全局变量获取到地址数据:', selectedAddress);
        
        // 使用后清除全局变量
        app.globalData.selectedAddress = null;
        
        // 如果获取到了地址信息，立即更新UI
        if (selectedAddress) {
          this.setData({
            selectedAddress: selectedAddress
          });
          console.log('已设置选中的收货地址');
          
          // 如果当前已有选中的客户，刷新该客户的地址列表（不允许创建临时地址）
          if (this.data.selectedCustomer && this.data.selectedCustomer._id) {
            console.log('刷新客户的地址列表数据');
            this.loadCustomerAddress(this.data.selectedCustomer._id, false);
          }
        }
      }
      
      // 如果全局变量中没有，尝试从本地存储获取
      if (!selectedAddress) {
        const storedAddress = wx.getStorageSync('selectedAddress');
        if (storedAddress && storedAddress._id) {
          selectedAddress = storedAddress;
          console.log('从本地存储获取到地址数据:', selectedAddress);
          
          // 使用后清除本地存储
          wx.removeStorageSync('selectedAddress');
          
          // 如果获取到了地址信息，更新UI
          if (selectedAddress) {
            this.setData({
              selectedAddress: selectedAddress
            });
            console.log('已设置选中的收货地址');
            
            // 如果当前已有选中的客户，刷新该客户的地址列表（不允许创建临时地址）
            if (this.data.selectedCustomer && this.data.selectedCustomer._id) {
              console.log('刷新客户的地址列表数据');
              this.loadCustomerAddress(this.data.selectedCustomer._id, false);
            }
          }
        }
      }
      
      // 设置全局地址选择监听器
      if (app.globalData) {
        app.globalData.onAddressSelected = (address) => {
          console.log('收到全局地址选择事件:', address);
          this.setData({
            selectedAddress: address
          });
          
          // 如果当前已有选中的客户，刷新该客户的地址列表（不允许创建临时地址）
          if (this.data.selectedCustomer && this.data.selectedCustomer._id) {
            console.log('刷新客户的地址列表数据');
            this.loadCustomerAddress(this.data.selectedCustomer._id, false);
          }
        };
      }
      
      // 检查是否有新创建的客户信息
      let newCustomer = null;
      
      // 先检查全局变量
      if (app.globalData && app.globalData.newCustomer) {
        newCustomer = app.globalData.newCustomer;
        console.log('从全局变量获取到新客户数据:', newCustomer._id);
        // 使用后清除全局变量
        app.globalData.newCustomer = null;
      } else {
        // 如果全局变量中没有，检查本地存储
        const storedCustomer = wx.getStorageSync('newCreatedCustomer');
        if (storedCustomer && storedCustomer._id) {
          newCustomer = storedCustomer;
          console.log('从本地存储获取到新客户数据:', newCustomer._id);
          // 使用后清除存储
          wx.removeStorageSync('newCreatedCustomer');
        }
      }
      
      // 如果获取到了新客户信息，更新购物车页面
      if (newCustomer) {
        // 确保联系人信息存在
        if (!newCustomer.contacts) {
          newCustomer.contacts = [];
        }
        
        console.log('处理新客户数据:', newCustomer);
        
        // 先加载客户列表，确保有最新数据
        const db = wx.cloud.database();
        db.collection('customers')
          .where({_id: newCustomer._id})
          .get()
          .then(res => {
            if (res.data && res.data.length > 0) {
              const fullCustomer = res.data[0];
              console.log('从数据库获取完整客户信息:', fullCustomer);
              
              // 更新客户列表
              let updatedList = this.data.customerList || [];
              // 检查是否已存在该客户
              const existingIndex = updatedList.findIndex(c => c._id === fullCustomer._id);
              if (existingIndex >= 0) {
                // 更新现有客户数据
                updatedList[existingIndex] = fullCustomer;
              } else {
                // 添加新客户到列表顶部
                updatedList = [fullCustomer].concat(updatedList);
              }
              
              // 设置为当前选中的客户
              this.setData({
                customerList: updatedList,
                filteredCustomers: updatedList.slice(0, 5),
                selectedCustomer: fullCustomer,
                showCustomerModal: false // 确保弹窗关闭
              });
              
              console.log('已选择新客户:', fullCustomer.name);
              
              // 加载该客户的地址列表
              console.log('加载新客户的地址列表，客户ID:', fullCustomer._id);
              this.loadCustomerAddress(fullCustomer._id, false);
              
              // 显示成功提示
              wx.showToast({
                title: '已选择新客户',
                icon: 'success',
                duration: 2000
              });
            } else {
              console.error('无法获取完整客户信息');
            }
          })
          .catch(err => {
            console.error('获取客户信息失败:', err);
          });
        
        return; // 已处理，无需继续
      }
    } catch (err) {
      console.error('处理页面数据时出错:', err);
    }
    
    // 如果没有新客户信息，检查是否需要加载已选客户的地址
    console.log('页面显示时检查地址状态:');
    console.log('- 选中客户:', this.data.selectedCustomer ? this.data.selectedCustomer.name : '无');
    console.log('- 选中地址:', this.data.selectedAddress ? this.data.selectedAddress.name : '无');
    
    if (this.data.selectedCustomer && !this.data.selectedAddress) {
      console.log('尝试加载已选客户的地址');
      this.loadCustomerAddress(this.data.selectedCustomer._id, false);
    } else if (this.data.selectedCustomer) {
      // 如果已有客户和地址，仍然刷新一次地址列表，确保数据最新
      console.log('刷新当前客户地址列表');
      this.loadCustomerAddress(this.data.selectedCustomer._id, false);
    }
  },

  loadCartData: function () {
    const cartItems = wx.getStorageSync('cartItems') || [];
    const isEmpty = cartItems.length === 0;
    
    console.log('正在加载购物车数据, 商品数量:', cartItems.length);
    
    // 获取全局产品数据，用于补充购物车商品的详细信息
    const app = getApp();
    const allProducts = app.globalData.shopProducts || [];
    
    if (allProducts.length === 0) {
      console.log('商城产品数据为空，从数据库重新加载');
      // 如果商城产品数据为空，尝试从数据库加载
      app.loadProductsFromCloud();
    }
    
    // 为购物车中的每个商品补充详细信息
    const enrichedCartItems = cartItems.map(item => {
      // 检查商品ID
      if (!item.id && !item._id) {
        console.error('购物车中的商品没有有效ID:', item);
        return null; // 返回null以便后续过滤掉
      }
      
      console.log('处理购物车商品:', item.name, 'ID:', item.id, '数据库ID:', item._id);
      
      // 查找对应的完整产品信息，同时检查id和_id
      const productInfo = allProducts.find(p => {
        // 处理边缘情况
        if (!p) return false;
        
        // 多种匹配方式尝试
        return (item.id && (p.id === item.id || p._id === item.id)) || 
               (item._id && (p._id === item._id || p.id === item._id));
      });
      
      // 如果找到了产品信息，补充详细信息
      if (productInfo) {
        console.log('找到商城产品信息:', productInfo.name);
        return Object.assign({}, item, {
          // 保留原始ID和数据库ID
          id: item.id || productInfo.id,
          _id: item._id || productInfo._id,
          brand: productInfo.brand || '无',
          type: productInfo.type || '无',
          specification: productInfo.specification || '无',
          remark: productInfo.remark || '无',
          // 确保使用最新的库存信息
          stock: productInfo.stock || 0
        });
      } else {
        console.warn('未找到商品信息:', item.name, 'ID:', item.id, '数据库ID:', item._id);
        // 找不到信息时，保留原始信息
        return item;
      }
    }).filter(item => item !== null); // 过滤掉无效项
    
    let totalPrice = 0;
    enrichedCartItems.forEach(item => {
      totalPrice += item.price * item.quantity;
    });

    this.setData({
      cartItems: enrichedCartItems,
      totalPrice: totalPrice.toFixed(2),
      isEmpty: enrichedCartItems.length === 0
    });
    
    // 更新存储中的购物车数据，移除无效项
    if (enrichedCartItems.length !== cartItems.length) {
      console.log('更新购物车数据，移除无效项');
      wx.setStorageSync('cartItems', enrichedCartItems);
    }
  },

  // 增加商品数量
  increaseQuantity: function (e) {
    const index = e.currentTarget.dataset.index;
    let cartItems = this.data.cartItems;
    cartItems[index].quantity += 1;
    
    this.updateCart(cartItems);
  },

  // 减少商品数量
  decreaseQuantity: function (e) {
    const index = e.currentTarget.dataset.index;
    let cartItems = this.data.cartItems;
    
    if (cartItems[index].quantity > 1) {
      cartItems[index].quantity -= 1;
      this.updateCart(cartItems);
    } else {
      this.removeItem(e);
    }
  },

  // 移除商品
  removeItem: function (e) {
    const index = e.currentTarget.dataset.index;
    let cartItems = this.data.cartItems;
    cartItems.splice(index, 1);
    
    this.updateCart(cartItems);
  },

  // 更新购物车数据
  updateCart: function (cartItems) {
    wx.setStorageSync('cartItems', cartItems);
    
    let totalPrice = 0;
    cartItems.forEach(item => {
      totalPrice += item.price * item.quantity;
    });

    this.setData({
      cartItems,
      totalPrice: totalPrice.toFixed(2),
      isEmpty: cartItems.length === 0
    });
  },

  // 清空购物车
  clearCart: function () {
    wx.showModal({
      title: '提示',
      content: '确定要清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('cartItems', []);
          this.setData({
            cartItems: [],
            totalPrice: '0.00',
            isEmpty: true
          });
          wx.showToast({
            title: '购物车已清空',
            icon: 'success'
          });
        }
      }
    });
  },

  // 提交订单
  submitOrder: function () {
    if (this.data.isEmpty) {
      wx.showToast({
        title: '购物车为空',
        icon: 'none'
      });
      return;
    }
    
    // 检查购物车中的商品是否都有有效ID
    const invalidItems = this.data.cartItems.filter(item => !item.id && !item._id);
    if (invalidItems.length > 0) {
      console.error('购物车中存在无效商品:', invalidItems);
      wx.showModal({
        title: '提交失败',
        content: '购物车中存在无效商品，请重新添加',
        showCancel: false
      });
      return;
    }
    
    // 检查是否选择了客户
    if (!this.data.selectedCustomer) {
      wx.showToast({
        title: '请选择客户',
        icon: 'none'
      });
      return;
    }

    // 检查是否有收货地址
    if (!this.data.selectedAddress) {
      wx.showToast({
        title: '请选择收货地址',
        icon: 'none'
      });
      return;
    }

    // 直接进行结算处理
    this.confirmOrder();
  },

  // 显示结算信息选择对话框
  showSettlementDialog: function() {
    wx.navigateTo({
      url: '/pages/settlement/settlement',
      success: (res) => {
        // 传递购物车数据到结算页面
        res.eventChannel.emit('acceptCartData', {
          cartItems: this.data.cartItems,
          totalPrice: this.data.totalPrice
        });
      }
    });
  },

  // 选择客户
  selectCustomer: function() {
    console.log('购物车页面：点击选择客户');
    
    // 无论是否已选择客户，都显示客户选择弹窗
    this.showCustomerModal();
  },
  
  // 显示客户选择弹窗
  showCustomerModal: function() {
    console.log('显示客户选择弹窗');
    // 先加载客户数据
    this.loadCustomerList(() => {
      // 数据加载完成后，打开客户选择弹窗
      this.setData({
        showCustomerModal: true,
        searchValue: '',
        filteredCustomers: this.data.customerList.slice(0, 5) // 限制显示5个客户
      });
    });
  },
  
  // 关闭客户选择弹窗
  closeCustomerModal: function() {
    this.setData({
      showCustomerModal: false
    });
  },
  
  // 加载客户列表数据
  loadCustomerList: function(callback) {
    this.setData({ loadingCustomers: true });
    
    const db = wx.cloud.database();
    db.collection('customers')
      .orderBy('createTime', 'desc')
      .limit(50) // 获取较多客户以便搜索
      .get({
        success: res => {
          console.log('获取客户列表成功:', res.data.length);
          this.setData({
            customerList: res.data,
            filteredCustomers: res.data.slice(0, 5), // 只显示前5个客户
            loadingCustomers: false
          });
          
          if (typeof callback === 'function') {
            callback();
          }
        },
        fail: err => {
          console.error('获取客户列表失败:', err);
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
      return (
        (customer.name && customer.name.toLowerCase().includes(keyword)) ||
        (customer.phone && customer.phone.includes(keyword)) ||
        (customer.contacts && customer.contacts.length > 0 && 
         ((customer.contacts[0].name && customer.contacts[0].name.toLowerCase().includes(keyword)) ||
          (customer.contacts[0].phone && customer.contacts[0].phone.includes(keyword))))
      );
    }).slice(0, 5); // 限制显示5个结果
    
    this.setData({
      filteredCustomers: filtered
    });
  },
  
  // 选择客户列表中的客户
  selectCustomerItem: function(e) {
    const customerId = e.currentTarget.dataset.id;
    const customer = this.data.customerList.find(c => c._id === customerId);
    
    if (customer) {
      // 更新选中的客户
      this.setData({
        selectedCustomer: customer,
        showCustomerModal: false  // 关闭弹窗
      });
      
      // 切换客户后，清空地址相关数据，防止弹窗残留上一个客户的地址
      this.setData({
        allAddresses: [],
        contactAddresses: [],
        savedAddresses: [],
        selectedAddress: null
      });
      
      // 清除全局临时地址，确保只显示当前客户的地址
      const app = getApp();
      if (app.globalData && app.globalData.tempAddresses) {
        // 清除所有临时地址，重新为当前客户创建
        app.globalData.tempAddresses = {};
        console.log('已清除全局临时地址，准备为当前客户重新创建');
      }
      // 重新加载新客户的地址，允许创建临时地址
      this.loadCustomerAddress(customer._id, true);
      
      // 检查该客户是否有可用的预存记录
      this.checkCustomerPrepaidRecords(customer);
    }
  },
  
  // 跳转到添加客户页面
  navigateToAddCustomer: function() {
    // 标记对话框为打开状态，避免界面闪烁
    this.setData({
      showCustomerModal: true
    });
    
    wx.navigateTo({
      url: '/pages/customers/addCustomer/addCustomer?from=cart'
    });
  },
  
  // 检查客户的预存记录
  checkCustomerPrepaidRecords: function(customer) {
    // 如果购物车中只有一个商品，检查是否可以使用预存抵扣
    if (this.data.cartItems.length === 1) {
      const item = this.data.cartItems[0];
      const customerPhone = customer.phone || (customer.contacts && customer.contacts.length > 0 ? customer.contacts[0].phone : '');
      
      // 检查该客户是否有对应产品的预存记录
      const db = wx.cloud.database();
      db.collection('prepaidRecords').where({
        customerPhone: customerPhone,
        productName: item.name,
        type: 'product',
        balance: db.command.gt(0)
      }).get({
        success: res => {
          if (res.data && res.data.length > 0) {
            // 检查预存余额是否足够
            const totalBalance = res.data.reduce((sum, record) => sum + record.balance, 0);
            if (totalBalance >= item.quantity) {
              // 有足够的预存余额，提示用户
              wx.showModal({
                title: '发现预存记录',
                content: `该客户有${totalBalance}个"${item.name}"的预存记录，是否使用预存抵扣结算？`,
                confirmText: '使用预存',
                cancelText: '不使用',
                success: (result) => {
                  if (result.confirm) {
                    // 用户确认使用预存抵扣，更新支付方式
                    this.setData({
                      paymentMethod: 'prepaid'
                    });
                    wx.showToast({
                      title: '已设置为预存抵扣',
                      icon: 'success'
                    });
                  }
                }
              });
            }
          }
        }
      });
    }
  },

  // 加载客户地址
  loadCustomerAddress: function(customerId, allowCreateTemp = true) {
    const db = wx.cloud.database();
    
    // 先检查是否已经有当前客户的临时地址，避免重复创建
    const app = getApp();
    const existingTempAddresses = app.globalData && app.globalData.tempAddresses ? Object.values(app.globalData.tempAddresses) : [];
    const currentCustomerTempAddresses = existingTempAddresses.filter(addr => addr.customerId === customerId);
    const hasExistingTempAddresses = currentCustomerTempAddresses.length > 0;

    if (hasExistingTempAddresses) {
      console.log('购物车页面-已存在当前客户的临时地址，跳过创建');
      this.setData({
        contactAddresses: currentCustomerTempAddresses,
        selectedAddress: currentCustomerTempAddresses[0] || null
      });
      return; // 直接返回，不执行后续逻辑
    }
    
    // 如果不允许创建临时地址，只加载保存的地址
    if (!allowCreateTemp) {
      console.log('购物车页面-不允许创建临时地址，只加载保存的地址');
    } else {
      console.log('购物车页面-开始创建临时地址，客户ID:', customerId);
      // 先尝试查找客户的联系人信息
      db.collection('customers').doc(customerId).get({
        success: res => {
          const customer = res.data;
          // 处理contacts字段，可能是字符串也可能是数组
          let contacts = [];
          if (customer && customer.contacts) {
            console.log('cart页面-原始contacts数据:', customer.contacts, '类型:', typeof customer.contacts);
            
            if (typeof customer.contacts === 'string') {
              try {
                contacts = JSON.parse(customer.contacts);
                console.log('cart页面-解析JSON字符串后的contacts:', contacts);
              } catch (e) {
                console.error('cart页面-解析contacts JSON失败:', e);
                contacts = [];
              }
            } else if (Array.isArray(customer.contacts)) {
              contacts = customer.contacts;
              console.log('cart页面-contacts已经是数组:', contacts);
            }
          }
          
          if (contacts && contacts.length > 0) {
            console.log('获取到客户联系人:', contacts.length, '个');
            
            // 创建临时地址数组，添加去重逻辑
            const tempAddresses = [];
            const processedPhones = new Set(); // 用于去重
            
            // 遍历所有联系人，为每个有地址信息的联系人创建地址记录
            contacts.forEach((contact, index) => {
              console.log(`处理联系人 ${index}:`, contact);
              
              // 检查联系人是否有地址信息且电话号码不重复
              const hasDistrict = contact.district || (contact.region && Array.isArray(contact.region) && contact.region.length >= 3);
              const hasAddressInfo = contact.address || contact.addressDetail || (contact.province && hasDistrict);
              const hasRequiredFields = contact.name && contact.phone;
              const isPhoneUnique = !processedPhones.has(contact.phone);
              
              console.log(`联系人 ${index} 检查结果:`, {
                hasName: !!contact.name,
                hasPhone: !!contact.phone,
                hasAddressInfo: hasAddressInfo,
                hasDistrict: hasDistrict,
                isPhoneUnique: isPhoneUnique,
                canCreate: hasRequiredFields && hasAddressInfo && isPhoneUnique
              });
              
              if (hasRequiredFields && hasAddressInfo && isPhoneUnique) {
                
                processedPhones.add(contact.phone);
                
                // 生成临时ID
                const tempId = 'temp_contact_' + new Date().getTime() + '_' + index;
                
                // 处理区域信息
                let district = contact.district || '';
                if (!district && contact.region && Array.isArray(contact.region) && contact.region.length >= 3) {
                  district = contact.region[2];
                  console.log('cart页面-从region数组获取区域:', district);
                }
                
                // 创建临时地址对象
                const address = {
                  _id: tempId,
                  name: contact.name,
                  phone: contact.phone,
                  province: contact.province || '',
                  city: contact.city || '',
                  district: district,
                  detail: contact.addressDetail || contact.address || '',
                  isDefault: tempAddresses.length === 0, // 第一个有效联系人默认选中
                  customerId: customerId,
                  isTemporary: true,
                  fromContact: true,
                  contactIndex: index
                };
                
                // 保存到临时地址数组
                tempAddresses.push(address);
                
                // 同时保存到全局变量
                if (!app.globalData) app.globalData = {};
                if (!app.globalData.tempAddresses) app.globalData.tempAddresses = {};
                app.globalData.tempAddresses[tempId] = address;
              }
            });
            
            console.log('从联系人创建的临时地址:', tempAddresses.length, '个');
            
            // 保存到本地存储
            try {
              const storedAddresses = wx.getStorageSync('tempAddresses') || {};
              tempAddresses.forEach(addr => {
                storedAddresses[addr._id] = addr;
              });
              wx.setStorageSync('tempAddresses', storedAddresses);
            } catch (err) {
              console.error('保存临时地址到本地存储失败:', err);
            }
            
            // 保存临时地址
            this.setData({
              contactAddresses: tempAddresses
            });
            
            // 如果没有已选择的地址，设置第一个临时地址为默认选中
            console.log('临时地址创建完成，数量:', tempAddresses.length);
            console.log('当前选中地址:', this.data.selectedAddress);
            if (!this.data.selectedAddress && tempAddresses.length > 0) {
              console.log('设置第一个临时地址为默认选中:', tempAddresses[0]);
              this.setData({
                selectedAddress: tempAddresses[0]
              });
              // 强制更新页面
              this.$forceUpdate && this.$forceUpdate();
            } else if (tempAddresses.length > 0) {
              console.log('已有选中地址，不覆盖临时地址');
            } else {
              console.log('没有创建任何临时地址');
            }
          }
        },
        fail: err => {
          console.error('加载客户信息失败:', err);
        }
      });
    }
    
    // 同时尝试查找客户的地址记录
    console.log('开始查询客户保存的地址，客户ID:', customerId);
    console.log('查询条件:', { customerId: customerId });
    db.collection('customerAddresses')
      .where({
        customerId: customerId
      })
      .orderBy('isDefault', 'desc')
      .get({
        success: res => {
          console.log('查询客户地址成功，返回数据:', res.data);
          console.log('查询到的地址数量:', res.data ? res.data.length : 0);
          if (res.data && res.data.length > 0) {
            console.log('获取到客户保存的地址:', res.data.length, '个');
            console.log('地址详情:', res.data);
            
            // 保存所有地址
            this.setData({
              savedAddresses: res.data
            });
            
            // 优先选择保存的地址中的默认地址
            const defaultAddress = res.data.find(addr => addr.isDefault);
            console.log('查找默认地址结果:', defaultAddress);
            if (defaultAddress) {
              console.log('找到默认地址，设置为选中地址:', defaultAddress);
              this.setData({
                selectedAddress: defaultAddress
              });
            } else if (!this.data.selectedAddress) {
              // 如果没有默认地址且当前没有选择的地址，选择第一个保存的地址
              console.log('没有默认地址，选择第一个保存的地址:', res.data[0]);
              this.setData({
                selectedAddress: res.data[0]
              });
            } else {
              console.log('当前已有选中地址，不覆盖:', this.data.selectedAddress);
            }
          } else {
            console.log('客户没有保存的地址记录');
          }
        },
        fail: err => {
          console.error('加载客户地址失败:', err);
        }
      });
  },

  // 选择地址
  selectAddress: function() {
    console.log('点击选择地址按钮');
    console.log('当前选中客户:', this.data.selectedCustomer);
    console.log('当前选中地址:', this.data.selectedAddress);
    console.log('联系人地址数量:', this.data.contactAddresses ? this.data.contactAddresses.length : 0);
    console.log('保存地址数量:', this.data.savedAddresses ? this.data.savedAddresses.length : 0);
    
    if (!this.data.selectedCustomer) {
      wx.showToast({
        title: '请先选择客户',
        icon: 'none'
      });
      return;
    }

    // 获取当前客户的联系人地址和保存的地址
    const contactAddrs = this.data.contactAddresses || [];
    const savedAddrs = this.data.savedAddresses || [];
    
    // 合并所有地址并去重
    const allAddresses = contactAddrs.concat(savedAddrs);
    
    // 去重逻辑：基于姓名+电话+地址的组合去重
    const uniqueAddresses = [];
    const seenAddresses = new Set();
    
    allAddresses.forEach(addr => {
      // 创建唯一标识：姓名+电话+地址
      const addressKey = `${addr.name}_${addr.phone}_${addr.province}_${addr.city}_${addr.district}_${addr.detail}`;
      
      if (!seenAddresses.has(addressKey)) {
        seenAddresses.add(addressKey);
        uniqueAddresses.push(addr);
      }
    });
    
    // 检查是否有地址
    console.log(`地址数据统计: 联系人地址${contactAddrs.length}个, 保存的地址${savedAddrs.length}个`);
    
    // 如果没有任何地址，直接跳转到地址列表页
    if (uniqueAddresses.length === 0) {
      this.navigateToAddressList();
      return;
    }
    
    // 显示地址选择弹窗
    console.log('准备显示地址选择弹窗，地址数量:', uniqueAddresses.length);
    console.log('地址列表:', uniqueAddresses);
    this.setData({
      allAddresses: uniqueAddresses,
      showAddressModal: true
    });
    console.log('地址弹窗状态已设置为显示');
  },
  
  // 跳转到地址列表页面
  navigateToAddressList: function() {
    // 记录当前客户ID，方便后续使用
    const customerId = this.data.selectedCustomer._id;
    console.log('准备跳转到地址列表页，客户ID:', customerId);

    wx.navigateTo({
      url: '/pages/addressList/addressList?customerId=' + customerId,
      events: {
        // 监听选择地址结果
        addressSelected: (address) => {
          console.log('已选择地址:', address);
          if (address && address._id) {
            this.setData({
              selectedAddress: address
            });
            
            // 刷新地址列表数据，确保数据一致性（不允许创建临时地址）
            this.loadCustomerAddress(customerId, false);
            
            wx.showToast({
              title: '已选择收货地址',
              icon: 'success'
            });
          }
        },
        // 同时监听selectAddress事件，确保兼容性
        selectAddress: (address) => {
          console.log('收到地址选择事件:', address);
          this.setData({
            selectedAddress: address
          });
          
          // 刷新地址列表数据，确保数据一致性（不允许创建临时地址）
          this.loadCustomerAddress(customerId, false);
        },
        // 监听addressSelected事件
        addressSelected: (address) => {
          console.log('收到addressSelected事件:', address);
          this.setData({
            selectedAddress: address
          });
          
          // 刷新地址列表数据，确保数据一致性（不允许创建临时地址）
          this.loadCustomerAddress(customerId, false);
        }
      },
      success: (res) => {
        // 向地址列表页面传递客户信息
        res.eventChannel.emit('getCustomerInfo', {
          customerId: customerId,
          customerName: this.data.selectedCustomer.name
        });
      }
    });
  },
  
  // 点击地址列表中的地址项
  selectAddressItem: function(e) {
    const index = e.currentTarget.dataset.index;
    const address = this.data.allAddresses[index];
    
    console.log('选择地址项:', address);
    
    this.setData({
      selectedAddress: address,
      showAddressModal: false
    });
    
    // 强制更新页面
    this.$forceUpdate && this.$forceUpdate();
    
    wx.showToast({
      title: '已选择地址',
      icon: 'success'
    });
  },
  
  // 添加新地址
  addNewAddress: function() {
    this.setData({
      showAddressModal: false
    });
    
    // 获取当前客户ID
    const customerId = this.data.selectedCustomer._id;
    console.log('准备添加新地址，客户ID:', customerId);
    
    // 跳转到编辑地址页面
    wx.navigateTo({
      url: '/pages/address/editAddress/editAddress?customerId=' + customerId,
      success: () => {
        console.log('成功跳转到编辑地址页面');
      },
      fail: (err) => {
        console.error('跳转到编辑地址页面失败:', err);
        
        // 尝试备用路径
        wx.navigateTo({
          url: '/pages/editAddress/editAddress?customerId=' + customerId,
          fail: (err2) => {
            console.error('备用路径也失败:', err2);
            
            // 最后的备选方案 - 普通地址列表页
            this.navigateToAddressList();
          }
        });
      }
    });
  },
  


  // 关闭地址选择弹窗
  closeAddressModal: function() {
    this.setData({
      showAddressModal: false
    });
  },

  // 选择支付方式
  selectPaymentMethod: function(e) {
    const method = e.currentTarget.dataset.method;
    this.setData({
      paymentMethod: method
    });
  },

  // 确认订单
  confirmOrder: function() {
    // 验证必要信息
    if (!this.data.selectedCustomer) {
      wx.showToast({
        title: '请选择客户',
        icon: 'none'
      });
      return;
    }

    if (!this.data.selectedAddress) {
      wx.showToast({
        title: '请选择收货地址',
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
    const customerPhone = this.data.selectedCustomer.phone || 
                         (this.data.selectedCustomer.contacts && 
                          this.data.selectedCustomer.contacts.length > 0 ? 
                          this.data.selectedCustomer.contacts[0].phone : '');
    
    wx.showLoading({
      title: '提交中...'
    });
    
    // 检查是否为预存产品订单
    let isPrepaidProduct = false;
    
    if (this.data.paymentMethod === 'prepaid') {
      // 如果支付方式为预存抵扣
      if (this.data.cartItems.length === 1) {
        const item = this.data.cartItems[0];
        // 检查商品名称是否与预存记录匹配
        const db = wx.cloud.database();
        
        // 显示查询中的提示
        wx.showLoading({
          title: '检查预存记录...'
        });
        
        db.collection('prepaidRecords').where({
          customerPhone: customerPhone,
          productName: item.name,
          type: 'product',
          balance: db.command.gt(0)
        }).get().then(res => {
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
              
              // 更新UI，提示用户预存将被扣减
              wx.hideLoading();
              wx.showModal({
                title: '预存抵扣确认',
                content: `将从您的预存记录中扣除${item.quantity}个"${item.name}"，确认继续吗？`,
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    // 用户确认扣减预存，继续创建订单
                    this.createOrder(customerId, customerPhone, true);
                  } else {
                    wx.hideLoading();
                  }
                }
              });
            } else {
              console.warn('预存产品余额不足:', {
                productName: item.name,
                quantity: item.quantity,
                totalBalance: totalBalance
              });
              
              wx.hideLoading();
              wx.showModal({
                title: '预存余额不足',
                content: `您的预存余额不足，当前余额: ${totalBalance}，需要: ${item.quantity}，请选择其他支付方式或调整数量`,
                showCancel: false
              });
            }
          } else {
            // 没有找到匹配的预存记录
            console.warn('未找到匹配的预存记录');
            wx.hideLoading();
            wx.showModal({
              title: '无法使用预存',
              content: `未找到该商品"${item.name}"的预存记录，请选择其他支付方式`,
              success: (modalRes) => {
                if (modalRes.confirm) {
                  // 默认切换为现金支付
                  this.setData({
                    paymentMethod: 'cash'
                  });
                }
              }
            });
          }
        }).catch(err => {
          console.error('查询预存记录失败:', err);
          wx.hideLoading();
          wx.showToast({
            title: '查询预存记录失败',
            icon: 'none'
          });
        });
      } else {
        // 多个商品不能使用预存抵扣
        wx.hideLoading();
        wx.showModal({
          title: '无法使用预存',
          content: '预存抵扣只能用于单个商品结算，请选择其他支付方式',
          success: (modalRes) => {
            if (modalRes.confirm) {
              // 默认切换为现金支付
              this.setData({
                paymentMethod: 'cash'
              });
            }
          }
        });
      }
    } else if (this.data.paymentMethod === 'prestore') {
      // 如果支付方式为预存
      const totalAmount = this.data.totalPrice; // 总金额
      const customerName = this.data.selectedCustomer.name; // 客户名称
      
      wx.showModal({
        title: '确认预存',
        content: `确定将¥${totalAmount}添加到${customerName}的预存记录中吗？`,
        success: (res) => {
          if (res.confirm) {
            // 用户确认预存，处理预存逻辑
            this.handlePrestore(customerId, customerPhone, customerName, totalAmount);
          } else {
            wx.hideLoading();
          }
        }
      });
    } else {
      // 非预存抵扣支付方式，直接创建订单
      this.createOrder(customerId, customerPhone, false);
    }
  },
  
  // 处理预存支付
  handlePrestore: function(customerId, customerPhone, customerName, amount) {
    wx.showLoading({
      title: '处理中...',
      mask: true
    });
    
    // 获取购物车商品信息
    const cartItems = this.data.cartItems;
    if (!cartItems || cartItems.length === 0) {
      wx.hideLoading();
      wx.showToast({
        title: '购物车为空',
        icon: 'none'
      });
      return;
    }
    
    // 只取第一个商品作为预存商品
    const firstItem = cartItems[0];
    const productName = firstItem.name;
    const quantity = parseInt(firstItem.quantity) || 1; // 确保是整数
    
    console.log('准备创建预存记录，商品:', productName, '数量:', quantity);
    
    // 生成唯一的操作ID，用于关联预存记录和订单
    const operationId = 'prestore_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    console.log('生成操作ID:', operationId);
    
    // 获取客户地址信息
    const getCustomerAddress = () => {
      return new Promise((resolve) => {
        if (!customerId) {
          resolve('');
          return;
        }
        
        const db = wx.cloud.database();
        db.collection('customers').doc(customerId).get({
          success: res => {
            const customer = res.data;
            let address = '';
            
            // 处理contacts字段，可能是字符串也可能是数组
            let contacts = [];
            if (customer && customer.contacts) {
              console.log('cart预存-原始contacts数据:', customer.contacts, '类型:', typeof customer.contacts);
              
              if (typeof customer.contacts === 'string') {
                try {
                  contacts = JSON.parse(customer.contacts);
                  console.log('cart预存-解析JSON字符串后的contacts:', contacts);
                } catch (e) {
                  console.error('cart预存-解析contacts JSON失败:', e);
                  contacts = [];
                }
              } else if (Array.isArray(customer.contacts)) {
                contacts = customer.contacts;
                console.log('cart预存-contacts已经是数组:', contacts);
              }
            }
            
            if (contacts && contacts.length > 0) {
              // 查找默认联系人或第一个有地址的联系人
              const defaultContact = contacts.find(c => c.isDefault) || contacts[0];
              console.log('cart预存-选择的联系人:', defaultContact);
              
              if (defaultContact) {
                const addressParts = [];
                if (defaultContact.province) addressParts.push(defaultContact.province);
                if (defaultContact.city) addressParts.push(defaultContact.city);
                // 处理区域信息，可能是district字段或region数组
                if (defaultContact.district) {
                  addressParts.push(defaultContact.district);
                } else if (defaultContact.region && Array.isArray(defaultContact.region) && defaultContact.region.length >= 3) {
                  addressParts.push(defaultContact.region[2]); // 取第三个元素作为区域
                }
                if (defaultContact.address || defaultContact.addressDetail) {
                  addressParts.push(defaultContact.address || defaultContact.addressDetail);
                }
                address = addressParts.join(' ');
                console.log('cart预存-组合后的完整地址:', address);
              }
            }
            
            resolve(address);
          },
          fail: err => {
            console.error('cart预存-获取客户地址失败:', err);
            resolve('');
          }
        });
      });
    };
    
    // 获取地址信息后创建预存记录
    getCustomerAddress().then(customerAddress => {
      console.log('cart预存-从数据库获取的客户默认地址:', customerAddress);
      
      // 优先使用用户在购物车页面选择的地址
      let finalAddress = '';
      if (this.data.selectedAddress && this.data.selectedAddress.detail) {
        // 用户选择了地址，使用选择的地址
        finalAddress = this.data.selectedAddress.detail;
        console.log('cart预存-使用用户选择的地址:', finalAddress);
      } else {
        // 没有选择地址，使用从数据库获取的默认地址
        finalAddress = customerAddress;
        console.log('cart预存-使用数据库默认地址:', finalAddress);
      }
      
      console.log('cart预存-最终使用的地址:', finalAddress);
      
      // 直接在客户端创建预存记录
      const db = wx.cloud.database();
      const recordData = {
        customerId: customerId,
        customerName: customerName,
        customerPhone: customerPhone,
        customerAddress: finalAddress,
        type: 'product',
        productName: productName,
        quantity: quantity,
        balance: quantity,
        createTime: db.serverDate(),
        updateTime: db.serverDate(),
        remark: `商城下单预存 - ${productName}`,
        usageRecords: [],
        operationId: operationId,
        source: 'cart'
      };
      
      console.log('cart预存-创建记录数据:', recordData);
      
      db.collection('prepaidRecords').add({
        data: recordData,
        success: res => {
          console.log('预存记录创建成功，返回结果:', res);
          console.log('返回结果JSON:', JSON.stringify(res));
          console.log('预存使用的地址:', finalAddress);
          console.log('当前购物车页面selectedAddress:', this.data.selectedAddress);
          
          // 获取预存记录ID
          let prestoreRecordId = res._id || '';
          let success = true;
          let resultMessage = '预存记录创建成功';
          
          console.log('获取到预存记录ID:', prestoreRecordId);
          
          // 无论返回结果如何，都创建订单
          console.log('开始创建订单，预存记录ID:', prestoreRecordId);
          console.log('订单创建前的购物车状态:', {
            selectedCustomer: this.data.selectedCustomer,
            selectedAddress: this.data.selectedAddress,
            cartItems: this.data.cartItems,
            totalPrice: this.data.totalPrice
          });
          
          // 临时设置地址信息，确保订单创建时有地址
          if (finalAddress && !this.data.selectedAddress) {
            this.setData({
              selectedAddress: {
                detail: finalAddress,
                name: this.data.selectedCustomer.name,
                phone: customerPhone
              }
            });
          }
          
          this.createOrder(
            customerId, 
            customerPhone, 
            false, 
            'prestore', 
            prestoreRecordId, 
            true, 
            operationId
          );
          
          // 隐藏加载提示
          wx.hideLoading();
          
          // 显示成功消息
          wx.showToast({
            title: success ? '预存成功' : '预存处理中',
            icon: success ? 'success' : 'none'
          });
          
          // 刷新预存记录页面
          setTimeout(() => {
            // 尝试刷新全局数据
            const app = getApp();
            if (app && app.loadPrepaidRecordsFromCloud) {
              console.log('尝试刷新全局预存记录数据');
              app.loadPrepaidRecordsFromCloud(true); // 强制刷新
              
              // 检查是否有记录页面
              const pages = getCurrentPages();
              const membersPage = pages.find(p => p.route === 'pages/members/members');
              if (membersPage && membersPage.refreshRecords) {
                console.log('找到预存记录页面，尝试刷新');
                membersPage.refreshRecords();
              }
              
              // 刷新订单页面数据
              const ordersPage = pages.find(p => p.route === 'pages/orders/orders');
              if (ordersPage && ordersPage.manualRefresh) {
                console.log('找到订单页面，尝试刷新订单数据');
                ordersPage.manualRefresh();
              }
            }
            
            // 导航到预存记录页面
            wx.showModal({
              title: '查看记录',
              content: '预存记录和订单已创建成功！\n是否立即前往预存记录页面查看?',
              success: (res) => {
                if (res.confirm) {
                  wx.switchTab({
                    url: '/pages/members/members'
                  });
                }
              }
            });
          }, 1500);
        },
        fail: err => {
          console.error('预存记录创建失败:', err);
          console.error('错误详情:', JSON.stringify(err));
          wx.hideLoading();
          wx.showToast({
            title: '预存失败: ' + (err.errMsg || '未知错误'),
            icon: 'none',
            duration: 2000
          });
        }
      });
    });
  },
  
  // 创建订单
  createOrder: function(customerId, customerPhone, isPrepaidProduct, paymentMethod, prestoreRecordId, skipInventoryDeduction, operationId) {
    const app = getApp();
    
    console.log('createOrder被调用，参数:', {
      customerId, customerPhone, isPrepaidProduct, paymentMethod, prestoreRecordId, skipInventoryDeduction, operationId
    });
    console.log('当前selectedAddress:', this.data.selectedAddress);
    
    // 获取北京时间（UTC+8）
    const now = new Date();
    const utc8Offset = 8 * 60 * 60 * 1000;  
    const beijingTime = new Date(now.getTime() + utc8Offset);
    const beijingDateStr = beijingTime.toISOString().split('T')[0];
    
    console.log("购物车页面 - 系统当前时间:", now.toString());
    console.log("购物车页面 - 转换后北京日期:", beijingDateStr);
    
    // 确保有地址信息
    let addressInfo = { detail: '暂无地址' };
    if (this.data.selectedAddress && this.data.selectedAddress.detail) {
      addressInfo = this.data.selectedAddress;
    }
    console.log('订单使用的地址信息:', addressInfo);
    
    // 准备订单数据
    const orderData = {
      customer: this.data.selectedCustomer.name,
      customerId: customerId,
      customerPhone: customerPhone,
      address: addressInfo,
      paymentMethod: paymentMethod || this.data.paymentMethod,
      items: this.data.cartItems.map(item => {
        const validItem = {
          name: item.name,
          quantity: item.quantity,
          price: item.price
        };
        
        // 确保至少有一个有效ID
        if (item.id) validItem.id = item.id;
        if (item._id) validItem._id = item._id;
        if (item.validId) validItem.validId = item.validId;
        
        return validItem;
      }),
      total: isPrepaidProduct ? 0 : parseFloat(this.data.totalPrice), // 预存扣除订单金额为0
      isPrepaidProduct: isPrepaidProduct,
      date: beijingDateStr,  // 使用北京时间
      // 添加客户关联信息
      customerInfo: {
        name: this.data.selectedCustomer.name,
        phone: customerPhone,
        address: addressInfo.detail,
        contactName: addressInfo.name || this.data.selectedCustomer.name,
        contactPhone: addressInfo.phone || customerPhone
      },
      // 添加预存记录关联
      prestoreInfo: prestoreRecordId || operationId ? {
        recordId: prestoreRecordId || '',
        operationId: operationId || '',
        amount: isPrepaidProduct ? 0 : parseFloat(this.data.totalPrice), // 预存扣除金额为0
        timestamp: new Date().getTime()
      } : null,
      // 标记是否跳过库存扣减
      skipInventoryDeduction: !!skipInventoryDeduction
    };
    
    console.log('提交订单数据:', JSON.stringify(orderData));
    
    // 调用全局保存订单方法
    const orderId = app.saveOrder(orderData);
    
    // 清空购物车
    wx.setStorageSync('cartItems', []);
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showModal({
        title: '订单提交成功',
        content: '您的订单已提交，订单号：' + orderId + '\n总金额：¥' + this.data.totalPrice,
        showCancel: false,
        success: (res) => {
          if (res.confirm) {
            // 更新UI显示空购物车
            this.setData({
              cartItems: [],
              totalPrice: '0.00',
              isEmpty: true,
              selectedCustomer: null,
              selectedAddress: null,
              paymentMethod: 'cash'
            });
            
            // 返回上一页
            wx.navigateBack();
          }
        }
      });
    }, 1000);
  },

  // 返回商店
  goBackToShop: function () {
    wx.navigateBack();
  }
})