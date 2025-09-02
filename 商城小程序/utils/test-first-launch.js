/**
 * 首次启动测试工具
 * 用于测试自动登录弹窗功能
 */

// 清除所有登录相关的本地存储，模拟首次启动
function clearLoginData() {
  console.log('🧹 清除登录数据，模拟首次启动...');
  
  // 清除登录相关数据
  wx.removeStorageSync('userInfo');
  wx.removeStorageSync('openid');
  wx.removeStorageSync('hasEverLoggedIn');
  wx.removeStorageSync('lastPhoneNumber');
  wx.removeStorageSync('userPhone');
  wx.removeStorageSync('userCountryCode');
  
  console.log('✅ 登录数据已清除');
  
  wx.showToast({
    title: '已清除登录数据',
    icon: 'success',
    duration: 2000
  });
}

// 恢复登录数据（用于测试后恢复）
function restoreLoginData() {
  console.log('🔄 恢复登录数据...');
  
  // 设置一些测试数据
  wx.setStorageSync('hasEverLoggedIn', true);
  wx.setStorageSync('openid', 'test_openid_123');
  wx.setStorageSync('userInfo', {
    nickName: '测试用户',
    avatarUrl: 'https://via.placeholder.com/100'
  });
  
  console.log('✅ 登录数据已恢复');
  
  wx.showToast({
    title: '已恢复登录数据',
    icon: 'success',
    duration: 2000
  });
}

// 检查当前登录状态
function checkCurrentLoginStatus() {
  const userInfo = wx.getStorageSync('userInfo');
  const openid = wx.getStorageSync('openid');
  const hasEverLoggedIn = wx.getStorageSync('hasEverLoggedIn');
  
  const status = {
    hasUserInfo: !!userInfo,
    hasOpenid: !!openid,
    hasEverLoggedIn: !!hasEverLoggedIn,
    isFirstLaunch: !hasEverLoggedIn
  };
  
  console.log('📊 当前登录状态:', status);
  
  wx.showModal({
    title: '登录状态检查',
    content: `用户信息: ${status.hasUserInfo ? '有' : '无'}\nOpenID: ${status.hasOpenid ? '有' : '无'}\n曾经登录: ${status.hasEverLoggedIn ? '是' : '否'}\n首次启动: ${status.isFirstLaunch ? '是' : '否'}`,
    showCancel: false
  });
  
  return status;
}

// 手动触发登录弹窗（用于测试）
function triggerLoginPopup() {
  console.log('🚀 手动触发登录弹窗...');
  
  // 获取当前页面
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  
  if (currentPage && currentPage.showLoginPopupFlow) {
    currentPage.showLoginPopupFlow();
    console.log('✅ 登录弹窗已触发');
  } else {
    console.error('❌ 无法获取当前页面或页面没有showLoginPopupFlow方法');
    wx.showToast({
      title: '触发失败',
      icon: 'none'
    });
  }
}

// 显示测试菜单
function showTestMenu() {
  wx.showActionSheet({
    itemList: [
      '清除登录数据（模拟首次启动）',
      '恢复登录数据',
      '检查当前登录状态',
      '手动触发登录弹窗',
      '重启小程序'
    ],
    success: (res) => {
      switch (res.tapIndex) {
        case 0:
          clearLoginData();
          break;
        case 1:
          restoreLoginData();
          break;
        case 2:
          checkCurrentLoginStatus();
          break;
        case 3:
          triggerLoginPopup();
          break;
        case 4:
          wx.reLaunch({
            url: '/pages/index/index'
          });
          break;
      }
    }
  });
}

module.exports = {
  clearLoginData,
  restoreLoginData,
  checkCurrentLoginStatus,
  triggerLoginPopup,
  showTestMenu
};
