// pages/profile/profile.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 用户显示名称
    userDisplayName: '微信用户',
    // 会员信息
    memberInfo: {
      level: 2,
      levelName: '资深养鸭人'
    },
    // 进度信息
    progressPercent: 35.6, // 170.9/480 * 100
    progressText: '170.9/480',
    // 鸭子图片（修复本地资源不存在问题）
    duckImage: '/images/placeholder.png',
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

  async refreshUserInfo() {
    const app = getApp()
    const openid = wx.getStorageSync('openid') || app?.globalData?.openid
    const userInfo = wx.getStorageSync('userInfo') || app?.globalData?.userInfo

    if (userInfo) {
      this.setData({ 
        userInfo: { ...this.data.userInfo, ...userInfo },
        userDisplayName: userInfo.nickName || '微信用户'
      })
    }

    // 优先调用统一云函数
    const ok = await this.fetchMemberSummary()

    // 兜底直查 users
    if (!ok && openid) {
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
            },
            userDisplayName: u.nickName || '微信用户'
          })
        }
      })
    }

    // 加载用户优惠券数量（兼容旧逻辑，可保留或删除）
    this.loadUserCouponCount();
  },

  // 统一云函数获取会员汇总
  async fetchMemberSummary() {
    if (!wx.cloud) return false
    try {
      const res = await wx.cloud.callFunction({ name: 'getMemberSummary' })
      if (res && res.result && res.result.ok && res.result.data) {
        const { profile, assets, benefits } = res.result.data
        // 会员等级信息
        const memberInfo = {
          level: profile.vipLevel || 0,
          levelName: this.levelNameFromLevel(profile.vipLevel || 0)
        }
        // 进度条（如无经验字段，按0处理）
        const curr = profile.vipExp || 0
        const next = profile.nextLevelExp || 0
        const progressPercent = next > 0 ? Math.min(100, (curr / next) * 100) : 0
        const progressText = next > 0 ? `${curr}/${next}` : '0/0'

        // 资产
        const assetsInfo = {
          coupons: assets.coupons || 0,
          balance: assets.balance || 0,
          points: assets.points || 0
        }

        // 权益
        const benefitsInfo = {
          count: (benefits.items || []).length,
          items: (benefits.items || []).map(it => ({ id: it.id, icon: '🎁', name: it.name, count: 1 }))
        }

        // userInfo 兼容页面绑定
        const userInfo = {
          ...this.data.userInfo,
          vipLevel: memberInfo.level,
          points: assetsInfo.points,
          balance: assetsInfo.balance,
          coupons: assetsInfo.coupons
        }

        this.setData({ 
          memberInfo, 
          progressPercent, 
          progressText, 
          assetsInfo, 
          benefitsInfo, 
          userInfo,
          userDisplayName: userInfo.nickName || '微信用户'
        })
        wx.setStorageSync('userInfo', userInfo)
        return true
      }
    } catch (e) {
      console.warn('getMemberSummary 调用失败', e)
    }
    return false
  },

  // 简单的等级名映射
  levelNameFromLevel(level) {
    const map = {
      0: '普通会员',
      1: '新晋养鸭人',
      2: '资深养鸭人',
      3: '大师养鸭人',
      4: '传奇养鸭人'
    }
    return map[level] || '普通会员'
  },

  // 加载用户优惠券数量（兼容）
  loadUserCouponCount() {
    wx.cloud.callFunction({
      name: 'getUserCouponCount',
      success: (res) => {
        if (res.result && res.result.success) {
          this.setData({ 'userInfo.coupons': res.result.data })
        }
      },
      fail: () => {}
    })
  },

  /**
   * 功能菜单点击事件
   */
  onMenuTap(e) {
    const { path } = e.currentTarget.dataset;
    if (path) {
      wx.navigateTo({ url: path });
    }
  },

  /**
   * 礼品卡点击事件
   */
  onGiftCardTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/gift-detail/gift-detail?id=${id}` });
  },

  /**
   * 优惠券点击事件
   */
  onCouponTap() {
    wx.navigateTo({ url: '/pages/coupon/coupon' });
  },

  /**
   * 权益点击事件
   */
  onBenefitTap(e) {
    const { benefit } = e.currentTarget.dataset;
    wx.showToast({ title: `查看${benefit.name}`, icon: 'none', duration: 1500 });
  },

  /**
   * 查看全部权益
   */
  onViewAllBenefits() {
    wx.showToast({ title: '查看全部权益', icon: 'none', duration: 1500 });
  },

  /**
   * 查看全部礼品卡
   */
  onViewAllGifts() {
    wx.navigateTo({ url: '/pages/gift-list/gift-list' });
  },

  /**
   * 用户问候语点击事件
   */
  onUserGreetingTap() {
    wx.navigateTo({ url: '/pages/profile-edit/profile-edit' });
  },

  // 跳转到调试页面
  goToDebug() {
    wx.navigateTo({
      url: '/pages/debug/debug'
    });
  },

  // 跳转到测试弹窗页面
})