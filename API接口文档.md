# API接口文档

## 接口概述

本文档描述了商城系统中所有云函数的API接口规范，包括请求参数、响应格式、错误码等详细信息。

### 统一响应格式

所有API接口都遵循统一的响应格式：

```javascript
{
  "success": Boolean,      // 操作是否成功
  "data": Object,          // 返回数据
  "message": String,       // 消息描述
  "code": Number,          // 错误码（可选）
  "timestamp": Number      // 时间戳
}
```

### 统一错误码

| 错误码 | 描述 | 说明 |
|--------|------|------|
| 200 | 成功 | 操作成功 |
| 400 | 参数错误 | 请求参数不正确 |
| 401 | 未授权 | 用户未登录或权限不足 |
| 403 | 禁止访问 | 没有访问权限 |
| 404 | 资源不存在 | 请求的资源不存在 |
| 500 | 服务器错误 | 内部服务器错误 |

## 认证相关接口

### 1. 用户登录

**云函数名称：** `login`

**描述：** 微信小程序用户登录，获取用户OpenID和基本信息

**请求参数：**
```javascript
{
  "code": String,          // 微信登录code
  "userInfo": {            // 用户信息（可选）
    "nickName": String,
    "avatarUrl": String,
    "gender": Number,
    "city": String,
    "province": String,
    "country": String
  }
}
```

**响应示例：**
```javascript
{
  "success": true,
  "data": {
    "openid": "oXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "unionid": "uXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "appid": "wxXXXXXXXXXXXXXXXX",
    "user": {
      "_id": "60f1234567890abcdef12345",
      "openid": "oXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "nickName": "用户昵称",
      "avatarUrl": "https://...",
      "points": 100,
      "balance": 50.00,
      "vipLevel": 1
    }
  },
  "message": "登录成功",
  "timestamp": 1625097600000
}
```

### 2. 管理员登录

**云函数名称：** `adminLogin`

**描述：** 管理员登录验证

**请求参数：**
```javascript
{
  "username": String,      // 管理员用户名
  "password": String       // 密码
}
```

**响应示例：**
```javascript
{
  "success": true,
  "data": {
    "admin": {
      "_id": "60f1234567890abcdef12345",
      "username": "admin",
      "name": "管理员",
      "role": "super_admin",
      "permissions": ["user_manage", "order_manage"]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "登录成功",
  "timestamp": 1625097600000
}
```

## 商品相关接口

### 1. 获取商城商品列表

**云函数名称：** `getShopProducts`

**描述：** 获取商城商品列表，支持分类筛选和分页

**请求参数：**
```javascript
{
  "category": String,      // 商品分类（可选）
  "onSale": Boolean,       // 是否上架（可选）
  "page": Number,          // 页码，默认1
  "limit": Number,         // 每页数量，默认10
  "keyword": String,       // 搜索关键词（可选）
  "sortBy": String,        // 排序字段（可选）
  "sortOrder": String      // 排序方向：asc/desc（可选）
}
```

**响应示例：**
```javascript
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "60f1234567890abcdef12345",
        "name": "商品名称",
        "description": "商品描述",
        "category": "电子产品",
        "price": 99.99,
        "originalPrice": 129.99,
        "stock": 100,
        "images": ["https://...", "https://..."],
        "onSale": true,
        "isRecommended": false,
        "saleCount": 50,
        "rating": 4.5,
        "createTime": "2021-07-16T08:00:00.000Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "categories": ["电子产品", "服装", "食品"]
  },
  "message": "获取成功",
  "timestamp": 1625097600000
}
```

### 2. 获取商品详情

**云函数名称：** `getProductDetail`

**描述：** 获取单个商品的详细信息

**请求参数：**
```javascript
{
  "productId": String      // 商品ID
}
```

