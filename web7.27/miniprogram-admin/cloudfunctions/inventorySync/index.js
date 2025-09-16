const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: cloudbase.SYMBOL_CURRENT_ENV
});

const db = app.database();

/**
 * 库存同步云函数
 * 用于处理小程序下单时的库存同步
 */
exports.main = async (event, context) => {
  console.log('🔄 库存同步云函数被调用:', event);
  
  try {
    const { action, orderData } = event;
    
    switch (action) {
      case 'syncOrderInventory':
        return await syncOrderInventory(orderData);
      case 'syncInventoryToShop':
        return await syncInventoryToShop();
      case 'getInventoryStatus':
        return await getInventoryStatus();
      default:
        throw new Error('未知的操作类型');
    }
  } catch (error) {
    console.error('❌ 库存同步失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 同步订单库存（小程序下单时调用）
 * @param {Object} orderData - 订单数据
 */
async function syncOrderInventory(orderData) {
  console.log('📦 开始同步订单库存:', orderData);
  
  try {
    const { items } = orderData; // 订单商品列表
    
    if (!items || !Array.isArray(items)) {
      throw new Error('订单商品数据无效');
    }
    
    const results = [];
    
    // 遍历订单商品，同步库存
    for (const item of items) {
      const { productId, quantity } = item;
      
      if (!productId || !quantity) {
        console.warn('⚠️ 跳过无效商品:', item);
        continue;
      }
      
      try {
        // 1. 更新商品库存
        const shopProductResult = await db.collection('shopProducts')
          .where({ _id: productId })
          .get();
        
        if (shopProductResult.data.length === 0) {
          console.warn('⚠️ 商品不存在:', productId);
          continue;
        }
        
        const shopProduct = shopProductResult.data[0];
        const newStock = Math.max(0, (shopProduct.stock || 0) - quantity);
        
        await db.collection('shopProducts').doc(productId).update({
          stock: newStock,
          updateTime: new Date(),
          lastOrderSyncTime: new Date()
        });
        
        // 2. 如果商品关联了仓库产品，同步更新仓库库存
        if (shopProduct.productId) {
          const inventoryProductResult = await db.collection('products')
            .where({ _id: shopProduct.productId })
            .get();
          
          if (inventoryProductResult.data.length > 0) {
            const inventoryProduct = inventoryProductResult.data[0];
            const newInventoryStock = Math.max(0, (inventoryProduct.stock || 0) - quantity);
            
            await db.collection('products').doc(shopProduct.productId).update({
              stock: newInventoryStock,
              updateTime: new Date(),
              lastOrderSyncTime: new Date()
            });
            
            console.log(`✅ 同步库存: ${shopProduct.name} (商品: ${shopProduct.stock} → ${newStock}, 仓库: ${inventoryProduct.stock} → ${newInventoryStock})`);
          }
        }
        
        results.push({
          productId,
          productName: shopProduct.name,
          quantity,
          newStock,
          success: true
        });
        
      } catch (error) {
        console.error(`❌ 同步商品库存失败: ${productId}`, error);
        results.push({
          productId,
          quantity,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      success: true,
      message: `库存同步完成，处理了 ${results.length} 个商品`,
      results
    };
    
  } catch (error) {
    console.error('❌ 同步订单库存失败:', error);
    throw error;
  }
}

/**
 * 同步仓库库存到商品（管理员手动同步）
 */
async function syncInventoryToShop() {
  console.log('🔄 开始同步仓库库存到商品');
  
  try {
    // 获取所有仓库产品
    const inventoryResult = await db.collection('products').get();
    const inventoryProducts = inventoryResult.data;
    
    // 获取所有商品
    const shopResult = await db.collection('shopProducts').get();
    const shopProducts = shopResult.data;
    
    let syncCount = 0;
    let errorCount = 0;
    const results = [];
    
    // 遍历商品，同步库存
    for (const shopProduct of shopProducts) {
      if (shopProduct.productId) {
        const inventoryProduct = inventoryProducts.find(p => p._id === shopProduct.productId);
        
        if (inventoryProduct) {
          // 检查库存是否需要同步
          const needsSync = shopProduct.stock !== inventoryProduct.stock;
          
          if (needsSync) {
            try {
              await db.collection('shopProducts').doc(shopProduct._id).update({
                stock: inventoryProduct.stock,
                updateTime: new Date(),
                lastSyncTime: new Date()
              });
              
              syncCount++;
              results.push({
                productId: shopProduct._id,
                productName: shopProduct.name,
                oldStock: shopProduct.stock,
                newStock: inventoryProduct.stock,
                success: true
              });
              
              console.log(`✅ 同步库存: ${shopProduct.name} (${shopProduct.stock} → ${inventoryProduct.stock})`);
            } catch (error) {
              console.error(`❌ 同步库存失败: ${shopProduct.name}`, error);
              errorCount++;
              results.push({
                productId: shopProduct._id,
                productName: shopProduct.name,
                success: false,
                error: error.message
              });
            }
          }
        }
      }
    }
    
    return {
      success: true,
      message: `库存同步完成！成功同步 ${syncCount} 个商品${errorCount > 0 ? `，${errorCount} 个失败` : ''}`,
      syncCount,
      errorCount,
      results
    };
    
  } catch (error) {
    console.error('❌ 同步仓库库存到商品失败:', error);
    throw error;
  }
}

/**
 * 获取库存同步状态
 */
async function getInventoryStatus() {
  try {
    // 获取最近同步的商品
    const recentSyncResult = await db.collection('shopProducts')
      .where({
        lastSyncTime: db.command.exists(true)
      })
      .orderBy('lastSyncTime', 'desc')
      .limit(5)
      .get();
    
    // 获取库存预警商品
    const lowStockResult = await db.collection('shopProducts')
      .where({
        stock: db.command.lte(10),
        onSale: true
      })
      .get();
    
    // 获取关联状态统计
    const allShopProducts = await db.collection('shopProducts').get();
    const linkedProducts = allShopProducts.data.filter(p => p.productId).length;
    const unlinkedProducts = allShopProducts.data.length - linkedProducts;
    
    return {
      success: true,
      data: {
        recentSync: recentSyncResult.data,
        lowStockCount: lowStockResult.data.length,
        lowStockProducts: lowStockResult.data,
        totalProducts: allShopProducts.data.length,
        linkedProducts,
        unlinkedProducts,
        lastSyncTime: recentSyncResult.data.length > 0 ? recentSyncResult.data[0].lastSyncTime : null
      }
    };
    
  } catch (error) {
    console.error('❌ 获取库存状态失败:', error);
    throw error;
  }
}
