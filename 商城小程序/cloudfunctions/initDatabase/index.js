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
    
    // 7. 插入初始数据
    await insertInitialData()
    
    return {
      success: true,
      message: '数据库初始化成功',
      data: {
        collections: ['coupons', 'users', 'orders', 'products', 'categories', 'operationLogs', 'systemSettings']
      }
    }
    
  } catch (error) {
    console.error('数据库初始化失败:', error)
    return {
      success: false,
      message: '数据库初始化失败',
      error: error.message
    }
  }
}

// 创建优惠券集合
async function createCouponsCollection() {
  // 创建小程序端优惠券集合（用户领取的优惠券）
  try {
    console.log('正在创建coupons集合...')
    await db.createCollection('coupons')
    console.log('小程序优惠券集合创建成功')
  } catch (error) {
    console.log('coupons集合创建错误:', error.message)
    if (error.message.includes('collection already exists') || error.message.includes('Table exist')) {
      console.log('coupons集合已存在')
    } else {
      console.error('coupons集合创建失败:', error)
    }
  }
  
  // 创建Web端管理系统优惠券集合（优惠券模板）
  try {
    console.log('正在创建mall_coupons集合...')
    await db.createCollection('mall_coupons')
    console.log('Web端优惠券集合创建成功')
  } catch (error) {
    console.log('mall_coupons集合创建错误:', error.message)
    if (error.message.includes('collection already exists') || error.message.includes('Table exist')) {
      console.log('mall_coupons集合已存在')
    } else {
      console.error('mall_coupons集合创建失败:', error)
    }
  }
  
  // 创建用户优惠券关联集合
  try {
    console.log('正在创建user_coupons集合...')
    await db.createCollection('user_coupons')
    console.log('用户优惠券关联集合创建成功')
  } catch (error) {
    console.log('user_coupons集合创建错误:', error.message)
    if (error.message.includes('collection already exists') || error.message.includes('Table exist')) {
      console.log('user_coupons集合已存在')
    } else {
      console.error('user_coupons集合创建失败:', error)
    }
  }
}

// 创建用户集合
async function createUsersCollection() {
  try {
    console.log('正在创建users集合...')
    await db.createCollection('users')
    console.log('用户集合创建成功')
  } catch (error) {
    console.log('用户集合创建错误:', error.message)
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
    console.log('正在创建orders集合...')
    await db.createCollection('orders')
    console.log('订单集合创建成功')
  } catch (error) {
    console.log('订单集合创建错误:', error.message)
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
    console.log('正在创建products集合...')
    await db.createCollection('products')
    console.log('商品集合创建成功')
  } catch (error) {
    console.log('商品集合创建错误:', error.message)
    if (error.message.includes('collection already exists') || error.message.includes('Table exist')) {
      console.log('商品集合已存在')
    } else {
      throw error
    }
  }
}

// 创建分类集合
async function createCategoriesCollection() {
  try {
    console.log('正在创建categories集合...')
    await db.createCollection('categories')
    console.log('分类集合创建成功')
  } catch (error) {
    console.log('分类集合创建错误:', error.message)
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
    console.log('正在创建operationLogs集合...')
    await db.createCollection('operationLogs')
    console.log('操作日志集合创建成功')
    
    // 创建系统设置集合
    console.log('正在创建systemSettings集合...')
    await db.createCollection('systemSettings')
    console.log('系统设置集合创建成功')
  } catch (error) {
    console.log('系统集合创建错误:', error.message)
    if (error.message.includes('collection already exists') || error.message.includes('Table exist')) {
      console.log('系统管理集合已存在')
    } else {
      throw error
    }
  }
}

// 插入初始数据
async function insertInitialData() {
  try {
    // 插入默认分类
    const categories = [
      { name: '热销推荐', icon: '🔥', sort: 1, status: 1 },
      { name: '饮品', icon: '🥤', sort: 2, status: 1 },
      { name: '小吃', icon: '🍟', sort: 3, status: 1 },
      { name: '甜点', icon: '🍰', sort: 4, status: 1 }
    ]
    
    for (const category of categories) {
      await db.collection('categories').add({
        data: {
          ...category,
          createTime: new Date(),
          updateTime: new Date()
        }
      })
    }
    
    // 插入默认商品
    const products = [
      {
        name: '经典奶茶',
        price: 12.00,
        originalPrice: 15.00,
        categoryId: 'drinks',
        image: '/images/products/milk-tea.jpg',
        description: '香浓奶茶，口感顺滑',
        status: 1,
        stock: 100
      },
      {
        name: '薯条',
        price: 8.00,
        originalPrice: 10.00,
        categoryId: 'snacks',
        image: '/images/products/fries.jpg',
        description: '香脆薯条，外酥内软',
        status: 1,
        stock: 50
      }
    ]
    
    for (const product of products) {
      await db.collection('products').add({
        data: {
          ...product,
          createTime: new Date(),
          updateTime: new Date()
        }
      })
    }
    
    console.log('初始数据插入成功')
  } catch (error) {
    console.log('插入初始数据时出错:', error.message)
    // 不抛出错误，因为数据可能已经存在
  }
}