**响应示例：**
```javascript
{
  "success": true,
  "data": {
    "_id": "60f1234567890abcdef12345",
    "name": "商品名称",
    "description": "详细描述",
    "category": "电子产品",
    "price": 99.99,
    "originalPrice": 129.99,
    "stock": 100,
    "images": ["https://..."],
    "specifications": {
      "颜色": "黑色",
      "尺寸": "M",
      "重量": "500g"
    },
    "onSale": true,
    "saleCount": 50,
    "rating": 4.5,
    "reviews": [
      {
        "userId": "user123",
        "rating": 5,
        "comment": "很好的商品",
        "createTime": "2021-07-16T08:00:00.000Z"
      }
    ]
  },
  "message": "获取成功",
  "timestamp": 1625097600000
}
```

### 3. 初始化商城商品

**云函数名称：** `initShopProducts`

**描述：** 从基础商品库同步商品到商城（管理员功能）

**请求参数：**
```javascript
{
  "productIds": [String],  // 要同步的商品ID数组
  "defaultOnSale": Boolean // 默认是否上架
}
```

**响应示例：**
```javascript
{
  "success": true,
  "data": {
    "syncedCount": 5,
    "skippedCount": 2,
    "syncedProducts": [
      {
        "productId": "60f1234567890abcdef12345",
        "name": "商品名称",
        "status": "synced"
      }
    ]
  },
  "message": "同步完成",
  "timestamp": 1625097600000
}
```

## 订单相关接口

### 1. 提交订单

**云函数名称：** `submitOrder`

**描述：** 用户提交订单

**请求参数：**
```javascript
{
  "type": String,          // 订单类型：mall/backend
  "customerId": String,    // 客户ID（后台订单）
  "items": [               // 订单商品
    {
      "productId": String,
      "quantity": Number,
      "specifications": Object
    }
  ],
  "shippingAddress": {     // 收货地址
    "name": String,
    "phone": String,
    "province": String,
    "city": String,
    "district": String,
    "detail": String
  },
  "paymentMethod": String, // 支付方式
  "couponId": String,      // 优惠券ID（可选）
  "notes": String          // 备注（可选）
}
```

**响应示例：**
```javascript
{
  "success": true,
  "data": {
    "orderId": "60f1234567890abcdef12345",
    "orderNo": "ORD202107160001",
    "totalAmount": 199.98,
    "discountAmount": 20.00,
    "finalAmount": 179.98,
    "status": "pending_payment",
    "paymentInfo": {
      "prepayId": "wx123456789",
      "timeStamp": "1625097600",
      "nonceStr": "abc123",
      "package": "prepay_id=wx123456789",
      "signType": "MD5",
      "paySign": "signature"
    }
  },
  "message": "订单创建成功",
  "timestamp": 1625097600000
}
```

### 2. 获取订单列表

**云函数名称：** `getOrders`

**描述：** 获取用户订单列表

**请求参数：**
```javascript
{
  "status": String,        // 订单状态（可选）
  "page": Number,          // 页码，默认1
  "limit": Number,         // 每页数量，默认10
  "startDate": String,     // 开始日期（可选）
  "endDate": String        // 结束日期（可选）
}
```

**响应示例：**
```javascript
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "60f1234567890abcdef12345",
        "orderNo": "ORD202107160001",
        "items": [
          {
            "productId": "60f1234567890abcdef12345",
            "name": "商品名称",
            "price": 99.99,
            "quantity": 2,
            "subtotal": 199.98
          }
        ],
        "totalAmount": 199.98,
        "finalAmount": 179.98,
        "status": "shipped",
        "createTime": "2021-07-16T08:00:00.000Z",
        "shipTime": "2021-07-17T08:00:00.000Z",
        "trackingNumber": "SF1234567890"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  },
  "message": "获取成功",
  "timestamp": 1625097600000
}
```

### 3. 更新订单状态

**云函数名称：** `updateOrderStatus`

**描述：** 更新订单状态（管理员功能）

