# 首页管理 Web API 使用指南

这个API示例展示了如何通过Web端管理小程序首页的轮播图和推广内容。

## 功能特性

- ✨ 轮播图管理 (CRUD)
- 🖼️ 图片上传到云存储
- 📝 推广内容管理
- 🎨 渐变色配置
- 📱 响应式设计支持

## 快速开始

### 1. 配置云开发环境

```javascript
const api = new HomepageAPI({
  appId: 'your-mini-program-appid',      // 小程序AppID
  env: 'your-cloud-env-id',              // 云开发环境ID
  accessToken: 'your-access-token'       // 访问令牌
});
```

### 2. 获取轮播图列表

```javascript
// 获取所有启用的轮播图
const result = await api.getCarouselImages({ status: 'active' });
console.log('轮播图列表:', result.data);
```

### 3. 上传并添加轮播图

```javascript
// 选择文件
const fileInput = document.getElementById('file-input');
const file = fileInput.files[0];

// 上传图片并添加轮播图
const carouselData = {
  title: '夏日消暑·就喝「丘大叔」',
  subtitle: 'Lemon tea for Uncle Q',
  gradient: 'linear-gradient(135deg, rgba(76, 175, 80, 0.85) 0%, rgba(139, 195, 74, 0.85) 50%, rgba(205, 220, 57, 0.85) 100%)',
  sort: 1,
  status: 'active'
};

try {
  // 1. 上传图片
  const uploadResult = await api.uploadCarouselImage(file);
  
  // 2. 添加轮播图记录
  const addResult = await api.addCarouselImage({
    ...carouselData,
    imageUrl: uploadResult.fileID
  });
  
  console.log('轮播图添加成功:', addResult);
} catch (error) {
  console.error('操作失败:', error);
}
```

### 4. 更新轮播图

```javascript
const carouselId = 'carousel-id-123';
const updateData = {
  title: '新的标题',
  status: 'inactive'
};

const result = await api.updateCarouselImage(carouselId, updateData);
console.log('更新成功:', result);
```

### 5. 管理推广内容

```javascript
// 获取推广内容
const promoContent = await api.getPromoContent();

// 更新推广内容
const newPromoData = {
  title: '夏日消暑·就喝「丘大叔」',
  subtitle: 'Lemon tea for Uncle Q',
  giftNote: '【赠6元代金券×1】',
  validityNote: '*自购买之日起3年内有效，可转赠可自用',
  prices: [
    { price: 30, originalPrice: 30 },
    { price: 86, originalPrice: 100 },
    { price: 66, originalPrice: 66 },
    { price: 168, originalPrice: 200 }
  ]
};

const result = await api.updatePromoContent(newPromoData);
```

## 渐变色预设

系统提供了多种预设渐变色：

```javascript
const gradientOptions = [
  {
    name: '绿色渐变',
    value: 'linear-gradient(135deg, rgba(76, 175, 80, 0.85) 0%, rgba(139, 195, 74, 0.85) 50%, rgba(205, 220, 57, 0.85) 100%)'
  },
  {
    name: '蓝色渐变',
    value: 'linear-gradient(135deg, rgba(33, 150, 243, 0.85) 0%, rgba(63, 81, 181, 0.85) 50%, rgba(103, 58, 183, 0.85) 100%)'
  },
  {
    name: '橙色渐变',
    value: 'linear-gradient(135deg, rgba(255, 152, 0, 0.85) 0%, rgba(255, 87, 34, 0.85) 50%, rgba(244, 67, 54, 0.85) 100%)'
  },
  {
    name: '紫色渐变',
    value: 'linear-gradient(135deg, rgba(156, 39, 176, 0.85) 0%, rgba(123, 31, 162, 0.85) 50%, rgba(81, 45, 168, 0.85) 100%)'
  },
  {
    name: '粉色渐变',
    value: 'linear-gradient(135deg, rgba(233, 30, 99, 0.85) 0%, rgba(236, 64, 122, 0.85) 50%, rgba(240, 98, 146, 0.85) 100%)'
  }
];
```

## 数据结构

### 轮播图数据结构

```javascript
{
  "_id": "carousel-id",
  "title": "标题",
  "subtitle": "副标题",
  "imageUrl": "cloud://file-id",
  "gradient": "渐变色CSS",
  "sort": 1,
  "status": "active|inactive",
  "link": "可选链接",
  "createTime": "2024-01-01T00:00:00.000Z",
  "updateTime": "2024-01-01T00:00:00.000Z"
}
```

### 推广内容数据结构

```javascript
{
  "_id": "promo-id",
  "title": "主标题",
  "subtitle": "副标题",
  "giftNote": "优惠信息",
  "validityNote": "有效期说明",
  "prices": [
    {
      "price": 30,
      "originalPrice": 30
    }
  ],
  "createTime": "2024-01-01T00:00:00.000Z",
  "updateTime": "2024-01-01T00:00:00.000Z"
}
```

## API 方法列表

| 方法 | 描述 | 参数 | 返回值 |
|-----|------|------|--------|
| `getCarouselImages(params)` | 获取轮播图列表 | `{status?, limit?}` | `{success, data, total}` |
| `uploadCarouselImage(file, fileName)` | 上传轮播图 | `File/base64, string` | `{success, fileID, cloudPath}` |
| `addCarouselImage(data)` | 添加轮播图 | `CarouselData` | `{success, data, message}` |
| `updateCarouselImage(id, data)` | 更新轮播图 | `string, Partial<CarouselData>` | `{success, data, message}` |
| `deleteCarouselImage(id)` | 删除轮播图 | `string` | `{success, message}` |
| `getPromoContent()` | 获取推广内容 | - | `{success, data}` |
| `updatePromoContent(data)` | 更新推广内容 | `PromoData` | `{success, data, message}` |

## 错误处理

```javascript
try {
  const result = await api.getCarouselImages();
  // 处理成功结果
} catch (error) {
  console.error('操作失败:', error.message);
  // 处理错误
}
```

## 注意事项

1. **访问令牌**: 需要有效的微信小程序访问令牌
2. **云开发环境**: 确保云开发环境已正确配置
3. **文件大小**: 上传图片建议不超过2MB
4. **图片格式**: 支持 JPG、PNG、WebP 格式
5. **并发限制**: 注意云函数的并发调用限制

## 部署说明

1. 上传云函数到小程序云开发环境
2. 配置云函数权限和环境变量
3. 在Web端集成API代码
4. 测试各项功能是否正常

## 技术支持

如有问题，请参考：
- 微信小程序云开发文档
- 云函数开发指南
- 云存储使用说明 