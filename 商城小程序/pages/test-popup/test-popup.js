// 弹窗测试页面
Page({
  data: {
    // 弹窗显示状态
    showPrivacyPopup: false,
    showBenefitPopup: false,

    
    // 手机号掩码
    maskedPhone: '138****8888',
    
    // 设备信息
    deviceInfo: {},
    isRealDevice: false,
    
    // 测试结果
    testResults: []
  },

  onLoad() {
    // 获取设备信息
    this.getDeviceInfo()
  },

  // 获取设备信息
  getDeviceInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      
    this.setData({
        deviceInfo: systemInfo,
        isRealDevice: systemInfo.platform !== 'devtools'
    })
      
      console.log('测试页面设备信息:', systemInfo)
    } catch (error) {
      console.error('获取设备信息失败:', error)
    }
  },

  // 测试隐私政策弹窗滚动
  testPrivacyPopup() {
    this.setData({
      showPrivacyPopup: true,
      showBenefitPopup: false,
      showPhonePopup: false
    })
    
    // 记录测试
    this.recordTest('隐私政策弹窗', '显示弹窗')
    
    console.log('测试隐私政策弹窗滚动')
  },

  // 测试注册福利弹窗滚动
  testBenefitPopup() {
    this.setData({
      showPrivacyPopup: false,
      showBenefitPopup: true,
      showPhonePopup: false
    })
    
    // 记录测试
    this.recordTest('注册福利弹窗', '显示弹窗')
    
    console.log('测试注册福利弹窗滚动')
  },

  // 测试手机号授权弹窗滚动


  // 记录测试结果
  recordTest(type, action, success = true, detail = '') {
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    
    const testResult = {
      time,
      type,
      action,
      success,
      detail: detail || (success ? '操作成功' : '操作失败')
    }
    
    this.setData({
      testResults: [testResult, ...this.data.testResults].slice(0, 10) // 保留最近10条
    })
  },

  // ===== 弹窗事件处理 =====

  // 隐私政策同意
  onPrivacyAgree() {
    console.log('用户同意隐私政策')
    this.recordTest('隐私政策弹窗', '同意', true, '用户点击同意按钮')
    
    // 延迟显示下一个弹窗
    setTimeout(() => {
      this.testBenefitPopup()
    }, 500)
  },

  // 隐私政策拒绝
  onPrivacyReject() {
    console.log('用户拒绝隐私政策')
    this.recordTest('隐私政策弹窗', '拒绝', true, '用户点击拒绝按钮')
    
    // 关闭弹窗
    this.setData({
      showPrivacyPopup: false
    })
  },

  // 注册福利登录
  onBenefitLogin() {
    console.log('用户点击注册福利登录')
    this.recordTest('注册福利弹窗', '登录', true, '用户点击登录按钮')
    
    // 直接获取手机号，无需显示手机号授权弹窗
    console.log('直接获取手机号，跳过手机号授权弹窗')
  },

  // 注册福利跳过
  onBenefitSkip() {
    console.log('用户跳过注册福利')
    this.recordTest('注册福利弹窗', '跳过', true, '用户点击跳过按钮')
    
    // 关闭弹窗
    this.setData({
      showBenefitPopup: false
    })
  },


  onUseOtherPhone() {
    console.log('用户选择使用其他手机号')
    this.recordTest('手机号授权弹窗', '其他号码', true, '用户选择使用其他手机号')
    

  },

  // 流程完成
  onFlowComplete() {
    console.log('弹窗流程完成')
    this.recordTest('弹窗系统', '流程完成', true, '所有弹窗流程已完成')
  },

  // 页面显示时检查弹窗状态
  onShow() {
    // 检查是否有弹窗显示
    const hasPopup = this.data.showPrivacyPopup || this.data.showBenefitPopup
    
    if (hasPopup) {
      console.log('页面显示，当前弹窗状态:', {
        privacy: this.data.showPrivacyPopup,
        benefit: this.data.showBenefitPopup,

      })
    }
  },

  // 页面隐藏时记录
  onHide() {
    console.log('测试页面隐藏')
  },

  // 页面卸载时清理
  onUnload() {
    console.log('测试页面卸载')
    
    // 清理弹窗状态
    this.setData({
      showPrivacyPopup: false,
      showBenefitPopup: false
    })
  }
}) 