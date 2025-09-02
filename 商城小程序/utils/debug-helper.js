// 调试助手工具
const debugHelper = {
  // 检查系统环境
  checkSystemEnvironment() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      console.log('=== 系统环境检查 ===');
      console.log('微信版本:', systemInfo.version);
      console.log('基础库版本:', systemInfo.SDKVersion);
      console.log('平台:', systemInfo.platform);
      console.log('系统:', systemInfo.system);
      console.log('设备型号:', systemInfo.model);
      console.log('屏幕信息:', {
        screenWidth: systemInfo.screenWidth,
        screenHeight: systemInfo.screenHeight,
        windowWidth: systemInfo.windowWidth,
        windowHeight: systemInfo.windowHeight
      });
      
      return {
        success: true,
        data: systemInfo
      };
    } catch (error) {
      console.error('获取系统信息失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 检查云开发环境
  checkCloudEnvironment() {
    try {
      console.log('=== 云开发环境检查 ===');
      console.log('云开发是否可用:', !!wx.cloud);
      
      // 获取环境ID的多种方式
      let envId = null;
      try {
        // 方式1：从app.js中获取
        const app = getApp();
        if (app && app.globalData && app.globalData.envId) {
          envId = app.globalData.envId;
        }
        
        // 方式2：从云开发配置中获取
        if (!envId && wx.cloud) {
          envId = wx.cloud.DYNAMIC_CURRENT_ENV;
        }
        
        // 方式3：从本地存储获取
        if (!envId) {
          envId = wx.getStorageSync('cloudEnvId');
        }
        
        console.log('云开发环境ID:', envId);
      } catch (e) {
        console.log('获取环境ID失败:', e);
      }
      
      if (wx.cloud) {
        return {
          success: true,
          cloudAvailable: true,
          envId: envId || 'cloudbase-3g4w6lls8a5ce59b' // 使用默认环境ID
        };
      } else {
        return {
          success: false,
          cloudAvailable: false,
          error: '云开发环境未初始化'
        };
      }
    } catch (error) {
      console.error('检查云开发环境失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 检查API可用性
  checkAPIAvailability() {
    const apis = {
      getPhoneNumber: typeof wx.getPhoneNumber === 'function',
      cloud: !!wx.cloud,
      callFunction: !!(wx.cloud && typeof wx.cloud.callFunction === 'function'),
      getSystemInfoSync: typeof wx.getSystemInfoSync === 'function',
      showModal: typeof wx.showModal === 'function',
      showToast: typeof wx.showToast === 'function',
      showLoading: typeof wx.showLoading === 'function'
    };

    console.log('=== API可用性检查 ===');
    console.log('API检查结果:', apis);

    // 检查getPhoneNumber的具体可用性
    let getPhoneNumberAvailable = apis.getPhoneNumber;
    try {
      // 检查是否在正确的场景下可用
      const systemInfo = wx.getSystemInfoSync();
      if (systemInfo.platform === 'devtools') {
        // 在开发者工具中，getPhoneNumber可能不可用
        getPhoneNumberAvailable = false;
      }
    } catch (e) {
      getPhoneNumberAvailable = false;
    }

    apis.getPhoneNumber = getPhoneNumberAvailable;

    return {
      success: true,
      data: apis
    };
  },

  // 测试云函数调用
  async testCloudFunction(functionName) {
    try {
      console.log(`=== 测试云函数: ${functionName} ===`);
      
      const result = await wx.cloud.callFunction({
        name: functionName,
        data: { test: true }
      });

      console.log('云函数测试结果:', result);
      
      return {
        success: true,
        functionName,
        result
      };
    } catch (error) {
      console.error(`云函数 ${functionName} 测试失败:`, error);
      return {
        success: false,
        functionName,
        error: error.message
      };
    }
  },

  // 版本比较
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
  async fullDiagnosis() {
    console.log('=== 开始完整诊断 ===');
    
    const results = {
      system: this.checkSystemEnvironment(),
      cloud: this.checkCloudEnvironment(),
      apis: this.checkAPIAvailability()
    };

    // 测试关键云函数
    if (results.cloud.success && results.cloud.cloudAvailable) {
      results.cloudFunctions = {
        decryptPhoneNumber: await this.testCloudFunction('decryptPhoneNumber'),
        sendSmsCode: await this.testCloudFunction('sendSmsCode'),
        verifySmsCode: await this.testCloudFunction('verifySmsCode')
      };
    }

    console.log('=== 诊断结果 ===');
    console.log(JSON.stringify(results, null, 2));

    return results;
  },

  // 显示诊断结果
  showDiagnosisResult(results) {
    let message = '诊断结果:\n\n';
    
    // 系统环境
    if (results.system.success) {
      const sys = results.system.data;
      message += `✅ 系统环境正常\n`;
      message += `微信版本: ${sys.version}\n`;
      message += `基础库版本: ${sys.SDKVersion}\n`;
      message += `平台: ${sys.platform}\n\n`;
    } else {
      message += `❌ 系统环境异常: ${results.system.error}\n\n`;
    }

    // 云开发环境
    if (results.cloud.success && results.cloud.cloudAvailable) {
      message += `✅ 云开发环境正常\n`;
      message += `环境ID: ${results.cloud.envId}\n\n`;
    } else {
      message += `❌ 云开发环境异常: ${results.cloud.error}\n\n`;
    }

    // API可用性
    const apis = results.apis.data;
    message += `API可用性:\n`;
    message += `getPhoneNumber: ${apis.getPhoneNumber ? '✅' : '❌'}\n`;
    message += `云开发: ${apis.cloud ? '✅' : '❌'}\n`;
    message += `云函数: ${apis.callFunction ? '✅' : '❌'}\n\n`;

    // 云函数测试结果
    if (results.cloudFunctions) {
      message += `云函数测试:\n`;
      Object.keys(results.cloudFunctions).forEach(name => {
        const result = results.cloudFunctions[name];
        message += `${name}: ${result.success ? '✅' : '❌'}\n`;
        if (!result.success) {
          message += `  错误: ${result.error}\n`;
        }
      });
    }

    wx.showModal({
      title: '诊断结果',
      content: message,
      showCancel: false
    });
  }
};

module.exports = debugHelper; 