// 手机号获取功能演示页面
Page({
  data: {
    showPhonePopup: false,
    userPhone: '',
    maskedPhone: '',
    phoneStatus: '未获取',
    phoneHistory: []
  },

  onLoad() {
    // 检查是否已有手机号
    const savedPhone = wx.getStorageSync('userPhone');
    if (savedPhone) {
      this.setData({
        userPhone: savedPhone,
        maskedPhone: this.maskPhoneNumber(savedPhone),
        phoneStatus: '已获取'
      });
    }
  },

  // 显示手机号弹窗
  showPhonePopup() {
    this.setData({
      showPhonePopup: true
    });
  },

  // 手机号获取成功
  onPhoneNumberSuccess(e) {
    const { phoneNumber, countryCode } = e.detail;
    
    console.log('手机号获取成功:', phoneNumber, countryCode);
    
    this.setData({
      userPhone: phoneNumber,
      maskedPhone: this.maskPhoneNumber(phoneNumber),
      phoneStatus: '获取成功',
      showPhonePopup: false
    });

    // 添加到历史记录
    this.addToHistory({
      phoneNumber: phoneNumber,
      countryCode: countryCode,
      timestamp: new Date().toLocaleString(),
      status: 'success'
    });

    wx.showToast({
      title: '手机号获取成功',
      icon: 'success'
    });
  },

  // 手机号获取失败
  onPhoneNumberError(e) {
    console.log('手机号获取失败:', e.detail);
    
    this.addToHistory({
      phoneNumber: '',
      countryCode: '',
      timestamp: new Date().toLocaleString(),
      status: 'error',
      error: e.detail.error
    });

    wx.showToast({
      title: '手机号获取失败',
      icon: 'none'
    });
  },

  // 用户拒绝授权
  onPhoneNumberReject(e) {
    console.log('用户拒绝授权手机号:', e.detail);
    
    this.addToHistory({
      phoneNumber: '',
      countryCode: '',
      timestamp: new Date().toLocaleString(),
      status: 'rejected',
      errno: e.detail.errno
    });

    wx.showToast({
      title: '需要授权手机号才能使用',
      icon: 'none'
    });
  },

  // 额度不足
  onPhoneNumberQuotaExceeded() {
    console.log('手机号获取额度不足');
    
    this.addToHistory({
      phoneNumber: '',
      countryCode: '',
      timestamp: new Date().toLocaleString(),
      status: 'quota_exceeded'
    });

    wx.showModal({
      title: '提示',
      content: '该功能使用次数已达上限，请联系客服',
      showCancel: false
    });
  },

  // 使用其他手机号
  onUseOtherPhone() {
    console.log('用户选择使用其他手机号');
    
    this.addToHistory({
      phoneNumber: '',
      countryCode: '',
      timestamp: new Date().toLocaleString(),
      status: 'use_other'
    });

    wx.showToast({
      title: '请手动输入手机号',
      icon: 'none'
    });
  },

  // 手机号掩码处理
  maskPhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.length < 7) {
      return phoneNumber;
    }
    
    const prefix = phoneNumber.substring(0, 3);
    const suffix = phoneNumber.substring(phoneNumber.length - 4);
    const masked = '*'.repeat(phoneNumber.length - 7);
    
    return `${prefix}${masked}${suffix}`;
  },

  // 添加到历史记录
  addToHistory(record) {
    const history = this.data.phoneHistory;
    history.unshift(record);
    
    // 只保留最近10条记录
    if (history.length > 10) {
      history.pop();
    }
    
    this.setData({
      phoneHistory: history
    });
  },

  // 清除手机号
  clearPhone() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除已保存的手机号吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userPhone');
          wx.removeStorageSync('userCountryCode');
          
          this.setData({
            userPhone: '',
            maskedPhone: '',
            phoneStatus: '未获取'
          });
          
          wx.showToast({
            title: '手机号已清除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 复制手机号
  copyPhone() {
    if (!this.data.userPhone) {
      wx.showToast({
        title: '暂无手机号',
        icon: 'none'
      });
      return;
    }
    
    wx.setClipboardData({
      data: this.data.userPhone,
      success: () => {
        wx.showToast({
          title: '手机号已复制',
          icon: 'success'
        });
      }
    });
  },

  // 查看完整手机号
  showFullPhone() {
    if (!this.data.userPhone) {
      wx.showToast({
        title: '暂无手机号',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '完整手机号',
      content: this.data.userPhone,
      showCancel: false
    });
  },

  // 测试云函数
  testCloudFunction() {
    wx.showLoading({
      title: '测试中...'
    });
    
    wx.cloud.callFunction({
      name: 'decryptPhoneNumber',
      data: { test: true },
      success: (res) => {
        wx.hideLoading();
        console.log('云函数测试结果:', res);
        
        wx.showModal({
          title: '云函数测试',
          content: JSON.stringify(res.result, null, 2),
          showCancel: false
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('云函数测试失败:', err);
        
        wx.showModal({
          title: '云函数测试失败',
          content: err.message || '未知错误',
          showCancel: false
        });
      }
    });
  }
}); 