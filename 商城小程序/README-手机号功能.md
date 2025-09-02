# 微信小程序手机号获取功能

## 功能概述

本项目实现了微信小程序手机号快速登录功能，用户可以通过微信授权快速获取手机号，无需手动输入，提升用户体验。

## 功能特性

### ✅ 已实现功能

1. **微信手机号授权获取**
   - 使用 `open-type="getPhoneNumber"` 获取用户授权
   - 支持一键获取微信绑定的手机号
   - 自动处理授权成功和失败的情况

2. **云函数解密**
   - 创建了 `decryptPhoneNumber` 云函数
   - 使用微信官方API解密手机号
   - 完善的错误处理和日志记录

3. **登录弹窗系统**
   - 隐私政策弹窗
   - 注册福利弹窗
   - 手机号授权弹窗
   - 完整的登录流程

4. **测试页面**
   - 独立的手机号测试页面
   - 实时显示获取结果
   - 支持重新测试和复制功能

5. **数据存储**
   - 本地存储用户手机号
   - 支持国家代码存储
   - 手机号脱敏显示

## 技术架构

### 前端组件

```
components/login-popup-system/
├── login-popup-system.js    # 登录弹窗系统逻辑
├── login-popup-system.wxml  # 登录弹窗界面
├── login-popup-system.wxss  # 登录弹窗样式
└── login-popup-system.json  # 组件配置
```

### 云函数

```
cloudfunctions/decryptPhoneNumber/
├── index.js                 # 手机号解密逻辑
└── package.json            # 依赖配置
```

### 测试页面

```
pages/phone-test/
├── phone-test.js           # 测试页面逻辑
├── phone-test.wxml         # 测试页面界面
├── phone-test.wxss         # 测试页面样式
└── phone-test.json         # 页面配置
```

## 使用方法

### 1. 在页面中使用登录弹窗系统

```javascript
// 在页面中引入组件
{
  "usingComponents": {
    "login-popup-system": "/components/login-popup-system/login-popup-system"
  }
}

// 在WXML中使用
<login-popup-system 
  showPrivacyPopup="{{showPrivacyPopup}}"
  showBenefitPopup="{{showBenefitPopup}}"
  bind:phoneNumberSuccess="onPhoneNumberSuccess"
  bind:phoneNumberError="onPhoneNumberError"
/>

// 在JS中处理事件
onPhoneNumberSuccess(e) {
  const { phoneNumber, countryCode, maskedPhone } = e.detail;
  console.log('手机号获取成功:', phoneNumber);
  // 处理登录逻辑
}
```

### 2. 直接获取手机号

```javascript
// 在按钮上添加 open-type
<button 
  open-type="getPhoneNumber" 
  bindgetphonenumber="onGetPhoneNumber"
>
  获取手机号
</button>

// 处理获取结果
onGetPhoneNumber(e) {
  if (e.detail.errMsg === 'getPhoneNumber:ok') {
    this.decryptPhoneNumber(e.detail.code);
  }
}

// 解密手机号
async decryptPhoneNumber(code) {
  const result = await wx.cloud.callFunction({
    name: 'decryptPhoneNumber',
    data: { code: code }
  });
  
  if (result.result.success) {
    const { phoneNumber, countryCode } = result.result;
    // 处理成功逻辑
  }
}
```

### 3. 访问测试页面

在首页点击"手机号测试"按钮，或直接访问：
```
/pages/phone-test/phone-test
```

## 错误处理

### 常见错误码

| 错误码 | 说明 | 处理方式 |
|--------|------|----------|
| 40013 | 无效的code | 重新获取授权 |
| 40029 | code已过期 | 重新获取授权 |
| 45011 | 请求过于频繁 | 稍后重试 |
| 40226 | 需要实名认证 | 引导用户完成实名认证 |
| 1400001 | 功能使用次数已达上限 | 联系客服 |

### 错误处理示例

```javascript
// 在云函数中处理错误
catch (error) {
  let errorMessage = '手机号解密失败';
  
  if (error.message.includes('40013')) {
    errorMessage = '无效的code，请重新获取';
  } else if (error.message.includes('40029')) {
    errorMessage = 'code已过期，请重新获取';
  }
  
  return {
    success: false,
    error: errorMessage,
    detail: error.message
  };
}
```

## 安全注意事项

1. **code安全性**
   - code只能使用一次
   - code有效期限制
   - 必须在云函数中解密

2. **数据存储**
   - 手机号本地存储时注意安全
   - 显示时进行脱敏处理
   - 传输时使用HTTPS

3. **权限控制**
   - 云函数需要配置相应权限
   - 前端需要用户主动授权

## 部署说明

### 1. 部署云函数

```bash
# 进入云函数目录
cd cloudfunctions/decryptPhoneNumber

# 安装依赖
npm install

# 部署云函数（通过微信开发者工具或CLI）
```

### 2. 配置小程序

确保在小程序管理后台配置了以下权限：
- 手机号快速验证
- 云开发环境

### 3. 测试功能

1. 在微信开发者工具中预览
2. 点击"手机号测试"按钮
3. 授权获取手机号
4. 查看获取结果

## 更新日志

### v1.0.0 (2024-01-XX)
- ✅ 实现基础手机号获取功能
- ✅ 创建登录弹窗系统
- ✅ 添加云函数解密支持
- ✅ 完善错误处理机制
- ✅ 创建测试页面
- ✅ 添加数据存储功能

## 常见问题

### Q: 为什么获取不到手机号？
A: 请检查以下几点：
1. 用户是否授权了手机号获取权限
2. 云函数是否正确部署
3. 小程序是否配置了手机号快速验证权限
4. code是否有效且未过期

### Q: 如何处理用户拒绝授权？
A: 可以引导用户手动输入手机号，或显示相关说明。

### Q: 手机号获取有次数限制吗？
A: 是的，微信对手机号获取有次数限制，建议合理使用。

## 联系方式

如有问题，请联系开发团队或查看项目文档。 