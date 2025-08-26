// pages/coupon/coupon.js
Page({
  data: {
    coupons: [],
    loading: true,
    hasError: false,
    errorMessage: ''
  },

  onLoad() {
    this.loadCoupons();
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
    this.setData({ loading: true, hasError: false });
    
    const app = getApp();
    const openid = wx.getStorageSync('openid') || app?.globalData?.openid;

    if (!openid) {
      this.setData({ 
        loading: false, 
        hasError: true, 
        errorMessage: '用户未登录' 
      });
      return;
    }

    // 直接从coupons集合获取用户的优惠券
    wx.cloud.database().collection('coupons')
      .where({
        _openid: openid,
        status: 'unused'
      })
      .get()
      .then(res => {
        console.log('获取优惠券成功:', res);
        if (res.data && res.data.length > 0) {
          const coupons = res.data.map(coupon => ({
            id: coupon._id,
            type: coupon.type || 'fixed',
            value: coupon.value || 0,
            unit: (coupon.type === 'fixed' ? '元' : '折'),
            title: coupon.name || '优惠券',
            condition: coupon.minAmount > 0 ? `满${coupon.minAmount}元可用` : '无门槛',
            validity: this.formatValidity(coupon.startTime, coupon.endTime),
            rules: [
              coupon.description || '本券不可与其他优惠同享',
              '请在有效期内使用'
            ],
            rulesExpanded: false,
            isUsed: false
          }));
          this.setData({ coupons, loading: false });
        } else {
          this.setData({ coupons: [], loading: false });
        }
      })
      .catch(err => {
        console.error('获取用户优惠券失败:', err);
        this.setData({ 
          coupons: [], 
          loading: false, 
          hasError: true, 
          errorMessage: '获取优惠券失败，请稍后重试' 
        });
      });
  },

  // 格式化有效期
  formatValidity(startTime, endTime) {
    if (!startTime || !endTime) {
      return '长期有效';
    }
    
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
      return `${startStr} - ${endStr}`;
    } catch (error) {
      return '长期有效';
    }
  },

  // 领取优惠券
  onGetCoupon() {
    // 用户已经在优惠券页面，跳转到优惠券中心领取新优惠券
    wx.navigateTo({
      url: '/pages/coupon-center/coupon-center'
    });
  },

  // 重试加载
  onRetry() {
    this.loadCoupons();
  }
});