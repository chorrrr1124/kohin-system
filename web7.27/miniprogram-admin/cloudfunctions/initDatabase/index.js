// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 1. 创建优惠券集合
    await createCouponsCollection()
    
    // 2. 创建用户集合
    await createUsersCollection()
    
    // 3. 创建订单集合
    await createOrdersCollection()
    
    // 4. 创建商品集合
    await createProductsCollection()
    
    // 5. 创建分类集合
    await createCategoriesCollection()
    
    // 6. 创建系统管理集合
    await createSystemCollections()
    
    return {
      success: true,
      message: '数据库集合创建成功',
      data: {
        collections: ['coupons', 'users', 'orders', 'products', 'categories', 'operationLogs', 'systemSettings']
      }
    }
    
  } catch (error) {
    console.error('数据库集合创建失败:', error)
    return {
      success: false,
      message: '数据库集合创建失败',
      error: error.message
    }
  }
}

// 创建优惠券集合
async function createCouponsCollection() {
  try {
    // 创建小程序端优惠券集合（用户领取的优惠券）
    await db.createCollection('coupons')
    
    console.log('小程序优惠券集合创建成功')
    
    // 创建Web端管理系统优惠券集合（优惠券模板）
    await db.createCollection('mall_coupons')
    
    console.log('Web端优惠券集合创建成功')
    
    // 创建用户优惠券关联集合
    await db.createCollection('user_coupons')
    
    console.log('用户优惠券关联集合创建成功')
    
  } catch (error) {
    if (error.message.includes('collection already exists') || error.message.includes('Table exist')) {
      console.log('优惠券相关集合已存在')
    } else {
      throw error
    }
  }
}

// 创建用户集合
async function createUsersCollection() {
  try {
    await db.createCollection('users')
    
    console.log('用户集合创建成功')
  } catch (error) {
    if (error.message.includes('collection already exists') || error.message.includes('Table exist')) {
      console.log('用户集合已存在')
    } else {
      throw error
    }
  }
}

// 创建订单集合
async function createOrdersCollection() {
  try {
    await db.createCollection('orders')
    
    console.log('订单集合创建成功')
  } catch (error) {
    if (error.message.includes('collection already exists') || error.message.includes('Table exist')) {
      console.log('订单集合已存在')
    } else {
      throw error
    }
  }
}

// 创建商品集合
async function createProductsCollection() {
  try {
    await db.createCollection('products')
    
    console.log('商城产品集合创建成功')
  } catch (error) {
    if (error.message.includes('collection already exists') || error.message.includes('Table exist')) {
      console.log('商城产品集合已存在')
    } else {
      throw error
    }
  }
}

// 创建分类集合
async function createCategoriesCollection() {
  try {
    await db.createCollection('categories')
    
    console.log('分类集合创建成功')
  } catch (error) {
    if (error.message.includes('collection already exists') || error.message.includes('Table exist')) {
      console.log('分类集合已存在')
    } else {
      throw error
    }
  }
}

// 创建系统管理集合
async function createSystemCollections() {
  try {
    // 创建操作日志集合
    await db.createCollection('operationLogs')
    
    console.log('操作日志集合创建成功')
    
    // 创建系统设置集合
    await db.createCollection('systemSettings')
    
    console.log('系统设置集合创建成功')
    
  } catch (error) {
    if (error.message.includes('collection already exists') || error.message.includes('Table exist')) {
      console.log('系统管理集合已存在')
    } else {
      throw error
    }
  }
}