**请求参数：**
```javascript
{
  "orderId": String,       // 订单ID
  "status": String,        // 新状态
  "trackingNumber": String, // 快递单号（可选）
  "notes": String          // 备注（可选）
}
```

**响应示例：**
```javascript
{
  "success": true,
  "data": {
    "orderId": "60f1234567890abcdef12345",
    "oldStatus": "paid",
    "newStatus": "shipped",
    "updateTime": "2021-07-16T08:00:00.000Z"
  },
  "message": "状态更新成功",
  "timestamp": 1625097600000
}
```

## 用户相关接口

### 1. 获取用户积分

**云函数名称：** `getUserPoints`

**描述：** 获取用户积分信息

**请求参数：**
```javascript
{
  "userId": String         // 用户ID（可选，默认当前用户）
}
```

**响应示例：**
```javascript
{
  "success": true,
  "data": {
    "userId": "oXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "points": 1500,
    "totalEarned": 2000,
    "totalSpent": 500,
    "level": "银牌会员",
    "nextLevelPoints": 2500,
    "pointsToNext": 1000,
    "recentTransactions": [
      {
        "type": "earn",
        "amount": 100,
        "reason": "购物消费",
        "createTime": "2021-07-16T08:00:00.000Z"
      }
    ]
  },
  "message": "获取成功",
  "timestamp": 1625097600000
}
```

### 2. 添加积分

**云函数名称：** `addPoints`

**描述：** 为用户添加积分（管理员功能）

**请求参数：**
```javascript
{
  "userId": String,        // 用户ID
  "points": Number,        // 积分数量
  "reason": String,        // 添加原因
  "orderId": String        // 关联订单ID（可选）
}
```

**响应示例：**
```javascript
{
  "success": true,
  "data": {
    "userId": "oXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "pointsBefore": 1000,
    "pointsAdded": 100,
    "pointsAfter": 1100,
    "transactionId": "60f1234567890abcdef12345"
  },
  "message": "积分添加成功",
  "timestamp": 1625097600000
}
```

## 客户管理接口

### 1. 添加预存

**云函数名称：** `addPrestore`

**描述：** 为客户添加预存金额

**请求参数：**
```javascript
{
  "customerId": String,    // 客户ID
  "amount": Number,        // 预存金额
  "paymentMethod": String, // 支付方式
  "notes": String,         // 备注
  "operatorId": String     // 操作员ID
}
```

**响应示例：**
```javascript
{
  "success": true,
  "data": {
    "recordId": "60f1234567890abcdef12345",
    "customerId": "60f1234567890abcdef12345",
    "amount": 500.00,
    "balanceBefore": 100.00,
    "balanceAfter": 600.00,
    "transactionNo": "PRE202107160001",
    "createTime": "2021-07-16T08:00:00.000Z"
  },
  "message": "预存添加成功",
  "timestamp": 1625097600000
}
```

### 2. 获取客户列表

**云函数名称：** `getCustomers`

**描述：** 获取客户列表

**请求参数：**
```javascript
{
  "keyword": String,       // 搜索关键词（可选）
  "page": Number,          // 页码，默认1
  "limit": Number,         // 每页数量，默认10
  "sortBy": String,        // 排序字段（可选）
  "sortOrder": String      // 排序方向（可选）
}
```

**响应示例：**
```javascript
{
  "success": true,
  "data": {
    "customers": [
      {
        "_id": "60f1234567890abcdef12345",
        "name": "张三",
        "phone": "13800138000",
        "address": "北京市朝阳区",
        "prepaidBalance": 500.00,
        "totalSpent": 2000.00,
        "orderCount": 15,
        "lastOrderTime": "2021-07-16T08:00:00.000Z",
        "createTime": "2021-01-01T08:00:00.000Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  },
  "message": "获取成功",
  "timestamp": 1625097600000
}
```

## 内容管理接口

### 1. 获取轮播图

**云函数名称：** `getBanners`

**描述：** 获取首页轮播图列表

