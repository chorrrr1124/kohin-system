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
    
    console.log('商品集合创建成功')
  } catch (error) {
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

// 插入初始数据
async function insertInitialData() {
  try {
    // 插入示例优惠券数据
    const couponsCollection = db.collection('mall_coupons')
    const existingCoupons = await couponsCollection.get()
    
    if (existingCoupons.data.length === 0) {
      const sampleCoupons = [
        {
          name: '新用户专享',
          description: '新用户注册即可获得',
          type: 'fixed',
          value: 10,
          minAmount: 50,
          totalCount: 1000,
          usedCount: 0,
          status: 'active',
          startTime: new Date(),
          endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
          createTime: new Date()
        },
        {
          name: '满减优惠券',
          description: '满100减20',
          type: 'fixed',
          value: 20,
          minAmount: 100,
          totalCount: 500,
          usedCount: 0,
          status: 'active',
          startTime: new Date(),
          endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60天后过期
          createTime: new Date()
        }
      ]
      
      await couponsCollection.add({
        data: sampleCoupons
      })
      
      console.log('示例优惠券数据插入成功')
    }
    
    // 插入示例分类数据
    const categoriesCollection = db.collection('categories')
    const existingCategories = await categoriesCollection.get()
    
    if (existingCategories.data.length === 0) {
      const sampleCategories = [
        {
          name: '数码产品',
          description: '手机、电脑、相机等数码产品',
          icon: '📱',
          sort: 1,
          status: 'active',
          createTime: new Date()
        },
        {
          name: '服装鞋帽',
          description: '男装、女装、鞋子、帽子等',
          icon: '👕',
          sort: 2,
          status: 'active',
          createTime: new Date()
        },
        {
          name: '家居用品',
          description: '家具、装饰、厨具等家居用品',
          icon: '🏠',
          sort: 3,
          status: 'active',
          createTime: new Date()
        }
      ]
      
      await categoriesCollection.add({
        data: sampleCategories
      })
      
      console.log('示例分类数据插入成功')
    }
    
  } catch (error) {
    console.error('插入初始数据失败:', error)
    throw error
  }
}