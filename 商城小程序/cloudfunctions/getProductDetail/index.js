// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { productId } = event

  try {
    // 查询商品详情
    const productRes = await db.collection('products').doc(productId).get()
    
    if (!productRes.data) {
      return {
        success: false,
        message: '商品不存在'
      }
    }

    const product = productRes.data

    // 处理商品数据
    const processedProduct = {
      _id: product._id,
      name: product.name,
      subtitle: product.subtitle || '',
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      image: product.image || '/images/placeholder.png',
      images: product.images || [product.image || '/images/placeholder.png'],
      stock: product.stock || 0,
      sales: product.sales || 0,
      category: product.category,
      description: product.description || '',
      detail: product.detail || product.description || '',
      brand: product.brand || '',
      specification: product.specification || '',
      specs: product.specs || [],
      isHot: (product.sales || 0) > 100,
      isNew: isNewProduct(product.createTime),
      freeShipping: product.freeShipping || false,
      discount: calculateDiscount(product.originalPrice, product.price),
      onSale: product.onSale !== false,
      createTime: product.createTime,
      updateTime: product.updateTime
    }

    return {
      success: true,
      data: processedProduct
    }
  } catch (error) {
    console.error('获取商品详情失败:', error)
    return {
      success: false,
      message: '获取商品详情失败',
      error: error.message
    }
  }
}

// 判断是否为新品（7天内创建的商品）
function isNewProduct(createTime) {
  if (!createTime) return false
  const now = new Date()
  const create = new Date(createTime)
  const diffTime = now - create
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 7
}

// 计算折扣
function calculateDiscount(originalPrice, currentPrice) {
  if (!originalPrice || originalPrice <= currentPrice) return null
  return Math.round((currentPrice / originalPrice) * 10)
} 