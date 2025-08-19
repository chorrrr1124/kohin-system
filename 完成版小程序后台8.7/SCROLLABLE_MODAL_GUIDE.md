# 可滚动弹窗组件使用指南

## 🎯 功能概述

为了解决弹窗内容过多时的显示问题，我们新增了可滚动弹窗组件，支持：

- ✅ **内容滚动**：当内容超出屏幕高度时，自动显示滚动条
- ✅ **分页显示**：当数据量大时，支持分页浏览
- ✅ **自适应选择**：根据内容长度智能选择普通弹窗或可滚动弹窗
- ✅ **自定义样式**：支持自定义分页项的显示样式

## 📁 组件文件

```
components/scrollable-modal/
├── scrollable-modal.wxml    # 组件模板
├── scrollable-modal.js      # 组件逻辑
├── scrollable-modal.wxss    # 组件样式
└── scrollable-modal.json    # 组件配置
```

## 🔧 使用方法

### 1. 注册组件

在页面的 `.json` 文件中注册组件：

```json
{
  "usingComponents": {
    "scrollable-modal": "/components/scrollable-modal/scrollable-modal"
  }
}
```

### 2. 添加到页面模板

在页面的 `.wxml` 文件中添加组件：

```xml
<!-- 可滚动弹窗 -->
<scrollable-modal
  show="{{showScrollableModal}}"
  title="{{modalTitle}}"
  content="{{modalContent}}"
  maxHeight="{{1000}}"
  showCancel="{{false}}"
  confirmText="关闭"
  enablePagination="{{enablePagination}}"
  pageData="{{pageData}}"
  pageSize="{{5}}"
  bind:confirm="onScrollableModalClose"
  bind:close="onScrollableModalClose"
>
  <!-- 自定义分页项模板 -->
  <template slot="pageItem">
    <view class="custom-item">
      <text>{{item.title}}</text>
      <text>{{item.content}}</text>
    </view>
  </template>
</scrollable-modal>
```

### 3. 页面数据配置

在页面的 `.js` 文件的 `data` 中添加：

```javascript
data: {
  // 可滚动弹窗相关数据
  showScrollableModal: false,
  modalTitle: '',
  modalContent: '',
  enablePagination: false,
  pageData: [],
  pageSize: 5
},
```

### 4. 事件处理方法

添加事件处理方法：

```javascript
// 关闭可滚动弹窗
onScrollableModalClose() {
  this.setData({
    showScrollableModal: false,
    pageData: [],
    enablePagination: false
  });
}
```

## 📋 属性说明

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `show` | Boolean | `false` | 是否显示弹窗 |
| `title` | String | `'详情'` | 弹窗标题 |
| `content` | String | `''` | 弹窗内容（非分页模式） |
| `maxHeight` | Number | `800` | 最大高度（rpx） |
| `showCancel` | Boolean | `true` | 是否显示取消按钮 |
| `confirmText` | String | `'确定'` | 确认按钮文本 |
| `cancelText` | String | `'取消'` | 取消按钮文本 |
| `enablePagination` | Boolean | `false` | 是否启用分页 |
| `pageData` | Array | `[]` | 分页数据 |
| `pageSize` | Number | `10` | 每页显示数量 |

## 🎨 使用场景

### 场景1：内容滚动模式

适用于：产品详情、订单详情、长文本显示等

```javascript
// 显示产品详情
showProductDetail(product) {
  const content = `🏷️ 品牌：${product.brand || '暂无'}
📦 类型：${product.type || '暂无'}  
🏗️ 品类：${product.category || '暂无'}
📏 规格：${product.specification || '暂无'}
📊 当前库存：${product.stock || 0} 件
📝 备注：${product.remark || '暂无备注'}`;

  this.setData({
    showScrollableModal: true,
    modalTitle: product.name,
    modalContent: content,
    enablePagination: false
  });
}
```

### 场景2：分页显示模式

适用于：记录列表、历史数据、大量条目等

```javascript
// 显示出入库记录
showRecords(records) {
  const formattedRecords = records.map(record => ({
    icon: record.type === 'in' ? '📥' : '📤',
    productName: record.productName,
    action: record.type === 'in' ? '入库' : '出库',
    quantity: record.quantity,
    time: record.time,
    orderNote: record.orderNote
  }));

  this.setData({
    showScrollableModal: true,
    modalTitle: '出入库明细',
    enablePagination: true,
    pageData: formattedRecords,
    pageSize: 5
  });
}
```

## 🔄 智能选择逻辑

系统会根据内容自动选择合适的弹窗类型：

```javascript
// 智能选择弹窗类型
showDetail(data) {
  if (data.length <= 5) {
    // 数据量少，使用普通弹窗
    wx.showModal({
      title: '详情',
      content: formatContent(data)
    });
  } else {
    // 数据量多，使用可滚动分页弹窗
    this.setData({
      showScrollableModal: true,
      enablePagination: true,
      pageData: data
    });
  }
}
```

## 🎯 已应用页面

目前已在以下页面应用了可滚动弹窗：

1. **产品记录页面** (`pages/productRecords/productRecords.js`)
   - 查看某天的出入库记录
   - 记录数量 ≤ 5条：使用普通内容模式
   - 记录数量 > 5条：使用分页模式

2. **日历页面** (`pages/calendar/calendar.js`)
   - 查看某天的详细记录
   - 自动根据记录数量选择显示方式

## 🛠️ 工具函数

提供了 `utils/modalUtils.js` 工具文件，包含：

- `showContentModal()` - 智能显示内容弹窗
- `showPaginatedModal()` - 显示分页弹窗
- `addScrollableModalSupport()` - 为页面添加弹窗支持

## 🎨 自定义样式

可以通过 `slot="pageItem"` 自定义分页项的显示样式：

```xml
<template slot="pageItem">
  <view class="my-custom-item">
    <view class="item-header">
      <text class="icon">{{item.icon}}</text>
      <text class="title">{{item.title}}</text>
    </view>
    <view class="item-content">
      <text>{{item.description}}</text>
    </view>
  </view>
</template>
```

## 📱 用户体验

- **流畅滚动**：支持原生滚动，体验流畅
- **分页导航**：清晰的分页控件，方便浏览
- **响应式设计**：适配不同屏幕尺寸
- **优雅动画**：平滑的显示/隐藏动画

## 🔮 扩展建议

可以进一步扩展的功能：

1. **搜索功能**：在分页数据中添加搜索
2. **排序功能**：支持按不同字段排序
3. **筛选功能**：支持条件筛选
4. **导出功能**：支持数据导出

---

*通过使用可滚动弹窗组件，用户可以更好地浏览大量内容，提升了应用的用户体验。* 