// 手机号手动输入页面
Page({
  data: {
    phone: '',
    code: '',
    phoneError: '',
    codeError: '',
    countdown: 0,
    loading: false
  },

  onLoad() {
    // 页面加载时的初始化
  },

  // 手机号输入处理
  onPhoneInput(e) {
    const phone = e.detail.value;
    this.setData({
      phone,
      phoneError: ''
    });
  },

  // 手机号失焦验证
  onPhoneBlur() {
    this.validatePhone();
  },

  // 验证码输入处理
  onCodeInput(e) {
    const code = e.detail.value;
    this.setData({
      code,
      codeError: ''
    });
  },

  // 验证码失焦验证
  onCodeBlur() {
    this.validateCode();
  },

  // 验证手机号格式
  validatePhone() {
    const { phone } = this.data;
    if (!phone) {
      this.setData({ phoneError: '请输入手机号' });
      return false;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      this.setData({ phoneError: '请输入正确的手机号格式' });
      return false;
    }
    return true;
  },

  // 验证验证码格式
  validateCode() {
    const { code } = this.data;
    if (!code) {
      this.setData({ codeError: '请输入验证码' });
      return false;
    }
    if (!/^\d{6}$/.test(code)) {
      this.setData({ codeError: '验证码为6位数字' });
      return false;
    }
    return true;
  },

  // 发送验证码
  async sendCode() {
    if (!this.validatePhone()) {
      return;
    }

    const { phone } = this.data;
    
    try {
      this.setData({ loading: true });
      
      // 调用云函数发送验证码
      const result = await wx.cloud.callFunction({
        name: 'sendSmsCode',
        data: { phone }
      });

      if (result.result.success) {
        wx.showToast({
          title: '验证码已发送',
          icon: 'success'
        });
        
        // 开始倒计时
        this.startCountdown();
      } else {
        wx.showToast({
          title: result.result.message || '发送失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
      wx.showToast({
        title: '发送失败，请重试',
        icon: 'error'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 开始倒计时
  startCountdown() {
    this.setData({ countdown: 60 });
    
    const timer = setInterval(() => {
      if (this.data.countdown > 1) {
        this.setData({ countdown: this.data.countdown - 1 });
      } else {
        this.setData({ countdown: 0 });
        clearInterval(timer);
      }
    }, 1000);
  },

  // 登录
  async login() {
    if (!this.validatePhone() || !this.validateCode()) {
      return;
    }

    const { phone, code } = this.data;
    
    try {
      this.setData({ loading: true });
      
      // 调用云函数验证验证码
      const result = await wx.cloud.callFunction({
        name: 'verifySmsCode',
        data: { phone, code }
      });

      if (result.result.success) {
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });

        // 保存用户信息到本地存储
        const userInfo = {
          phone,
          loginTime: new Date().getTime(),
          loginMethod: 'manual'
        };
        
        wx.setStorageSync('userInfo', userInfo);
        
        console.log('登录成功，用户信息:', userInfo);

        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          wx.navigateBack({
            success: () => {
              console.log('返回上一页成功');
            },
            fail: (error) => {
              console.error('返回上一页失败:', error);
              // 如果返回失败，跳转到首页
              wx.switchTab({
                url: '/pages/index/index'
              });
            }
          });
        }, 1500);
      } else {
        wx.showToast({
          title: result.result.message || '验证失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'error'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 页面显示时检查登录状态
  onShow() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.phone) {
      // 如果已经登录，显示用户信息
      this.setData({
        phone: userInfo.phone
      });
    }
  }
}); 