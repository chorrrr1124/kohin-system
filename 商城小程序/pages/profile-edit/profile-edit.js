// pages/profile-edit/profile-edit.js
Page({
  data: {
    form: {
      name: '',
      gender: '男',
      birthday: '',
      address: ''
    },
    avatarUrl: '/images/placeholder.png',
    maskedPhone: '',
    region: ['广东省','佛山市','禅城区'],
    regionText: '广东省佛山市禅城区',
    birthdayText: '完善生日，不错过惊喜'
  },

  onLoad() {
    console.log('个人资料编辑页面加载')
    this.initFromUserInfo()
  },

  async initFromUserInfo() {
    try {
      wx.showLoading({ title: '加载中...' })
      
      const app = getApp()
      const userInfo = wx.getStorageSync('userInfo') || app?.globalData?.userInfo || {}
      const phone = userInfo?.phone || userInfo?.mobile || ''
      const masked = phone ? (phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')) : '未绑定'
      
      const cachedRegion = wx.getStorageSync('region')
      const regionArr = Array.isArray(cachedRegion) && cachedRegion.length === 3 ? cachedRegion : this.data.region

      this.setData({
        maskedPhone: masked,
        'form.name': userInfo?.nickName || '',
        'form.gender': userInfo?.gender === 2 ? '女' : '男',
        avatarUrl: userInfo?.avatarUrl || this.data.avatarUrl,
        birthdayText: userInfo?.birthday || '完善生日，不错过惊喜',
        region: regionArr,
        regionText: regionArr.join(' '),
        'form.address': regionArr.join(' ')
      })
      
      wx.hideLoading()

      // 若无缓存地区，尝试引导导入微信收货地址
      if (!Array.isArray(cachedRegion) || cachedRegion.length !== 3) {
        setTimeout(() => {
          wx.showModal({
            title: '导入地址',
            content: '是否从微信收货地址导入省市区？',
            confirmText: '导入',
            success: (res) => {
              if (res.confirm) this.onImportFromWeixin()
            }
          })
        }, 200)
      }
    } catch (e) {
      wx.hideLoading()
      console.error('获取用户资料失败:', e)
    }
  },

  onNameInput(e) {
    this.setData({ 'form.name': e.detail.value })
  },

  onGenderTap(e) {
    const value = e.currentTarget.dataset.value
    this.setData({ 'form.gender': value })
  },

  onBirthdayChange(e) {
    const val = e.detail.value
    this.setData({ 'form.birthday': val, birthdayText: val })
  },

  onChangeAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: () => {
        wx.showToast({ title: '头像已更新', icon: 'success' })
      }
    })
  },

  onChangePhone() {
    wx.navigateTo({ url: '/pages/phone-input/phone-input' })
  },

  onRegionChange(e) {
    const region = e.detail.value
    this.setData({
      region,
      regionText: region.join(' '),
      'form.address': region.join(' ')
    })
    wx.setStorageSync('region', region)
  },

  // 新增：从微信收货地址导入省市区
  async onImportFromWeixin() {
    try {
      // 直接调用会触发授权弹窗
      const addr = await new Promise((resolve, reject) => {
        wx.chooseAddress({
          success: resolve,
          fail: reject
        })
      })

      const { provinceName, cityName, countyName } = addr || {}
      if (provinceName && cityName && countyName) {
        const region = [provinceName, cityName, countyName]
        this.setData({
          region,
          regionText: region.join(' '),
          'form.address': region.join(' ')
        })
        wx.setStorageSync('region', region)
        wx.showToast({ title: '已导入', icon: 'success' })
      } else {
        wx.showToast({ title: '导入失败', icon: 'none' })
      }
    } catch (err) {
      // 用户拒绝或无收货地址
      wx.showToast({ title: '未完成导入', icon: 'none' })
    }
  },

  async onSave() {
    try {
      wx.showLoading({ title: '保存中...' })
      
      const app = getApp()
      const userInfo = wx.getStorageSync('userInfo') || app?.globalData?.userInfo || {}
      const updatedUserInfo = { ...userInfo, ...this.data.form }
      wx.setStorageSync('userInfo', updatedUserInfo)
      
      if (app?.globalData?.userInfo) {
        app.globalData.userInfo = updatedUserInfo
      }
      
      wx.hideLoading()
      wx.showToast({ title: '已保存', icon: 'success' })
      
      setTimeout(() => wx.navigateBack({ delta: 1 }), 600)
    } catch (e) {
      wx.hideLoading()
      console.error('保存用户资料失败:', e)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  }
}) 