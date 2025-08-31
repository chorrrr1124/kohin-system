// 弹窗测试页面
Page({
  data: {
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

  // 页面显示时检查弹窗状态
  onShow() {
    // 检查是否有弹窗显示
    const hasPopup = false // No longer checking for popups
    
    if (hasPopup) {
      console.log('页面显示，当前弹窗状态:', {
        // Removed popup status as they are removed
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
    // Removed popup state cleanup
  }
}) 