// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    console.log('开始清理外部图片URL...')
    
    // 获取所有商品
    const result = await db.collection('shopProducts').get()
    
    let updateCount = 0
    
    // 遍历所有商品，替换外部URL
    for (const product of result.data) {
      let needUpdate = false
      const updateData = {}
      
      // 检查并替换 image 字段
      if (product.image && (product.image.includes('placeholder.com') || product.image.includes('via.placeholder'))) {
        updateData.image = '/images/placeholder.svg'
        needUpdate = true
      }
      
      // 检查并替换 imagePath 字段
      if (product.imagePath && (product.imagePath.includes('placeholder.com') || product.imagePath.includes('via.placeholder'))) {
        updateData.imagePath = '/images/placeholder.svg'
        needUpdate = true
      }
      
      // 检查并替换 images 数组
      if (product.images && Array.isArray(product.images)) {
        const cleanedImages = product.images.map(img => {
          if (img && (img.includes('placeholder.com') || img.includes('via.placeholder'))) {
            return '/images/placeholder.svg'
          }
          return img
        })
        
        // 检查是否有变化
        if (JSON.stringify(cleanedImages) !== JSON.stringify(product.images)) {
          updateData.images = cleanedImages
          needUpdate = true
        }
      }
      
      // 如果需要更新，执行更新操作
      if (needUpdate) {
        await db.collection('shopProducts').doc(product._id).update({
          data: updateData
        })
        updateCount++
        console.log(`更新商品 ${product.name} 的图片URL`)
      }
    }
    
    console.log(`清理完成，共更新了 ${updateCount} 个商品`)
    
    return {
      success: true,
      message: `清理完成，共更新了 ${updateCount} 个商品的图片URL`,
      updateCount: updateCount
    }
    
  } catch (err) {
    console.error('清理图片URL失败:', err)
    return {
      success: false,
      message: err.message || '清理图片URL失败'
    }
  }
}