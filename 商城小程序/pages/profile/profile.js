// pages/profile/profile.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 用户信息
    userInfo: {
      nickName: '游客',
      avatar: '/images/placeholder.png',
      vipLevel: 0,
      points: 0,
      balance: 0,
      coupons: 0
    },
    
    // 成长值信息
    growthInfo: {
      current: 170.9,
      total: 480,
      level: 'Lv2'
    },
    
    // 权益信息
    benefitsInfo: {
      count: 5
    },
    
    // 功能菜单
    functionMenus: [
      [
        { icon: '/images/placeholder.png', name: '学生认证', path: '/pages/student-auth/student-auth' },
        { icon: '/images/placeholder.png', name: '企业团购', path: '/pages/enterprise/enterprise' },
        { icon: '/images/placeholder.png', name: '兑换中心', path: '/pages/exchange/exchange' },
        { icon: '/images/placeholder.png', name: '在线客服', path: '/pages/service/service' }
      ],
      [
        { icon: '/images/placeholder.png', name: '礼品卡', path: '/pages/gift-card/gift-card' },
        { icon: '/images/placeholder.png', name: '完善信息', path: '/pages/sale-info/sale-info' },
        { icon: '/images/placeholder.png', name: '我的地址', path: '/pages/address/address' },
        { icon: '/images/placeholder.png', name: '更多', path: '/pages/more/more' }
      ]
    ],
    
    // 心意礼卡
    giftCards: [
      {
        id: 1,
        title: '春风。',
        price: 30,
        brand: '丘大叔UNCLE丘',
        image: '/images/placeholder.png'
      },
      {
        id: 2,
        title: '拼面。',
        price: 66,
        brand: '丘大叔UNCLE丘',
        image: '/images/placeholder.png'
      }
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
   * 查看全部礼品卡
   */
  onViewAllGifts() {
    wx.navigateTo({
      url: '/pages/gift-list/gift-list'
    });
  }
})