**请求参数：**
```javascript
{
  "position": String,      // 位置：home/category（可选）
  "isActive": Boolean      // 是否启用（可选）
}
```

**响应示例：**
```javascript
{
  "success": true,
  "data": {
    "banners": [
      {
        "_id": "60f1234567890abcdef12345",
        "title": "夏季大促销",
        "imageUrl": "https://...",
        "linkType": "product",
        "linkValue": "60f1234567890abcdef12345",
        "sortOrder": 1,
        "isActive": true,
        "startTime": "2021-07-01T00:00:00.000Z",
        "endTime": "2021-07-31T23:59:59.000Z"
      }
    ]
  },
  "message": "获取成功",
  "timestamp": 1625097600000
}
```

### 2. 管理轮播图

**云函数名称：** `manageBanners`

**描述：** 添加、更新或删除轮播图（管理员功能）

**请求参数：**
```javascript
{
  "action": String,        // 操作类型：add/update/delete
  "bannerId": String,      // 轮播图ID（更新/删除时必需）
  "bannerData": {          // 轮播图数据（添加/更新时必需）
    "title": String,
    "imageUrl": String,
    "linkType": String,
    "linkValue": String,
    "sortOrder": Number,
    "isActive": Boolean,
    "startTime": String,
    "endTime": String
  }
}
```

**响应示例：**
```javascript
{
  "success": true,
  "data": {
    "bannerId": "60f1234567890abcdef12345",
    "action": "add",
    "banner": {
      "_id": "60f1234567890abcdef12345",
      "title": "夏季大促销",
      "imageUrl": "https://...",
      "createTime": "2021-07-16T08:00:00.000Z"
    }
  },
  "message": "操作成功",
  "timestamp": 1625097600000
}
```

### 3. 首页配置管理

**云函数名称：** `manageHomepageConfig`

**描述：** 管理首页配置信息

**请求参数：**
```javascript
{
  "action": String,        // 操作类型：get/update
  "config": {              // 配置数据（更新时必需）
    "promotionTitle": String,
    "promotionSubtitle": String,
    "promotionPrice": Number,
    "giftDescription": String,
    "isPromotionActive": Boolean,
    "theme": {
      "primaryColor": String,
      "secondaryColor": String,
      "backgroundColor": String
    }
  }
}
```

**响应示例：**
```javascript
{
  "success": true,
  "data": {
    "config": {
      "promotionTitle": "限时特惠",
      "promotionSubtitle": "全场8折起",
      "promotionPrice": 99.99,
      "giftDescription": "满200送精美礼品",
      "isPromotionActive": true,
      "theme": {
        "primaryColor": "#ff6b6b",
        "secondaryColor": "#4ecdc4",
        "backgroundColor": "#f8f9fa"
      },
      "updateTime": "2021-07-16T08:00:00.000Z"
    }
  },
  "message": "操作成功",
  "timestamp": 1625097600000
}
```

## 系统管理接口

### 1. 创建数据库集合

**云函数名称：** `createCollection`

**描述：** 动态创建数据库集合（系统初始化）

**请求参数：**
```javascript
{
  "collectionName": String, // 集合名称
  "indexes": [             // 索引配置（可选）
    {
      "fields": Object,
      "options": Object
    }
  ],
  "initialData": [Object]  // 初始数据（可选）
}
```

**响应示例：**
```javascript
{
  "success": true,
  "data": {
    "collectionName": "newCollection",
    "created": true,
    "indexesCreated": 2,
    "initialDataInserted": 5
  },
  "message": "集合创建成功",
  "timestamp": 1625097600000
}
```

### 2. 获取COS临时密钥

**云函数名称：** `getCosSts`

**描述：** 获取腾讯云COS临时访问密钥

**请求参数：**
```javascript
{
  "action": String,        // 操作类型：upload/download
  "bucket": String,        // 存储桶名称（可选）
  "region": String,        // 地域（可选）
  "prefix": String         // 路径前缀（可选）
}
```

