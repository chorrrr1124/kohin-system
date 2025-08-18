# Web端管理小程序布局系统开发文档

## 📋 目录

1. [项目概述](#项目概述)
2. [系统架构设计](#系统架构设计)
3. [数据库设计](#数据库设计)
4. [API接口设计](#api接口设计)
5. [后端实现](#后端实现)
6. [Web管理界面](#web管理界面)
7. [小程序端实现](#小程序端实现)
8. [部署指南](#部署指南)
9. [测试方案](#测试方案)
10. [维护指南](#维护指南)

---

## 🎯 项目概述

### 核心目标

通过 Web 端后台管理系统，实现对小程序布局、页面配置、组件设置等的动态管理，无需重新发布小程序即可实现内容和布局的调整。

### 功能特性

- 🎨 **页面布局管理**：拖拽式布局编辑器
- 🧩 **组件配置管理**：动态组件属性设置
- 🖼️ **资源管理**：图片、图标统一管理
- 🎯 **主题配置**：颜色、字体、样式管理
- 📱 **实时预览**：所见即所得编辑体验
- 🔄 **版本控制**：配置版本管理和回滚
- 👥 **权限管理**：多角色权限控制

### 技术栈

- **后端**：Node.js + Express + MongoDB
- **前端管理**：Vue 3 + Element Plus + Vue3-Draggable
- **小程序端**：微信小程序原生 + 云开发
- **存储**：腾讯云开发 + 云存储

---

## 🏗️ 系统架构设计

### 整体架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web管理端     │    │    后端API     │    │   小程序端      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ 布局编辑器  │ │◄──►│ │ 配置管理API │ │◄──►│ │ 动态渲染器  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ 资源管理器  │ │◄──►│ │ 资源管理API │ │◄──►│ │ 组件库      │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ 主题编辑器  │ │◄──►│ │ 主题管理API │ │◄──►│ │ 样式引擎    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 数据流程

```
Web管理端 操作 → API接口 → 云数据库 → 小程序端获取 → 动态渲染
    ↑                                              ↓
实时预览 ←── WebSocket通知 ←── 配置变更监听 ←── 缓存更新
```

---

## 🗃️ 数据库设计

### 核心数据表

#### 1. 页面配置表 (page_configs)

```javascript
{
  _id: "page_001",
  page_name: "首页",           // 页面名称
  page_path: "pages/index/index",  // 页面路径
  version: "1.0.0",           // 配置版本
  status: "published",        // 状态：draft/published/archived
  layout: {                   // 布局配置
    type: "vertical",         // 布局类型
    components: [             // 组件列表
      {
        id: "banner_001",
        type: "banner",
        position: { x: 0, y: 0, width: 100, height: 200 },
        config: {
          images: ["https://xxx.com/banner1.jpg"],
          autoplay: true,
          duration: 3000
        },
        style: {
          borderRadius: "8px",
          margin: "10px"
        }
      },
      {
        id: "product_grid_001",
        type: "product_grid",
        position: { x: 0, y: 200, width: 100, height: 400 },
        config: {
          columns: 2,
          showPrice: true,
          showStock: false
        }
      }
    ]
  },
  theme_id: "theme_001",      // 关联主题ID
  created_at: "2024-12-01T00:00:00Z",
  updated_at: "2024-12-01T00:00:00Z",
  created_by: "admin_001"
}
```

#### 2. 组件库表 (component_library)

```javascript
{
  _id: "comp_banner",
  component_name: "轮播图",
  component_type: "banner",
  category: "展示组件",
  description: "支持多图轮播的组件",
  default_config: {
    images: [],
    autoplay: true,
    duration: 3000,
    indicatorDots: true
  },
  configurable_props: [       // 可配置属性
    {
      key: "autoplay",
      label: "自动播放",
      type: "boolean",
      default: true
    },
    {
      key: "duration",
      label: "切换间隔(ms)",
      type: "number",
      default: 3000,
      min: 1000,
      max: 10000
    }
  ],
  preview_image: "https://xxx.com/preview/banner.png",
  created_at: "2024-12-01T00:00:00Z"
}
```

#### 3. 主题配置表 (themes)

```javascript
{
  _id: "theme_001",
  theme_name: "默认主题",
  description: "商城默认主题风格",
  config: {
    colors: {
      primary: "#4CAF50",      // 主色调
      secondary: "#2196F3",    // 辅助色
      success: "#4CAF50",      // 成功色
      warning: "#FF9800",      // 警告色
      error: "#F44336",        // 错误色
      text_primary: "#333333", // 主文本色
      text_secondary: "#666666", // 辅助文本色
      background: "#FFFFFF",   // 背景色
      border: "#E0E0E0"        // 边框色
    },
    fonts: {
      primary: "PingFang SC",  // 主字体
      sizes: {
        xs: "24rpx",
        sm: "28rpx", 
        md: "32rpx",
        lg: "36rpx",
        xl: "40rpx"
      }
    },
    spacing: {
      xs: "8rpx",
      sm: "16rpx",
      md: "24rpx", 
      lg: "32rpx",
      xl: "48rpx"
    },
    border_radius: {
      sm: "4rpx",
      md: "8rpx",
      lg: "12rpx",
      xl: "16rpx"
    }
  },
  is_default: true,
  created_at: "2024-12-01T00:00:00Z"
}
```

#### 4. 资源管理表 (assets)

```javascript
{
  _id: "asset_001",
  asset_name: "首页轮播图1",
  asset_type: "image",        // image/icon/video
  category: "banner",         // 分类
  file_path: "https://xxx.com/images/banner1.jpg",
  file_size: 245678,          // 文件大小(字节)
  dimensions: {               // 图片尺寸
    width: 750,
    height: 300
  },
  alt_text: "商城首页轮播图",
  tags: ["首页", "轮播", "促销"],
  used_in_pages: ["pages/index/index"],  // 使用页面
  created_at: "2024-12-01T00:00:00Z"
}
```

#### 5. 配置版本表 (config_versions)

```javascript
{
  _id: "version_001",
  page_id: "page_001",
  version: "1.0.0",
  config_snapshot: {}, // 完整配置快照
  change_log: "添加了产品网格组件",
  created_by: "admin_001",
  created_at: "2024-12-01T00:00:00Z",
  is_current: true
}
```

---

## 🔌 API接口设计

### 页面配置管理

#### 获取页面配置

```http
GET /api/pages/:pageId/config
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success", 
  "data": {
    "page_id": "page_001",
    "config": { /* 页面配置 */ },
    "version": "1.0.0",
    "cache_key": "page_001_v1.0.0"
  }
}
```

#### 更新页面配置

```http
PUT /api/pages/:pageId/config
```

**请求体：**
```json
{
  "layout": { /* 布局配置 */ },
  "theme_id": "theme_001",
  "change_log": "更新了轮播图组件"
}
```

#### 发布页面配置

```http
POST /api/pages/:pageId/publish
```

### 组件管理

#### 获取组件库列表

```http
GET /api/components?category=展示组件&page=1&limit=20
```

#### 获取组件配置

```http
GET /api/components/:componentType/config
```

### 主题管理

#### 获取主题列表

```http
GET /api/themes
```

#### 更新主题配置

```http
PUT /api/themes/:themeId
```

### 资源管理

#### 上传资源

```http
POST /api/assets/upload
Content-Type: multipart/form-data
```

#### 获取资源列表

```http
GET /api/assets?type=image&category=banner&page=1&limit=20
```

---

## 💻 后端实现

### 项目结构

```
backend/
├── config/                 # 配置文件
│   ├── database.js         # 数据库配置
│   └── upload.js           # 上传配置
├── controllers/            # 控制器
│   ├── pageController.js   # 页面管理
│   ├── componentController.js # 组件管理
│   ├── themeController.js  # 主题管理
│   └── assetController.js  # 资源管理
├── models/                 # 数据模型
│   ├── Page.js
│   ├── Component.js
│   ├── Theme.js
│   └── Asset.js
├── routes/                 # 路由
│   ├── pages.js
│   ├── components.js
│   ├── themes.js
│   └── assets.js
├── middleware/             # 中间件
│   ├── auth.js             # 认证中间件
│   ├── upload.js           # 上传中间件
│   └── validation.js       # 验证中间件
├── services/               # 业务服务
│   ├── configService.js    # 配置服务
│   ├── cacheService.js     # 缓存服务
│   └── notificationService.js # 通知服务
└── app.js                  # 应用入口
```

### 核心代码实现

#### 页面配置控制器 (controllers/pageController.js)

```javascript
const Page = require('../models/Page');
const ConfigVersion = require('../models/ConfigVersion');
const cacheService = require('../services/cacheService');

class PageController {
  // 获取页面配置
  async getPageConfig(req, res) {
    try {
      const { pageId } = req.params;
      const { version } = req.query;
      
      // 从缓存获取
      const cacheKey = `page_${pageId}_${version || 'latest'}`;
      let config = await cacheService.get(cacheKey);
      
      if (!config) {
        // 从数据库获取
        const page = await Page.findById(pageId);
        if (!page) {
          return res.status(404).json({
            code: 404,
            message: 'Page not found'
          });
        }
        
        config = {
          page_id: page._id,
          config: page.layout,
          theme_id: page.theme_id,
          version: page.version
        };
        
        // 缓存配置
        await cacheService.set(cacheKey, config, 3600);
      }
      
      res.json({
        code: 200,
        message: 'success',
        data: config
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: error.message
      });
    }
  }
  
  // 更新页面配置
  async updatePageConfig(req, res) {
    try {
      const { pageId } = req.params;
      const { layout, theme_id, change_log } = req.body;
      
      // 验证配置格式
      if (!this.validateLayout(layout)) {
        return res.status(400).json({
          code: 400,
          message: 'Invalid layout configuration'
        });
      }
      
      // 保存历史版本
      const page = await Page.findById(pageId);
      await ConfigVersion.create({
        page_id: pageId,
        version: page.version,
        config_snapshot: page.layout,
        change_log: change_log || 'Configuration update',
        created_by: req.user.id
      });
      
      // 生成新版本号
      const newVersion = this.generateVersion(page.version);
      
      // 更新页面配置
      const updatedPage = await Page.findByIdAndUpdate(pageId, {
        layout,
        theme_id,
        version: newVersion,
        updated_at: new Date()
      }, { new: true });
      
      // 清除相关缓存
      await cacheService.deletePattern(`page_${pageId}_*`);
      
      // 通知小程序端更新
      await this.notifyConfigUpdate(pageId, newVersion);
      
      res.json({
        code: 200,
        message: 'Configuration updated successfully',
        data: {
          version: newVersion,
          updated_at: updatedPage.updated_at
        }
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: error.message
      });
    }
  }
  
  // 发布页面配置
  async publishPageConfig(req, res) {
    try {
      const { pageId } = req.params;
      
      await Page.findByIdAndUpdate(pageId, {
        status: 'published',
        published_at: new Date()
      });
      
      // 清除缓存，强制小程序端获取最新配置
      await cacheService.deletePattern(`page_${pageId}_*`);
      
      res.json({
        code: 200,
        message: 'Page published successfully'
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: error.message
      });
    }
  }
  
  // 验证布局配置
  validateLayout(layout) {
    if (!layout || !layout.components || !Array.isArray(layout.components)) {
      return false;
    }
    
    return layout.components.every(component => {
      return component.id && 
             component.type && 
             component.position &&
             typeof component.position.x === 'number' &&
             typeof component.position.y === 'number';
    });
  }
  
  // 生成版本号
  generateVersion(currentVersion) {
    const parts = currentVersion.split('.').map(Number);
    parts[2]++; // 增加修订号
    return parts.join('.');
  }
  
  // 通知配置更新
  async notifyConfigUpdate(pageId, version) {
    // 通过WebSocket或消息队列通知小程序端
    const notificationService = require('../services/notificationService');
    await notificationService.broadcast('config_updated', {
      page_id: pageId,
      version: version,
      timestamp: new Date()
    });
  }
}

module.exports = new PageController();
```

#### 组件库管理 (controllers/componentController.js)

```javascript
const Component = require('../models/Component');

class ComponentController {
  // 获取组件库列表
  async getComponents(req, res) {
    try {
      const { category, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;
      
      const query = category ? { category } : {};
      
      const components = await Component.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ created_at: -1 });
        
      const total = await Component.countDocuments(query);
      
      res.json({
        code: 200,
        message: 'success',
        data: {
          components,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: error.message
      });
    }
  }
  
  // 获取组件配置
  async getComponentConfig(req, res) {
    try {
      const { componentType } = req.params;
      
      const component = await Component.findOne({ 
        component_type: componentType 
      });
      
      if (!component) {
        return res.status(404).json({
          code: 404,
          message: 'Component not found'
        });
      }
      
      res.json({
        code: 200,
        message: 'success',
        data: {
          default_config: component.default_config,
          configurable_props: component.configurable_props
        }
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: error.message
      });
    }
  }
}

module.exports = new ComponentController();
```

---

## 🎨 Web管理界面

### 项目结构

```
web-admin/
├── src/
│   ├── components/          # 组件
│   │   ├── LayoutEditor/    # 布局编辑器
│   │   │   ├── DragCanvas.vue      # 拖拽画布
│   │   │   ├── ComponentPanel.vue  # 组件面板
│   │   │   ├── PropertyPanel.vue   # 属性面板
│   │   │   └── PreviewPanel.vue    # 预览面板
│   │   ├── ThemeEditor/     # 主题编辑器
│   │   │   ├── ColorPicker.vue     # 颜色选择器
│   │   │   ├── FontSelector.vue    # 字体选择器
│   │   │   └── StylePreview.vue    # 样式预览
│   │   └── AssetManager/    # 资源管理器
│   │       ├── FileUpload.vue      # 文件上传
│   │       ├── ImageGallery.vue    # 图片画廊
│   │       └── AssetSearch.vue     # 资源搜索
│   ├── views/              # 页面
│   │   ├── PageManager.vue # 页面管理
│   │   ├── ComponentLibrary.vue # 组件库
│   │   ├── ThemeManager.vue # 主题管理
│   │   └── AssetManager.vue # 资源管理
│   ├── utils/              # 工具函数
│   │   ├── api.js          # API封装
│   │   ├── dragHelper.js   # 拖拽助手
│   │   └── configValidator.js # 配置验证
│   └── store/              # 状态管理
│       ├── modules/
│       │   ├── pages.js    # 页面状态
│       │   ├── components.js # 组件状态
│       │   └── themes.js   # 主题状态
│       └── index.js
└── package.json
```

### 核心组件实现

#### 布局编辑器 (components/LayoutEditor/DragCanvas.vue)

```vue
<template>
  <div class="drag-canvas" ref="canvas">
    <!-- 网格背景 -->
    <div class="grid-background"></div>
    
    <!-- 组件容器 -->
    <draggable
      v-model="components"
      :options="dragOptions"
      @start="onDragStart"
      @end="onDragEnd"
      class="components-container"
    >
      <div
        v-for="component in components"
        :key="component.id"
        :class="['component-wrapper', { 'selected': selectedComponent?.id === component.id }]"
        :style="getComponentStyle(component)"
        @click="selectComponent(component)"
      >
        <!-- 组件内容 -->
        <component 
          :is="getComponentRenderer(component.type)"
          :config="component.config"
          :style="component.style"
        />
        
        <!-- 选中时的操作手柄 -->
        <div v-if="selectedComponent?.id === component.id" class="component-handles">
          <div class="handle handle-tl"></div>
          <div class="handle handle-tr"></div>
          <div class="handle handle-bl"></div>
          <div class="handle handle-br"></div>
        </div>
      </div>
    </draggable>
    
    <!-- 添加组件的占位区域 -->
    <div v-if="isDragOver" class="drop-zone">
      <i class="el-icon-plus"></i>
      <span>拖拽组件到此处</span>
    </div>
  </div>
</template>

<script>
import draggable from 'vue3-draggable';
import { ref, computed, onMounted } from 'vue';

export default {
  name: 'DragCanvas',
  components: {
    draggable
  },
  props: {
    layout: {
      type: Object,
      required: true
    }
  },
  emits: ['update:layout', 'component-selected'],
  setup(props, { emit }) {
    const canvas = ref(null);
    const selectedComponent = ref(null);
    const isDragOver = ref(false);
    
    const components = computed({
      get: () => props.layout.components || [],
      set: (value) => {
        emit('update:layout', {
          ...props.layout,
          components: value
        });
      }
    });
    
    const dragOptions = {
      group: 'components',
      ghostClass: 'ghost',
      chosenClass: 'chosen',
      animation: 150
    };
    
    // 获取组件样式
    const getComponentStyle = (component) => {
      const { position } = component;
      return {
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${position.width}px`,
        height: `${position.height}px`,
        ...component.style
      };
    };
    
    // 获取组件渲染器
    const getComponentRenderer = (type) => {
      const renderers = {
        'banner': () => import('./renderers/BannerRenderer.vue'),
        'product_grid': () => import('./renderers/ProductGridRenderer.vue'),
        'text': () => import('./renderers/TextRenderer.vue'),
        'image': () => import('./renderers/ImageRenderer.vue')
      };
      return renderers[type] || 'div';
    };
    
    // 选择组件
    const selectComponent = (component) => {
      selectedComponent.value = component;
      emit('component-selected', component);
    };
    
    // 拖拽开始
    const onDragStart = (evt) => {
      console.log('Drag start:', evt);
    };
    
    // 拖拽结束
    const onDragEnd = (evt) => {
      console.log('Drag end:', evt);
      // 更新组件位置
      updateComponentPositions();
    };
    
    // 更新组件位置
    const updateComponentPositions = () => {
      const canvasRect = canvas.value.getBoundingClientRect();
      components.value.forEach((component, index) => {
        const element = canvas.value.children[index];
        if (element) {
          const rect = element.getBoundingClientRect();
          component.position = {
            ...component.position,
            x: rect.left - canvasRect.left,
            y: rect.top - canvasRect.top
          };
        }
      });
    };
    
    return {
      canvas,
      components,
      selectedComponent,
      isDragOver,
      dragOptions,
      getComponentStyle,
      getComponentRenderer,
      selectComponent,
      onDragStart,
      onDragEnd
    };
  }
};
</script>

<style lang="scss" scoped>
.drag-canvas {
  position: relative;
  width: 375px; // 模拟手机屏幕宽度
  height: 667px; // 模拟手机屏幕高度
  background: #f5f5f5;
  border: 1px solid #ddd;
  overflow: hidden;
  
  .grid-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px),
      linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px);
    background-size: 20px 20px;
    pointer-events: none;
  }
  
  .components-container {
    position: relative;
    width: 100%;
    height: 100%;
  }
  
  .component-wrapper {
    cursor: move;
    border: 2px solid transparent;
    
    &.selected {
      border-color: #409eff;
    }
    
    &:hover {
      border-color: #c0c4cc;
    }
  }
  
  .component-handles {
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    pointer-events: none;
    
    .handle {
      position: absolute;
      width: 8px;
      height: 8px;
      background: #409eff;
      border: 1px solid #fff;
      cursor: pointer;
      pointer-events: auto;
      
      &.handle-tl { top: 0; left: 0; }
      &.handle-tr { top: 0; right: 0; }
      &.handle-bl { bottom: 0; left: 0; }
      &.handle-br { bottom: 0; right: 0; }
    }
  }
  
  .drop-zone {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 20px;
    border: 2px dashed #c0c4cc;
    border-radius: 4px;
    text-align: center;
    color: #909399;
    
    i {
      font-size: 24px;
      margin-bottom: 8px;
    }
  }
}

.ghost {
  opacity: 0.5;
}

.chosen {
  cursor: grabbing;
}
</style>
```

#### 属性面板 (components/LayoutEditor/PropertyPanel.vue)

```vue
<template>
  <div class="property-panel">
    <div v-if="!selectedComponent" class="empty-state">
      <i class="el-icon-info"></i>
      <p>请选择一个组件以编辑其属性</p>
    </div>
    
    <div v-else class="property-content">
      <el-card class="property-section">
        <template #header>
          <div class="section-header">
            <span>基本信息</span>
            <el-button 
              type="text" 
              size="small"
              @click="removeComponent"
              style="color: #f56c6c"
            >
              删除组件
            </el-button>
          </div>
        </template>
        
        <el-form label-width="80px" size="small">
          <el-form-item label="组件ID">
            <el-input v-model="selectedComponent.id" disabled />
          </el-form-item>
          
          <el-form-item label="组件类型">
            <el-tag>{{ getComponentTypeName(selectedComponent.type) }}</el-tag>
          </el-form-item>
        </el-form>
      </el-card>
      
      <el-card class="property-section">
        <template #header>位置和尺寸</template>
        
        <el-form label-width="80px" size="small">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-form-item label="X坐标">
                <el-input-number
                  v-model="selectedComponent.position.x"
                  :min="0"
                  :max="375"
                  @change="updatePosition"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Y坐标">
                <el-input-number
                  v-model="selectedComponent.position.y"
                  :min="0"
                  :max="667"
                  @change="updatePosition"
                />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="10">
            <el-col :span="12">
              <el-form-item label="宽度">
                <el-input-number
                  v-model="selectedComponent.position.width"
                  :min="50"
                  :max="375"
                  @change="updatePosition"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="高度">
                <el-input-number
                  v-model="selectedComponent.position.height"
                  :min="50"
                  :max="667"
                  @change="updatePosition"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>
      
      <el-card class="property-section">
        <template #header>组件配置</template>
        
        <component
          :is="getConfigEditor(selectedComponent.type)"
          v-model="selectedComponent.config"
          @update:modelValue="updateConfig"
        />
      </el-card>
      
      <el-card class="property-section">
        <template #header>样式设置</template>
        
        <el-form label-width="80px" size="small">
          <el-form-item label="边框圆角">
            <el-input v-model="selectedComponent.style.borderRadius" placeholder="8px" />
          </el-form-item>
          
          <el-form-item label="外边距">
            <el-input v-model="selectedComponent.style.margin" placeholder="10px" />
          </el-form-item>
          
          <el-form-item label="内边距">
            <el-input v-model="selectedComponent.style.padding" placeholder="16px" />
          </el-form-item>
          
          <el-form-item label="背景色">
            <el-color-picker v-model="selectedComponent.style.backgroundColor" />
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'PropertyPanel',
  props: {
    selectedComponent: {
      type: Object,
      default: null
    }
  },
  emits: ['update:selectedComponent', 'remove-component'],
  setup(props, { emit }) {
    // 获取组件类型名称
    const getComponentTypeName = (type) => {
      const typeNames = {
        'banner': '轮播图',
        'product_grid': '产品网格',
        'text': '文本',
        'image': '图片'
      };
      return typeNames[type] || type;
    };
    
    // 获取配置编辑器
    const getConfigEditor = (type) => {
      const editors = {
        'banner': () => import('./config-editors/BannerConfigEditor.vue'),
        'product_grid': () => import('./config-editors/ProductGridConfigEditor.vue'),
        'text': () => import('./config-editors/TextConfigEditor.vue'),
        'image': () => import('./config-editors/ImageConfigEditor.vue')
      };
      return editors[type] || 'div';
    };
    
    // 更新位置
    const updatePosition = () => {
      emit('update:selectedComponent', { ...props.selectedComponent });
    };
    
    // 更新配置
    const updateConfig = (config) => {
      emit('update:selectedComponent', {
        ...props.selectedComponent,
        config
      });
    };
    
    // 删除组件
    const removeComponent = () => {
      emit('remove-component', props.selectedComponent);
    };
    
    return {
      getComponentTypeName,
      getConfigEditor,
      updatePosition,
      updateConfig,
      removeComponent
    };
  }
};
</script>

<style lang="scss" scoped>
.property-panel {
  width: 320px;
  height: 100%;
  background: #fff;
  border-left: 1px solid #e4e7ed;
  overflow-y: auto;
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #909399;
    
    i {
      font-size: 48px;
      margin-bottom: 16px;
    }
  }
  
  .property-content {
    padding: 16px;
  }
  
  .property-section {
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
```

---

## 📱 小程序端实现

### 动态渲染器架构

```
小程序端架构
├── components/               # 动态组件库
│   ├── banner/              # 轮播图组件
│   │   ├── index.js
│   │   ├── index.wxml
│   │   └── index.wxss
│   ├── product-grid/        # 产品网格组件
│   └── text/                # 文本组件
├── services/                # 服务层
│   ├── configService.js     # 配置服务
│   ├── cacheService.js      # 缓存服务
│   └── renderService.js     # 渲染服务
├── utils/                   # 工具函数
│   ├── componentLoader.js   # 组件加载器
│   └── styleEngine.js       # 样式引擎
└── pages/                   # 页面
    └── dynamic/             # 动态页面
        ├── index.js
        ├── index.wxml
        └── index.wxss
```

### 核心实现代码

#### 配置服务 (services/configService.js)

```javascript
// services/configService.js
class ConfigService {
  constructor() {
    this.cache = new Map();
    this.baseUrl = 'https://your-api-domain.com/api';
  }
  
  // 获取页面配置
  async getPageConfig(pageId, options = {}) {
    const { useCache = true, version = 'latest' } = options;
    const cacheKey = `page_${pageId}_${version}`;
    
    // 检查缓存
    if (useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const result = await this.request(`/pages/${pageId}/config`, {
        version: version === 'latest' ? undefined : version
      });
      
      if (result.code === 200) {
        const config = result.data;
        // 缓存配置
        this.cache.set(cacheKey, config);
        return config;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('获取页面配置失败:', error);
      // 返回默认配置
      return this.getDefaultConfig(pageId);
    }
  }
  
  // 获取主题配置
  async getThemeConfig(themeId) {
    const cacheKey = `theme_${themeId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const result = await this.request(`/themes/${themeId}`);
      if (result.code === 200) {
        this.cache.set(cacheKey, result.data);
        return result.data;
      }
    } catch (error) {
      console.error('获取主题配置失败:', error);
    }
    
    return this.getDefaultTheme();
  }
  
  // 监听配置更新
  startConfigWatcher() {
    // 连接WebSocket或使用长轮询监听配置变更
    const socketUrl = 'wss://your-websocket-domain.com/config-updates';
    
    wx.connectSocket({
      url: socketUrl,
      success: () => {
        console.log('配置监听器连接成功');
      }
    });
    
    wx.onSocketMessage((res) => {
      try {
        const update = JSON.parse(res.data);
        if (update.type === 'config_updated') {
          this.handleConfigUpdate(update.data);
        }
      } catch (error) {
        console.error('处理配置更新失败:', error);
      }
    });
  }
  
  // 处理配置更新
  handleConfigUpdate(updateData) {
    const { page_id, version } = updateData;
    
    // 清除相关缓存
    for (const key of this.cache.keys()) {
      if (key.startsWith(`page_${page_id}_`)) {
        this.cache.delete(key);
      }
    }
    
    // 通知页面刷新
    const pages = getCurrentPages();
    pages.forEach(page => {
      if (page.data.pageId === page_id && page.refreshConfig) {
        page.refreshConfig();
      }
    });
  }
  
  // 网络请求
  async request(url, params = {}) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.baseUrl}${url}`,
        data: params,
        method: 'GET',
        header: {
          'content-type': 'application/json'
        },
        success: (res) => {
          resolve(res.data);
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }
  
  // 获取默认配置
  getDefaultConfig(pageId) {
    const defaultConfigs = {
      'pages/index/index': {
        page_id: pageId,
        config: {
          type: 'vertical',
          components: [
            {
              id: 'default_banner',
              type: 'banner',
              position: { x: 0, y: 0, width: 375, height: 200 },
              config: {
                images: ['/images/default-banner.jpg'],
                autoplay: true,
                duration: 3000
              }
            }
          ]
        },
        theme_id: 'default_theme',
        version: '1.0.0'
      }
    };
    
    return defaultConfigs[pageId] || { config: { components: [] } };
  }
  
  // 获取默认主题
  getDefaultTheme() {
    return {
      config: {
        colors: {
          primary: '#4CAF50',
          secondary: '#2196F3',
          text_primary: '#333333',
          text_secondary: '#666666',
          background: '#FFFFFF'
        },
        fonts: {
          sizes: {
            sm: '28rpx',
            md: '32rpx',
            lg: '36rpx'
          }
        }
      }
    };
  }
}

module.exports = new ConfigService();
```

#### 动态渲染器 (utils/componentLoader.js)

```javascript
// utils/componentLoader.js
class ComponentLoader {
  constructor() {
    this.componentRegistry = new Map();
    this.loadedComponents = new Set();
  }
  
  // 注册组件
  registerComponent(type, componentPath) {
    this.componentRegistry.set(type, componentPath);
  }
  
  // 加载组件
  async loadComponent(type) {
    if (this.loadedComponents.has(type)) {
      return true;
    }
    
    const componentPath = this.componentRegistry.get(type);
    if (!componentPath) {
      console.warn(`未找到组件类型: ${type}`);
      return false;
    }
    
    try {
      // 动态导入组件（注意：小程序不支持动态import，需要预先注册）
      this.loadedComponents.add(type);
      return true;
    } catch (error) {
      console.error(`加载组件失败: ${type}`, error);
      return false;
    }
  }
  
  // 渲染组件
  renderComponent(component, theme) {
    const { type, config, style, position } = component;
    
    // 应用主题样式
    const themedStyle = this.applyTheme(style, theme);
    
    // 计算最终样式
    const finalStyle = {
      ...themedStyle,
      position: 'absolute',
      left: `${position.x}rpx`,
      top: `${position.y}rpx`,
      width: `${position.width}rpx`,
      height: `${position.height}rpx`
    };
    
    return {
      type,
      config,
      style: finalStyle,
      id: component.id
    };
  }
  
  // 应用主题
  applyTheme(style, theme) {
    const themedStyle = { ...style };
    
    // 替换主题色变量
    Object.keys(themedStyle).forEach(key => {
      const value = themedStyle[key];
      if (typeof value === 'string' && value.startsWith('var(--')) {
        const varName = value.slice(6, -1); // 移除 'var(--' 和 ')'
        const themeValue = this.getThemeValue(varName, theme);
        if (themeValue) {
          themedStyle[key] = themeValue;
        }
      }
    });
    
    return themedStyle;
  }
  
  // 获取主题值
  getThemeValue(varName, theme) {
    const themeConfig = theme?.config || {};
    
    // 支持的主题变量映射
    const themeMapping = {
      'color-primary': themeConfig.colors?.primary,
      'color-secondary': themeConfig.colors?.secondary,
      'color-text': themeConfig.colors?.text_primary,
      'font-size-md': themeConfig.fonts?.sizes?.md,
      'font-size-lg': themeConfig.fonts?.sizes?.lg
    };
    
    return themeMapping[varName];
  }
}

// 预注册组件
const componentLoader = new ComponentLoader();
componentLoader.registerComponent('banner', '/components/banner/index');
componentLoader.registerComponent('product_grid', '/components/product-grid/index');
componentLoader.registerComponent('text', '/components/text/index');
componentLoader.registerComponent('image', '/components/image/index');

module.exports = componentLoader;
```

#### 动态页面 (pages/dynamic/index.js)

```javascript
// pages/dynamic/index.js
const configService = require('../../services/configService');
const componentLoader = require('../../utils/componentLoader');

Page({
  data: {
    pageId: '',
    pageConfig: null,
    themeConfig: null,
    renderedComponents: [],
    loading: true,
    error: null
  },
  
  onLoad(options) {
    const pageId = options.pageId || this.route;
    this.setData({ pageId });
    
    // 启动配置监听器
    configService.startConfigWatcher();
    
    // 加载页面配置
    this.loadPageConfig();
  },
  
  async loadPageConfig() {
    try {
      this.setData({ loading: true, error: null });
      
      // 获取页面配置
      const pageConfig = await configService.getPageConfig(this.data.pageId);
      
      // 获取主题配置
      const themeConfig = await configService.getThemeConfig(pageConfig.theme_id);
      
      // 渲染组件
      const renderedComponents = await this.renderComponents(
        pageConfig.config.components,
        themeConfig
      );
      
      this.setData({
        pageConfig,
        themeConfig,
        renderedComponents,
        loading: false
      });
      
    } catch (error) {
      console.error('加载页面配置失败:', error);
      this.setData({
        error: error.message,
        loading: false
      });
    }
  },
  
  async renderComponents(components, theme) {
    const rendered = [];
    
    for (const component of components) {
      // 加载组件
      const loaded = await componentLoader.loadComponent(component.type);
      if (loaded) {
        // 渲染组件
        const renderedComponent = componentLoader.renderComponent(component, theme);
        rendered.push(renderedComponent);
      }
    }
    
    return rendered;
  },
  
  // 刷新配置（由配置更新通知触发）
  async refreshConfig() {
    console.log('收到配置更新通知，重新加载页面配置');
    await this.loadPageConfig();
  },
  
  // 组件点击事件
  onComponentTap(e) {
    const { componentId, action } = e.currentTarget.dataset;
    
    // 处理组件交互
    this.handleComponentAction(componentId, action);
  },
  
  handleComponentAction(componentId, action) {
    // 根据不同的action类型处理交互
    switch (action) {
      case 'navigate':
        // 页面跳转
        wx.navigateTo({
          url: `/pages/product-detail/product-detail?id=${componentId}`
        });
        break;
      case 'call':
        // 拨打电话
        wx.makePhoneCall({
          phoneNumber: '400-123-4567'
        });
        break;
      default:
        console.log('未知的组件动作:', action);
    }
  },
  
  onShareAppMessage() {
    return {
      title: '丘大叔茶饮',
      path: `/pages/dynamic/index?pageId=${this.data.pageId}`
    };
  }
});
```

#### 动态页面模板 (pages/dynamic/index.wxml)

```xml
<!-- pages/dynamic/index.wxml -->
<view class="dynamic-page">
  <!-- 加载状态 -->
  <view wx:if="{{loading}}" class="loading-container">
    <view class="loading-spinner"></view>
    <text>加载中...</text>
  </view>
  
  <!-- 错误状态 -->
  <view wx:elif="{{error}}" class="error-container">
    <view class="error-icon">⚠️</view>
    <text class="error-message">{{error}}</text>
    <button bindtap="loadPageConfig" class="retry-button">重试</button>
  </view>
  
  <!-- 渲染的组件 -->
  <view wx:else class="components-container">
    <block wx:for="{{renderedComponents}}" wx:key="id">
      <!-- 轮播图组件 -->
      <view
        wx:if="{{item.type === 'banner'}}"
        class="component-wrapper"
        style="{{item.style}}"
        data-component-id="{{item.id}}"
        data-action="{{item.config.action}}"
        bindtap="onComponentTap"
      >
        <swiper
          autoplay="{{item.config.autoplay}}"
          interval="{{item.config.duration}}"
          indicator-dots="{{item.config.indicatorDots}}"
          circular="{{true}}"
        >
          <swiper-item wx:for="{{item.config.images}}" wx:for-item="image" wx:key="*this">
            <image src="{{image}}" class="banner-image" mode="aspectFill" />
          </swiper-item>
        </swiper>
      </view>
      
      <!-- 产品网格组件 -->
      <view
        wx:elif="{{item.type === 'product_grid'}}"
        class="component-wrapper"
        style="{{item.style}}"
      >
        <view class="product-grid" style="grid-template-columns: repeat({{item.config.columns}}, 1fr);">
          <view
            wx:for="{{item.config.products}}"
            wx:for-item="product"
            wx:key="id"
            class="product-item"
            data-component-id="{{product.id}}"
            data-action="navigate"
            bindtap="onComponentTap"
          >
            <image src="{{product.image}}" class="product-image" mode="aspectFill" />
            <view class="product-info">
              <text class="product-name">{{product.name}}</text>
              <text wx:if="{{item.config.showPrice}}" class="product-price">¥{{product.price}}</text>
              <text wx:if="{{item.config.showStock}}" class="product-stock">库存: {{product.stock}}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 文本组件 -->
      <view
        wx:elif="{{item.type === 'text'}}"
        class="component-wrapper"
        style="{{item.style}}"
      >
        <text class="text-content" style="{{item.config.textStyle}}">{{item.config.content}}</text>
      </view>
      
      <!-- 图片组件 -->
      <view
        wx:elif="{{item.type === 'image'}}"
        class="component-wrapper"
        style="{{item.style}}"
        data-component-id="{{item.id}}"
        data-action="{{item.config.action}}"
        bindtap="onComponentTap"
      >
        <image src="{{item.config.src}}" class="image-content" mode="{{item.config.mode || 'aspectFill'}}" />
      </view>
    </block>
  </view>
</view>
```

---

## 🚀 部署指南

### 环境要求

- **Node.js**: >= 14.0.0
- **MongoDB**: >= 4.4
- **Redis**: >= 6.0 (可选，用于缓存)
- **微信开发者工具**: 最新版

### 后端部署

1. **安装依赖**
```bash
cd backend
npm install
```

2. **环境配置**
```bash
# .env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/mini_program_cms
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key
UPLOAD_PATH=/uploads
MAX_FILE_SIZE=10485760  # 10MB
```

3. **启动服务**
```bash
npm run build
npm start
```

### Web管理端部署

1. **构建项目**
```bash
cd web-admin
npm run build
```

2. **Nginx配置**
```nginx
server {
    listen 80;
    server_name your-admin-domain.com;
    
    location / {
        root /var/www/admin;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 小程序端配置

1. **域名配置**
   - 在微信公众平台配置服务器域名
   - 添加API域名到request合法域名
   - 添加WebSocket域名到socket合法域名

2. **云开发配置**
   - 在app.js中初始化云开发环境
   - 配置数据库权限
   - 上传云函数

---

## 🧪 测试方案

### 单元测试

```javascript
// tests/unit/configService.test.js
const configService = require('../../services/configService');

describe('ConfigService', () => {
  test('应该能够获取页面配置', async () => {
    const config = await configService.getPageConfig('pages/index/index');
    
    expect(config).toHaveProperty('page_id');
    expect(config).toHaveProperty('config');
    expect(config.config).toHaveProperty('components');
    expect(Array.isArray(config.config.components)).toBe(true);
  });
  
  test('应该能够缓存配置', async () => {
    const pageId = 'pages/index/index';
    
    // 第一次获取
    const config1 = await configService.getPageConfig(pageId);
    
    // 第二次获取（应该从缓存）
    const config2 = await configService.getPageConfig(pageId);
    
    expect(config1).toEqual(config2);
  });
});
```

### 集成测试

```javascript
// tests/integration/api.test.js
const request = require('supertest');
const app = require('../../app');

describe('API Integration', () => {
  test('GET /api/pages/:pageId/config', async () => {
    const response = await request(app)
      .get('/api/pages/page_001/config')
      .expect(200);
      
    expect(response.body.code).toBe(200);
    expect(response.body.data).toHaveProperty('config');
  });
  
  test('PUT /api/pages/:pageId/config', async () => {
    const updateData = {
      layout: {
        type: 'vertical',
        components: []
      },
      theme_id: 'theme_001'
    };
    
    const response = await request(app)
      .put('/api/pages/page_001/config')
      .send(updateData)
      .expect(200);
      
    expect(response.body.code).toBe(200);
  });
});
```

### 小程序端测试

使用微信开发者工具的自动化测试功能：

```javascript
// test/page.test.js
describe('动态页面', () => {
  let miniProgram;
  let page;
  
  beforeAll(async () => {
    miniProgram = await automator.launch({
      cliPath: 'path/to/cli',
      projectPath: 'path/to/project'
    });
    
    page = await miniProgram.reLaunch('/pages/dynamic/index?pageId=pages/index/index');
    await page.waitFor(3000);
  });
  
  test('应该能够加载页面配置', async () => {
    const loading = await page.$('.loading-container');
    expect(loading).toBeFalsy();
    
    const components = await page.$$('.component-wrapper');
    expect(components.length).toBeGreaterThan(0);
  });
  
  test('组件应该能够响应点击事件', async () => {
    const banner = await page.$('.component-wrapper[data-component-type="banner"]');
    await banner.tap();
    
    // 验证页面跳转或其他交互
  });
});
```

---

## 🛠️ 维护指南

### 监控和日志

1. **API监控**
```javascript
// middleware/monitoring.js
const monitor = require('./monitor');

const apiMonitoring = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    monitor.recordApiCall({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date()
    });
  });
  
  next();
};
```

2. **小程序端监控**
```javascript
// utils/monitor.js
class Monitor {
  static reportError(error, context) {
    wx.request({
      url: 'https://your-api.com/api/errors',
      method: 'POST',
      data: {
        error: error.message,
        stack: error.stack,
        context,
        userInfo: wx.getStorageSync('userInfo'),
        timestamp: new Date()
      }
    });
  }
  
  static reportPerformance(metrics) {
    wx.request({
      url: 'https://your-api.com/api/performance',
      method: 'POST',
      data: {
        ...metrics,
        timestamp: new Date()
      }
    });
  }
}
```

### 性能优化

1. **缓存策略**
   - 页面配置缓存（TTL: 1小时）
   - 主题配置缓存（TTL: 24小时）
   - 组件库缓存（TTL: 7天）

2. **CDN配置**
   - 静态资源使用CDN加速
   - 图片资源自动压缩和格式转换
   - 启用浏览器缓存

3. **数据库优化**
   - 为常用查询字段创建索引
   - 使用聚合管道优化复杂查询
   - 定期清理过期的配置版本

### 版本管理

1. **配置版本控制**
   - 每次配置更新自动创建版本快照
   - 支持一键回滚到历史版本
   - 版本对比和差异展示

2. **API版本管理**
   - 使用语义化版本号
   - 向后兼容性保证
   - 废弃API的迁移指南

### 备份和恢复

1. **数据库备份**
```bash
# 创建备份
mongodump --db mini_program_cms --out /backup/$(date +%Y%m%d)

# 恢复备份
mongorestore --db mini_program_cms /backup/20241201/mini_program_cms
```

2. **配置备份**
```javascript
// scripts/backup-configs.js
const { MongoClient } = require('mongodb');
const fs = require('fs');

async function backupConfigs() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  
  const configs = await client.db().collection('page_configs').find({}).toArray();
  
  fs.writeFileSync(
    `backup-configs-${Date.now()}.json`,
    JSON.stringify(configs, null, 2)
  );
  
  await client.close();
}
```

---

## 📚 总结

通过这套系统，您可以实现：

1. **可视化布局编辑**：拖拽式界面，所见即所得
2. **实时配置更新**：无需重新发布小程序即可更新内容
3. **主题统一管理**：一键切换不同风格主题
4. **组件库复用**：标准化组件，提高开发效率
5. **版本控制**：配置变更历史追踪和回滚
6. **权限管理**：多角色协作，安全可控

这个系统将大大提高小程序的运营灵活性和开发效率！

---

*文档版本：v1.0.0*  
*最后更新：2024年12月* 