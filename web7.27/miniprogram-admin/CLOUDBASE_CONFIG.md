# CloudBase 配置说明

## 概述

本项目支持两种 CloudBase 认证方式：

1. **API Key 认证** - 使用 Publishable Key 进行资源访问
2. **匿名登录认证** - 使用默认访客身份进行资源访问

## 配置方式

### 方式一：环境变量配置（推荐）

创建 `.env.local` 文件：

```bash
# CloudBase 环境ID
VUE_APP_CLOUDBASE_ENV=kohin-system-7g8k8x8y5a0b2c4d

# 是否启用 CloudBase API Key 认证
VUE_APP_ENABLE_CLOUDBASE_API_KEY=false

# CloudBase Publishable Key (仅在启用 API Key 认证时需要)
VUE_APP_CLOUDBASE_PUBLISHABLE_KEY=your-publishable-key-here

# 是否启用匿名登录 (默认启用)
VUE_APP_ENABLE_ANONYMOUS_AUTH=true
```

### 方式二：直接修改配置文件

编辑 `src/config/cloudbase.js` 文件：

```javascript
export const CLOUDBASE_CONFIG = {
  env: 'kohin-system-7g8k8x8y5a0b2c4d',
  publishableKey: 'your-publishable-key-here', // 填入你的 Publishable Key
  enableApiKey: true, // 设置为 true 启用 API Key 认证
  enableAnonymousAuth: false, // 设置为 false 禁用匿名登录
};
```

## 获取 Publishable Key

1. 登录 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 选择你的环境
3. 进入 **系统配置** -> **API Key 配置**
4. 在 **客户端 Publishable key** 部分点击 **生成**
5. 复制生成的 JWT 格式密钥

## 认证方式对比

| 认证方式 | 优点 | 缺点 | 适用场景 |
|---------|------|------|----------|
| API Key | 无需登录步骤，访问速度快 | 需要配置密钥 | 公开资源访问 |
| 匿名登录 | 配置简单，无需额外密钥 | 需要登录步骤 | 需要用户身份的场景 |

## 安全注意事项

- **Publishable Key** 可以暴露在浏览器中，但请确保只用于访问公开资源
- **服务端 API Key** 绝对不能暴露在客户端代码中
- 建议在生产环境中使用环境变量管理敏感配置

## 故障排除

### 1. 初始化失败
- 检查环境ID是否正确
- 检查网络连接是否正常
- 查看浏览器控制台错误信息

### 2. API Key 认证失败
- 检查 Publishable Key 是否正确
- 确认 API Key 配置页面中已启用相应权限
- 检查环境变量是否正确加载

### 3. 匿名登录失败
- 检查是否启用了匿名登录
- 确认 CloudBase 环境配置正确
- 查看控制台错误信息

## 相关文档

- [CloudBase API Key 配置文档](https://docs.cloudbase.net/api-reference/webv3/api-key)
- [CloudBase Web SDK 文档](https://docs.cloudbase.net/storage/sdk)
- [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
