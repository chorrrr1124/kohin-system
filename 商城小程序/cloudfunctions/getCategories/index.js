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

    // 如果商城分类集合为空，从实际商品中提取分类
    if (!result.data || result.data.length === 0) {
      // 获取所有上架商品
      const productsResult = await db.collection('shopProducts')
        .where({
          onSale: true
        })
        .field({
          category: true,
          sales: true,
          createTime: true
        })
        .get()
      
      const categories = []
      const categorySet = new Set()
      
      // 从商品中提取分类
      if (productsResult.data && productsResult.data.length > 0) {
        productsResult.data.forEach(product => {
          if (product.category && product.category.trim()) {
            categorySet.add(product.category.trim())
          }
        })
        
        // 构建分类数据
        let sortIndex = 1
        Array.from(categorySet).sort().forEach(categoryName => {
          categories.push({
            _id: `cat_${sortIndex}`,
            name: categoryName,
            icon: '/images/category/all.png',
            type: categoryName.toLowerCase(),
            sort: sortIndex,
            status: 'active'
          })
          sortIndex++
        })
        
        // 如果有商品但没有分类，添加基本的动态分类
        if (categorySet.size === 0) {
          const hotProducts = productsResult.data.filter(p => (p.sales || 0) > 100)
          const now = new Date()
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          const newProducts = productsResult.data.filter(p => 
            p.createTime && new Date(p.createTime) > thirtyDaysAgo
          )
          
          if (hotProducts.length > 0) {
            categories.push({
              _id: 'hot',
              name: '热销',
              icon: '/images/category/hot.png',
              type: 'hot',
              sort: 1,
              status: 'active'
            })
          }
          
          if (newProducts.length > 0) {
            categories.push({
              _id: 'new',
              name: '新品',
              icon: '/images/category/new.png',
              type: 'new',
              sort: 2,
              status: 'active'
            })
          }
        }
      }
      
      // 始终添加全部分类
      categories.unshift({
        _id: 'all',
        name: '全部',
        icon: '/images/category/all.png',
        type: 'all',
        sort: 0,
        status: 'active'
      })
      
      result.data = categories
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
        { _id: 'all', name: '全部', icon: '/images/category/all.png', type: 'all' }
      ],
      message: '获取分类失败，只返回全部分类'
    }
  }
}