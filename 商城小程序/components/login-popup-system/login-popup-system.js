Component({
  properties: {
    // 控制各个弹窗的显示状态
    showPrivacyPopup: {
      type: Boolean,
      value: false
    },
    showBenefitPopup: {
      type: Boolean,
      value: false
    },
    showPhonePopup: {
      type: Boolean,
      value: false
    },
    // 手机号掩码显示
    maskedPhone: {
      type: String,
      value: ''
    }
  },

  data: {
    // 弹窗显示状态
    privacyVisible: false,
    benefitVisible: false,
    phoneVisible: false,
    
    // 弹窗类型
    popupType: '',
    
    // 弹窗内容 - 添加默认值
    popupContent: {
      brand: {
        name: '丘大叔柠檬茶',
        logo: '/images/general/148L.png'
      },
      privacy: {
        title: '温馨提示',
        greeting: '亲爱的用户，欢迎使用丘大叔柠檬茶小程序',
        agreementIntro: '我们依据相关法律法规制定了《丘大叔柠檬茶用户协议》和《丘大叔柠檬茶隐私协议》，请您在使用我们的产品前仔细阅读并充分理解相关条款，以了解您的权利。',
        necessaryInfo: '根据《常见类型移动互联网应用程序必要个人信息范围规定》，丘大叔柠檬茶小程序属于网上购物类，基本功能为"购买商品"，必要个人信息包括：注册用户移动电话号码；收货人姓名(名称)、地址、联系电话；支付时间、支付金额、支付渠道等支付信息。',
        minimalPrinciple: '我们严格遵循最小必要原则，在法律规定的必要信息范围内及与实现业务相关联的个人信息范围内处理个人信息。您可以通过《丘大叔柠檬茶用户隐私政策》了解我们处理您个人信息的情况，以及您所享有的相关权利。如您是未成年人，请您和您的监护人仔细阅读本政策，并在征得您的监护人授权同意的前提下使用我们的服务或向我们提供个人信息。',
        agreementScope: '您同意《丘大叔柠檬茶用户隐私政策》仅代表您已了解应用提供的功能，以及功能运行所需的必要个人信息，并不代表您已同意我们可以收集非必要个人信息，非必要个人信息会根据您的明确同意进行收集。',
        rejectButton: '拒绝',
        agreeButton: '同意'
      },
      benefit: {
        title: '注册福利',
        titlePrefix: '[新会员]',
        subTitle: '全新升级',
        newBadge: 'NEW',
        greeting: '欢迎加入丘大叔柠檬茶',
        benefitIntro: '新会员专享福利',
        benefitDetails: '21元优惠券包',
        benefitDescription: '包含多种优惠券，让您享受更多优惠',
        privacyNote: '我已阅读并同意《用户协议》和《隐私政策》',
        privacyDetail: '允许我们在必要场景下,合理使用您的个人信息,且阅读并同意《隐私条款》、《会员协议》等内容',
        loginButton: '手机号一键登录',
        skipButton: '暂时跳过'
      },
      phone: {
        title: '获取手机号',
        greeting: '申请获取并验证手机号',
        description: '为了提供更好的服务，我们需要获取您的手机号',
        currentPhone: '当前微信绑定号码',
        infoIcon: 'i',
        allowButton: '允许',
        rejectButton: '不允许',
        otherPhoneButton: '使用其它号码'
      }
    },
    
    // 用户信息
    userInfo: null,
    hasUserInfo: false,
    
    // 手机号授权状态
    phoneAuthorized: false,
    
    // 隐私政策同意状态
    privacyAgreed: false,
    
    // 注册福利领取状态
    benefitClaimed: false,
    
    // 系统信息
    systemInfo: null,
    isRealDevice: false
  },

  lifetimes: {
    // 组件实例被创建时执行
    created() {
      console.log('弹窗组件创建，开始初始化...')
      // 检测是否为真机环境
      this.detectDevice()
      // 确保弹窗内容数据完整
      this.ensurePopupContent()
      // 获取弹窗内容
      this.getPopupContent()
      // 同步弹窗显示状态
      this.syncPopupVisibility()
    },
    
    // 组件实例被挂载到页面时执行
    attached() {
      console.log('弹窗组件挂载完成，当前数据:', this.data)
      // 再次同步弹窗显示状态
      this.syncPopupVisibility()
    }
  },

  methods: {
    // 同步弹窗显示状态
    syncPopupVisibility() {
      console.log('=== 同步弹窗显示状态 ===')
      console.log('外部属性状态:', {
        showPrivacyPopup: this.properties.showPrivacyPopup,
        showBenefitPopup: this.properties.showBenefitPopup,
        showPhonePopup: this.properties.showPhonePopup
      })
      console.log('当前内部状态:', {
        privacyVisible: this.data.privacyVisible,
        benefitVisible: this.data.benefitVisible,
        phoneVisible: this.data.phoneVisible
      })
      
      // 同步状态
      this.setData({
        privacyVisible: this.properties.showPrivacyPopup,
        benefitVisible: this.properties.showBenefitPopup,
        phoneVisible: this.properties.showPhonePopup
      })
      
      console.log('同步后的内部状态:', {
        privacyVisible: this.data.privacyVisible,
        benefitVisible: this.data.benefitVisible,
        phoneVisible: this.data.phoneVisible
      })
      
      // 检查弹窗内容
      console.log('弹窗内容状态:')
      console.log('- privacy:', this.data.popupContent?.privacy)
      console.log('- benefit:', this.data.popupContent?.benefit)
      console.log('- phone:', this.data.popupContent?.phone)
      
      // 检查弹窗是否应该显示
      const shouldShow = this.data.privacyVisible || this.data.benefitVisible || this.data.phoneVisible
      console.log('弹窗是否应该显示:', shouldShow)
      
      if (shouldShow) {
        console.log('✅ 弹窗应该显示')
        // 强制触发一次渲染
        this.setData({
          forceUpdate: Date.now()
        })
      } else {
        console.log('❌ 弹窗不应该显示')
      }
      
      console.log('=== 同步完成 ===')
    },

    // 检测设备类型
    detectDevice() {
      try {
        const systemInfo = wx.getSystemInfoSync()
        this.setData({
          isRealDevice: systemInfo.platform !== 'devtools',
          systemInfo: systemInfo
        })
      } catch (error) {
        console.error('设备检测失败:', error)
      }
    },

    // 获取弹窗内容
    async getPopupContent() {
      console.log('开始获取弹窗内容...')
      console.log('当前默认弹窗内容:', this.data.popupContent)
      
      // 调试模式：强制使用默认数据
      const forceUseDefault = false // 设置为true可以强制使用默认数据
      
      if (forceUseDefault) {
        console.log('调试模式：强制使用默认弹窗内容')
        return
      }
      
      try {
        wx.showLoading({
          title: '加载中...'
        })
        
        const result = await wx.cloud.callFunction({
          name: 'getPopupContent'
        })
        
        console.log('云函数返回结果:', result)
        
        if (result.result && result.result.success) {
          // 合并数据，确保关键字段不丢失
          const newContent = {
            ...this.data.popupContent,  // 保留默认值
            ...result.result.data        // 覆盖云函数返回的数据
          }
          
          console.log('合并后的弹窗内容:', newContent)
          console.log('按钮文字检查:')
          console.log('- 拒绝按钮:', newContent.privacy?.rejectButton)
          console.log('- 同意按钮:', newContent.privacy?.agreeButton)
          console.log('- 登录按钮:', newContent.benefit?.loginButton)
          console.log('- 跳过按钮:', newContent.benefit?.skipButton)
          console.log('- 允许按钮:', newContent.benefit?.allowButton)
          console.log('- 不允许按钮:', newContent.phone?.rejectButton)
          
          this.setData({
            popupContent: newContent
          })
          console.log('弹窗内容更新成功')
        } else {
          console.error('获取弹窗内容失败:', result.result?.message || '未知错误')
          // 保持默认内容，不显示错误提示
          console.log('使用默认弹窗内容:', this.data.popupContent)
        }
      } catch (error) {
        console.error('调用云函数失败:', error)
        // 保持默认内容，不显示错误提示
        console.log('云函数调用失败，使用默认弹窗内容:', this.data.popupContent)
      } finally {
        wx.hideLoading()
      }
    },

    // 触摸事件阻止方法
    preventTouchMove(e) {
      console.log('阻止触摸移动事件: touchmove', e)
      e.preventDefault()
      e.stopPropagation()
      return false
    },

    preventTouchStart(e) {
      console.log('阻止触摸开始事件: touchstart', e)
      // 检查触摸目标，如果是按钮则不阻止
      const target = e.target
      if (target && (target.dataset.test || target.className.includes('popup-btn'))) {
        console.log('触摸目标是按钮，允许触摸事件')
        return true
      }
      e.preventDefault()
      e.stopPropagation()
      return false
    },

    preventTouchEnd(e) {
      console.log('阻止触摸结束事件: touchend', e)
      // 检查触摸目标，如果是按钮则不阻止
      const target = e.target
      if (target && (target.dataset.test || target.className.includes('popup-btn'))) {
        console.log('触摸目标是按钮，允许触摸事件')
        return true
      }
      e.preventDefault()
      e.stopPropagation()
      return false
    },

    preventTap(e) {
      console.log('阻止点击事件: tap', e)
      // 检查点击目标，如果是按钮则不阻止
      const target = e.target
      if (target && (target.dataset.test || target.className.includes('popup-btn'))) {
        console.log('点击目标是按钮，允许点击事件')
        return true
      }
      e.preventDefault()
      e.stopPropagation()
      return false
    },

    preventLongPress(e) {
      console.log('阻止长按事件: longpress', e)
      e.preventDefault()
      e.stopPropagation()
      return false
    },

    // 阻止所有触摸相关事件
    preventAllTouchEvents(e) {
      console.log('阻止所有触摸事件:', e.type)
      e.stopPropagation()
      e.preventDefault()
      return false
    },

    // 滚动事件
    onScroll(e) {
      // 滚动事件处理
    },

    onScrollToLower(e) {
      // 滚动到底部处理
    },

    onScrollToUpper(e) {
      // 滚动到顶部处理
    },

    // ===== 隐私政策弹窗事件 =====
    
    // 隐私协议复选框变化
    onPrivacyCheckboxChange(e) {
      const values = e.detail.value;
      this.setData({
        privacyAgreed: values.includes('agreed')
      });
    },

    // ===== 弹窗操作事件 =====
    
    // 隐私政策弹窗按钮事件
    handlePrivacyReject() {
      console.log('用户拒绝隐私政策')
      this.setData({
        privacyVisible: false
      })
      // 可以在这里添加拒绝后的逻辑
      wx.showToast({
        title: '您已拒绝隐私政策',
        icon: 'none'
      })
    },

    handlePrivacyAgree() {
      console.log('用户同意隐私政策')
      this.setData({
        privacyVisible: false,
        benefitVisible: true
      })
      // 显示福利弹窗
      wx.showToast({
        title: '感谢您的同意！',
        icon: 'success'
      })
    },

    // 福利弹窗按钮事件
    handleBenefitClose() {
      console.log('用户关闭福利弹窗')
      this.setData({
        benefitVisible: false
      })
    },

    handleBenefitConfirm() {
      console.log('用户确认福利')
      this.setData({
        benefitVisible: false,
        phoneVisible: true
      })
      // 显示手机号弹窗
      wx.showToast({
        title: '请绑定手机号',
        icon: 'none'
      })
    },

    // 手机号弹窗按钮事件
    handlePhoneClose() {
      console.log('用户关闭手机号弹窗')
      this.setData({
        phoneVisible: false
      })
    },

    handlePhoneCancel() {
      console.log('用户取消手机号绑定')
      this.setData({
        phoneVisible: false
      })
    },

    handlePhoneConfirm() {
      console.log('用户确认手机号绑定')
      // 这里可以添加手机号验证逻辑
      this.setData({
        phoneVisible: false
      })
      wx.showToast({
        title: '手机号绑定成功！',
        icon: 'success'
      })
    },

    // 完成弹窗流程
    completePopupFlow() {
      console.log('完成所有弹窗流程')
      // 可以在这里添加完成后的逻辑
      // 比如跳转页面、显示成功提示等
    },

    // 刷新弹窗内容
    refreshPopupContent() {
      this.getPopupContent();
    },

    // 显示弹窗时阻止页面触摸事件
    showPopup(type) {
      console.log('显示弹窗:', type)
      
      // 阻止页面触摸事件
      this.preventPageTouch()
      
      switch (type) {
        case 'privacy':
          this.setData({
            privacyVisible: true,
            benefitVisible: false,
            phoneVisible: false
          })
          break
        case 'benefit':
          this.setData({
            privacyVisible: false,
            benefitVisible: true,
            phoneVisible: false
          })
          break
        case 'phone':
          this.setData({
            privacyVisible: false,
            benefitVisible: false,
            phoneVisible: true
          })
          break
      }
      
      // 更新弹窗状态
      this.updatePopupStatus()
    },

    // 隐藏弹窗时恢复页面触摸事件
    hidePopup(type) {
      console.log('隐藏弹窗:', type)
      
      // 恢复页面触摸事件
      this.restorePageTouch()
      
      switch (type) {
        case 'privacy':
          this.setData({ privacyVisible: false })
          break
        case 'benefit':
          this.setData({ benefitVisible: false })
          break
        case 'phone':
          this.setData({ phoneVisible: false })
          break
      }
      
      // 更新弹窗状态
      this.updatePopupStatus()
    },

    // 阻止页面触摸事件
    preventPageTouch() {
      // 获取当前页面实例
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      
      if (currentPage && currentPage.setData) {
        // 设置页面样式阻止触摸
        currentPage.setData({
          pageStyle: 'touch-action: none !important; overflow: hidden !important;'
        })
      }
    },

    // 恢复页面触摸事件
    restorePageTouch() {
      // 获取当前页面实例
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      
      if (currentPage && currentPage.setData) {
        // 恢复页面触摸
        currentPage.setData({
          pageStyle: ''
        })
      }
    },

    // 测试弹窗内容显示
    testPopupContent() {
      console.log('=== 弹窗内容测试 ===')
      console.log('popupContent:', this.data.popupContent)
      console.log('privacy:', this.data.popupContent?.privacy)
      console.log('benefit:', this.data.popupContent?.benefit)
      console.log('phone:', this.data.popupContent?.phone)
      console.log('brand:', this.data.popupContent?.brand)
      
      // 检查关键字段是否存在
      if (this.data.popupContent?.privacy?.rejectButton) {
        console.log('✅ 拒绝按钮文本:', this.data.popupContent.privacy.rejectButton)
      } else {
        console.log('❌ 拒绝按钮文本缺失')
      }
      
      if (this.data.popupContent?.privacy?.agreeButton) {
        console.log('✅ 同意按钮文本:', this.data.popupContent.privacy.agreeButton)
      } else {
        console.log('❌ 同意按钮文本缺失')
      }
    },

    // 确保弹窗内容数据完整
    ensurePopupContent() {
      // 检查并填充缺失的弹窗内容
      if (!this.data.popupContent.privacy) {
        this.data.popupContent.privacy = {
          title: '温馨提示',
          greeting: '亲爱的用户，欢迎使用丘大叔柠檬茶小程序',
          agreementIntro: '我们依据相关法律法规制定了《丘大叔柠檬茶用户协议》和《丘大叔柠檬茶隐私协议》，请您在使用我们的产品前仔细阅读并充分理解相关条款，以了解您的权利。',
          necessaryInfo: '根据《常见类型移动互联网应用程序必要个人信息范围规定》，丘大叔柠檬茶小程序属于网上购物类，基本功能为"购买商品"，必要个人信息包括：注册用户移动电话号码；收货人姓名(名称)、地址、联系电话；支付时间、支付金额、支付渠道等支付信息。',
          minimalPrinciple: '我们严格遵循最小必要原则，在法律规定的必要信息范围内及与实现业务相关联的个人信息范围内处理个人信息。您可以通过《丘大叔柠檬茶用户隐私政策》了解我们处理您个人信息的情况，以及您所享有的相关权利。如您是未成年人，请您和您的监护人仔细阅读本政策，并在征得您的监护人授权同意的前提下使用我们的服务或向我们提供个人信息。',
          agreementScope: '您同意《丘大叔柠檬茶用户隐私政策》仅代表您已了解应用提供的功能，以及功能运行所需的必要个人信息，并不代表您已同意我们可以收集非必要个人信息，非必要个人信息会根据您的明确同意进行收集。',
          rejectButton: '拒绝',
          agreeButton: '同意'
        };
      }
      if (!this.data.popupContent.benefit) {
        this.data.popupContent.benefit = {
          title: '注册福利',
          titlePrefix: '[新会员]',
          subTitle: '全新升级',
          newBadge: 'NEW',
          greeting: '欢迎加入丘大叔柠檬茶',
          benefitIntro: '新会员专享福利',
          benefitDetails: '21元优惠券包',
          benefitDescription: '包含多种优惠券，让您享受更多优惠',
          privacyNote: '我已阅读并同意《用户协议》和《隐私政策》',
          privacyDetail: '允许我们在必要场景下,合理使用您的个人信息,且阅读并同意《隐私条款》、《会员协议》等内容',
          loginButton: '手机号一键登录',
          skipButton: '暂时跳过'
        };
      }
      if (!this.data.popupContent.phone) {
        this.data.popupContent.phone = {
          title: '获取手机号',
          greeting: '申请获取并验证手机号',
          description: '为了提供更好的服务，我们需要获取您的手机号',
          currentPhone: '当前微信绑定号码',
          infoIcon: 'i',
          allowButton: '允许',
          rejectButton: '不允许',
          otherPhoneButton: '使用其它号码'
        };
      }
      if (!this.data.popupContent.brand) {
        this.data.popupContent.brand = {
          name: '丘大叔柠檬茶',
          logo: '/images/general/148L.png'
        };
      }
    },

    // 显示隐私弹窗
    showPrivacyPopup() {
      console.log('显示隐私弹窗')
      
      // 确保弹窗内容数据完整
      this.ensurePopupContent()
      
      // 强制设置弹窗内容
      const privacyContent = {
        title: '温馨提示',
        greeting: '亲爱的用户，欢迎使用丘大叔柠檬茶小程序',
        agreementIntro: '我们依据相关法律法规制定了《丘大叔柠檬茶用户协议》和《丘大叔柠檬茶隐私协议》，请您在使用我们的产品前仔细阅读并充分理解相关条款，以了解您的权利。',
        necessaryInfo: '根据《常见类型移动互联网应用程序必要个人信息范围规定》，丘大叔柠檬茶小程序属于网上购物类，基本功能为"购买商品"，必要个人信息包括：注册用户移动电话号码；收货人姓名(名称)、地址、联系电话；支付时间、支付金额、支付渠道等支付信息。',
        minimalPrinciple: '我们严格遵循最小必要原则，在法律规定的必要信息范围内及与实现业务相关联的个人信息范围内处理个人信息。您可以通过《丘大叔柠檬茶用户隐私政策》了解我们处理您个人信息的情况，以及您所享有的相关权利。如您是未成年人，请您和您的监护人仔细阅读本政策，并在征得您的监护人授权同意的前提下使用我们的服务或向我们提供个人信息。',
        agreementScope: '您同意《丘大叔柠檬茶用户隐私政策》仅代表您已了解应用提供的功能，以及功能运行所需的必要个人信息，并不代表您已同意我们可以收集非必要个人信息，非必要个人信息会根据您的明确同意进行收集。',
        rejectButton: '拒绝',
        agreeButton: '同意'
      }
      
      this.setData({
        showPrivacyPopup: true,
        'popupContent.privacy': privacyContent
      })
      
      console.log('隐私弹窗数据设置完成:', this.data.popupContent.privacy)
      console.log('按钮文字检查:', {
        rejectButton: this.data.popupContent.privacy.rejectButton,
        agreeButton: this.data.popupContent.privacy.agreeButton
      })
    },

    // 显示福利弹窗
    showBenefitPopup() {
      console.log('显示福利弹窗')
      
      // 确保弹窗内容数据完整
      this.ensurePopupContent()
      
      // 强制设置弹窗内容
      const benefitContent = {
        title: '注册福利',
        titlePrefix: '[新会员]',
        subTitle: '全新升级',
        newBadge: 'NEW',
        greeting: '欢迎加入丘大叔柠檬茶',
        benefitIntro: '新会员专享福利',
        benefitDetails: '21元优惠券包',
        benefitDescription: '包含多种优惠券，让您享受更多优惠',
        privacyNote: '我已阅读并同意《用户协议》和《隐私政策》',
        privacyDetail: '允许我们在必要场景下,合理使用您的个人信息,且阅读并同意《隐私条款》、《会员协议》等内容',
        loginButton: '手机号一键登录',
        skipButton: '暂时跳过'
      }
      
      this.setData({
        showBenefitPopup: true,
        'popupContent.benefit': benefitContent
      })
      
      console.log('福利弹窗数据设置完成:', this.data.popupContent.benefit)
      console.log('按钮文字检查:', {
        loginButton: this.data.popupContent.benefit.loginButton,
        skipButton: this.data.popupContent.benefit.skipButton
      })
    },

    // 显示手机号弹窗
    showPhonePopup() {
      console.log('显示手机号弹窗')
      
      // 确保弹窗内容数据完整
      this.ensurePopupContent()
      
      // 强制设置弹窗内容
      const phoneContent = {
        title: '获取手机号',
        greeting: '申请获取并验证手机号',
        description: '为了提供更好的服务，我们需要获取您的手机号',
        currentPhone: '当前微信绑定号码',
        infoIcon: 'i',
        allowButton: '允许',
        rejectButton: '不允许',
        otherPhoneButton: '使用其它号码'
      }
      
      this.setData({
        showPhonePopup: true,
        'popupContent.phone': phoneContent
      })
      
      console.log('手机号弹窗数据设置完成:', this.data.popupContent.phone)
      console.log('按钮文字检查:', {
        allowButton: this.data.popupContent.phone.allowButton,
        rejectButton: this.data.popupContent.phone.rejectButton,
        otherPhoneButton: this.data.popupContent.phone.otherPhoneButton
      })
    }
  },

  observers: {
    // 监听弹窗显示状态变化
    'showPrivacyPopup, showBenefitPopup, showPhonePopup': function(showPrivacyPopup, showBenefitPopup, showPhonePopup) {
      console.log('弹窗显示状态变化:', { showPrivacyPopup, showBenefitPopup, showPhonePopup })
      console.log('当前弹窗内容:', this.data.popupContent)
      
      // 同步弹窗显示状态
      this.setData({
        privacyVisible: showPrivacyPopup,
        benefitVisible: showBenefitPopup,
        phoneVisible: showPhonePopup
      })
      
      if (showPrivacyPopup || showBenefitPopup || showPhonePopup) {
        // 弹窗显示后的处理
        console.log('弹窗显示，开始处理...')
        
        // 确保弹窗内容数据完整
        this.ensurePopupContent()
        
        // 强制设置弹窗内容，确保按钮文字显示
        if (showPrivacyPopup) {
          console.log('强制设置隐私弹窗内容...')
          const privacyContent = {
            title: '温馨提示',
            greeting: '亲爱的用户，欢迎使用丘大叔柠檬茶小程序',
            agreementIntro: '我们依据相关法律法规制定了《丘大叔柠檬茶用户协议》和《丘大叔柠檬茶隐私协议》，请您在使用我们的产品前仔细阅读并充分理解相关条款，以了解您的权利。',
            necessaryInfo: '根据《常见类型移动互联网应用程序必要个人信息范围规定》，丘大叔柠檬茶小程序属于网上购物类，基本功能为"购买商品"，必要个人信息包括：注册用户移动电话号码；收货人姓名(名称)、地址、联系电话；支付时间、支付金额、支付渠道等支付信息。',
            minimalPrinciple: '我们严格遵循最小必要原则，在法律规定的必要信息范围内及与实现业务相关联的个人信息范围内处理个人信息。您可以通过《丘大叔柠檬茶用户隐私政策》了解我们处理您个人信息的情况，以及您所享有的相关权利。如您是未成年人，请您和您的监护人仔细阅读本政策，并在征得您的监护人授权同意的前提下使用我们的服务或向我们提供个人信息。',
            agreementScope: '您同意《丘大叔柠檬茶用户隐私政策》仅代表您已了解应用提供的功能，以及功能运行所需的必要个人信息，并不代表您已同意我们可以收集非必要个人信息，非必要个人信息会根据您的明确同意进行收集。',
            rejectButton: '拒绝',
            agreeButton: '同意'
          }
          
          this.setData({
            'popupContent.privacy': privacyContent
          })
          
          console.log('隐私弹窗按钮文字检查:')
          console.log('- 拒绝按钮:', this.data.popupContent?.privacy?.rejectButton)
          console.log('- 同意按钮:', this.data.popupContent?.privacy?.agreeButton)
        }
        
        if (showBenefitPopup) {
          console.log('强制设置福利弹窗内容...')
          const benefitContent = {
            title: '注册福利',
            titlePrefix: '[新会员]',
            subTitle: '全新升级',
            newBadge: 'NEW',
            greeting: '欢迎加入丘大叔柠檬茶',
            benefitIntro: '新会员专享福利',
            benefitDetails: '21元优惠券包',
            benefitDescription: '包含多种优惠券，让您享受更多优惠',
            privacyNote: '我已阅读并同意《用户协议》和《隐私政策》',
            privacyDetail: '允许我们在必要场景下,合理使用您的个人信息,且阅读并同意《隐私条款》、《会员协议》等内容',
            loginButton: '手机号一键登录',
            skipButton: '暂时跳过'
          }
          
          this.setData({
            'popupContent.benefit': benefitContent
          })
          
          console.log('福利弹窗按钮文字检查:')
          console.log('- 登录按钮:', this.data.popupContent?.benefit?.loginButton)
          console.log('- 跳过按钮:', this.data.popupContent?.benefit?.skipButton)
        }
        
        if (showPhonePopup) {
          console.log('强制设置手机号弹窗内容...')
          const phoneContent = {
            title: '获取手机号',
            greeting: '申请获取并验证手机号',
            description: '为了提供更好的服务，我们需要获取您的手机号',
            currentPhone: '当前微信绑定号码',
            infoIcon: 'i',
            allowButton: '允许',
            rejectButton: '不允许',
            otherPhoneButton: '使用其它号码'
          }
          
          this.setData({
            'popupContent.phone': phoneContent
          })
          
          console.log('手机号弹窗按钮文字检查:')
          console.log('- 允许按钮:', this.data.popupContent?.phone?.allowButton)
          console.log('- 不允许按钮:', this.data.popupContent?.phone?.rejectButton)
          console.log('- 其他号码按钮:', this.data.popupContent?.phone?.otherPhoneButton)
        }
        
        console.log('弹窗显示状态已同步:')
        console.log('- privacyVisible:', this.data.privacyVisible)
        console.log('- benefitVisible:', this.data.benefitVisible)
        console.log('- phoneVisible:', this.data.phoneVisible)
      }
    },
    
    // 监听弹窗内容变化
    'popupContent': function(popupContent) {
      console.log('弹窗内容数据变化:', popupContent)
      console.log('按钮文字状态:')
      console.log('- 隐私弹窗:', popupContent?.privacy?.rejectButton, popupContent?.privacy?.agreeButton)
      console.log('- 福利弹窗:', popupContent?.benefit?.loginButton, popupContent?.benefit?.skipButton)
      console.log('- 手机号弹窗:', popupContent?.phone?.allowButton, popupContent?.phone?.rejectButton)
    }
  }
}) 