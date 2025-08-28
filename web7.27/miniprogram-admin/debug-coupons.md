# 🐛 优惠券数据不显示问题调试指南

## 🔍 问题描述

Web端优惠券管理页面显示"暂无优惠券"，但数据库中 `mall_coupons` 集合有数据。

## 🚀 调试步骤

### 步骤1：检查浏览器控制台

1. 打开优惠券管理页面
2. 按 F12 打开开发者工具
3. 切换到 Console 标签页
4. 查看是否有错误信息

### 步骤2：运行数据库测试脚本

在浏览器控制台中复制粘贴以下代码：

```javascript
// 测试数据库连接和优惠券数据
console.log('🔍 开始测试数据库连接...');

// 1. 检查CloudBase实例
try {
  const app = window.cloudbase?.app || window.app;
  console.log('📱 CloudBase实例:', app);
  
  if (!app) {
    console.error('❌ 未找到CloudBase实例');
    return;
  }
  
  // 2. 检查数据库实例
  const db = app.database();
  console.log('📊 数据库实例:', db);
  
  if (!db) {
    console.error('❌ 未找到数据库实例');
    return;
  }
  
  // 3. 尝试查询数据
  console.log('🔍 查询mall_coupons集合...');
  
  db.collection('mall_coupons')
    .limit(1)
    .get()
    .then(result => {
      console.log('✅ 查询成功:', result);
      console.log('📊 数据数量:', result.data?.length || 0);
      console.log('📝 数据内容:', result.data);
    })
    .catch(error => {
      console.error('❌ 查询失败:', error);
      console.error('❌ 错误代码:', error.code);
      console.error('❌ 错误信息:', error.message);
    });
    
} catch (error) {
  console.error('❌ 测试过程中发生错误:', error);
}
```

### 步骤3：检查可能的问题

#### 问题1：CloudBase实例未正确初始化
**症状**：控制台显示"未找到CloudBase实例"
**解决方案**：
- 检查 `src/utils/cloudbase.js` 文件是否正确导入
- 确认环境ID `cloudbase-3g4w6lls8a5ce59b` 是否正确

#### 问题2：数据库权限问题
**症状**：查询失败，错误代码为权限相关
**解决方案**：
- 在云开发控制台中检查 `mall_coupons` 集合权限
- 确保设置为"所有用户可读，仅管理员可写"

#### 问题3：集合不存在
**症状**：错误代码为 `DATABASE_COLLECTION_NOT_EXIST`
**解决方案**：
- 点击页面上的"初始化数据库"按钮
- 或者手动调用 `initDatabase` 云函数

#### 问题4：数据格式问题
**症状**：查询成功但数据为空
**解决方案**：
- 检查数据库中的数据格式是否正确
- 确认字段名是否匹配

### 步骤4：手动初始化数据库

如果检测到集合不存在，可以手动初始化：

```javascript
// 手动调用初始化云函数
const app = window.cloudbase?.app || window.app;
if (app) {
  app.callFunction({
    name: 'initDatabase',
    data: {}
  }).then(result => {
    console.log('初始化结果:', result);
  }).catch(error => {
    console.error('初始化失败:', error);
  });
}
```

### 步骤5：检查云函数部署

确认以下云函数已正确部署：
- `initDatabase` - 数据库初始化
- `initInventory` - 库存初始化

## 🔧 常见解决方案

### 方案1：重新部署云函数
```bash
# 在项目根目录执行
npm run deploy:functions
```

### 方案2：检查环境配置
确认 `cloudbaserc.json` 中的环境ID正确：
```json
{
  "envId": "cloudbase-3g4w6lls8a5ce59b"
}
```

### 方案3：检查数据库权限
在云开发控制台中：
1. 进入数据库页面
2. 找到 `mall_coupons` 集合
3. 点击"权限设置"
4. 选择"所有用户可读，仅管理员可写"

## 📋 调试检查清单

- [ ] 浏览器控制台无错误
- [ ] CloudBase实例正确初始化
- [ ] 数据库实例可访问
- [ ] `mall_coupons` 集合存在
- [ ] 集合权限设置正确
- [ ] 数据格式正确
- [ ] 云函数已部署

## 🆘 如果问题仍然存在

1. **收集错误信息**：截图保存控制台错误信息
2. **检查网络请求**：查看Network标签页的请求状态
3. **验证环境配置**：确认环境ID和云函数配置
4. **联系技术支持**：提供详细的错误信息和环境配置

---

**调试完成后，请删除此文件以避免混淆** 