**响应示例：**
```javascript
{
  "success": true,
  "data": {
    "credentials": {
      "tmpSecretId": "AKID...",
      "tmpSecretKey": "...",
      "sessionToken": "..."
    },
    "expiredTime": 1625101200,
    "expiration": "2021-07-01T09:00:00Z",
    "bucket": "my-bucket-1234567890",
    "region": "ap-beijing"
  },
  "message": "获取成功",
  "timestamp": 1625097600000
}
```

## 调用示例

### 小程序端调用

```javascript
// 调用云函数
wx.cloud.callFunction({
  name: 'getShopProducts',
  data: {
    category: '电子产品',
    page: 1,
    limit: 10
  }
}).then(res => {
  if (res.result.success) {
    console.log('商品列表：', res.result.data.products)
  } else {
    console.error('获取失败：', res.result.message)
  }
}).catch(err => {
  console.error('调用失败：', err)
})
```

### Web端调用

```javascript
// 使用腾讯云开发Web SDK
import tcb from '@cloudbase/js-sdk'

const app = tcb.init({
  env: 'your-env-id'
})

// 调用云函数
app.callFunction({
  name: 'getShopProducts',
  data: {
    category: '电子产品',
    page: 1,
    limit: 10
  }
}).then(res => {
  if (res.result.success) {
    console.log('商品列表：', res.result.data.products)
  } else {
    console.error('获取失败：', res.result.message)
  }
}).catch(err => {
  console.error('调用失败：', err)
})
```

### 错误处理

```javascript
// 统一错误处理函数
const handleApiResponse = (response) => {
  if (response.result.success) {
    return response.result.data
  } else {
    const error = new Error(response.result.message)
    error.code = response.result.code
    throw error
  }
}

// 使用示例
try {
  const res = await wx.cloud.callFunction({
    name: 'getShopProducts',
    data: { page: 1, limit: 10 }
  })
  
  const data = handleApiResponse(res)
  console.log('获取成功：', data)
} catch (error) {
  console.error('操作失败：', error.message)
  
  // 根据错误码进行不同处理
  switch (error.code) {
    case 401:
      // 跳转到登录页
      wx.navigateTo({ url: '/pages/login/login' })
      break
    case 403:
      wx.showToast({ title: '权限不足', icon: 'none' })
      break
    default:
      wx.showToast({ title: error.message, icon: 'none' })
  }
}
```

## 接口测试

### 测试工具推荐

1. **微信开发者工具** - 小程序端测试
2. **Postman** - API接口测试
3. **云开发控制台** - 云函数调试

### 测试用例示例

```javascript
// 测试用例：用户登录
const testLogin = async () => {
  const testCases = [
    {
      name: '正常登录',
      data: {
        code: 'valid_wx_code',
        userInfo: {
          nickName: '测试用户',
          avatarUrl: 'https://...',
          gender: 1
        }
      },
      expected: {
        success: true,
        hasOpenid: true
      }
    },
    {
      name: '无效code',
      data: {
        code: 'invalid_code'
      },
      expected: {
        success: false,
        code: 400
      }
    }
  ]
  
  for (const testCase of testCases) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: testCase.data
      })
      
      console.log(`测试 ${testCase.name}:`, 
        result.result.success === testCase.expected.success ? '通过' : '失败'
      )
    } catch (error) {
      console.error(`测试 ${testCase.name} 异常:`, error)
    }
  }
}
```

## 性能优化建议

### 1. 请求优化

- 合理使用分页，避免一次性获取大量数据
- 使用缓存减少重复请求
- 批量操作接口减少网络请求次数

### 2. 数据传输优化

- 只返回必要的字段
- 使用数据压缩
- 图片使用CDN和适当的格式

### 3. 错误处理

- 实现重试机制
- 提供友好的错误提示
- 记录详细的错误日志

这个API文档为开发团队提供了完整的接口规范，确保前后端开发的一致性和规范性。