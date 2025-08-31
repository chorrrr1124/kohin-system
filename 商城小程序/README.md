# 商城小程序

## 📱 项目简介

这是一个基于微信小程序和腾讯云开发的综合性电商平台，提供完整的购物体验和用户管理系统。

## 🎯 项目特性

- 🛒 **完整电商功能**：商品展示、购物车、订单管理
- 👤 **用户系统**：登录注册、个人信息管理
- 🔐 **安全认证**：微信授权、手机号验证
- 📊 **数据管理**：云数据库、云函数
- 🎨 **现代化UI**：Tailwind CSS 样式系统
- 📱 **响应式设计**：适配各种屏幕尺寸

## 🚀 核心功能

### 1. 商品展示
- 商品列表展示
- 商品详情页面
- 商品分类管理
- 商品搜索功能

### 2. 购物车
- 添加商品到购物车
- 购物车商品管理
- 商品数量修改
- 购物车结算

### 3. 用户中心
- 用户登录注册
- 个人信息管理
- 订单管理
- 收货地址管理

### 4. 订单系统
- 订单创建
- 订单支付
- 订单状态跟踪
- 订单历史记录

### 5. 登录弹窗系统
- 隐私政策确认
- 注册福利展示
- 手机号快速验证
- 一键登录功能

## 🛠️ 技术架构

### 前端技术栈
- **框架**：微信小程序原生框架
- **样式**：Tailwind CSS + WXSS
- **状态管理**：小程序原生数据绑定
- **组件化**：自定义组件系统

### 后端技术栈
- **云开发**：腾讯云开发平台
- **数据库**：云数据库 (NoSQL)
- **云函数**：Node.js 服务端逻辑
- **存储**：云存储文件管理

### 核心组件

#### 登录弹窗系统 (`components/login-popup-system/`)
```
├── login-popup-system.wxml    # 弹窗模板
├── login-popup-system.js      # 弹窗逻辑
├── login-popup-system.wxss    # 弹窗样式
└── login-popup-system.json    # 组件配置
```

#### 云函数 (`cloudfunctions/`)
```
├── decryptPhoneNumber/        # 手机号解密
├── userLogin/                 # 用户登录
├── getProductList/            # 获取商品列表
└── createOrder/               # 创建订单
```

## 📁 项目结构

```
商城小程序/
├── components/                # 自定义组件
│   ├── login-popup-system/    # 登录弹窗系统
│   └── product-card/          # 商品卡片组件
├── pages/                     # 页面文件
│   ├── index/                 # 首页
│   ├── product/               # 商品详情
│   ├── cart/                  # 购物车
│   └── user/                  # 用户中心
├── cloudfunctions/            # 云函数
│   ├── decryptPhoneNumber/    # 手机号解密
│   └── userLogin/             # 用户登录
├── utils/                     # 工具函数
├── images/                    # 图片资源
├── docs/                      # 文档
│   └── phone-number-integration.md  # 手机号获取文档
├── app.js                     # 小程序入口
├── app.json                   # 小程序配置
├── app.wxss                   # 全局样式
└── project.config.json        # 项目配置
```

## 🔧 开发环境

### 环境要求
- 微信开发者工具
- Node.js 14+
- 微信小程序基础库 2.21.2+

### 安装依赖
```bash
npm install
```

### 开发调试
1. 打开微信开发者工具
2. 导入项目
3. 配置云开发环境
4. 开始开发调试

## 📱 手机号获取功能

### 功能说明
本项目集成了微信小程序手机号快速验证组件，提供安全便捷的用户身份验证。

### 技术实现
- 使用 `open-type="getPhoneNumber"` 按钮
- 云函数解密手机号数据
- 完整的错误处理机制

### 详细文档
请参考：[手机号获取功能开发文档](./docs/phone-number-integration.md)

## 🚀 部署说明

### 云函数部署
```bash
# 在微信开发者工具中右键云函数
# 选择"上传并部署：云端安装依赖"
```

### 小程序发布
1. 提交代码审核
2. 发布正式版本
3. 监控功能使用情况

## 📊 数据库设计

### 用户表 (users)
```javascript
{
  _id: "用户ID",
  openid: "微信OpenID",
  phoneNumber: "手机号",
  nickname: "昵称",
  avatar: "头像",
  createTime: "创建时间",
  updateTime: "更新时间"
}
```

### 商品表 (products)
```javascript
{
  _id: "商品ID",
  name: "商品名称",
  price: "价格",
  description: "描述",
  images: ["图片数组"],
  category: "分类",
  stock: "库存",
  status: "状态"
}
```

### 订单表 (orders)
```javascript
{
  _id: "订单ID",
  userId: "用户ID",
  products: ["商品列表"],
  totalAmount: "总金额",
  status: "订单状态",
  createTime: "创建时间",
  updateTime: "更新时间"
}
```

## 🔒 安全特性

### 数据安全
- 手机号数据仅在服务端解密
- 使用HTTPS传输
- 定期清理过期数据

### 用户隐私
- 明确告知数据使用目的
- 提供拒绝授权选项
- 遵守隐私保护法规

## 📈 监控统计

### 使用统计
- 手机号获取成功率
- 用户登录转化率
- 功能使用频率

### 性能监控
- 云函数调用耗时
- 数据库查询性能
- 页面加载速度

## 🤝 技术支持

### 文档资源
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [腾讯云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

### 问题反馈
如遇到问题，请参考：
1. 微信开发者社区
2. 云开发控制台日志
3. 小程序后台数据分析

## 📄 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

---

**注意**：本项目基于微信小程序和腾讯云开发构建，请确保符合相关平台的使用规范。 