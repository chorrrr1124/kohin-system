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

    // 流程步骤
    currentStep: 0,
    
    // 弹窗类型
    popupType: '',
    
    // 弹窗内容数据
    popupContent: {
      brand: {
        name: '丘大叔柠檬茶',
        logo: '/images/logo.png'
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
      // 检测是否为真机环境
      this.detectDevice()
      // 获取弹窗内容
      this.getPopupContent()
    },
    
    // 组件实例被挂载到页面时执行
    attached() {
      // 可以在这里进行一些初始化操作
      console.log('弹窗组件已挂载，当前popupContent:', this.data.popupContent)
      
      // 检查数据是否正确初始化
      if (this.data.popupContent && this.data.popupContent.benefit) {
        console.log('福利弹窗数据:', {
          newBadge: this.data.popupContent.benefit.newBadge,
          subTitle: this.data.popupContent.benefit.subTitle,
          title: this.data.popupContent.benefit.title,
          privacyNote: this.data.popupContent.benefit.privacyNote,
          privacyDetail: this.data.popupContent.benefit.privacyDetail
        })
      }
    }
  },

  methods: {
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
      try {
        console.log('开始获取弹窗内容...')
        console.log('当前popupContent状态:', this.data.popupContent)
        
        wx.showLoading({
          title: '加载中...'
        })
        
        const result = await wx.cloud.callFunction({
          name: 'getPopupContent'
        })
        
        console.log('云函数返回结果:', result)
        
        if (result.result && result.result.success) {
          console.log('云函数调用成功，设置弹窗内容:', result.result.data)
          // 深度合并：以默认值为基，云函数返回覆盖默认值，缺失字段保留默认
          const defaultContent = this.data.popupContent
          const server = result.result.data || {}
          const merged = {
            brand: { ...defaultContent.brand, ...(server.brand || {}) },
            privacy: { ...defaultContent.privacy, ...(server.privacy || {}) },
            benefit: { ...defaultContent.benefit, ...(server.benefit || {}) },
            phone: { ...defaultContent.phone, ...(server.phone || {}) }
          }
          this.setData({
            popupContent: merged
          })
          console.log('弹窗内容设置完成，当前状态:', this.data.popupContent)
        } else {
          console.error('获取弹窗内容失败:', result.result?.message || '未知错误')
          // 使用默认内容
          console.log('使用默认弹窗内容')
        }
      } catch (error) {
        console.error('调用云函数失败:', error)
        // 使用默认内容
        console.log('云函数调用失败，使用默认弹窗内容')
      } finally {
        wx.hideLoading()
        // 兜底：确保按钮文案不为空
        const content = this.data.popupContent
        const safe = {
          ...content,
          privacy: {
            ...content.privacy,
            rejectButton: content.privacy?.rejectButton || '拒绝',
            agreeButton: content.privacy?.agreeButton || '同意'
          },
          benefit: {
            ...content.benefit,
            loginButton: content.benefit?.loginButton || '手机号一键登录',
            skipButton: content.benefit?.skipButton || '暂时跳过'
          },
          phone: {
            ...content.phone,
            allowButton: content.phone?.allowButton || '允许',
            rejectButton: content.phone?.rejectButton || '不允许',
            otherPhoneButton: content.phone?.otherPhoneButton || '使用其它号码'
          }
        }
        this.setData({ popupContent: safe })
      }
    },

    // 阻止背景滚动
    preventTouchMove() {
      return false;
    },

    // 遮罩层点击关闭弹窗，内部内容点击吞掉
    onMaskTap() {
      // 优先逐一关闭可见弹窗
      if (this.data.showPrivacyPopup) {
        this.setData({ showPrivacyPopup: false })
        this.triggerEvent('privacyMaskClose')
        return
      }
      if (this.data.showBenefitPopup) {
        this.setData({ showBenefitPopup: false })
        this.triggerEvent('benefitMaskClose')
        return
      }
      if (this.data.showPhonePopup) {
        this.setData({ showPhonePopup: false })
        this.triggerEvent('phoneMaskClose')
        return
      }
    },
    swallow() {},

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

    // 打开协议页面
    openAgreement(e) {
      const type = e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.type : ''
      if (!type) return
      wx.navigateTo({
        url: `/pages/agreement/index?type=${type}`
      })
    },

    // ===== 隐私政策弹窗事件 =====
    
    // 同意隐私政策
    onPrivacyAgree() {
      this.setData({
        showPrivacyPopup: false,
        privacyAgreed: true,
        currentStep: 0
      });
      
      // 延迟显示下一个弹窗
      setTimeout(() => {
        this.showNextPopup();
      }, 300);
      
      this.triggerEvent('privacyAgree');
    },

    // 拒绝隐私政策
    onPrivacyReject() {
      this.setData({
        showPrivacyPopup: false
      });
      
      // 用户拒绝，关闭所有弹窗
      this.closeAllPopups();
      this.triggerEvent('privacyReject');
    },

    // ===== 注册福利弹窗事件 =====
    
    // 点击注册福利登录按钮
    onBenefitLogin() {
      if (!this.data.privacyAgreed) {
        wx.showToast({
          title: '请先同意隐私条款',
          icon: 'none'
        });
        return;
      }
      
      this.setData({
        showBenefitPopup: false
      });
      
      // 延迟显示下一个弹窗
      setTimeout(() => {
        this.showNextPopup();
      }, 300);
      
      this.triggerEvent('benefitLogin');
    },

    // 暂时跳过注册福利
    onBenefitSkip() {
      this.setData({
        showBenefitPopup: false
      });
      
      // 跳过福利，直接完成流程
      this.completeFlow();
      this.triggerEvent('benefitSkip');
    },

    // 隐私协议复选框变化
    onPrivacyCheckboxChange(e) {
      const values = e.detail.value;
      this.setData({
        privacyAgreed: values.includes('agreed')
      });
    },

    // ===== 手机号授权弹窗事件 =====
    
    // 获取手机号事件处理
    onPhoneNumberGet(e) {
      console.log('手机号获取事件:', e);
      
      if (e.detail.errMsg === 'getPhoneNumber:ok') {
        // 获取成功，触发事件给父组件处理
        this.triggerEvent('phoneNumberGet', {
          code: e.detail.code,
          encryptedData: e.detail.encryptedData,
          iv: e.detail.iv
        });
      } else {
        // 获取失败
        console.log('用户拒绝授权手机号');
        this.triggerEvent('phoneNumberReject');
      }
    },

    // 允许获取手机号（保留兼容性）
    onPhoneAllow() {
      // 这个方法现在由 onPhoneNumberGet 处理
      // 保留是为了向后兼容
    },

    // 拒绝获取手机号
    onPhoneReject() {
      this.setData({
        showPhonePopup: false
      });
      
      // 用户拒绝，关闭所有弹窗
      this.closeAllPopups();
      this.triggerEvent('phoneReject');
    },

    // 使用其他手机号
    onUseOtherPhone() {
      this.setData({
        showPhonePopup: false
      });
      
      // 触发使用其他手机号事件
      this.triggerEvent('useOtherPhone');
    },

    // ===== 流程控制方法 =====
    
    // 显示下一个弹窗
    showNextPopup() {
      const nextStep = this.data.currentStep + 1;
      
      if (nextStep === 1) {
        // 显示注册福利弹窗
        this.setData({
          showBenefitPopup: true,
          currentStep: nextStep
        });
      } else if (nextStep === 2) {
        // 显示手机号授权弹窗
        this.setData({
          showPhonePopup: true,
          currentStep: nextStep
        });
      }
    },

    // 关闭所有弹窗
    closeAllPopups() {
      this.setData({
        showPrivacyPopup: false,
        showBenefitPopup: false,
        showPhonePopup: false,
        currentStep: 0
      });
    },

    // 完成流程
    completeFlow() {
      this.setData({
        currentStep: 0
      });
      
      this.triggerEvent('flowComplete');
    },

    // 刷新弹窗内容
    refreshPopupContent() {
      this.getPopupContent();
    },

    // 弹窗显示
    showPopup(type) {
      this.setData({
        [`${type}Visible`]: true
      })
    },
  },

  observers: {
    // 监听弹窗显示状态变化
    'showPrivacyPopup, showBenefitPopup, showPhonePopup': function(showPrivacyPopup, showBenefitPopup, showPhonePopup) {
      if (showPrivacyPopup || showBenefitPopup || showPhonePopup) {
        // 弹窗显示后的处理
      }
    }
  }
}) 