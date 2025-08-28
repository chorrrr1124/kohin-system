// 弹窗测试页面
Page({
  data: {
    showPrivacyPopup: false,
    showBenefitPopup: false,
    showPhonePopup: false,
    popupDataStatus: {
      privacy: '未加载',
      benefit: '未加载',
      phone: '未加载'
    },
    pageStyle: '', // 新增页面样式属性
    touchBlocked: false // 触摸阻止状态
  },

  onLoad() {
    console.log('测试页面加载完成')
  },

  // 测试隐私弹窗
  testPrivacyPopup() {
    console.log('测试隐私弹窗')
    this.setData({
      showPrivacyPopup: true,
      showBenefitPopup: false,
      showPhonePopup: false
    })
    
    // 检查弹窗组件数据
    setTimeout(() => {
      this.checkPopupData('privacy')
    }, 100)
  },

  // 测试福利弹窗
  testBenefitPopup() {
    console.log('测试福利弹窗')
    this.setData({
      showPrivacyPopup: false,
      showBenefitPopup: true,
      showPhonePopup: false
    })
    
    // 检查弹窗组件数据
    setTimeout(() => {
      this.checkPopupData('benefit')
    }, 100)
  },

  // 测试手机号弹窗
  testPhonePopup() {
    console.log('测试手机号弹窗')
    this.setData({
      showPrivacyPopup: false,
      showBenefitPopup: false,
      showPhonePopup: true
    })
    
    // 检查弹窗组件数据
    setTimeout(() => {
      this.checkPopupData('phone')
    }, 100)
  },

  // 测试所有弹窗
  testAllPopups() {
    console.log('测试所有弹窗')
    this.testPrivacyPopup()
    
    setTimeout(() => {
      this.testBenefitPopup()
    }, 2000)
    
    setTimeout(() => {
      this.testPhonePopup()
    }, 4000)
  },

  // 测试弹窗触摸阻止
  testPopupTouchBlocking() {
    console.log('测试弹窗触摸阻止')
    
    // 显示隐私弹窗
    this.setData({
      showPrivacyPopup: true
    })
    
    wx.showToast({
      title: '隐私弹窗已显示，测试触摸阻止',
      icon: 'none',
      duration: 2000
    })
    
    // 3秒后自动隐藏
    setTimeout(() => {
      this.setData({
        showPrivacyPopup: false
      })
      wx.showToast({
        title: '触摸阻止测试完成',
        icon: 'success'
      })
    }, 3000)
  },

  // 测试弹窗按钮点击
  testPopupButtonClick() {
    console.log('测试弹窗按钮点击')
    
    // 显示福利弹窗
    this.setData({
      showBenefitPopup: true
    })
    
    wx.showToast({
      title: '福利弹窗已显示，测试按钮点击',
      icon: 'none',
      duration: 2000
    })
    
    // 5秒后自动隐藏
    setTimeout(() => {
      this.setData({
        showBenefitPopup: false
      })
      wx.showToast({
        title: '按钮点击测试完成',
        icon: 'success'
      })
    }, 5000)
  },

  // 触摸事件阻止方法
  preventTouchMove(e) {
    console.log('页面阻止触摸移动')
    if (e && e.preventDefault) e.preventDefault()
    if (e && e.stopPropagation) e.stopPropagation()
    return false
  },

  preventTouchStart(e) {
    console.log('页面阻止触摸开始')
    if (e && e.preventDefault) e.preventDefault()
    if (e && e.stopPropagation) e.stopPropagation()
    return false
  },

  preventTouchEnd(e) {
    console.log('页面阻止触摸结束')
    if (e && e.preventDefault) e.preventDefault()
    if (e && e.stopPropagation) e.stopPropagation()
    return false
  },

  // 测试触摸事件阻止
  testTouchEvents() {
    console.log('测试触摸事件阻止')
    
    if (this.data.touchBlocked) {
      // 如果已经阻止，则恢复
      this.setData({
        pageStyle: '',
        touchBlocked: false
      })
      wx.showToast({
        title: '触摸阻止已关闭',
        icon: 'success'
      })
    } else {
      // 设置页面样式阻止触摸
      this.setData({
        pageStyle: 'touch-action: none !important; overflow: hidden !important;',
        touchBlocked: true
      })
      wx.showToast({
        title: '触摸阻止已开启',
        icon: 'success'
      })
    }
  },

  // 添加触摸事件监听
  addTouchEventListeners() {
    // 监听页面触摸事件
    wx.onTouchStart((e) => {
      console.log('页面触摸开始:', e)
    })
    
    wx.onTouchMove((e) => {
      console.log('页面触摸移动:', e)
    })
    
    wx.onTouchEnd((e) => {
      console.log('页面触摸结束:', e)
    })
  },

  // 测试弹窗内容完整性
  testPopupContentIntegrity() {
    console.log('测试弹窗内容完整性')
    
    const popupSystem = this.selectComponent('#loginPopupSystem')
    if (popupSystem) {
      const popupContent = popupSystem.data.popupContent
      
      console.log('弹窗内容状态:')
      console.log('- 隐私弹窗:', popupContent.privacy)
      console.log('- 福利弹窗:', popupContent.benefit)
      console.log('- 手机号弹窗:', popupContent.phone)
      
      // 检查按钮文字
      if (popupContent.privacy) {
        console.log('隐私弹窗按钮:')
        console.log('  拒绝按钮:', popupContent.privacy.rejectButton)
        console.log('  同意按钮:', popupContent.privacy.agreeButton)
      }
      
      if (popupContent.benefit) {
        console.log('福利弹窗按钮:')
        console.log('  登录按钮:', popupContent.benefit.loginButton)
        console.log('  跳过按钮:', popupContent.benefit.skipButton)
      }
      
      if (popupContent.phone) {
        console.log('手机号弹窗按钮:')
        console.log('  允许按钮:', popupContent.phone.allowButton)
        console.log('  不允许按钮:', popupContent.phone.rejectButton)
        console.log('  其他号码按钮:', popupContent.phone.otherPhoneButton)
      }
    }
  },

  // 调试弹窗显示状态
  debugPopupStatus() {
    console.log('=== 弹窗状态调试 ===')
    
    const popupSystem = this.selectComponent('#loginPopupSystem')
    if (popupSystem) {
      console.log('弹窗组件实例:', popupSystem)
      console.log('弹窗组件数据:', popupSystem.data)
      console.log('弹窗组件属性:', popupSystem.properties)
      
      // 检查弹窗显示状态
      console.log('弹窗显示状态:')
      console.log('- showPrivacyPopup:', this.data.showPrivacyPopup)
      console.log('- showBenefitPopup:', this.data.showBenefitPopup)
      console.log('- showPhonePopup:', this.data.showPhonePopup)
      
      // 检查内部状态
      console.log('弹窗内部状态:')
      console.log('- privacyVisible:', popupSystem.data.privacyVisible)
      console.log('- benefitVisible:', popupSystem.data.benefitVisible)
      console.log('- phoneVisible:', popupSystem.data.phoneVisible)
      
      // 检查弹窗内容
      console.log('弹窗内容:')
      console.log('- popupContent:', popupSystem.data.popupContent)
      
      // 强制同步状态
      popupSystem.syncPopupVisibility()
      
      console.log('=== 调试完成 ===')
    } else {
      console.error('弹窗组件未找到!')
    }
  },

  // 测试弹窗显示状态

  // 检查弹窗数据
  checkPopupData(type) {
    const popupSystem = this.selectComponent('#loginPopupSystem')
    if (popupSystem) {
      const popupContent = popupSystem.data.popupContent
      console.log(`${type}弹窗数据:`, popupContent[type])
      
      // 更新状态显示
      const statusKey = `popupDataStatus.${type}`
      const statusValue = popupContent[type] ? '已加载' : '未加载'
      this.setData({
        [statusKey]: statusValue
      })
      
      // 检查按钮文字
      if (popupContent[type]) {
        const buttons = this.getButtonTexts(type, popupContent[type])
        console.log(`${type}弹窗按钮文字:`, buttons)
        
        // 显示按钮文字状态
        wx.showToast({
          title: `按钮文字: ${buttons.join(', ')}`,
          icon: 'none',
          duration: 3000
        })
      }
    }
  },

  // 获取按钮文字
  getButtonTexts(type, content) {
    switch (type) {
      case 'privacy':
        return [content.rejectButton, content.agreeButton]
      case 'benefit':
        return [content.loginButton, content.skipButton]
      case 'phone':
        return [content.allowButton, content.rejectButton, content.otherPhoneButton]
      default:
        return []
    }
  },

  // 隐私弹窗事件处理
  onPrivacyAgree() {
    console.log('用户同意隐私政策')
    this.setData({ showPrivacyPopup: false })
    wx.showToast({ title: '已同意隐私政策', icon: 'success' })
  },

  onPrivacyReject() {
    console.log('用户拒绝隐私政策')
    this.setData({ showPrivacyPopup: false })
    wx.showToast({ title: '已拒绝隐私政策', icon: 'error' })
  },

  // 福利弹窗事件处理
  onBenefitLogin() {
    console.log('用户点击福利登录')
    this.setData({ showBenefitPopup: false })
    wx.showToast({ title: '跳转到登录流程', icon: 'success' })
  },

  onBenefitSkip() {
    console.log('用户跳过福利')
    this.setData({ showBenefitPopup: false })
    wx.showToast({ title: '已跳过福利', icon: 'none' })
  },

  // 手机号弹窗事件处理
  onPhoneAllow() {
    console.log('用户允许获取手机号')
    this.setData({ showPhonePopup: false })
    wx.showToast({ title: '已允许获取手机号', icon: 'success' })
  },

  onPhoneReject() {
    console.log('用户拒绝获取手机号')
    this.setData({ showPhonePopup: false })
    wx.showToast({ title: '已拒绝获取手机号', icon: 'error' })
  },

  onUseOtherPhone() {
    console.log('用户选择使用其他手机号')
    wx.showToast({ title: '跳转到其他手机号输入', icon: 'success' })
  }
}) 