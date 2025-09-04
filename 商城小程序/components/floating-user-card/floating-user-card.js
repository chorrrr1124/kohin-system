// components/floating-user-card/floating-user-card.js
Component({
  properties: {
    // 用户信息
    userInfo: {
      type: Object,
      value: {
        nickName: '微信用户',
        points: 0,
        balance: 0,
        coupons: 0,
        vipLevel: 0
      }
    }
  },

  data: {
    animationClass: ''
  },

  lifetimes: {
    attached() {
      this.loadUserInfo();
      this.startAnimation();
    }
  },

  methods: {
    // 加载用户信息
    async loadUserInfo() {
      // 先读缓存
      const cached = wx.getStorageSync('userInfo');
      if (cached) {
        this.setData({ userInfo: { ...this.properties.userInfo, ...cached } });
      }

      // 优先通过统一云函数获取
      await this.fetchMemberSummary();

      // 兜底：直查 users（若云函数不可用）
      if (!this.data.userInfo || !this.data.userInfo.nickName) {
      this.syncUserInfoFromCloud();
      }
    },

    // 统一云函数：会员信息汇总
    async fetchMemberSummary() {
      if (!wx.cloud) return;
      try {
        const res = await wx.cloud.callFunction({ name: 'getMemberSummary' });
        if (res && res.result && res.result.ok && res.result.data) {
          const { profile, assets } = res.result.data;
          const userInfo = {
            nickName: profile.nickName || this.data.userInfo.nickName,
            vipLevel: profile.vipLevel || 0,
            points: assets.points || 0,
            balance: assets.balance || 0,
            coupons: assets.coupons || 0
          };
          this.setData({ userInfo });
          wx.setStorageSync('userInfo', userInfo);
          return true;
        }
      } catch (e) {
        console.warn('getMemberSummary 调用失败', e);
      }
      return false;
    },

    // 从云数据库同步用户信息（兜底）
    syncUserInfoFromCloud() {
      if (!wx.cloud) {
        console.warn('云开发未初始化');
        return;
      }

      const openid = wx.getStorageSync('openid');
      if (!openid) return;

      wx.cloud.database().collection('users')
        .where({ _openid: openid })
        .get()
        .then(res => {
          if (res.data && res.data.length > 0) {
            const userData = res.data[0];
            const userInfo = {
              nickName: userData.nickName || this.data.userInfo.nickName,
              points: userData.points || 0,
              balance: userData.balance || 0,
              coupons: userData.coupons || 0,
              vipLevel: userData.vipLevel || 0
            };

            this.setData({ userInfo });
            wx.setStorageSync('userInfo', userInfo);
          }
        })
        .catch(err => {
          console.error('同步用户信息失败:', err);
        });
    },

    // 启动入场动画
    startAnimation() {
      setTimeout(() => {
        this.setData({
          animationClass: 'slide-in'
        });
      }, 100);
    },

    // 昵称点击跳转个人资料编辑页面
    onNameTap() {
      wx.navigateTo({ url: '/pages/profile-edit/profile-edit' });
    },

    // 服务选择事件
    onServiceTap(e) {
      const serviceType = e.currentTarget.dataset.type;
      this.triggerEvent('serviceSelect', { type: serviceType, timestamp: Date.now() });
      this.showFeedback(e.currentTarget);
      switch (serviceType) {
        case 'pickup':
          this.handlePickupService();
          break;
        case 'delivery':
          this.handleDeliveryService();
          break;
      }
    },

    // 优惠券点击事件
    onCouponTap() {
      wx.navigateTo({ url: '/pages/coupon/coupon' });
    },

    // 功能按钮点击事件
    onFunctionTap(e) {
      const functionType = e.currentTarget.dataset.type;
      this.triggerEvent('functionSelect', { type: functionType, timestamp: Date.now() });
      this.showFeedback(e.currentTarget);
      this.handleFunctionAction(functionType);
    },

    // 处理自取服务
    handlePickupService() {
      wx.showToast({ title: '切换到自取模式', icon: 'success', duration: 1500 });
      getApp().globalData.serviceMode = 'pickup';
    },

    // 处理外卖服务
    handleDeliveryService() {
      wx.showToast({ title: '切换到外卖模式', icon: 'success', duration: 1500 });
      getApp().globalData.serviceMode = 'delivery';
    },

    // 处理功能按钮动作
    handleFunctionAction(type) {
      const actions = {
        gift: () => { wx.showToast({ title: '添加有礼功能', icon: 'none' }); },
        group: () => { wx.showToast({ title: '团单优惠功能', icon: 'none' }); },
        card: () => { wx.showToast({ title: '心意礼卡功能', icon: 'none' }); },
        exchange: () => { wx.showToast({ title: '团购兑换功能', icon: 'none' }); }
      };
      if (actions[type]) actions[type]();
    },

    // 显示点击反馈
    showFeedback(element) {
      if (element) {
        element.style.transform = 'scale(0.95)';
        setTimeout(() => { element.style.transform = 'scale(1)'; }, 150);
      }
    },

    // 刷新用户信息
    refresh() {
      this.loadUserInfo();
    },

    // 获取用户统计信息
    getUserStats() {
      return {
        points: this.data.userInfo.points || 0,
        balance: this.data.userInfo.balance || 0,
        coupons: this.data.userInfo.coupons || 0,
        vipLevel: this.data.userInfo.vipLevel || 0
      };
    }
  }
});