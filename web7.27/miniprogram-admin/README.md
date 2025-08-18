# 小程序管理后台

一个基于 React + CloudBase 的小程序管理后台系统，提供用户管理、订单管理、预存记录管理和商城管理功能。

## 功能特性

- 📊 **仪表板**: 数据统计和业务概览
- 👥 **用户管理**: 用户列表、搜索、详情查看
- 📦 **订单管理**: 订单列表、状态管理、详情查看
- 💳 **预存记录**: 预存记录管理、添加新记录
- 🛍️ **商城管理**: 商品管理、上下架、库存管理

## 技术栈

- **前端**: React 19 + Vite + Tailwind CSS + DaisyUI
- **后端**: 腾讯云开发 (CloudBase)
- **数据库**: CloudBase 数据库
- **图标**: Heroicons

## 环境配置

项目已配置为使用你的 CloudBase 环境：
- 环境ID: `cloudbase-3g4w6lls8a5ce59b`

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

### 商城管理 (/shop)
- 商品列表展示
- 添加新商品
- 编辑商品信息
- 商品上下架管理
- 商品删除

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
│   └── ShopPage.jsx
├── utils/         # 工具函数
│   └── cloudbase.js
├── App.jsx
└── main.jsx
```

### CloudBase 配置
CloudBase 配置位于 `src/utils/cloudbase.js`，包含：
- 环境ID配置
- 登录状态管理
- 数据库连接

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

## 许可证

MIT License
