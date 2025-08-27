const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { limit = 20, skip = 0, category = '', onSale = true, getCategories = false } = event
    
    // 如果是获取分类列表
    if (getCategories) {
      const categoriesResult = await db.collection('shopProducts')
        .field({ category: true, type: true })
        .get()
      
      const categoriesSet = new Set()
      categoriesResult.data.forEach(item => {
        if (item.category) categoriesSet.add(item.category)
        if (item.type) categoriesSet.add(item.type)
      })
      
      return {
        success: true,
        categories: Array.from(categoriesSet).filter(cat => cat && cat.trim() !== '')
      }
    }
    
    // 构建查询条件
    let whereCondition = {}
    
    // 只获取上架商品
    if (onSale !== undefined) {
      whereCondition.onSale = onSale
    }
    
    // 按分类筛选 (同时支持category和type字段)
    if (category && category !== '') {
      whereCondition = db.command.and([
        whereCondition,
        db.command.or([
          { category: category },
          { type: category }
        ])
      ])
    }
    
    // 查询商品数据
    const result = await db.collection('shopProducts')
      .where(whereCondition)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(limit)
      .get()
    
    // 处理返回数据，确保字段完整
    const products = result.data.map(item => ({
      _id: item._id,
      name: item.name || '未知商品',
      price: item.price || 0,
      originalPrice: item.originalPrice || item.price || 0,
      description: item.description || '',
      stock: item.stock || 0,
      category: item.category || item.type || '未分类',
      type: item.type || item.category || '未分类',
      images: item.images || [],
      image: item.imagePath || (item.images && item.images.length > 0 ? item.images[0] : '/images/placeholder.svg'),
      onSale: item.onSale !== false, // 默认为true
      brand: item.brand || '',
      specification: item.specification || item.description || '',
      sales: item.sales || 0,
      remark: item.remark || '',
      createTime: item.createTime,
      updateTime: item.updateTime
    }))
    
    return {
      success: true,
      data: products,
      total: result.data.length,
      message: '获取商品数据成功'
    }
    
  } catch (err) {
    console.error('获取商品数据失败:', err)
    return {
      success: false,
      data: [],
      total: 0,
      message: err.message || '获取商品数据失败'
    }
  }
}