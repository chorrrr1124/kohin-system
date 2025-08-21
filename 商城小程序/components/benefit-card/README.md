# 权益卡片组件 (Benefit Card)

## 组件介绍

权益卡片组件用于展示用户的已解锁权益，包含权益数量、权益列表和"全部权益"按钮。

## 组件特性

- 🎨 红色边框设计，符合设计要求
- 📱 响应式网格布局，支持5个权益项
- 🎯 交互式权益项，支持点击事件
- 🔄 平滑的动画效果和悬停状态
- 📊 动态数据绑定

## 使用方法

### 1. 在页面中引入组件

```json
{
  "usingComponents": {
    "benefit-card": "/components/benefit-card/benefit-card"
  }
}
```

### 2. 在WXML中使用

```xml
<benefit-card 
  benefits-count="{{benefitsCount}}"
  benefits-list="{{benefitsList}}"
  bind:benefittap="onBenefitTap"
  bind:viewall="onViewAllBenefits">
</benefit-card>
```

### 3. 在JS中处理事件

```javascript
Page({
  data: {
    benefitsCount: 5,
    benefitsList: [
      {
        id: 1,
        icon: '💰',
        count: 1,
        name: '满30-5元券',
        description: '满30元可用',
        status: 'active'
      }
      // ... 更多权益项
    ]
  },

  // 权益点击事件
  onBenefitTap(e) {
    const { benefit } = e.detail;
    console.log('点击权益:', benefit);
  },

  // 查看全部权益
  onViewAllBenefits() {
    console.log('查看全部权益');
  }
});
```

## 属性说明

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| benefitsCount | Number | 5 | 已解锁权益数量 |
| benefitsList | Array | [] | 权益列表数据 |

## 事件说明

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| benefittap | 权益项点击事件 | { benefit: 权益对象 } |
| viewall | 全部权益按钮点击事件 | 无 |

## 权益数据结构

```javascript
{
  id: 1,                    // 权益ID
  icon: '💰',               // 权益图标（emoji）
  count: 1,                 // 权益数量
  name: '满30-5元券',       // 权益名称
  description: '满30元可用', // 权益描述
  status: 'active'          // 权益状态
}
```

## 样式定制

组件使用CSS变量，可以通过以下方式定制样式：

```css
/* 自定义主题色 */
.benefit-card {
  --primary-color: #ff4757;
  --secondary-color: #4a5a3a;
}
```

## 注意事项

1. 权益列表建议最多显示5个，超出部分可以通过"全部权益"按钮查看
2. 图标建议使用emoji，确保跨平台兼容性
3. 组件已包含响应式设计，支持不同屏幕尺寸 