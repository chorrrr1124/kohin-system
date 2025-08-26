# Tailwind CSS 配置说明

## 概述

本项目已成功集成 Tailwind CSS，为小程序开发提供了现代化的 CSS 框架支持。

## 配置文件

### 1. tailwind.config.js
Tailwind CSS 的主配置文件，定义了：
- 内容扫描路径
- 主题自定义
- 插件配置

### 2. weapp-tailwindcss.config.js
微信小程序专用的 Tailwind CSS 配置文件，包含：
- 小程序特定的样式转换规则
- 组件样式定义
- 工具类配置

### 3. src/styles/tailwind.wxss
生成的 Tailwind CSS 样式文件，包含：
- 基础样式
- 组件样式
- 工具类

## 使用方法

### 1. 在 WXML 中使用 Tailwind 类名

```xml
<!-- 基础布局 -->
<view class="container mx-auto p-4">
  <view class="flex flex-col space-y-4">
    <view class="bg-white rounded-lg shadow-sm p-4">
      <text class="text-lg font-semibold text-gray-900">标题</text>
      <text class="text-sm text-gray-600">描述文本</text>
    </view>
  </view>
</view>
```

### 2. 预定义组件

#### 按钮组件
```xml
<button class="btn btn-primary">主要按钮</button>
<button class="btn btn-secondary">次要按钮</button>
<button class="btn btn-outline">边框按钮</button>
```

#### 卡片组件
```xml
<view class="card">
  <view class="text-lg font-semibold mb-2">卡片标题</view>
  <view class="text-sm text-gray-600">卡片内容</view>
</view>
```

#### 标签组件
```xml
<view class="tag tag-primary">主要标签</view>
<view class="tag tag-success">成功标签</view>
<view class="tag tag-warning">警告标签</view>
<view class="tag tag-error">错误标签</view>
```

### 3. 自定义主题颜色

在 `tailwind.config.js` 中定义的主题颜色：

```javascript
colors: {
  primary: '#007aff',
  secondary: '#5856d6',
  success: '#34c759',
  warning: '#ff9500',
  error: '#ff3b30',
  info: '#5ac8fa'
}
```

## 构建流程

### 1. 安装依赖
```bash
npm install tailwindcss weapp-tailwindcss-webpack-plugin weapp-tailwindcss --save-dev
```

### 2. 生成样式文件
```bash
npx weapp-tailwindcss-webpack-plugin build
```

### 3. 在 app.wxss 中引入
```css
@import "./src/styles/tailwind.wxss";
```

## 测试页面

项目包含一个 Tailwind CSS 测试页面：
- 路径：`pages/tailwind-test/tailwind-test`
- 功能：展示各种 Tailwind CSS 组件和样式
- 访问：在首页右下角点击 "TW" 按钮

## 注意事项

1. **样式优先级**：Tailwind CSS 的样式会与现有样式共存，注意样式优先级
2. **文件大小**：生成的样式文件较大，建议在生产环境中进行优化
3. **兼容性**：确保微信开发者工具版本支持相关特性
4. **热更新**：修改配置后需要重新构建样式文件

## 常用工具类

### 布局
- `flex` - 弹性布局
- `grid` - 网格布局
- `container` - 容器
- `mx-auto` - 水平居中

### 间距
- `p-4` - 内边距
- `m-4` - 外边距
- `space-y-4` - 垂直间距
- `gap-4` - 网格间距

### 颜色
- `bg-primary` - 主色背景
- `text-primary` - 主色文字
- `border-primary` - 主色边框

### 尺寸
- `w-full` - 全宽
- `h-full` - 全高
- `w-16` - 固定宽度
- `h-16` - 固定高度

### 圆角
- `rounded` - 圆角
- `rounded-lg` - 大圆角
- `rounded-full` - 圆形

### 阴影
- `shadow` - 阴影
- `shadow-lg` - 大阴影
- `shadow-sm` - 小阴影

## 扩展开发

如需添加新的组件样式，可以在 `weapp-tailwindcss.config.js` 的 `components` 部分添加：

```javascript
components: {
  '.new-component': {
    '@apply bg-white rounded-lg p-4 shadow-sm': {}
  }
}
```

然后重新构建样式文件即可使用。 