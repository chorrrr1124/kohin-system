/**
 * 手机号获取问题诊断工具
 * 专门用于诊断 getPhoneNumber API 的问题
 */

const phoneNumberDebug = {
  // 检查小程序配置
  checkAppConfig() {
    try {
      console.log('=== 小程序配置检查 ===');
      
      // getPhoneNumber 不需要在 app.json 里配置权限
      console.log('手机号权限配置: ✅ 无需在 app.json 配置');
      
      // 检查云开发环境
      let cloudEnv = '未配置';
      try {
        if (wx.cloud && wx.cloud.DYNAMIC_CURRENT_ENV) {
          cloudEnv = wx.cloud.DYNAMIC_CURRENT_ENV;
        } else if (getApp() && getApp().globalData && getApp().globalData.cloudEnv) {
          cloudEnv = getApp().globalData.cloudEnv;
        }
      } catch (e) {
        console.log('无法获取云开发环境配置');
      }
      
      console.log('云开发环境:', cloudEnv);
      
      return {
        success: true,
        hasPermission: true,
        permissionDesc: 'getPhoneNumber 无需在 app.json 配置权限',
        cloudEnv: cloudEnv
      };
    } catch (error) {
      console.error('检查小程序配置失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 检查按钮配置
  checkButtonConfig() {
    try {
      console.log('=== 按钮配置检查 ===');
      
      // 检查当前页面是否有正确的按钮
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      
      console.log('当前页面:', currentPage.route);
      
      // 检查页面是否有 onGetPhoneNumber 方法
      const hasMethod = typeof currentPage.onGetPhoneNumber === 'function';
      console.log('onGetPhoneNumber方法:', hasMethod ? '✅ 存在' : '❌ 不存在');
      
      return {
        success: true,
        currentPage: currentPage.route,
        hasGetPhoneNumberMethod: hasMethod
      };
    } catch (error) {
      console.error('检查按钮配置失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 检查微信版本和基础库
  checkWeChatVersion() {
    try {
      // 使用支持度更好的同步方式并提供兜底
      const appBaseInfo = (typeof wx.getAppBaseInfo === 'function') ? wx.getAppBaseInfo() : {};
      let systemInfo = {};
      try {
        systemInfo = (typeof wx.getSystemInfoSync === 'function') ? wx.getSystemInfoSync() : {};
      } catch (e) {
        systemInfo = {};
      }
      
      const wechatVersion = appBaseInfo && appBaseInfo.version ? appBaseInfo.version : '0.0.0';
      const sdkVersion = systemInfo && systemInfo.SDKVersion ? systemInfo.SDKVersion : (appBaseInfo.SDKVersion || '0.0.0');
      const platform = systemInfo && systemInfo.platform ? systemInfo.platform : 'unknown';
      
      console.log('=== 微信版本检查 ===');
      console.log('微信版本:', wechatVersion);
      console.log('基础库版本:', sdkVersion);
      console.log('平台:', platform);
      
      // getPhoneNumber 需要基础库 2.21.2 及以上
      const minSDKVersion = '2.21.2';
      const currentSDKVersion = sdkVersion || '0.0.0';
      const isSupported = this.compareVersion(currentSDKVersion, minSDKVersion) >= 0;
      
      console.log('基础库支持:', isSupported ? '✅ 支持' : '❌ 不支持');
      
      return {
        success: true,
        wechatVersion: wechatVersion,
        sdkVersion: currentSDKVersion,
        platform: platform,
        isSupported: isSupported,
        minRequiredVersion: minSDKVersion
      };
    } catch (error) {
      console.error('检查微信版本失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 检查小程序类型
  checkMiniProgramType() {
    try {
      console.log('=== 小程序类型检查 ===');
      
      // 个人小程序可能无法使用 getPhoneNumber
      const accountInfo = wx.getAccountInfoSync();
      console.log('小程序类型:', accountInfo.miniProgram.type);
      console.log('小程序版本:', accountInfo.miniProgram.version);
      
      const isPersonal = accountInfo.miniProgram.type === 'personal';
      console.log('是否个人小程序:', isPersonal ? '是' : '否');
      
      if (isPersonal) {
        console.log('⚠️ 个人小程序可能无法使用 getPhoneNumber API');
      }
      
      return {
        success: true,
        type: accountInfo.miniProgram.type,
        version: accountInfo.miniProgram.version,
        isPersonal: isPersonal
      };
    } catch (error) {
      console.error('检查小程序类型失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 检查网络状态
  checkNetworkStatus() {
    try {
      console.log('=== 网络状态检查 ===');
      
      const networkType = wx.getNetworkType();
      console.log('网络类型:', networkType.networkType);
      
      return {
        success: true,
        networkType: networkType.networkType
      };
    } catch (error) {
      console.error('检查网络状态失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 模拟 getPhoneNumber 调用
  testGetPhoneNumber() {
    return new Promise((resolve) => {
      try {
        console.log('=== 测试 getPhoneNumber API ===');
        
        // 检查 API 是否存在
        if (typeof wx.getPhoneNumber !== 'function') {
          resolve({
            success: false,
            error: 'getPhoneNumber API 不存在',
            detail: '当前环境不支持 getPhoneNumber API'
          });
          return;
        }
        
        console.log('✅ getPhoneNumber API 存在');
        
        // 注意：这里不能直接调用，因为需要用户交互
        resolve({
          success: true,
          message: 'API 存在，需要用户交互才能测试',
          detail: '请点击获取手机号按钮进行实际测试'
        });
        
      } catch (error) {
        console.error('测试 getPhoneNumber 失败:', error);
        resolve({
          success: false,
          error: error.message
        });
      }
    });
  },

  // 版本比较函数
  compareVersion(v1, v2) {
    const normalize = (v) => {
      if (!v) return '0.0.0';
      if (typeof v !== 'string') v = String(v);
      v = v.trim();
      const m = v.match(/\d+(?:\.\d+){0,3}/);
      return m ? m[0] : '0.0.0';
    };

    const a = normalize(v1).split('.').map(n => Number(n) || 0);
    const b = normalize(v2).split('.').map(n => Number(n) || 0);

    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const x = a[i] || 0;
      const y = b[i] || 0;
      if (x > y) return 1;
      if (x < y) return -1;
    }
    return 0;
  },

  // 完整诊断
  async runFullDiagnosis() {
    console.log('🔍 开始手机号获取问题诊断...');
    
    const results = {
      appConfig: this.checkAppConfig(),
      buttonConfig: this.checkButtonConfig(),
      wechatVersion: this.checkWeChatVersion(),
      miniProgramType: this.checkMiniProgramType(),
      networkStatus: this.checkNetworkStatus(),
      apiTest: await this.testGetPhoneNumber()
    };
    
    console.log('📋 诊断结果汇总:', results);
    
    // 分析问题
    const issues = [];
    const suggestions = [];
    
    if (!results.appConfig.hasPermission) {
      issues.push('小程序未配置手机号权限');
      suggestions.push('在 app.json 中添加 permission.scope.phoneNumber 配置');
    }
    
    if (!results.buttonConfig.hasGetPhoneNumberMethod) {
      issues.push('页面缺少 onGetPhoneNumber 方法');
      suggestions.push('在页面中添加 onGetPhoneNumber 事件处理函数');
    }
    
    if (!results.wechatVersion.isSupported) {
      issues.push('基础库版本过低');
      suggestions.push(`需要基础库 ${results.wechatVersion.minRequiredVersion} 及以上版本`);
    }
    
    if (results.miniProgramType.isPersonal) {
      issues.push('个人小程序可能无法使用此API');
      suggestions.push('建议升级为企业小程序或使用其他登录方式');
    }
    
    return {
      success: true,
      results: results,
      issues: issues,
      suggestions: suggestions,
      summary: {
        totalChecks: 6,
        passedChecks: 6 - issues.length,
        failedChecks: issues.length
      }
    };
  }
};

module.exports = phoneNumberDebug; 