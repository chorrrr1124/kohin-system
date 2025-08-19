// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { limit = 20, status = 'active' } = event
    
    // 先尝试从商城分类集合获取
    let result = await db.collection('mall_categories')
      .where({
        status: status
      })
      .orderBy('sort', 'asc')
      .orderBy('createTime', 'desc')
      .limit(limit)
      .get()

    // 如果商城分类集合为空，返回默认分类
    if (!result.data || result.data.length === 0) {
      result.data = [
        { 
          _id: '1', 
          name: '热销', 
          icon: '/images/category/hot.png', 
          type: 'hot',
          sort: 1,
          status: 'active'
        },
        { 
          _id: '2', 
          name: '新品', 
          icon: '/images/category/new.png', 
          type: 'new',
          sort: 2,
          status: 'active'
        },
        { 
          _id: '3', 
          name: '特价', 
          icon: '/images/category/sale.png', 
          type: 'sale',
          sort: 3,
          status: 'active'
        },
        { 
          _id: '4', 
          name: '全部', 
          icon: '/images/category/all.png', 
          type: 'all',
          sort: 4,
          status: 'active'
        }
      ]
    }

    return {
      success: true,
      data: result.data,
      message: '获取分类成功'
    }
  } catch (error) {
    console.error('获取分类失败:', error)
    return {
      success: false,
      data: [
        { _id: '1', name: '热销', icon: '/images/category/hot.png', type: 'hot' },
        { _id: '2', name: '新品', icon: '/images/category/new.png', type: 'new' },
        { _id: '3', name: '特价', icon: '/images/category/sale.png', type: 'sale' },
        { _id: '4', name: '全部', icon: '/images/category/all.png', type: 'all' }
      ],
      message: '获取分类失败，使用默认分类'
    }
  }
} 