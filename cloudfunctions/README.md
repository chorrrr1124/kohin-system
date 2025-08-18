# 腾讯云COS图片存储配置指南

## 当前问题状态

根据调试日志显示的错误：`getAuthorization callback params missing "TmpSecretId"`，问题的根本原因是：

1. **云函数未正确部署** - 需要部署到腾讯云开发环境
2. **环境变量未配置** - 缺少腾讯云密钥配置
3. **本地开发环境限制** - PowerShell执行策略限制了tcb-cli运行

## 解决方案

### 方案1：完整部署（推荐）

#### 1. 安装并配置tcb-cli

```bash
# 使用npm安装（如果遇到PowerShell限制，请使用管理员权限运行）
npm install -g @cloudbase/cli

# 或使用yarn
yarn global add @cloudbase/cli
```

#### 2. 登录腾讯云开发

```bash
tcb login
```

#### 3. 部署云函数

```bash
# 在cloudfunctions目录下执行
tcb functions:deploy
```

#### 4. 配置环境变量

1. 登录 [腾讯云开发控制台](https://console.cloud.tencent.com/tcb)
2. 选择环境：`cloudbase-3g4w6lls8a5ce59b`
3. 进入「云函数」管理
4. 分别为 `getCosSts` 和 `uploadImageToCos` 函数配置环境变量：
   - `TENCENTCLOUD_SECRETID`: 您的腾讯云SecretId
   - `TENCENTCLOUD_SECRETKEY`: 您的腾讯云SecretKey

### 方案2：本地测试（临时解决）

如果暂时无法部署云函数，系统已经配置了降级处理：

1. 当云函数调用失败时，会自动使用测试凭证
2. 这样可以测试前端上传流程是否正常
3. 但实际文件不会上传到COS（因为凭证无效）

### 方案3：手动部署

如果tcb-cli安装有问题，可以手动部署：

1. 登录 [腾讯云开发控制台](https://console.cloud.tencent.com/tcb)
2. 选择环境：`cloudbase-3g4w6lls8a5ce59b`
3. 进入「云函数」管理
4. 点击「新建云函数」
5. 函数名称：`getCosSts`
6. 运行环境：`Node.js 16.13`
7. 复制 `cloudfunctions/getCosSts/index.js` 的内容到在线编辑器
8. 在「高级配置」中添加环境变量
9. 保存并部署

## 获取腾讯云密钥

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 进入「访问管理」→「API密钥管理」
3. 创建或查看现有的SecretId和SecretKey
4. 确保该密钥具有以下权限：
   - **COS存储桶权限**：
     - `cos:PutObject` - 上传文件
     - `cos:GetObject` - 读取文件
     - `cos:PostObject` - 表单上传
   - **STS权限**：
     - `sts:AssumeRole` - 获取临时密钥

## COS存储桶配置

确保您的COS存储桶配置正确：

### 基本配置
- **存储桶名称**: `kohin-1327524326`
- **地域**: `ap-guangzhou`
- **访问权限**: 公有读私有写

### CORS配置（重要！）

**当前错误 "CORS blocked or network error" 的解决方案：**

在COS控制台的「基础配置」→「跨域访问CORS设置」中添加：

#### 开发环境CORS配置：
```json
{
  "AllowedOrigins": [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://your-domain.com"
  ],
  "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
  "AllowedHeaders": [
    "*",
    "Content-Type",
    "Content-MD5",
    "Content-Disposition",
    "Date",
    "Expect",
    "Host",
    "x-cos-*",
    "Authorization"
  ],
  "ExposeHeaders": [
    "ETag",
    "x-cos-request-id",
    "x-cos-version-id"
  ],
  "MaxAgeSeconds": 3600
}
```

#### 生产环境CORS配置：
```json
{
  "AllowedOrigins": ["https://your-production-domain.com"],
  "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag", "x-cos-request-id"],
  "MaxAgeSeconds": 3600
}
```

## 测试步骤

1. **访问测试页面**：http://localhost:5173/test-cos-upload

2. **测试云开发连接**：
   - 点击「测试云开发连接」按钮
   - 查看调试日志中的连接状态
   - 确认用户登录和云函数调用结果

3. **测试文件上传**：
   - 选择一个图片文件
   - 点击「上传文件」按钮
   - 观察上传过程和结果

## 常见错误及解决方案

### 错误1: CORS跨域错误（当前主要问题）
```
CORS blocked or network error
```
**问题原因：**
- COS存储桶未配置正确的CORS规则
- 本地开发环境域名未在允许列表中

**详细解决步骤：**
1. 登录腾讯云控制台
2. 进入对象存储COS -> 存储桶列表
3. 找到存储桶 `kohin-1327524326`
4. 点击「基础配置」-> 「跨域访问CORS设置」
5. 添加上述开发环境CORS配置
6. 保存配置后等待1-2分钟生效

**验证方法：**
```javascript
// 在浏览器控制台测试
fetch('https://kohin-1327524326.cos.ap-guangzhou.myqcloud.com/', {
  method: 'OPTIONS'
}).then(response => {
  console.log('CORS配置正常:', response.headers);
}).catch(error => {
  console.error('CORS配置有问题:', error);
});
```

### 错误2: "getAuthorization callback params missing TmpSecretId"
**原因**: 云函数返回的数据格式不正确或云函数调用失败
**解决**: 
1. 检查云函数是否正确部署
2. 确认环境变量是否正确配置
3. 查看云函数执行日志

### 错误3: "云函数调用失败"
**原因**: 云函数未部署或网络问题
**解决**: 
1. 重新部署云函数
2. 检查网络连接
3. 确认云开发环境ID正确

### 错误4: "权限不足"
**原因**: 腾讯云密钥权限不足
**解决**: 
1. 为密钥添加COS和STS相关权限
2. 检查存储桶访问策略
3. 确认密钥未过期

## PowerShell执行策略问题

如果遇到PowerShell执行策略限制：

```powershell
# 以管理员身份运行PowerShell，然后执行：
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 或者临时绕过：
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

## 调试技巧

1. **使用测试页面**：专门的调试界面，显示详细日志
2. **查看浏览器控制台**：包含完整的错误堆栈
3. **检查云函数日志**：在腾讯云开发控制台查看
4. **网络检查**：确认能正常访问腾讯云服务

## 下一步计划

1. **完成云函数部署**：解决PowerShell限制，正确部署云函数
2. **配置生产环境**：设置正确的腾讯云密钥和权限
3. **测试完整流程**：从上传到显示的端到端测试
4. **优化用户体验**：改进错误提示和加载状态

## 联系支持

如果按照以上步骤仍无法解决问题，请提供：
1. 浏览器控制台的完整错误日志
2. 云函数执行日志（如果已部署）
3. COS存储桶配置截图
4. 腾讯云密钥权限配置截图
5. PowerShell执行策略设置