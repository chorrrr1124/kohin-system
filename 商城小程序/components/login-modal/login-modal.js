// components/login-modal/login-modal.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    phoneNumber: '',
    phoneProvider: '上次提供',
    loginLoading: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 防止触摸穿透
    preventTouchMove() {
      return false;
    },

    // 点击遮罩层
    onMaskTap() {
      // 可以选择是否允许点击遮罩关闭
      // this.onClose();
    },

    // 关闭弹窗
    onClose() {
      this.triggerEvent('close');
    },

    // 拒绝登录
    onReject() {
      this.triggerEvent('reject');
      this.onClose();
    },

    // 使用其他号码
    onUseOtherPhone() {
      wx.showToast({
        title: '功能开发中',
        icon: 'none'
      });
    },

    // 用户协议
    onUserAgreement() {
      wx.showModal({
        title: '用户协议',
        content: '这里是用户协议内容，实际项目中应该跳转到协议页面或显示完整协议内容。',
        showCancel: false
      });
    },

    // 隐私政策
    onPrivacyPolicy() {
      wx.showModal({
        title: '隐私政策',
        content: '这里是隐私政策内容，实际项目中应该跳转到隐私政策页面或显示完整政策内容。',
        showCancel: false
      });
    },

    // 主要登录方法
    async onLogin() {
      if (this.data.loginLoading) return;

      this.setData({ loginLoading: true });

      try {
        // 获取用户授权
        const { userInfo } = await wx.getUserProfile({
          desc: '用于完善用户资料'
        });

        // 调用云函数获取openid
        const loginResult = await wx.cloud.callFunction({
          name: 'login'
        });

        const openid = loginResult.result.openid;
        if (!openid) {
          throw new Error('获取用户标识失败');
        }

        // 保存用户信息到全局
        const app = getApp();
        app.globalData.userInfo = userInfo;
        app.globalData.openid = openid;
        app.globalData.isLoggedIn = true;

        // 本地存储
        wx.setStorageSync('userInfo', userInfo);
        wx.setStorageSync('openid', openid);
        wx.setStorageSync('hasEverLoggedIn', true);

        // 同步用户信息到数据库
        await this.syncUserToDatabase(userInfo, openid);

        // 触发登录成功事件
        this.triggerEvent('success', {
          userInfo,
          openid
        });

        // 显示成功提示
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });

        // 关闭弹窗
        this.onClose();

      } catch (error) {
        console.error('登录失败:', error);
        
        let errorMessage = '登录失败，请稍后重试';
        if (error.errMsg && error.errMsg.includes('getUserProfile:fail auth deny')) {
          errorMessage = '需要您的授权才能继续使用';
        }
        
        wx.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 2000
        });

        // 触发登录失败事件
        this.triggerEvent('fail', { error });
      } finally {
        this.setData({ loginLoading: false });
      }
    },

    // 同步用户信息到数据库
    async syncUserToDatabase(userInfo, openid) {
      try {
        await wx.cloud.callFunction({
          name: 'syncUser',
          data: {
            userInfo,
            openid
          }
        });
      } catch (error) {
        console.error('同步用户信息失败:', error);
        // 同步失败不影响登录流程
      }
    },

    // 获取手机号信息（模拟）
    async getPhoneNumber() {
      try {
        // 这里可以调用获取手机号的API
        // 目前先模拟显示
        const phoneNumber = '136****2406';
        this.setData({
          phoneNumber,
          phoneProvider: '上次提供'
        });
      } catch (error) {
        console.error('获取手机号失败:', error);
      }
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 组件实例被放到页面节点树后执行
      this.getPhoneNumber();
    }
  }
});