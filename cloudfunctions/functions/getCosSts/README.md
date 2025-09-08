# getCosSts 云函数

这是一个用于获取腾讯云COS临时密钥的云函数，用于前端直接上传文件到COS。

## 功能说明

- 获取腾讯云COS的临时访问密钥（STS Token）
- 支持文件上传、下载、删除等操作权限
- 临时密钥有效期30分钟
- 返回完整的COS配置信息

## 环境变量配置

在腾讯云控制台的云函数环境变量中配置以下参数：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `TENCENT_SECRET_ID` | 腾讯云API密钥ID | `AKIDxxxxxxxxxxxxxxxx` |
| `TENCENT_SECRET_KEY` | 腾讯云API密钥Key | `xxxxxxxxxxxxxxxxxxxxxxxx` |
| `COS_BUCKET` | COS存储桶名称 | `your-bucket-name-1234567890` |
| `COS_REGION` | COS存储桶地域 | `ap-guangzhou` |

## 配置步骤

1. **获取腾讯云API密钥**
   - 登录腾讯云控制台
   - 进入「访问管理」→「API密钥管理」
   - 创建或查看现有的SecretId和SecretKey

2. **创建COS存储桶**
   - 进入「对象存储COS」控制台
   - 创建存储桶，记录存储桶名称和地域

3. **部署云函数**
   - 将整个getCosSts文件夹上传到腾讯云云开发控制台
   - 或使用CloudBase CLI部署：`tcb fn deploy getCosSts`

4. **配置环境变量**
   - 在云函数详情页面的「环境变量」中添加上述4个变量

## 返回数据格式

成功时返回：
```json
{
  "success": true,
  "data": {
    "credentials": {
      "tmpSecretId": "临时密钥ID",
      "tmpSecretKey": "临时密钥Key",
      "sessionToken": "会话令牌"
    },
    "expiredTime": 1234567890,
    "expiration": "2024-01-01T12:00:00.000Z",
    "bucket": "存储桶名称",
    "region": "存储桶地域",
    "cosConfig": {
      "Bucket": "存储桶名称",
      "Region": "存储桶地域"
    }
  }
}
```

失败时返回：
```json
{
  "success": false,
  "error": "错误信息",
  "message": "详细说明"
}
```

## 前端使用示例

```javascript
// 获取临时密钥
const getStsCredentials = async () => {
  try {
    const result = await wx.cloud.callFunction({
      name: 'getCosSts'
    });
    
    if (result.result.success) {
      const { credentials, bucket, region } = result.result.data;
      
      // 使用临时密钥初始化COS SDK
      const cos = new COS({
        SecretId: credentials.tmpSecretId,
        SecretKey: credentials.tmpSecretKey,
        SecurityToken: credentials.sessionToken,
      });
      
      return { cos, bucket, region };
    } else {
      throw new Error(result.result.error);
    }
  } catch (error) {
    console.error('获取临时密钥失败:', error);
    throw error;
  }
};
```

## 注意事项

1. **安全性**：不要在前端代码中硬编码API密钥
2. **权限控制**：建议为云函数创建专门的子账号，只授予必要的COS权限
3. **有效期**：临时密钥有效期为30分钟，需要在过期前重新获取
4. **错误处理**：前端调用时要做好错误处理和重试机制

## 依赖说明

- `qcloud-cos-sts`: 腾讯云COS STS SDK，版本 ^3.1.0
- Node.js版本要求: >=12.0.0

## 故障排除

1. **环境变量未配置**：检查云函数环境变量是否正确设置
2. **权限不足**：确认API密钥对应的账号有COS相关权限
3. **存储桶不存在**：确认存储桶名称和地域配置正确
4. **网络问题**：检查云函数网络配置和超时设置