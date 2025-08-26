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
    
    // 6. 插入初始数据
    await insertInitialData()
    
    return {
      success: true,
      message: '数据库初始化成功',
      data: {
        collections: ['coupons', 'users', 'orders', 'products', 'categories']
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
    // 创建集合（如果不存在）
    await db.createCollection('coupons')
    
    // 设置集合权限
    await db.collection('coupons').createIndex({
      data: {
        _openid: 1,
        status: 1,
        expireTime: 1
      }
    })
    
    console.log('优惠券集合创建成功')
  } catch (error) {
    if (error.message.includes('collection already exists')) {
      console.log('优惠券集合已存在')
    } else {
      throw error
    }
  }
}

// 创建用户集合
async function createUsersCollection() {
  try {
    await db.createCollection('users')
    
    await db.collection('users').createIndex({
      data: {
        _openid: 1
      }
    })
    
    console.log('用户集合创建成功')
  } catch (error) {
    if (error.message.includes('collection already exists')) {
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
    
    await db.collection('orders').createIndex({
      data: {
        _openid: 1,
        status: 1,
        createTime: 1
      }
    })
    
    console.log('订单集合创建成功')
  } catch (error) {
    if (error.message.includes('collection already exists')) {
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
    
    await db.collection('products').createIndex({
      data: {
        categoryId: 1,
        status: 1
      }
    })
    
    console.log('商品集合创建成功')
  } catch (error) {
    if (error.message.includes('collection already exists')) {
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
    
    await db.collection('categories').createIndex({
      data: {
        status: 1,
        sort: 1
      }
    })
    
    console.log('分类集合创建成功')
  } catch (error) {
    if (error.message.includes('collection already exists')) {
      console.log('分类集合已存在')
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