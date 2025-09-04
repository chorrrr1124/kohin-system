// pages/debug/debug.js
const app = getApp()

// 确保页面不被"过滤无依赖文件"移除
if (typeof __route__ !== 'undefined') {
  console.log('Debug页面路由:', __route__);
}

// 强制输出，确保页面被识别
console.log('Debug页面JS文件已加载');

Page({
  data: {
    systemInfo: {},
    logs: [],
    pageRoute: '',
    testResult: ''
  },

  onLoad() {
    console.log('Debug页面加载');
    console.log('Debug页面路径:', this.route);
    console.log('Debug页面参数:', this.options);
    
    // 设置页面路径 - 使用正确的方式获取
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const pageRoute = currentPage ? currentPage.route : '未知';
    
    this.setData({
      pageRoute: pageRoute
    });
    
    // 强制输出到控制台
    wx.showToast({
      title: 'Debug页面加载成功',
      icon: 'success',
      duration: 2000
    });
    
    this.getSystemInfo();
    this.addLog('info', 'Debug页面加载成功');
  },

  onShow() {
    console.log('Debug页面显示');
  },

  // 获取系统信息
  getSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({
        systemInfo: systemInfo
      });
      this.addLog('info', '系统信息获取成功');
    } catch (error) {
      this.addLog('error', '获取系统信息失败: ' + error.message);
    }
  },

  // 测试基础功能
  testBasicFunction() {
    this.addLog('info', '开始测试基础功能...');
    
    try {
      // 测试基本API
      const systemInfo = wx.getSystemInfoSync();
      const storage = wx.getStorageSync('testKey');
      
      this.setData({
        testResult: '基础功能测试通过！系统信息获取成功，存储功能正常。'
      });
      
      this.addLog('success', '基础功能测试通过');
      wx.showToast({
        title: '基础功能测试通过',
        icon: 'success'
      });
    } catch (error) {
      this.setData({
        testResult: '基础功能测试失败: ' + error.message
      });
      this.addLog('error', '基础功能测试失败: ' + error.message);
      wx.showToast({
        title: '基础功能测试失败',
        icon: 'error'
      });
    }
  },

  // 添加日志
  addLog(level, message) {
    const now = new Date();
    const time = now.toLocaleTimeString();
    const log = {
      time: time,
      level: level.toUpperCase(),
      message: message
    };
    
    this.setData({
      logs: [log, ...this.data.logs].slice(0, 50) // 最多保留50条日志
    });
    
    console.log(`[${level.toUpperCase()}] ${message}`);
  },

  // 清空日志
  clearLogs() {
    this.setData({
      logs: []
    });
    this.addLog('info', '日志已清空');
  }
}) 