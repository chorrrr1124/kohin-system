// pages/test-benefit-login/test-benefit-login.js
Page({
  data: {
    showBenefitPopup: false,
    userPhone: '',
    loginStatus: ''
  },

  onLoad() {
    console.log('测试页面加载完成');
  },

  // 显示注册福利弹窗
  showBenefitPopup() {
    this.setData({
      showBenefitPopup: true
    });
  },

  // 注册福利登录事件
  onBenefitLogin(e) {
    console.log('注册福利登录事件:', e.detail);
    this.setData({
      loginStatus: '正在获取手机号...'
    });
  },

  // 手机号获取成功
  onPhoneNumberSuccess(e) {
    console.log('手机号获取成功:', e.detail);
    const { phoneNumber, countryCode } = e.detail;
    
    this.setData({
      userPhone: phoneNumber,
      loginStatus: `登录成功！手机号: ${phoneNumber}`
    });

    wx.showToast({
      title: '登录成功！',
      icon: 'success'
    });
  },

  // 手机号获取失败
  onPhoneNumberError(e) {
    console.log('手机号获取失败:', e.detail);
    this.setData({
      loginStatus: `登录失败: ${e.detail.error}`
    });
  },

  // 跳过注册福利
  onBenefitSkip(e) {
    console.log('跳过注册福利:', e.detail);
    this.setData({
      loginStatus: '用户跳过注册福利'
    });
  },

  // 清除状态
  clearStatus() {
    this.setData({
      userPhone: '',
      loginStatus: ''
    });
  }
}); 