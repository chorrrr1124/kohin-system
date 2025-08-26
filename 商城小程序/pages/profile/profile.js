// pages/profile/profile.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 会员信息
    memberInfo: {
      level: 2,
      levelName: '资深养鸭人'
    },
    // 进度信息
    progressPercent: 35.6, // 170.9/480 * 100
    progressText: '170.9/480',
    // 鸭子图片
    duckImage: '/images/duck.png',
    // 权益信息
    benefitsInfo: {
      count: 5,
      items: [
        { id: 1, icon: '💰', name: '会员专享优惠券', count: 1 },
        { id: 2, icon: '🥤', name: '饮品会员折扣', count: 1 },
        { id: 3, icon: '🪙', name: '会员积分翻倍', count: 2 },
        { id: 4, icon: '🎂', name: '生日会员特权', count: 1 },
        { id: 5, icon: '🎁', name: '会员专属礼品', count: 1 }
      ]
    },
    // 资产信息
    assetsInfo: {
      coupons: 0,
      balance: 0,
      points: 0
    },
    // 功能菜单
    functionMenus: [
      [
        { name: '学生认证', icon: '/images/icons/profile.png', path: '/pages/student-auth/student-auth' },
        { name: '企业团购', icon: '/images/icons/cart.png', path: '/pages/enterprise/enterprise' }
      ],
      [
        { name: '兑换中心', icon: '/images/icons/home.png', path: '/pages/exchange/exchange' },
        { name: '优惠券中心', icon: '/images/icons/profile.png', path: '/pages/coupon-center/coupon-center' }
      ],
      [
        { name: '在线客服', icon: '/images/icons/cart.png', path: '/pages/service/service' },
        { name: '意见反馈', icon: '/images/icons/home.png', path: '/pages/feedback/feedback' }
      ]
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.refreshUserInfo()
  },

  refreshUserInfo() {
    const app = getApp()
    const openid = wx.getStorageSync('openid') || app?.globalData?.openid
    const userInfo = wx.getStorageSync('userInfo') || app?.globalData?.userInfo

    if (userInfo) {
      this.setData({ userInfo: { ...this.data.userInfo, ...userInfo } })
    }

    if (openid) {
      // 按 _openid 拉取用户数据，确保隔离
      wx.cloud.database().collection('users').where({ _openid: openid }).get().then(res => {
        if (res.data && res.data.length) {
          const u = res.data[0]
          this.setData({
            userInfo: {
              ...this.data.userInfo,
              nickName: u.nickName || this.data.userInfo.nickName,
              avatar: u.avatarUrl || this.data.userInfo.avatar,
              vipLevel: u.vipLevel || 0,
              points: u.points || 0,
              balance: u.balance || 0,
              coupons: u.coupons || 0
            }
          })
        }
      })
    }

    // 获取用户优惠券数量
    this.loadUserCouponCount();
  },

  // 加载用户优惠券数量
  loadUserCouponCount() {
    wx.cloud.callFunction({
      name: 'getUserCouponCount',
      success: (res) => {
        console.log('获取优惠券数量成功:', res);
        if (res.result.success) {
          this.setData({
            'userInfo.coupons': res.result.data
          });
        }
      },
      fail: (error) => {
        console.error('获取优惠券数量失败:', error);
        // 失败时保持默认值
      }
    });
  },

  /**
   * 功能菜单点击事件
   */
  onMenuTap(e) {
    const { path } = e.currentTarget.dataset;
    if (path) {
      wx.navigateTo({
        url: path
      });
    }
  },

  /**
   * 礼品卡点击事件
   */
  onGiftCardTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/gift-detail/gift-detail?id=${id}`
    });
  },

  /**
   * 优惠券点击事件
   */
  onCouponTap() {
    // 直接跳转到优惠券页面，不需要弹窗选择
    wx.navigateTo({
      url: '/pages/coupon/coupon'
    });
  },

  /**
   * 权益点击事件
   */
  onBenefitTap(e) {
    const { benefit } = e.currentTarget.dataset;
    wx.showToast({
      title: `查看${benefit.name}`,
      icon: 'none',
      duration: 1500
    });
    
    // 这里可以跳转到权益详情页面
    // wx.navigateTo({
    //   url: `/pages/benefit-detail/benefit-detail?id=${benefit.id}`
    // });
  },

  /**
   * 查看全部权益
   */
  onViewAllBenefits() {
    wx.showToast({
      title: '查看全部权益',
      icon: 'none',
      duration: 1500
    });
    
    // 这里可以跳转到权益列表页面
    // wx.navigateTo({
    //   url: '/pages/benefits/benefits'
    // });
  },

  /**
   * 查看全部礼品卡
   */
  onViewAllGifts() {
    wx.navigateTo({
      url: '/pages/gift-list/gift-list'
    });
  }
})