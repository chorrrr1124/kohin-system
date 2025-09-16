/**
 * 库存同步工具函数
 * 用于处理小程序下单时的库存同步
 */

import { app } from './cloudbase';

/**
 * 同步订单库存（小程序下单时调用）
 * @param {Object} orderData - 订单数据
 * @param {Array} orderData.items - 订单商品列表
 * @param {string} orderData.items[].productId - 商品ID
 * @param {number} orderData.items[].quantity - 购买数量
 * @returns {Promise<Object>} 同步结果
 */
export const syncOrderInventory = async (orderData) => {
  try {
    console.log('🔄 开始同步订单库存:', orderData);
    
    const result = await app.callFunction({
      name: 'inventorySync',
      data: {
        action: 'syncOrderInventory',
        orderData
      }
    });
    
    if (result.result.success) {
      console.log('✅ 订单库存同步成功:', result.result);
      return {
        success: true,
        data: result.result
      };
    } else {
      throw new Error(result.result.error || '库存同步失败');
    }
  } catch (error) {
    console.error('❌ 订单库存同步失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 获取库存同步状态
 * @returns {Promise<Object>} 库存状态
 */
export const getInventoryStatus = async () => {
  try {
    const result = await app.callFunction({
      name: 'inventorySync',
      data: {
        action: 'getInventoryStatus'
      }
    });
    
    if (result.result.success) {
      return {
        success: true,
        data: result.result.data
      };
    } else {
      throw new Error(result.result.error || '获取库存状态失败');
    }
  } catch (error) {
    console.error('❌ 获取库存状态失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 检查商品库存是否充足
 * @param {Array} items - 商品列表
 * @returns {Promise<Object>} 检查结果
 */
export const checkInventoryAvailability = async (items) => {
  try {
    const db = app.database();
    const unavailableItems = [];
    
    for (const item of items) {
      const { productId, quantity } = item;
      
      if (!productId || !quantity) {
        continue;
      }
      
      // 查询商品库存
      const result = await db.collection('shopProducts')
        .where({ _id: productId })
        .get();
      
      if (result.data.length === 0) {
        unavailableItems.push({
          productId,
          reason: '商品不存在'
        });
        continue;
      }
      
      const product = result.data[0];
      if (!product.onSale) {
        unavailableItems.push({
          productId,
          productName: product.name,
          reason: '商品已下架'
        });
        continue;
      }
      
      if ((product.stock || 0) < quantity) {
        unavailableItems.push({
          productId,
          productName: product.name,
          availableStock: product.stock || 0,
          requestedQuantity: quantity,
          reason: '库存不足'
        });
      }
    }
    
    return {
      success: true,
      available: unavailableItems.length === 0,
      unavailableItems
    };
  } catch (error) {
    console.error('❌ 检查库存可用性失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 模拟小程序下单流程（用于测试）
 * @param {Object} orderData - 订单数据
 * @returns {Promise<Object>} 下单结果
 */
export const simulateOrder = async (orderData) => {
  try {
    console.log('🛒 模拟下单流程:', orderData);
    
    // 1. 检查库存可用性
    const availabilityCheck = await checkInventoryAvailability(orderData.items);
    if (!availabilityCheck.success) {
      throw new Error('库存检查失败: ' + availabilityCheck.error);
    }
    
    if (!availabilityCheck.available) {
      return {
        success: false,
        error: '库存不足',
        unavailableItems: availabilityCheck.unavailableItems
      };
    }
    
    // 2. 同步库存
    const syncResult = await syncOrderInventory(orderData);
    if (!syncResult.success) {
      throw new Error('库存同步失败: ' + syncResult.error);
    }
    
    // 3. 模拟创建订单
    const orderId = 'ORDER_' + Date.now();
    
    console.log('✅ 模拟下单成功:', {
      orderId,
      syncResult: syncResult.data
    });
    
    return {
      success: true,
      orderId,
      syncResult: syncResult.data
    };
    
  } catch (error) {
    console.error('❌ 模拟下单失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
