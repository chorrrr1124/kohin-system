# 权益卡片组件 (Benefit Card Component)

## 功能特性

### 🎯 会员等级显示
- 在权益卡片顶部显示会员等级信息
- 支持自定义等级数字和等级名称
- 红色渐变等级标签，突出显示

### 🎁 权益展示
- 支持5个权益项的动态展示
- 每个权益项包含图标、数量和名称
- 响应式网格布局，自动适应不同屏幕尺寸

### 🎨 视觉设计
- 红色边框突出显示，符合设计要求
- 渐变背景和阴影效果
- 悬停和点击动画效果

## 使用方法

### 1. 在页面中引入组件

```json
{
  "usingComponents": {
    "benefit-card": "/components/benefit-card/benefit-card"
  }
}
```

### 2. 在页面模板中使用

```xml
<benefit-card 
  member-level="{{memberInfo.level}}"
  member-level-name="{{memberInfo.levelName}}"
  benefits-count="{{benefitsInfo.count}}"
  benefits-list="{{benefitsInfo.items}}"
  bind:benefittap="onBenefitTap"
  bind:viewall="onViewAllBenefits">
</benefit-card>
```

### 3. 在页面脚本中设置数据

```javascript
Page({
  data: {
    memberInfo: {
      level: 2,
      levelName: '资深养鸭人'
    },
    benefitsInfo: {
      count: 5,
      items: [
        { id: 1, icon: '💰', name: '满30-5元券', count: 1 },
        { id: 2, icon: '🥤', name: '招牌饮品8折', count: 1 },
        { id: 3, icon: '🪙', name: '鸭币翻倍', count: 2 },
        { id: 4, icon: '🎂', name: '生日单品8折', count: 1 },
        { id: 5, icon: '🎁', name: '新用户专享券', count: 1 }
      ]
    }
  }
})
```

## 组件属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| memberLevel | Number | 2 | 会员等级数字 |
| memberLevelName | String | '资深养鸭人' | 会员等级名称 |
| benefitsCount | Number | 5 | 权益总数 |
| benefitsList | Array | [] | 权益列表数组 |

## 权益项数据结构

```javascript
{
  id: Number,        // 权益ID
  icon: String,      // 权益图标（emoji或图片路径）
  name: String,      // 权益名称
  count: Number      // 权益数量
}
```

## 事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| benefittap | 权益项点击事件 | event.detail.benefit: 被点击的权益项 |
| viewall | 全部权益按钮点击事件 | 无 |

## 样式定制

组件使用CSS变量，可以通过以下方式自定义样式：

```css
/* 自定义权益卡片样式 */
.benefit-card {
  --border-color: #ff4757;
  --border-radius: 16rpx;
  --shadow-color: rgba(255, 71, 87, 0.15);
}
```

## 注意事项

1. 权益列表最多支持5个权益项
2. 会员等级标签使用红色渐变设计
3. 组件会自动处理权益项的布局和响应式显示
4. 建议使用emoji图标以保持跨平台兼容性 