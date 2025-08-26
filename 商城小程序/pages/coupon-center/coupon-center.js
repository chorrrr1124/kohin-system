// pages/coupon-center/coupon-center.js
Page({
  data: {
    coupons: [],
    loading: true,
    userInfo: null
  },

  onLoad() {
    this.loadUserInfo();
    this.loadAvailableCoupons();
  },

  onShow() {
    this.loadAvailableCoupons();
  },

  // 加载用户信息
  loadUserInfo() {
    const app = getApp();
    const userInfo = wx.getStorageSync('userInfo') || app?.globalData?.userInfo;
    this.setData({ userInfo });
  },

  // 加载可用的优惠券
  loadAvailableCoupons() {
    this.setData({ loading: true });
    
    wx.cloud.callFunction({
      name: 'getActiveCoupons',
      data: {
        limit: 50,
        status: 'active'
      },
      success: (res) => {
        console.log('获取可用优惠券成功:', res);
        if (res.result.success) {
          this.setData({
            coupons: res.result.data || [],
            loading: false
          });
        } else {
          this.setData({ 
            coupons: [],
            loading: false 
          });
          wx.showToast({
            title: res.result.message || '获取优惠券失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        console.error('获取优惠券失败:', error);
        this.setData({ 
          coupons: [],
          loading: false 
        });
        wx.showToast({
          title: '获取优惠券失败',
          icon: 'none'
        });
      }
    });
  },

  // 领取优惠券
  claimCoupon(e) {
    const { id, name } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '领取确认',
      content: `确定要领取"${name}"优惠券吗？`,
      success: (res) => {
        if (res.confirm) {
          this.doClaimCoupon(id, name);
        }
      }
    });
  },

  // 执行领取优惠券
  doClaimCoupon(couponId, couponName) {
    wx.showLoading({
      title: '领取中...'
    });

    wx.cloud.callFunction({
      name: 'claimCoupon',
      data: {
        couponId: couponId,
        condition: '用户主动领取'
      },
      success: (res) => {
        wx.hideLoading();
        console.log('领取优惠券结果:', res);
        
        if (res.result.success) {
          wx.showToast({
            title: '领取成功',
            icon: 'success'
          });
          
          // 刷新优惠券列表
          this.loadAvailableCoupons();
          
          // 通知首页和我的页面更新优惠券数量
          this.notifyCouponCountUpdate();
        } else {
          wx.showToast({
            title: res.result.message || '领取失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('领取优惠券失败:', error);
        wx.showToast({
          title: '领取失败',
          icon: 'none'
        });
      }
    });
  },

  // 通知其他页面更新优惠券数量
  notifyCouponCountUpdate() {
    // 可以通过事件总线或者全局数据更新来通知其他页面
    const app = getApp();
    if (app.globalData) {
      app.globalData.couponCountUpdated = true;
    }
  },

  // 查看优惠券详情
  viewCouponDetail(e) {
    const { id } = e.currentTarget.dataset;
    // 可以跳转到优惠券详情页面
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadAvailableCoupons();
    wx.stopPullDownRefresh();
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}); 