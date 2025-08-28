// pages/debug/debug.js
Page({
  data: {
    userInfo: null,
    testResult: null,
    testCollection: 'products',
    testWhere: '{}',
    envId: '',
    version: '',
    systemInfo: {},
    logs: []
  },

  onLoad() {
    this.getSystemInfo()
    this.getEnvInfo()
    this.addLog('页面加载完成')
  },

  onShow() {
    this.checkLoginStatus()
  },

  // 获取系统信息
  getSystemInfo() {
    const systemInfo = wx.getSystemInfoSync()
    this.setData({ systemInfo })
  },

  // 获取环境信息
  getEnvInfo() {
    const envId = wx.cloud.DYNAMIC_CURRENT_ENV || '未配置'
    this.setData({ envId })
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
      this.addLog('检测到已登录用户')
    } else {
      this.addLog('用户未登录')
    }
  },

  // 测试登录
  testLogin() {
    this.addLog('开始测试登录...')
    
    wx.cloud.callFunction({
      name: 'login',
      success: (res) => {
        this.addLog('登录成功: ' + JSON.stringify(res.result))
        this.setData({ userInfo: res.result })
      },
      fail: (err) => {
        this.addLog('登录失败: ' + err.errMsg)
      }
    })
  },

  // 测试数据访问（通过云函数）
  testGetData() {
    this.addLog('开始测试数据访问...')
    
    wx.cloud.callFunction({
      name: 'getData',
      data: {
        collection: 'products',
        action: 'get',
        limit: 5
      },
      success: (res) => {
        this.addLog('数据访问成功')
        this.setData({ testResult: res.result })
      },
      fail: (err) => {
        this.addLog('数据访问失败: ' + err.errMsg)
        this.setData({ 
          testResult: { 
            success: false, 
            error: err.errMsg 
          } 
        })
      }
    })
  },

  // 测试创建数据
  testCreateData() {
    this.addLog('开始测试创建数据...')
    
    const testData = {
      name: '测试商品_' + Date.now(),
      price: Math.floor(Math.random() * 100) + 1,
      description: '这是一个测试商品',
      category: 'test'
    }
    
    wx.cloud.callFunction({
      name: 'getData',
        data: {
        collection: 'testProducts',
        action: 'add',
        data: testData
      },
      success: (res) => {
        this.addLog('数据创建成功: ' + JSON.stringify(res.result))
        this.setData({ testResult: res.result })
      },
      fail: (err) => {
        this.addLog('数据创建失败: ' + err.errMsg)
        this.setData({ 
          testResult: { 
            success: false, 
            error: err.errMsg 
          } 
        })
      }
    })
  },

  // 测试直接数据库访问（可能被免费版本限制）
  testDatabaseDirect() {
    this.addLog('开始测试直接数据库访问...')
    
    try {
      const db = wx.cloud.database()
      db.collection('products').limit(5).get({
        success: (res) => {
          this.addLog('直接数据库访问成功')
          this.setData({ 
            testResult: { 
              success: true, 
              data: res.data 
            } 
          })
        },
        fail: (err) => {
          this.addLog('直接数据库访问失败: ' + err.errMsg)
          this.setData({ 
            testResult: { 
              success: false, 
              error: err.errMsg 
            } 
          })
        }
      })
    } catch (error) {
      this.addLog('直接数据库访问异常: ' + error.message)
      this.setData({ 
        testResult: { 
          success: false, 
          error: error.message 
        } 
      })
    }
  },

  // 自定义查询
  testCustomQuery() {
    this.addLog('开始自定义查询...')
    
    let where = {}
    try {
      if (this.data.testWhere && this.data.testWhere !== '{}') {
        where = JSON.parse(this.data.testWhere)
      }
    } catch (error) {
      this.addLog('查询条件格式错误: ' + error.message)
      return
    }
    
    wx.cloud.callFunction({
      name: 'getData',
      data: {
        collection: this.data.testCollection,
        action: 'get',
        where: where,
        limit: 10
      },
      success: (res) => {
        this.addLog('自定义查询成功')
        this.setData({ testResult: res.result })
      },
      fail: (err) => {
        this.addLog('自定义查询失败: ' + err.errMsg)
        this.setData({ 
          testResult: { 
            success: false, 
            error: err.errMsg 
          } 
        })
      }
    })
  },

  // 初始化数据库
  initDatabase() {
    this.addLog('开始初始化数据库...')
    
    wx.showModal({
      title: '确认操作',
      content: '这将创建所有必要的数据库集合，确定要继续吗？',
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'initDatabase',
            success: (res) => {
              this.addLog('数据库初始化成功: ' + JSON.stringify(res.result))
              wx.showToast({
                title: '数据库初始化成功',
                icon: 'success'
              })
              this.setData({ testResult: res.result })
            },
            fail: (err) => {
              this.addLog('数据库初始化失败: ' + err.errMsg)
              wx.showToast({
                title: '初始化失败',
                icon: 'error'
              })
              this.setData({ 
                testResult: { 
                  success: false, 
                  error: err.errMsg 
                } 
              })
            }
          })
        }
      }
    })
  },

  // 检查集合状态
  checkCollections() {
    this.addLog('开始检查集合状态...')
    
    const collections = ['coupons', 'mall_coupons', 'user_coupons', 'users', 'orders', 'products', 'categories']
    const results = {}
    let completed = 0
    
    collections.forEach(collection => {
      wx.cloud.callFunction({
        name: 'getData',
        data: {
          collection: collection,
          action: 'count'
        },
        success: (res) => {
          results[collection] = {
            exists: res.result.success,
            count: res.result.total || 0,
            error: res.result.error || null
          }
        },
        fail: (err) => {
          results[collection] = {
            exists: false,
            count: 0,
            error: err.errMsg
          }
        },
        complete: () => {
          completed++
          if (completed === collections.length) {
            this.addLog('集合状态检查完成')
            this.setData({ 
              testResult: { 
                success: true, 
                data: results 
              } 
            })
          }
        }
      })
    })
  },

  // 输入事件处理
  onCollectionInput(e) {
    this.setData({ testCollection: e.detail.value })
  },

  onWhereInput(e) {
    this.setData({ testWhere: e.detail.value })
  },

  // 添加日志
  addLog(message) {
    const logs = this.data.logs
    const time = new Date().toLocaleTimeString()
    logs.unshift({ time, message })
    
    // 限制日志数量
    if (logs.length > 20) {
      logs.splice(20)
    }
    
    this.setData({ logs })
  },

  // 清空日志
  clearLogs() {
    this.setData({ logs: [] })
    this.addLog('日志已清空')
  }
})