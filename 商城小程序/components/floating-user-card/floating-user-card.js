// components/floating-user-card/floating-user-card.js
Component({
  properties: {
    // 用户信息
    userInfo: {
      type: Object,
      value: {
        nickName: '张楚健',
        points: 288,
        balance: 0,
        coupons: 0,
        vipLevel: 6
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
    loadUserInfo() {
      // 从缓存或云数据库获取用户信息
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.setData({
          userInfo: {
            ...this.properties.userInfo,
            ...userInfo
          }
        });
      }

      // 从云数据库同步最新信息
      this.syncUserInfoFromCloud();
    },

    // 从云数据库同步用户信息
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
              vipLevel: userData.vipLevel || 1
            };

            this.setData({ userInfo });
            
            // 缓存到本地
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

    // 服务选择事件
    onServiceTap(e) {
      const serviceType = e.currentTarget.dataset.type;
      
      // 触发父组件事件
      this.triggerEvent('serviceSelect', {
        type: serviceType,
        timestamp: Date.now()
      });

      // 添加点击反馈
      this.showFeedback(e.currentTarget);

      // 处理不同服务类型
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
      wx.navigateTo({
        url: '/pages/coupon/coupon',
      });
    },

    // 功能按钮点击事件
    onFunctionTap(e) {
      const functionType = e.currentTarget.dataset.type;
      
      // 触发父组件事件
      this.triggerEvent('functionSelect', {
        type: functionType,
        timestamp: Date.now()
      });

      // 添加点击反馈
      this.showFeedback(e.currentTarget);

      // 处理不同功能
      this.handleFunctionAction(functionType);
    },

    // 处理自取服务
    handlePickupService() {
      wx.showToast({
        title: '切换到自取模式',
        icon: 'success',
        duration: 1500
      });

      // 这里可以设置全局服务模式
      getApp().globalData.serviceMode = 'pickup';
    },

    // 处理外卖服务
    handleDeliveryService() {
      wx.showToast({
        title: '切换到外卖模式',
        icon: 'success',
        duration: 1500
      });

      // 这里可以设置全局服务模式
      getApp().globalData.serviceMode = 'delivery';
    },

    // 处理功能按钮动作
    handleFunctionAction(type) {
      const actions = {
        gift: () => {
          wx.showToast({ title: '添加有礼功能', icon: 'none' });
        },
        group: () => {
          wx.showToast({ title: '团单优惠功能', icon: 'none' });
        },
        card: () => {
          wx.showToast({ title: '心意礼卡功能', icon: 'none' });
        },
        exchange: () => {
          wx.showToast({ title: '团购兑换功能', icon: 'none' });
        }
      };

      if (actions[type]) {
        actions[type]();
      }
    },

    // 显示点击反馈
    showFeedback(element) {
      // 创建简单的点击动画反馈
      if (element) {
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
          element.style.transform = 'scale(1)';
        }, 150);
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
        vipLevel: this.data.userInfo.vipLevel || 1
      };
    }
  }
});