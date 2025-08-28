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

  onShow() {
    this.loadCoupons();
  },

  // 展开/收起规则
  toggleRules(e) {
    const index = e.currentTarget.dataset.index;
    const coupons = this.data.coupons;
    coupons[index].rulesExpanded = !coupons[index].rulesExpanded;
    this.setData({
      coupons: coupons
    });
  },

  // 使用优惠券
  useCoupon(e) {
    const index = e.currentTarget.dataset.index;
    const coupon = this.data.coupons[index];
    
    wx.showModal({
      title: '使用优惠券',
      content: `确定要使用"${coupon.title}"吗？`,
      success: (res) => {
        if (res.confirm) {
          // 跳转到商品页面选择商品
          wx.switchTab({
            url: '/pages/index/index'
          });
        }
      }
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

    // 使用云函数获取用户优惠券，避免直接访问数据库
    wx.cloud.callFunction({
      name: 'getData',
      data: {
        collection: 'user_coupons',
        action: 'get',
        where: {
        _openid: openid,
        status: 'unused'
        },
        limit: 50
      }
      })
      .then(res => {
      console.log('获取用户优惠券成功:', res);
      if (res.result && res.result.success && res.result.data && res.result.data.length > 0) {
        // 获取优惠券模板信息
        const couponIds = res.result.data.map(item => item.couponId);
        
        return wx.cloud.callFunction({
          name: 'getData',
          data: {
            collection: 'mall_coupons',
            action: 'get',
            where: {
              _id: wx.cloud.database().command.in(couponIds)
            }
          }
        }).then(templateRes => {
          return {
            userCoupons: res.result.data,
            templates: templateRes.result && templateRes.result.success ? templateRes.result.data : []
          };
        });
      } else {
        this.setData({ coupons: [], loading: false });
        return null;
      }
    })
    .then(data => {
      if (data) {
        const { userCoupons, templates } = data;
        
        // 合并用户优惠券和模板信息
        const coupons = userCoupons.map(userCoupon => {
          const template = templates.find(t => t._id === userCoupon.couponId);
          if (template) {
            return {
              id: userCoupon._id,
              type: template.type || 'fixed',
              value: template.value || 0,
              unit: (template.type === 'fixed' ? '元' : '折'),
              title: template.name || '优惠券',
              condition: template.minAmount > 0 ? `满${template.minAmount}元可用` : '无门槛',
              validity: this.formatValidity(template.startTime, template.endTime),
            rules: [
                template.description || '本券不可与其他优惠同享',
              '请在有效期内使用'
            ],
            rulesExpanded: false,
            isUsed: false
            };
          }
          return null;
        }).filter(Boolean);
        
          this.setData({ coupons, loading: false });
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