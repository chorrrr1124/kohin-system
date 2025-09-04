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

    },
    
    // 用户信息
    userInfo: null,
    hasUserInfo: false,
    

    
    // 隐私政策同意状态
    privacyAgreed: false,
    
    // 注册福利领取状态
    benefitClaimed: false,
    
    // 系统信息
    systemInfo: null,
    isRealDevice: false,
    
    // 版本兼容性信息
    compatibilityInfo: null
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
      
      // 预检查版本兼容性
      this.preCheckCompatibility();
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

    // 预检查版本兼容性
    preCheckCompatibility() {
      try {
        const systemInfo = wx.getSystemInfoSync();
        const version = systemInfo.version || '';
        const SDKVersion = systemInfo.SDKVersion || '';
        const platform = systemInfo.platform || '';
        const brand = systemInfo.brand || '';
        const model = systemInfo.model || '';
        
        console.log('=== 组件初始化版本兼容性检查 ===');
        console.log('微信版本:', version);
        console.log('基础库版本:', SDKVersion);
        console.log('平台:', platform);
        console.log('设备:', brand, model);
        console.log('getPhoneNumber API 存在:', !!wx.getPhoneNumber);
        
        // 记录兼容性状态
        let compatibilityStatus = 'unknown';
        let compatibilityMessage = '';
        
        if (platform === 'mac' || platform === 'windows') {
          compatibilityStatus = 'platform_not_supported';
          compatibilityMessage = '当前平台不支持手机号获取功能';
        } else if (platform === 'devtools') {
          compatibilityStatus = 'devtools';
          compatibilityMessage = '在开发者工具中运行，请在真机测试';
        } else if (!wx.getPhoneNumber) {
          compatibilityStatus = 'api_not_supported';
          compatibilityMessage = 'getPhoneNumber API 不支持';
        } else if (SDKVersion && this.compareVersion(SDKVersion, '2.19.0') < 0) {
          compatibilityStatus = 'sdk_too_old';
          compatibilityMessage = '基础库版本过低';
        } else if (version && this.compareVersion(version, '8.0.61') < 0) {
          compatibilityStatus = 'wechat_too_old';
          compatibilityMessage = '微信版本过低';
        } else {
          compatibilityStatus = 'compatible';
          compatibilityMessage = '版本兼容性检查通过';
        }
        
        console.log('兼容性状态:', compatibilityStatus);
        console.log('兼容性消息:', compatibilityMessage);
        
        // 保存兼容性信息到组件数据中
        this.setData({
          compatibilityInfo: {
            status: compatibilityStatus,
            message: compatibilityMessage,
            version: version,
            SDKVersion: SDKVersion,
            platform: platform,
            brand: brand,
            model: model,
            hasGetPhoneNumber: !!wx.getPhoneNumber
          }
        });
        
        // 如果明显不支持，提前记录警告
        if (compatibilityStatus !== 'compatible') {
          console.warn('⚠️ 版本兼容性警告:', compatibilityMessage);
          
          // 在开发环境下显示提示
          const isDev = wx.getAccountInfoSync().miniProgram.envVersion === 'develop';
          if (isDev && compatibilityStatus === 'platform_not_supported') {
            wx.showToast({
              title: '平台不支持',
              icon: 'none',
              duration: 3000
            });
          }
        }
        
      } catch (error) {
        console.error('预检查版本兼容性失败:', error);
        this.setData({
          compatibilityInfo: {
            status: 'check_failed',
            message: '版本检查失败',
            error: error.message
          }
        });
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
      
      console.log('用户点击注册福利登录，开始获取手机号');
      
      // 直接调用微信官方API获取手机号
      this.getPhoneNumberSimple();
      
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
      console.log('手机号获取事件:', e.detail);
      
      if (e.detail.errMsg === 'getPhoneNumber:ok') {
        // 获取成功，显示加载状态
        wx.showLoading({
          title: '验证中...',
          mask: true
        });
        
        // 调用云函数解密手机号
        this.decryptPhoneNumber(e.detail.code);
      } else if (e.detail.errno === 1400001) {
        // 额度不足
        wx.showModal({
          title: '提示',
          content: '该功能使用次数已达上限，请联系客服',
          showCancel: false
        });
        this.triggerEvent('phoneNumberQuotaExceeded');
      } else {
        // 用户拒绝或其他错误
        console.log('用户拒绝授权手机号或发生错误:', e.detail);
        this.handlePhoneNumberError(e.detail.errno);
        this.triggerEvent('phoneNumberReject', { errno: e.detail.errno });
      }
    },

    // 解密手机号
    async decryptPhoneNumber(code) {
      try {
        console.log('=== 开始解密手机号 ===');
        console.log('code长度:', code.length);
        console.log('code前10位:', code.substring(0, 10) + '...');
        console.log('云开发环境:', wx.cloud.DYNAMIC_CURRENT_ENV);
        
        const result = await wx.cloud.callFunction({
          name: 'decryptPhoneNumber',
          data: { code: code }
        });

        console.log('云函数返回结果:', JSON.stringify(result, null, 2));

        if (result.result && result.result.success) {
          const { phoneNumber, countryCode } = result.result;
          
          console.log('手机号解密成功:', phoneNumber);
          console.log('国家代码:', countryCode);
          
          // 保存到本地存储
          wx.setStorageSync('userPhone', phoneNumber);
          wx.setStorageSync('userCountryCode', countryCode);
          
          // 调用新的成功处理方法
          this.handlePhoneNumberSuccess(phoneNumber);
          
        } else {
          console.error('云函数返回失败:', result.result);
          const errorMsg = result.result?.error || '手机号解密失败';
          const errorDetail = result.result?.detail || '未知错误';
          const errCode = result.result?.errCode;
          
          console.error('错误信息:', errorMsg);
          console.error('错误详情:', errorDetail);
          console.error('错误代码:', errCode);
          
          // 根据错误代码提供更具体的提示
          let userMessage = errorMsg;
          if (errCode === '1400001') {
            userMessage = '功能使用次数已达上限，请联系客服';
          } else if (errCode === '40013' || errCode === '40029') {
            userMessage = '授权已过期，请重新获取';
          } else if (errCode === '45011') {
            userMessage = '请求过于频繁，请稍后重试';
          } else if (errCode === '40226') {
            userMessage = '需要完成实名认证';
          }
          
          throw new Error(userMessage);
        }
        
      } catch (error) {
        console.error('=== 手机号解密失败 ===');
        console.error('错误类型:', error.constructor.name);
        console.error('错误消息:', error.message);
        console.error('错误堆栈:', error.stack);
        
        wx.hideLoading();
        
        // 显示错误提示
        wx.showToast({
          title: error.message || '手机号验证失败，请重试',
          icon: 'none',
          duration: 3000
        });
        
        // 关闭注册福利弹窗
        this.setData({
          showBenefitPopup: false
        });
        
        this.triggerEvent('phoneNumberError', {
          error: error.message,
          detail: error.stack
        });
      }
    },

    // 处理手机号获取成功
    handlePhoneNumberSuccess(phoneNumber) {
      console.log('手机号获取成功:', phoneNumber);
      
      wx.hideLoading();
      
      // 获取国家代码
      const countryCode = wx.getStorageSync('userCountryCode') || '+86';
      
      // 显示成功提示
      wx.showToast({
        title: '手机号获取成功',
        icon: 'success',
        duration: 2000
      });
      
      // 关闭注册福利弹窗
      this.setData({
        showBenefitPopup: false
      });
      
      // 触发成功事件
      this.triggerEvent('phoneNumberSuccess', {
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        maskedPhone: this.maskPhoneNumber(phoneNumber)
      });
      
      // 完成流程
      this.completeFlow();
    },

    // 处理手机号获取错误
    handlePhoneNumberError(errno) {
      let message = '获取手机号失败，请重试';
      
      switch (errno) {
        case 1400001:
          message = '该功能使用次数已达上限，请联系客服';
          break;
        case 40013:
        case 40029:
          message = '授权已过期，请重新获取';
          break;
        case 45011:
          message = '请求过于频繁，请稍后重试';
          break;
        case 40226:
          message = '需要完成实名认证';
          break;
        default:
          message = '获取手机号失败，请重试';
      }
      
      wx.showToast({
        title: message,
        icon: 'none'
      });
    },

    // 手机号掩码处理
    maskPhoneNumber(phoneNumber) {
      if (!phoneNumber || phoneNumber.length < 7) {
        return phoneNumber;
      }
      
      // 保留前3位和后4位，中间用*代替
      const prefix = phoneNumber.substring(0, 3);
      const suffix = phoneNumber.substring(phoneNumber.length - 4);
      const masked = '*'.repeat(phoneNumber.length - 7);
      
      return `${prefix}${masked}${suffix}`;
    },



    // 直接获取手机号（从注册福利弹窗调用）
    getPhoneNumberDirectly() {
      console.log('=== 开始直接获取手机号 ===');
      
      // 检查微信版本和基础库版本
      const systemInfo = wx.getSystemInfoSync();
      const version = systemInfo.version || '';
      const SDKVersion = systemInfo.SDKVersion || '';
      
      console.log('微信版本:', version);
      console.log('基础库版本:', SDKVersion);
      console.log('系统信息:', systemInfo);
      
      // 检查是否支持获取手机号
      if (!wx.getPhoneNumber) {
        console.log('wx.getPhoneNumber API 不存在，使用降级方案');
        this.showFallbackOption();
        return;
      }
      
      // 检查基础库版本（您的版本3.9.3已经足够新）
      if (this.compareVersion(SDKVersion, '2.19.0') < 0) {
        console.log('基础库版本过低，使用降级方案');
        this.showFallbackOption();
        return;
      }
      
      // 检查云开发环境
      if (!wx.cloud) {
        console.error('云开发环境未初始化');
        wx.showToast({
          title: '云开发环境未初始化',
          icon: 'none'
        });
        return;
      }
      
      // 显示加载提示
      wx.showLoading({
        title: '获取手机号中...',
        mask: true
      });
      
      // 调用微信API获取手机号
      wx.getPhoneNumber({
        success: (res) => {
          console.log('微信获取手机号成功:', res);
          wx.hideLoading();
          
          if (res.errMsg === 'getPhoneNumber:ok') {
            // 获取成功，解密手机号
            this.decryptPhoneNumber(res.code);
          } else {
            console.error('微信API返回错误:', res);
            this.handlePhoneNumberError(res.errno || 0);
          }
        },
        fail: (err) => {
          console.error('微信获取手机号失败:', err);
          wx.hideLoading();
          
          // 详细记录错误信息
          console.error('错误详情:', {
            errMsg: err.errMsg,
            errno: err.errno,
            error: err.error,
            stack: err.stack
          });
          
          // 处理特定错误码
          if (err.errno === 1400001) {
            wx.showModal({
              title: '提示',
              content: '该功能使用次数已达上限，请联系客服',
              showCancel: false
            });
          } else if (err.errno === 40226) {
            wx.showModal({
              title: '实名认证',
              content: '需要完成实名认证才能获取手机号',
              showCancel: false
            });
          } else {
            // 其他错误，显示降级方案
            console.log('获取手机号失败，显示降级方案');
            this.showFallbackOption();
          }
        }
      });
    },

    // 简化的手机号获取方法（只弹出微信官方授权弹窗）
    getPhoneNumberSimple() {
      console.log('=== 开始简化获取手机号 ===');
      
      // 详细的版本兼容性检查
      try {
        const systemInfo = wx.getSystemInfoSync();
        const version = systemInfo.version || '';
        const SDKVersion = systemInfo.SDKVersion || '';
        const platform = systemInfo.platform || '';
        
        console.log('=== 版本兼容性预检查 ===');
        console.log('微信版本:', version);
        console.log('基础库版本:', SDKVersion);
        console.log('平台:', platform);
        console.log('getPhoneNumber API 存在:', !!wx.getPhoneNumber);
        
        // 检查是否支持获取手机号
        if (!wx.getPhoneNumber) {
          console.log('❌ getPhoneNumber API 不存在');
          this.showVersionError();
          return;
        }
        
        // 检查平台支持
        if (platform === 'mac' || platform === 'windows') {
          console.log('❌ 当前平台不支持:', platform);
          wx.showModal({
            title: '平台不支持',
            content: '微信手机号获取功能目前仅支持 iOS 和 Android 平台。\n\n请使用手动输入方式。',
            confirmText: '手动输入',
            cancelText: '稍后再说',
            success: (res) => {
              if (res.confirm) {
                this.showManualInputDialog();
              } else {
                this.setData({
                  showBenefitPopup: false
                });
              }
            }
          });
          return;
        }
        
        // 检查基础库版本
        if (SDKVersion && this.compareVersion(SDKVersion, '2.19.0') < 0) {
          console.log('❌ 基础库版本过低:', SDKVersion);
          wx.showModal({
            title: '基础库版本过低',
            content: `当前基础库版本：${SDKVersion}\n需要版本：2.19.0+\n\n建议升级微信到最新版本，或使用手动输入方式。`,
            confirmText: '手动输入',
            cancelText: '稍后再说',
            success: (res) => {
              if (res.confirm) {
                this.showManualInputDialog();
              } else {
                this.setData({
                  showBenefitPopup: false
                });
              }
            }
          });
          return;
        }
        
        console.log('✅ 版本兼容性检查通过');
        
      } catch (error) {
        console.error('版本兼容性检查失败:', error);
        // 即使检查失败，也尝试继续执行
        if (!wx.getPhoneNumber) {
          this.showVersionError();
          return;
        }
      }
      
      // 直接调用微信API，这会弹出官方的手机号授权弹窗
      wx.getPhoneNumber({
        success: (res) => {
          console.log('微信获取手机号成功:', res);
          
          if (res.errMsg === 'getPhoneNumber:ok') {
            // 获取成功，显示成功提示
            wx.showToast({
              title: '手机号获取成功',
              icon: 'success'
            });
            
            // 触发成功事件
            this.triggerEvent('phoneNumberGet', { 
              success: true, 
              code: res.code 
            });
            
            // 关闭福利弹窗
            this.setData({
              showBenefitPopup: false
            });
            
            // 完成流程
            this.completeFlow();
            
          } else {
            console.error('微信API返回错误:', res);
            wx.showToast({
              title: '获取失败，请重试',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          console.error('微信获取手机号失败:', err);
          
          if (err.errno === 1400001) {
            wx.showModal({
              title: '提示',
              content: '该功能使用次数已达上限，请联系客服',
              showCancel: false
            });
          } else if (err.errno === 40226) {
            wx.showModal({
              title: '实名认证',
              content: '需要完成实名认证才能获取手机号',
              showCancel: false
            });
          } else {
            wx.showToast({
              title: '获取失败，请重试',
              icon: 'none'
            });
          }
        }
      });
    },

    // 显示版本错误信息（简化版）
    showVersionError() {
      console.log('版本不兼容，直接关闭弹窗');
      // 直接关闭弹窗，不显示诊断信息
      this.setData({
        showBenefitPopup: false
      });
    },

    // 显示降级方案
    showFallbackOption() {
      // 在开发环境中提供诊断选项（已移除诊断）
      const isDev = wx.getAccountInfoSync().miniProgram.envVersion === 'develop';
      
      if (isDev) {
        wx.showActionSheet({
          itemList: ['手动输入手机号', '稍后再说'],
          success: (res) => {
            switch (res.tapIndex) {
              case 0:
                this.showManualInputDialog();
                break;
              case 1:
                this.setData({
                  showBenefitPopup: false
                });
                break;
            }
          }
        });
      } else {
        wx.showModal({
          title: '获取手机号失败',
          content: '无法自动获取手机号，是否手动输入手机号？\n\n我们将通过短信验证码验证您的身份。',
          confirmText: '手动输入',
          cancelText: '稍后再说',
          success: (res) => {
            if (res.confirm) {
              this.showManualInputDialog();
            } else {
              // 用户选择稍后再说，关闭弹窗
              this.setData({
                showBenefitPopup: false
              });
            }
          }
        });
      }
    },

    // 诊断功能（已移除）
    async runDiagnosis() {
        wx.showToast({
        title: '诊断功能已移除',
          icon: 'none'
        });
    },

    // 显示手动输入对话框
    showManualInputDialog() {
      wx.showModal({
        title: '手动输入手机号',
        content: '请输入您的手机号，我们将通过短信验证码验证您的身份',
        editable: true,
        placeholderText: '请输入11位手机号',
        success: (res) => {
          if (res.confirm && res.content) {
            const phoneNumber = res.content.trim();
            if (this.validatePhoneNumber(phoneNumber)) {
              this.handleManualPhoneNumber(phoneNumber);
            } else {
              wx.showToast({
                title: '手机号格式不正确',
                icon: 'none'
              });
              // 重新显示输入框
              setTimeout(() => {
                this.showManualInputDialog();
              }, 1500);
            }
          }
        }
      });
    },

    // 验证手机号格式
    validatePhoneNumber(phoneNumber) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      return phoneRegex.test(phoneNumber);
    },

    // 处理手动输入的手机号
    async handleManualPhoneNumber(phoneNumber) {
      console.log('手动输入手机号:', phoneNumber);
      
      // 显示加载状态
      wx.showLoading({
        title: '发送验证码中...',
        mask: true
      });
      
      try {
        // 调用云函数发送验证码
        const result = await wx.cloud.callFunction({
          name: 'sendSmsCode',
          data: {
            phoneNumber: phoneNumber,
            type: 'login'
          }
        });
        
        wx.hideLoading();
        
        if (result.result && result.result.success) {
          // 发送成功，显示验证码输入框
          this.showVerificationCodeDialog(phoneNumber);
          
          // 开发环境下显示验证码（生产环境应该注释掉）
          if (result.result.code) {
            wx.showModal({
              title: '开发提示',
              content: `验证码：${result.result.code}\n\n生产环境请注释掉此提示`,
              showCancel: false
            });
          }
        } else {
          wx.showToast({
            title: result.result.error || '发送失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('发送验证码失败:', error);
        wx.hideLoading();
        wx.showToast({
          title: '发送失败，请重试',
          icon: 'none'
        });
      }
    },
    
    // 显示验证码输入框
    showVerificationCodeDialog(phoneNumber) {
      wx.showModal({
        title: '输入验证码',
        content: `验证码已发送至 ${this.maskPhoneNumber(phoneNumber)}，请输入6位验证码`,
        editable: true,
        placeholderText: '请输入6位验证码',
        success: (res) => {
          if (res.confirm && res.content) {
            const code = res.content.trim();
            if (code.length === 6 && /^\d{6}$/.test(code)) {
              // 验证码格式正确，模拟验证成功
              this.verifyCodeAndComplete(phoneNumber, code);
            } else {
              wx.showToast({
                title: '验证码格式不正确',
                icon: 'none'
              });
              // 重新显示验证码输入框
              setTimeout(() => {
                this.showVerificationCodeDialog(phoneNumber);
              }, 1500);
            }
          }
        }
      });
    },
    
    // 验证验证码并完成流程
    async verifyCodeAndComplete(phoneNumber, code) {
      wx.showLoading({
        title: '验证中...',
        mask: true
      });
      
      try {
        // 调用云函数验证验证码
        const result = await wx.cloud.callFunction({
          name: 'verifySmsCode',
          data: {
            phoneNumber: phoneNumber,
            code: code,
            type: 'login'
          }
        });
        
        wx.hideLoading();
        
        if (result.result && result.result.success) {
          wx.showToast({
            title: '验证成功',
            icon: 'success'
          });
          
          // 完成流程
          this.handlePhoneNumberSuccess(phoneNumber);
        } else {
          wx.showToast({
            title: result.result.error || '验证失败',
            icon: 'none'
          });
          
          // 验证失败，重新显示验证码输入框
          setTimeout(() => {
            this.showVerificationCodeDialog(phoneNumber);
          }, 1500);
        }
      } catch (error) {
        console.error('验证验证码失败:', error);
        wx.hideLoading();
        wx.showToast({
          title: '验证失败，请重试',
          icon: 'none'
        });
        
        // 验证失败，重新显示验证码输入框
        setTimeout(() => {
          this.showVerificationCodeDialog(phoneNumber);
        }, 1500);
      }
    },

    // 版本比较函数
    compareVersion(v1, v2) {
      const v1Parts = v1.split('.').map(Number);
      const v2Parts = v2.split('.').map(Number);
      
      for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const v1Part = v1Parts[i] || 0;
        const v2Part = v2Parts[i] || 0;
        
        if (v1Part > v2Part) return 1;
        if (v1Part < v2Part) return -1;
      }
      
      return 0;
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
      }
    },

    // 关闭所有弹窗
    closeAllPopups() {
      this.setData({
        showPrivacyPopup: false,
        showBenefitPopup: false,
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
    }
  },

  observers: {
    // 监听弹窗显示状态变化
    'showPrivacyPopup, showBenefitPopup': function(showPrivacyPopup, showBenefitPopup) {
      if (showPrivacyPopup || showBenefitPopup) {
        // 弹窗显示后的处理
      }
    }
  }
}) 