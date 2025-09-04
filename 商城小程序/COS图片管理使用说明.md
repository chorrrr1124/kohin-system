# COS图片管理系统使用说明

## 概述

本系统实现了Web端上传图片到COS存储，小程序端获取和显示图片的完整流程。

## 系统架构

```
Web端 (miniprogram-admin) → COS存储 → 小程序端 (商城小程序)
```

## 部署步骤

### 1. 部署Web端云函数

```bash
# 进入Web端目录
cd web7.27/miniprogram-admin

# 部署getCosSts云函数
# 在微信开发者工具中右键 cloudfunctions/getCosSts 选择"上传并部署：云端安装依赖"
```

### 2. 部署小程序端云函数

```bash
# 进入小程序目录
cd 商城小程序

# 部署getCosImages云函数
# 在微信开发者工具中右键 cloudfunctions/getCosImages 选择"上传并部署：云端安装依赖"
```

## 使用方法

### Web端上传图片

1. 启动Web端管理后台
2. 进入"图片管理"页面
3. 选择分类（banners、products、category、icons等）
4. 上传图片文件
5. 图片会自动上传到COS存储

### 小程序端获取图片

#### 方法1：使用cosImageService工具类

```javascript
// 引入工具类
const cosImageService = require('../../utils/cosImageService');

// 获取轮播图
const banners = await cosImageService.getBanners();

// 获取商品图片
const productImages = await cosImageService.getProductImages();

// 获取分类图片
const categoryImages = await cosImageService.getCategoryImages();

// 获取所有图片
const allImages = await cosImageService.getImages('all');
```

#### 方法2：直接调用云函数

```javascript
// 调用云函数获取图片
const result = await wx.cloud.callFunction({
  name: 'getCosImages',
  data: {
    category: 'banners', // 可选：banners, products, category, icons, all
    limit: 20 // 可选：限制数量
  }
});

if (result.result && result.result.success) {
  const images = result.result.data;
  console.log('获取到的图片:', images);
}
```

## 图片分类说明

| 分类 | 路径 | 用途 |
|------|------|------|
| banners | images/banners/ | 轮播图、推广图 |
| products | images/products/ | 商品图片 |
| category | images/category/ | 分类图标 |
| icons | images/icons/ | 应用图标 |
| tab | images/tab/ | 标签栏图标 |
| general | images/general/ | 通用图片 |

## 在小程序页面中使用

### 1. 在页面JS中获取图片

```javascript
// pages/index/index.js
const cosImageService = require('../../utils/cosImageService');

Page({
  data: {
    banners: []
  },

  async onLoad() {
    // 获取轮播图
    const banners = await cosImageService.getBanners();
    this.setData({
      banners: banners.map(item => item.url)
    });
  }
});
```

### 2. 在WXML中显示图片

```xml
<!-- pages/index/index.wxml -->
<swiper class="banner-swiper" indicator-dots="true" autoplay="true">
  <swiper-item wx:for="{{banners}}" wx:key="index">
    <image src="{{item}}" mode="aspectFill" class="banner-image" />
  </swiper-item>
</swiper>
```

### 3. 使用图片占位符组件

```xml
<!-- 使用现有的image-placeholder组件 -->
<image-placeholder 
  src="{{imageUrl}}" 
  type="banner" 
  custom-class="banner-image"
  mode="aspectFill" 
/>
```

## 注意事项

1. **环境ID一致性**：确保Web端和小程序端使用相同的云开发环境ID
2. **COS权限**：确保COS存储桶有正确的读写权限
3. **图片格式**：支持 jpg、jpeg、png、gif 格式
4. **文件大小**：建议单张图片不超过2MB
5. **缓存策略**：COS图片URL是永久有效的，可以缓存使用

## 故障排除

### 1. 图片上传失败
- 检查getCosSts云函数是否部署成功
- 检查COS存储桶权限配置
- 检查网络连接

### 2. 图片获取失败
- 检查getCosImages云函数是否部署成功
- 检查图片分类路径是否正确
- 检查COS存储桶中是否有对应图片

### 3. 图片显示异常
- 使用image-placeholder组件处理加载失败
- 检查图片URL格式是否正确
- 检查网络连接和CDN状态

## 扩展功能

### 1. 图片压缩
可以在Web端上传时添加图片压缩功能：

```javascript
// 在imageApi.js中添加压缩逻辑
const compressImage = (file, quality = 0.8) => {
  // 实现图片压缩逻辑
};
```

### 2. 图片水印
可以在上传时添加水印：

```javascript
// 在COS上传时添加水印参数
const uploadParams = {
  // ... 其他参数
  'x-cos-watermark': 'watermark_text'
};
```

### 3. 图片CDN加速
COS图片已自动通过CDN加速，访问速度较快。
