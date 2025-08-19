Page({
  data: {
    customerId: '',
    addressList: [],
    loading: false,
    isEmpty: true
  },

  onLoad: function (options) {
    if (options.customerId) {
      this.setData({
        customerId: options.customerId
      });
      this.loadAddressList(options.customerId);
    } else {
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
    if (this.data.customerId) {
      this.loadAddressList(this.data.customerId);
    }
  },

  // 加载地址列表
  loadAddressList: function (customerId) {
    this.setData({ loading: true });
    
    const db = wx.cloud.database();
    db.collection('customerAddresses')
      .where({
        customerId: customerId
      })
      .orderBy('isDefault', 'desc')
      .get({
        success: res => {
          console.log('获取地址列表成功:', res.data.length);
          this.setData({
            addressList: res.data,
            isEmpty: res.data.length === 0,
            loading: false
          });
        },
        fail: err => {
          console.error('获取地址列表失败:', err);
          this.setData({ loading: false });
          wx.showToast({
            title: '加载地址失败',
            icon: 'none'
          });
        }
      });
  },

  // 选择地址
  selectAddress: function (e) {
    const index = e.currentTarget.dataset.index;
    const address = this.data.addressList[index];
    
    // 通过事件通道将选择的地址传回到购物车页面
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.emit('addressSelected', address);
    
    // 返回购物车页面
    wx.navigateBack();
  },
  
  // 添加新地址
  addAddress: function () {
    wx.navigateTo({
      url: '/pages/address/editAddress/editAddress?customerId=' + this.data.customerId,
    });
  },

  // 编辑地址
  editAddress: function (e) {
    const index = e.currentTarget.dataset.index;
    const address = this.data.addressList[index];
    
    wx.navigateTo({
      url: '/pages/address/editAddress/editAddress?id=' + address._id + '&customerId=' + this.data.customerId,
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
              
              // 刷新地址列表
              this.loadAddressList(this.data.customerId);
              
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
        
        // 刷新地址列表
        this.loadAddressList(this.data.customerId);
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