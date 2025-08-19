Page({
  data: {
    username: '',
    password: '',
    showPassword: false,
    canLogin: false,
    
    // 弹窗相关
    showModal: false,
    modalTitle: '',
    modalContent: '',
    showCancel: false,
    confirmText: '确定',
    cancelText: '取消'
  },

  onLoad: function(options) {
    // 检查是否已经登录且未过期
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    const expireTime = wx.getStorageSync('loginExpireTime');
    const now = new Date().getTime();
    
    if (isLoggedIn && expireTime && now <= expireTime) {
      this.redirectToMain();
    } else if (isLoggedIn) {
      // 登录已过期，清除登录信息
      wx.removeStorageSync('isLoggedIn');
      wx.removeStorageSync('username');
      wx.removeStorageSync('loginTime');
      wx.removeStorageSync('loginExpireTime');
    }
  },

  // 账号输入
  onUsernameInput: function(e) {
    const username = e.detail.value;
    this.setData({
      username: username
    });
    this.checkCanLogin();
  },

  // 密码输入
  onPasswordInput: function(e) {
    const password = e.detail.value;
    this.setData({
      password: password
    });
    this.checkCanLogin();
  },

  // 切换密码显示/隐藏
  togglePassword: function() {
    this.setData({
      showPassword: !this.data.showPassword
    });
  },

  // 检查是否可以登录
  checkCanLogin: function() {
    const { username, password } = this.data;
    const canLogin = username.trim().length > 0 && password.trim().length > 0;
    this.setData({
      canLogin: canLogin
    });
  },

  // 登录处理
  onLogin: function() {
    if (!this.data.canLogin) {
      return;
    }

    const { username, password } = this.data;
    
    // 验证账号密码
    const validUsername = username.toLowerCase() === 'kohin';
    const validPassword = password === 'adminBuygood888';

    if (validUsername && validPassword) {
      // 登录成功，保存登录状态（30天过期）
      const now = new Date().getTime();
      const expireTime = now + (30 * 24 * 60 * 60 * 1000); // 30天后过期
      
      wx.setStorageSync('isLoggedIn', true);
      wx.setStorageSync('username', username);
      wx.setStorageSync('loginTime', now);
      wx.setStorageSync('loginExpireTime', expireTime);
      
      this.setData({
        showModal: true,
        modalTitle: '登录成功',
        modalContent: '🎉 欢迎使用产品库存管理系统！\n\n正在跳转到主页...',
        showCancel: false,
        confirmText: '确定'
      });

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        this.setData({
          showModal: false
        });
        this.redirectToMain();
      }, 1500);

    } else {
      // 登录失败
      let errorMsg = '';
      if (!validUsername && !validPassword) {
        errorMsg = '❌ 账号和密码都不正确！\n\n请检查您的输入信息';
      } else if (!validUsername) {
        errorMsg = '❌ 账号不正确！\n\n请输入正确的账号';
      } else {
        errorMsg = '❌ 密码不正确！\n\n请输入正确的密码';
      }

      this.setData({
        showModal: true,
        modalTitle: '登录失败',
        modalContent: errorMsg,
        showCancel: false,
        confirmText: '重新输入'
      });

      // 清空密码
      this.setData({
        password: ''
      });
      this.checkCanLogin();
    }
  },

  // 跳转到主页
  redirectToMain: function() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  // 自定义弹窗事件处理
  onModalConfirm: function() {
    this.setData({
      showModal: false
    });
  },

  onModalCancel: function() {
    this.setData({
      showModal: false
    });
  },

  onModalClose: function() {
    this.setData({
      showModal: false
    });
  }
}); 