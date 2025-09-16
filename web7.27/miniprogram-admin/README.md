# 小程序管理后台

一个基于 React + CloudBase 的小程序管理后台系统，提供用户管理、订单管理、预存记录管理和库存管理功能。

## 功能特性

- 📊 **仪表板**: 数据统计和业务概览
- 👥 **用户管理**: 用户列表、搜索、详情查看
- 📦 **订单管理**: 订单列表、状态管理、详情查看
- 💳 **预存记录**: 预存记录管理、添加新记录
- 🛍️ **商品管理**: 商品管理、上下架、库存管理
- 📦 **仓库库存管理**: 库存统计、分类管理、产品列表
- 🎫 **优惠券管理**: 优惠券创建、编辑、状态管理
- 📈 **优惠券分析**: 优惠券使用数据分析

## 技术栈

- **前端**: React 19 + Vite + Tailwind CSS + DaisyUI
- **后端**: 腾讯云开发 (CloudBase)
- **数据库**: CloudBase 数据库
- **图标**: Heroicons

## 环境配置

项目已配置为使用你的 CloudBase 环境：
- 环境ID: `kohin-system-7g8k8x8y5a0b2c4d`

### CloudBase 认证配置

项目支持两种认证方式：

1. **API Key 认证** (推荐)
   - 使用 Publishable Key 进行资源访问
   - 无需登录步骤，访问速度快
   - 适合公开资源访问

2. **匿名登录认证** (默认)
   - 使用默认访客身份进行资源访问
   - 配置简单，无需额外密钥
   - 适合需要用户身份的场景

详细配置说明请参考 [CLOUDBASE_CONFIG.md](./CLOUDBASE_CONFIG.md)

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 构建生产版本：
```bash
npm run build
```

## 数据库集合

系统使用以下数据库集合：

- `users` - 用户信息
- `orders` - 订单信息
- `deposits` - 预存记录
- `products` - 商品信息
- `shopProducts` - 库存产品信息
- `mall_coupons` - 优惠券信息

## 页面说明

### 仪表板 (/)
- 显示用户数、订单数、预存记录数、总收入等统计数据
- 展示最近订单列表

### 用户管理 (/users)
- 用户列表展示
- 用户搜索功能
- 用户详情查看

### 订单管理 (/orders)
- 订单列表展示
- 订单状态筛选
- 订单状态更新（待处理 → 处理中 → 已完成）
- 订单详情查看

### 预存记录 (/deposits)
- 预存记录列表
- 添加新的预存记录
- 记录状态筛选
- 记录详情查看

### 商品管理 (/shop)
- 商品列表展示
- 添加新商品
- 编辑商品信息
- 商品上下架管理
- 商品删除

### 仓库库存管理 (/inventory)
- 库存统计概览（总产品数、在售中、库存不足、产品分类）
- 产品分类和品牌筛选
- 产品搜索功能
- 新增、编辑、删除产品
- 产品状态管理（在售/停售）
- 库存数量管理

### 优惠券管理 (/coupons)
- 优惠券列表展示
- 新增优惠券
- 编辑优惠券信息
- 优惠券状态管理
- 优惠券使用统计

### 优惠券分析 (/coupon-analytics)
- 优惠券使用数据分析
- 优惠券效果统计
- 数据可视化展示

## 开发说明

### 项目结构
```
src/
├── components/     # 组件
│   ├── Layout.jsx
│   └── Sidebar.jsx
├── pages/         # 页面
│   ├── DashboardPage.jsx
│   ├── UsersPage.jsx
│   ├── OrdersPage.jsx
│   ├── DepositsPage.jsx
│   ├── ShopPage.jsx
│   ├── InventoryManagePage.jsx
│   ├── CouponManagePage.jsx
│   └── CouponAnalyticsPage.jsx
├── utils/         # 工具函数
│   └── cloudbase.js
├── App.jsx
└── main.jsx
```

### CloudBase 配置
CloudBase 配置位于以下文件：
- `src/config/cloudbase.js` - 环境配置和认证设置
- `src/utils/cloudStorage.js` - 云存储管理工具
- `src/utils/cloudbase.js` - 数据库连接工具

配置包含：
- 环境ID配置
- API Key 认证配置
- 匿名登录配置
- 数据库连接
- 云存储管理

## 云函数

系统包含以下云函数：

- `initDatabase` - 初始化数据库集合
- `initInventory` - 初始化库存数据库集合

## 部署

项目可以部署到任何支持静态网站的平台上：

1. 构建项目：
```bash
npm run build
```

2. 将 `dist` 目录部署到你的服务器或 CDN

## 注意事项

- 确保 CloudBase 环境已正确配置
- 数据库集合需要适当的权限设置
- 建议在生产环境中添加用户认证和权限控制
- 库存管理功能与小程序后台数据保持一致

## 许可证

MIT License
