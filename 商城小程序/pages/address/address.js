Page({
  data: {
    addresses: [],
    selectedAddressId: null
  },

  onLoad: function(options) {
    this.loadAddresses();
    if (options.selectedId) {
      this.setData({
        selectedAddressId: options.selectedId
      });
    }
  },

  // 加载地址列表
  loadAddresses: function() {
    // 从本地存储获取地址列表
    const addresses = wx.getStorageSync('addresses') || [
      {
        id: 1,
        name: '张三',
        phone: '13800138000',
        province: '广东省',
        city: '深圳市',
        district: '南山区',
        detail: '科技园南区深南大道9999号',
        isDefault: true
      },
      {
        id: 2,
        name: '李四',
        phone: '13900139000',
        province: '北京市',
        city: '北京市',
        district: '海淀区',
        detail: '中关村大街1号',
        isDefault: false
      }
    ];

    this.setData({
      addresses: addresses,
      selectedAddressId: this.data.selectedAddressId || (addresses.find(addr => addr.isDefault)?.id)
    });
  },

  // 选择地址
  selectAddress: function(e) {
    const addressId = e.currentTarget.dataset.id;
    this.setData({
      selectedAddressId: addressId
    });
  },

  // 确认选择
  confirmSelect: function() {
    const selectedAddress = this.data.addresses.find(addr => addr.id === this.data.selectedAddressId);
    
    if (!selectedAddress) {
      wx.showToast({
        title: '请选择地址',
        icon: 'none'
      });
      return;
    }

    // 保存为默认地址
    const addressInfo = {
      name: selectedAddress.name,
      phone: selectedAddress.phone,
      address: `${selectedAddress.province}${selectedAddress.city}${selectedAddress.district}${selectedAddress.detail}`
    };
    
    wx.setStorageSync('defaultAddress', addressInfo);
    
    wx.showToast({
      title: '地址选择成功',
      icon: 'success'
    });

    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  // 添加新地址
  addNewAddress: function() {
    wx.navigateTo({
      url: '/pages/address-edit/address-edit'
    });
  },

  // 编辑地址
  editAddress: function(e) {
    const addressId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/address-edit/address-edit?id=${addressId}`
    });
  },

  // 删除地址
  deleteAddress: function(e) {
    const addressId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个地址吗？',
      success: (res) => {
        if (res.confirm) {
          let addresses = this.data.addresses.filter(addr => addr.id !== addressId);
          
          // 如果删除的是默认地址，设置第一个为默认
          if (addresses.length > 0 && !addresses.some(addr => addr.isDefault)) {
            addresses[0].isDefault = true;
          }
          
          wx.setStorageSync('addresses', addresses);
          this.setData({
            addresses: addresses
          });
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  }
}); 