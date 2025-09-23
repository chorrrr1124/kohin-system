const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloudbase-3g4w6lls8a5ce59b'
});

const db = app.database();

exports.main = async (event, context) => {
  console.log('🚀 inventorySync 云函数开始执行');
  console.log('📊 接收到的参数:', event);
  
  const { action } = event;
  
  try {
    switch (action) {
      case 'syncInventoryToShop':
        return await syncInventoryToShop();
      case 'checkSyncStatus':
        return await checkSyncStatus();
      default:
        return {
          success: false,
          error: '未知的操作类型'
        };
    }
  } catch (error) {
    console.error('❌ inventorySync 云函数错误:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 同步库存数据到商品管理
async function syncInventoryToShop() {
  console.log('🔄 开始同步库存数据到商品管理...');
  
  try {
    // 1. 获取库存管理数据（products集合）
    console.log('📊 获取库存管理数据...');
    const inventoryResult = await db.collection('products')
      .orderBy('createTime', 'desc')
      .get();
    
    console.log(`📋 库存管理数据数量: ${inventoryResult.data.length}`);
    
    if (inventoryResult.data.length === 0) {
      return {
        success: true,
        message: '库存管理中没有数据，无需同步',
        syncedCount: 0
      };
    }
    
    // 2. 获取商品管理现有数据（shopProducts集合）
    console.log('📊 获取商品管理现有数据...');
    const shopResult = await db.collection('shopProducts')
      .get();
    
    console.log(`📋 商品管理现有数据数量: ${shopResult.data.length}`);
    
    const existingProducts = new Map();
    shopResult.data.forEach(product => {
      if (product.productId) {
        existingProducts.set(product.productId, product);
      }
    });
    
    // 3. 同步数据
    let syncedCount = 0;
    let updatedCount = 0;
    let createdCount = 0;
    
    for (const inventoryProduct of inventoryResult.data) {
      const productId = inventoryProduct.productId || inventoryProduct._id;
      
      if (!productId) {
        console.warn('⚠️ 跳过没有productId的库存产品:', inventoryProduct);
        continue;
      }
      
      // 准备同步到商品管理的数据
      const shopProductData = {
        productId: productId,
        name: inventoryProduct.name || '未命名商品',
        price: inventoryProduct.price || 0,
        description: inventoryProduct.description || '',
        stock: inventoryProduct.stock || 0,
        category: inventoryProduct.category || '未分类',
        images: inventoryProduct.imageUrl ? [inventoryProduct.imageUrl] : [],
        status: inventoryProduct.onSale !== false ? 'active' : 'inactive',
        originalPrice: inventoryProduct.originalPrice || inventoryProduct.price || 0,
        brand: inventoryProduct.brand || '',
        specification: inventoryProduct.specification || '',
        promotionInfo: inventoryProduct.promotionInfo || '',
        remark: inventoryProduct.remark || '',
        updateTime: new Date(),
        syncTime: new Date()
      };
      
      if (existingProducts.has(productId)) {
        // 更新现有商品（只更新库存相关字段）
        console.log(`🔄 更新商品: ${productId}`);
        await db.collection('shopProducts')
          .where({ productId: productId })
          .update({
            stock: shopProductData.stock,
            price: shopProductData.price,
            originalPrice: shopProductData.originalPrice,
            status: shopProductData.status,
            updateTime: shopProductData.updateTime,
            syncTime: shopProductData.syncTime
          });
        updatedCount++;
      } else {
        // 创建新商品
        console.log(`➕ 创建新商品: ${productId}`);
        await db.collection('shopProducts')
          .add({
            ...shopProductData,
            createTime: new Date()
          });
        createdCount++;
      }
      
      syncedCount++;
    }
    
    console.log(`✅ 同步完成: 总计${syncedCount}个，更新${updatedCount}个，新增${createdCount}个`);
    
    return {
      success: true,
      message: `同步完成！总计处理${syncedCount}个商品，更新${updatedCount}个，新增${createdCount}个`,
      syncedCount,
      updatedCount,
      createdCount
    };
    
  } catch (error) {
    console.error('❌ 同步库存数据失败:', error);
    throw error;
  }
}

// 检查同步状态
async function checkSyncStatus() {
  console.log('🔍 检查同步状态...');
  
  try {
    // 获取最近同步的商品
    const recentSyncResult = await db.collection('shopProducts')
      .where({
        syncTime: db.command.neq(null)
      })
      .orderBy('syncTime', 'desc')
      .limit(1)
      .get();
    
    const lastSyncTime = recentSyncResult.data.length > 0 
      ? recentSyncResult.data[0].syncTime 
      : null;
    
    // 获取商品总数
    const totalResult = await db.collection('shopProducts').count();
    const totalProducts = totalResult.total;
    
    // 获取库存管理商品总数
    const inventoryResult = await db.collection('products').count();
    const totalInventory = inventoryResult.total;
    
    return {
      success: true,
      lastSyncTime,
      totalProducts,
      totalInventory,
      isSynced: lastSyncTime !== null
    };
    
  } catch (error) {
    console.error('❌ 检查同步状态失败:', error);
    throw error;
  }
}
