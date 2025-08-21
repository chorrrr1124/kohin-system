// pages/coupon/coupon.js
Page({
  data: {
    coupons: [
      {
        id: 1,
        type: 'discount',
        value: 7.5,
        unit: '折',
        title: '双杯7.5折券 (指定饮品)',
        condition: '满2件可用',
        validity: '2025-08-19 - 2025-08-24',
        rules: [
          '本券不可与其他优惠同享',
          '仅限指定饮品使用',
          '请在有效期内使用'
        ],
        rulesExpanded: false,
        isUsed: false
      },
      {
        id: 2,
        type: 'cash',
        value: 10,
        unit: '元',
        title: '满50减10元代金券',
        condition: '满50元可用',
        validity: '2025-09-01 - 2025-09-30',
        rules: [
          '全场通用',
          '不与其他代金券叠加使用'
        ],
        rulesExpanded: false,
        isUsed: false
      },
      {
        id: 3,
        type: 'discount',
        value: 5,
        unit: '折',
        title: '单品5折券',
        condition: '满1件可用',
        validity: '2025-08-19 - 2025-08-24',
        rules: [
          '本券不可与其他优惠同享',
          '仅限指定饮品使用',
          '请在有效期内使用'
        ],
        rulesExpanded: false,
        isUsed: true
      }
    ]
  },

  onLoad() {
    // this.loadCoupons(); // 暂时注释掉云函数调用，使用本地数据
  },

  // 切换使用规则展开/折叠
  toggleRules(e) {
    const index = e.currentTarget.dataset.index;
    const coupons = this.data.coupons;
    coupons[index].rulesExpanded = !coupons[index].rulesExpanded;
    this.setData({
      coupons: coupons
    });
  },

  // 去使用
  useCoupon(e) {
    const index = e.currentTarget.dataset.index;
    // 根据业务跳转到下单页或商品列表
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 送好友
  shareCoupon(e) {
    const index = e.currentTarget.dataset.index;
    // 实现分享逻辑
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 加载优惠券数据
  loadCoupons() {
    const app = getApp();
    const openid = wx.getStorageSync('openid') || app?.globalData?.openid;

    if (openid) {
      wx.cloud.database().collection('coupons')
        .where({
          _openid: openid,
          validityDate: {
            $gt: new Date().toISOString()
          }
        })
        .get()
        .then(res => {
          if (res.data && res.data.length > 0) {
            this.setData({
              coupons: res.data.map(coupon => ({
                ...coupon,
                validityDate: this.formatDate(coupon.validityDate),
                rulesExpanded: false // 默认不展开
              }))
            });
          }
        })
        .catch(err => {
          console.error('获取优惠券失败:', err);
        });
    }
  },

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  // 领取优惠券
  onGetCoupon() {
    wx.navigateTo({
      url: '/pages/coupon-center/coupon-center'
    });
  }
});