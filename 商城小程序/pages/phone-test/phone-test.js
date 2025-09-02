// 手机号测试页面
const phoneNumberDebug = require('../../utils/phone-number-debug.js');

Page({
  data: {
    loading: false,
    result: null,
    lastCallTime: 0, // 记录上次调用时间
    cooldownTime: 3000, // 冷却时间3秒
    isInCooldown: false, // 是否在冷却中
    cooldownRemaining: 0, // 剩余冷却时间
    diagnosisResult: null, // 诊断结果
    showDiagnosis: false // 是否显示诊断结果
  },

  onLoad(options) {
    console.log('手机号测试页面加载');
    // 启动冷却时间检查
    this.startCooldownCheck();
  },

  onUnload() {
    // 页面卸载时清除定时器
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
  },

  // 获取手机号
  onGetPhoneNumber(e) {
    console.log('获取手机号事件:', e);
    
    // 检查是否在冷却时间内
    const now = Date.now();
    const lastCallTime = this.data.lastCallTime || 0;
    const cooldownTime = this.data.cooldownTime;
    
    if (now - lastCallTime < cooldownTime) {
      const remainingTime = Math.ceil((cooldownTime - (now - lastCallTime)) / 1000);
      this.setData({
        isInCooldown: true,
        cooldownRemaining: remainingTime
      });
      return;
    }
    
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      this.setData({ 
        loading: true,
        lastCallTime: now,
        result: null
      });
      this.decryptPhoneNumber(e.detail.code);
    } else {
      console.log('用户拒绝授权:', e.detail.errMsg);
      wx.showToast({
        title: '需要授权才能获取手机号',
        icon: 'none'
      });
    }
  },

  // 解密手机号
  async decryptPhoneNumber(code) {
    try {
      console.log('开始解密手机号，code长度:', code.length);
      
      const result = await wx.cloud.callFunction({
        name: 'decryptPhoneNumber',
        data: { code: code }
      });

      console.log('云函数返回结果:', result);

      if (result.result && result.result.success) {
        const { phoneNumber, countryCode } = result.result;
        
        // 脱敏处理
        const maskedPhone = this.maskPhoneNumber(phoneNumber);
        
        this.setData({
          loading: false,
          result: {
            success: true,
            phoneNumber: phoneNumber,
            countryCode: countryCode,
            maskedPhone: maskedPhone
          }
        });

        wx.showToast({
          title: '手机号获取成功',
          icon: 'success'
        });
        
      } else {
        // 处理云函数返回的错误
        const errorResult = result.result;
        throw new Error(errorResult?.error || errorResult?.detail || '解密失败');
      }
      
    } catch (error) {
      console.error('手机号解密失败:', error);
      
      let errorMessage = '手机号获取失败';
      let errorDetail = error.message || '未知错误';
      
      // 根据错误类型提供更友好的提示
      if (error.message) {
        if (error.message.includes('40013')) {
          errorMessage = '无效的code，请重新获取';
        } else if (error.message.includes('40029')) {
          errorMessage = 'code已过期，请重新获取';
        } else if (error.message.includes('45011')) {
          errorMessage = '请求过于频繁，请稍后重试';
        } else if (error.message.includes('40226')) {
          errorMessage = '需要完成实名认证';
        } else if (error.message.includes('1400001')) {
          errorMessage = '功能使用次数已达上限';
        }
      }
      
      this.setData({
        loading: false,
        result: {
          success: false,
          error: errorMessage,
          detail: errorDetail
        }
      });

      wx.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000
      });
    }
  },

  // 手机号脱敏处理
  maskPhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.length < 7) {
      return phoneNumber;
    }
    
    const prefix = phoneNumber.substring(0, 3);
    const suffix = phoneNumber.substring(phoneNumber.length - 4);
    const middle = '*'.repeat(phoneNumber.length - 7);
    
    return prefix + middle + suffix;
  },

  // 重新测试
  onRetest() {
    this.setData({
      result: null
    });
  },

  // 复制手机号
  onCopyPhone() {
    if (this.data.result && this.data.result.phoneNumber) {
      wx.setClipboardData({
        data: this.data.result.phoneNumber,
        success: () => {
          wx.showToast({
            title: '手机号已复制',
            icon: 'success'
          });
        }
      });
    }
  },

  // 启动冷却时间检查
  startCooldownCheck() {
    this.cooldownTimer = setInterval(() => {
      const now = Date.now();
      const lastCallTime = this.data.lastCallTime || 0;
      const cooldownTime = this.data.cooldownTime;
      
      if (now - lastCallTime >= cooldownTime) {
        // 冷却时间结束
        this.setData({
          isInCooldown: false,
          cooldownRemaining: 0
        });
      } else {
        // 还在冷却中，更新剩余时间
        const remainingTime = Math.ceil((cooldownTime - (now - lastCallTime)) / 1000);
        this.setData({
          isInCooldown: true,
          cooldownRemaining: remainingTime
        });
      }
    }, 1000); // 每秒检查一次
  },

  // 运行手机号诊断
  async runPhoneDiagnosis() {
    try {
      this.setData({ loading: true });
      
      const diagnosis = await phoneNumberDebug.runFullDiagnosis();
      
      this.setData({
        diagnosisResult: diagnosis,
        showDiagnosis: true,
        loading: false
      });
      
      console.log('手机号诊断完成:', diagnosis);
      
    } catch (error) {
      console.error('诊断失败:', error);
      this.setData({
        diagnosisResult: {
          success: false,
          error: error.message
        },
        showDiagnosis: true,
        loading: false
      });
    }
  },

  // 隐藏诊断结果
  hideDiagnosis() {
    this.setData({
      showDiagnosis: false
    });
  },

  // 跳转到手动输入页面
  goToManualInput() {
    wx.navigateTo({
      url: '/pages/phone-input/phone-input'
    });
  }
}); 